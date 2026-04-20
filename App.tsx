import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  Dimensions, Image, Platform, Modal, Animated, Alert, PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as NavigationBar from 'expo-navigation-bar';
import { useEffect, useState, useRef } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';

const { width, height } = Dimensions.get('window');
const PURPLE = '#7B5CF0';
const TEAL = '#00C9BB';

// ── Animated Bottom Sheet ─────────────────────────────────────────────────────
function BottomSheet({
  visible, onClose, children, snapHeight,
}: {
  visible: boolean; onClose: () => void; children: React.ReactNode; snapHeight: number;
}) {
  const translateY = useRef(new Animated.Value(snapHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, damping: 22, stiffness: 280, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(translateY, { toValue: snapHeight, damping: 22, stiffness: 280, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start(() => setMounted(false));
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, { dy }) => { if (dy > 0) translateY.setValue(dy); },
      onPanResponderRelease: (_, { dy, vy }) => {
        if (dy > snapHeight * 0.35 || vy > 0.8) {
          onClose();
        } else {
          Animated.spring(translateY, { toValue: 0, damping: 22, stiffness: 280, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[sheet.backdrop, { opacity: backdropOpacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[sheet.container, { transform: [{ translateY }] }]}>
        <View {...panResponder.panHandlers} style={sheet.handleZone}>
          <View style={sheet.handle} />
        </View>
        {children}
      </Animated.View>
    </Modal>
  );
}

const sheet = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  container: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: 32,
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: -4 }, elevation: 20,
  },
  handleZone: { paddingVertical: 12, alignItems: 'center' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1' },
});

// ── Scan Camera Screen ────────────────────────────────────────────────────────
const TIPS = [
  'Stick your tongue out fully',
  'Ensure good lighting',
  'Hold still for 2 seconds',
  'Keep camera 20cm away',
];

function ScanScreen({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [tipIndex, setTipIndex] = useState(0);
  const tipOpacity = useRef(new Animated.Value(1)).current;
  const scanLineY = useRef(new Animated.Value(0)).current;
  const frameScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      Animated.timing(tipOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setTipIndex(i => (i + 1) % TIPS.length);
        Animated.timing(tipOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      });
    }, 2200);
    Animated.loop(Animated.sequence([
      Animated.timing(scanLineY, { toValue: 1, duration: 1800, useNativeDriver: true }),
      Animated.timing(scanLineY, { toValue: 0, duration: 1800, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(frameScale, { toValue: 1.04, duration: 900, useNativeDriver: true }),
      Animated.timing(frameScale, { toValue: 1, duration: 900, useNativeDriver: true }),
    ])).start();
    return () => clearInterval(interval);
  }, [visible]);

  if (!visible) return null;
  if (!permission) return null;

  if (!permission.granted) {
    return (
      <Modal visible animationType="slide" onRequestClose={onClose}>
        <View style={cam.permScreen}>
          <Ionicons name="camera-outline" size={64} color="#94A3B8" />
          <Text style={cam.permTitle}>Camera Access Needed</Text>
          <Text style={cam.permSub}>We need your camera to scan your tongue for health analysis.</Text>
          <TouchableOpacity style={cam.permBtn} onPress={requestPermission}>
            <Text style={cam.permBtnText}>Allow Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={cam.cancelLink} onPress={onClose}>
            <Text style={cam.cancelLinkText}>Not now</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  const FRAME_W = width * 0.72;
  const FRAME_H = FRAME_W * 0.62;

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={cam.root}>
        <CameraView style={StyleSheet.absoluteFill} facing="front" />
        <View style={[cam.mask, { top: 0, height: (height - FRAME_H) / 2 - 10 }]} />
        <View style={[cam.mask, { bottom: 0, height: (height - FRAME_H) / 2 - 10 }]} />
        <View style={[cam.maskSide, { left: 0, top: (height - FRAME_H) / 2 - 10, width: (width - FRAME_W) / 2, height: FRAME_H + 20 }]} />
        <View style={[cam.maskSide, { right: 0, top: (height - FRAME_H) / 2 - 10, width: (width - FRAME_W) / 2, height: FRAME_H + 20 }]} />

        <Animated.View style={[cam.frame, { width: FRAME_W, height: FRAME_H, transform: [{ scale: frameScale }] }]}>
          {[
            { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 22 },
            { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 22 },
            { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 22 },
            { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 22 },
          ].map((s, i) => <View key={i} style={[cam.corner, s]} />)}
          <Animated.View style={[cam.scanLine, {
            transform: [{ translateY: scanLineY.interpolate({ inputRange: [0, 1], outputRange: [0, FRAME_H - 2] }) }],
          }]} />
        </Animated.View>

        <View style={cam.header}>
          <TouchableOpacity style={cam.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={cam.headerTitle}>Tongue Scan</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={cam.instructionBox}>
          <Text style={cam.instructionLabel}>👅 Position your tongue in the frame</Text>
        </View>

        <View style={cam.tipBox}>
          <Animated.Text style={[cam.tipText, { opacity: tipOpacity }]}>💡 {TIPS[tipIndex]}</Animated.Text>
          <TouchableOpacity
            style={cam.captureBtn}
            onPress={() => { onClose(); Alert.alert('Scan Complete', 'Your tongue scan has been analysed. Results will appear shortly.'); }}
          >
            <LinearGradient colors={['#A78BFF', PURPLE]} style={cam.captureBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Ionicons name="scan" size={28} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
          <Text style={cam.captureHint}>Tap to capture</Text>
        </View>
      </View>
    </Modal>
  );
}

const cam = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  mask: { position: 'absolute', left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)' },
  maskSide: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.6)' },
  frame: { position: 'absolute', alignSelf: 'center', top: '50%', marginTop: -90, overflow: 'hidden' },
  corner: { position: 'absolute', width: 28, height: 28, borderColor: '#fff' },
  scanLine: {
    position: 'absolute', left: 8, right: 8, height: 2,
    backgroundColor: 'rgba(167,139,255,0.9)',
    shadowColor: PURPLE, shadowOpacity: 1, shadowRadius: 6, elevation: 4,
  },
  header: {
    position: 'absolute', top: 28, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20,
  },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  instructionBox: {
    position: 'absolute', top: '50%', marginTop: -160,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 20,
    paddingVertical: 8, paddingHorizontal: 18,
  },
  instructionLabel: { color: '#fff', fontSize: 14, fontWeight: '600' },
  tipBox: { position: 'absolute', bottom: 52, left: 0, right: 0, alignItems: 'center', gap: 16 },
  tipText: { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  captureBtn: { shadowColor: PURPLE, shadowOpacity: 0.6, shadowRadius: 16, elevation: 10 },
  captureBtnInner: {
    width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)',
  },
  captureHint: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  permScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 16 },
  permTitle: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  permSub: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 21 },
  permBtn: { backgroundColor: PURPLE, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40, marginTop: 8 },
  permBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cancelLink: { marginTop: 4 },
  cancelLinkText: { color: '#94A3B8', fontSize: 14 },
});

// ── Notifications data ────────────────────────────────────────────────────────
const NOTIFS = [
  { id: 1, icon: '💊', title: 'Time for your check-in!', time: '2 min ago', unread: true },
  { id: 2, icon: '😴', title: 'Sleep goal reached — 8h 20m', time: '1 hr ago', unread: true },
  { id: 3, icon: '🔥', title: '5-day streak! Keep it up', time: '3 hr ago', unread: false },
];

// ── Sub-components ────────────────────────────────────────────────────────────
function StressBarChart() {
  const bars = [0.4, 0.6, 0.5, 0.8, 0.7, 0.9, 1.0, 0.85];
  return (
    <View style={styles.barChart}>
      {bars.map((h, i) => <View key={i} style={[styles.bar, { height: h * 44 }]} />)}
    </View>
  );
}

function SleepWaveform() {
  const heights = [0.5, 1.0, 0.6, 0.3, 0.8, 0.4, 0.7, 0.2, 0.9, 0.5, 0.6, 0.8];
  return (
    <View style={styles.waveform}>
      {heights.map((h, i) => <View key={i} style={[styles.waveBar, { height: h * 44 }]} />)}
    </View>
  );
}

function InsightItem({ emoji, title, value }: { emoji: string; title: string; value: string }) {
  return (
    <View style={styles.insightItem}>
      <View style={styles.insightIcon}><Text style={styles.insightEmoji}>{emoji}</Text></View>
      <View>
        <Text style={styles.insightTitle}>{title}</Text>
        <Text style={styles.insightValue}>{value}</Text>
      </View>
    </View>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [scanVisible, setScanVisible] = useState(false);
  const [notifVisible, setNotifVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'android') NavigationBar.setVisibilityAsync('hidden');
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" hidden={true} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 82 }}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userRow}>
            <View style={styles.avatar}><Text style={styles.avatarEmoji}>👩</Text></View>
            <View>
              <Text style={styles.userName}>Sarah Guy</Text>
              <View style={styles.badgeRow}>
                <Text style={styles.starIcon}>⭐</Text>
                <Text style={styles.badgeText}>Pro Member</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.notifBtn} onPress={() => setNotifVisible(true)}>
            <Ionicons name="notifications-outline" size={22} color="#333" />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>

        {/* Hero */}
        <LinearGradient colors={['#E4D5FF', '#D4C2FF', '#EDD5FF']} style={styles.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.speechBubble}>
            <Text style={styles.speechText}>Feeling good, Sarah?{'\n'}Let's do a quick check-in!</Text>
            <TouchableOpacity style={styles.startScanBtn} onPress={() => setScanVisible(true)}>
              <Text style={styles.startScanText}>Start Scan</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.mascotContainer}>
            <Image source={require('./assets/mascot.png')} style={styles.mascot} resizeMode="contain" />
          </View>
        </LinearGradient>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mental Health Statistics</Text>
          <View style={styles.statsRow}>
            <TouchableOpacity style={[styles.statCard, { backgroundColor: PURPLE }]} onPress={() => Alert.alert('Stress Indicator', 'Your stress level is High. Consider taking a break.')}>
              <Text style={styles.statCardLabel}>Stress Indicator</Text>
              <StressBarChart />
              <View style={styles.statCardBottom}>
                <Text style={styles.statCardValue}>High</Text>
                <View style={styles.arrowBtn}><Feather name="arrow-up-right" size={14} color="#333" /></View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.statCard, { backgroundColor: TEAL }]} onPress={() => Alert.alert('Sleep Duration', 'You slept 8h 20m last night. Great job!')}>
              <Text style={styles.statCardLabel}>Sleep Duration</Text>
              <SleepWaveform />
              <View style={styles.statCardBottom}>
                <Text style={styles.statCardValue}>
                  <Text style={styles.statValueBig}>8h </Text>
                  <Text style={styles.statValueSm}>20m</Text>
                </Text>
                <View style={styles.arrowBtn}><Feather name="arrow-up-right" size={14} color="#333" /></View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Insights</Text>
          <View style={styles.insightsGrid}>
            <InsightItem emoji="👅" title="Tongue Color" value="Normal" />
            <InsightItem emoji="🫦" title="Tongue Cover" value="Thick" />
            <InsightItem emoji="💧" title="Humidity" value="Dry" />
            <InsightItem emoji="🔵" title="Herpes" value="No" />
          </View>
        </View>
      </ScrollView>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <View style={styles.activeNavIcon}><Ionicons name="home" size={20} color="#fff" /></View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}><Feather name="search" size={24} color="#bbb" /></TouchableOpacity>
        <TouchableOpacity style={styles.fabWrap} onPress={() => setScanVisible(true)}>
          <LinearGradient colors={['#A78BFF', PURPLE]} style={styles.fab} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="scan" size={26} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}><Feather name="bar-chart-2" size={24} color="#bbb" /></TouchableOpacity>
        <TouchableOpacity style={styles.navItem}><Feather name="user" size={24} color="#bbb" /></TouchableOpacity>
      </View>

      <ScanScreen visible={scanVisible} onClose={() => setScanVisible(false)} />

      <BottomSheet visible={notifVisible} onClose={() => setNotifVisible(false)} snapHeight={320}>
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={styles.sheetTitle}>Notifications</Text>
          {NOTIFS.map(n => (
            <View key={n.id} style={styles.notifRow}>
              <View style={[styles.notifIconWrap, n.unread && styles.notifIconUnread]}>
                <Text style={{ fontSize: 22 }}>{n.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.notifText}>{n.title}</Text>
                <Text style={styles.notifTime}>{n.time}</Text>
              </View>
              {n.unread && <View style={styles.unreadDot} />}
            </View>
          ))}
        </View>
      </BottomSheet>
    </View>
  );
}

const CARD_WIDTH = (width - 52) / 2;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F0FF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F0D9A8', alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 30 },
  userName: { fontSize: 17, fontWeight: '700', color: '#1A1A2E' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  starIcon: { fontSize: 10 },
  badgeText: { fontSize: 11, color: '#999' },
  notifBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  notifDot: { position: 'absolute', top: 9, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30', borderWidth: 1.5, borderColor: '#fff' },
  hero: { marginHorizontal: 20, borderRadius: 24, padding: 18, minHeight: 190, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  speechBubble: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14, maxWidth: '55%', marginBottom: 8,
    shadowColor: '#9B7EFF', shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  speechText: { fontSize: 13, color: '#333', lineHeight: 19, marginBottom: 10 },
  startScanBtn: { borderWidth: 1.5, borderColor: PURPLE, borderRadius: 20, paddingVertical: 5, paddingHorizontal: 14, alignSelf: 'center' },
  startScanText: { color: PURPLE, fontSize: 12, fontWeight: '600' },
  mascotContainer: { alignItems: 'center', justifyContent: 'flex-end' },
  mascot: { width: 150, height: 160 },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E', marginBottom: 14 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, borderRadius: 20, padding: 14, minHeight: 148, justifyContent: 'space-between' },
  statCardLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600' },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 50, marginVertical: 8 },
  bar: { flex: 1, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 3 },
  waveform: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 50, marginVertical: 8 },
  waveBar: { width: 4, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 3 },
  statCardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statCardValue: { color: '#fff', fontSize: 20, fontWeight: '700' },
  statValueBig: { fontSize: 22, fontWeight: '800', color: '#fff' },
  statValueSm: { fontSize: 16, fontWeight: '600', color: '#fff' },
  arrowBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  insightsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  insightItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16,
    padding: 12, gap: 10, width: CARD_WIDTH,
    shadowColor: '#9B7EFF', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  insightIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#F5F0FF', alignItems: 'center', justifyContent: 'center' },
  insightEmoji: { fontSize: 20 },
  insightTitle: { fontSize: 13, fontWeight: '600', color: '#1A1A2E' },
  insightValue: { fontSize: 11, color: '#999', marginTop: 1 },
  bottomNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: '#fff', paddingVertical: 10, paddingBottom: 10,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: -4 }, elevation: 12,
  },
  navItem: { alignItems: 'center', justifyContent: 'center', padding: 6 },
  activeNavIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: PURPLE, alignItems: 'center', justifyContent: 'center' },
  fabWrap: { marginTop: -28 },
  fab: {
    width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center',
    shadowColor: PURPLE, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 18 },
  notifRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  notifIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  notifIconUnread: { backgroundColor: '#F5F0FF' },
  notifText: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  notifTime: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: PURPLE },
});
