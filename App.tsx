import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  Dimensions, Image, Platform, Modal, Animated, Alert,
  PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as NavigationBar from 'expo-navigation-bar';
import { useEffect, useState, useRef } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';

const { width, height } = Dimensions.get('window');
const BLUE = '#2563EB';

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
        Animated.spring(translateY, {
          toValue: 0, damping: 22, stiffness: 280, useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1, duration: 220, useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: snapHeight, damping: 22, stiffness: 280, useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0, duration: 180, useNativeDriver: true,
        }),
      ]).start(() => setMounted(false));
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, { dy }) => {
        if (dy > 0) translateY.setValue(dy);
      },
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
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  container: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: 32,
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: -4 },
    elevation: 20,
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

    // Cycle tips with crossfade
    const interval = setInterval(() => {
      Animated.timing(tipOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setTipIndex(i => (i + 1) % TIPS.length);
        Animated.timing(tipOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      });
    }, 2200);

    // Scan line loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineY, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(scanLineY, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start();

    // Frame pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(frameScale, { toValue: 1.04, duration: 900, useNativeDriver: true }),
        Animated.timing(frameScale, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();

    return () => clearInterval(interval);
  }, [visible]);

  if (!visible) return null;

  // Permission flow
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
  const CORNER = 22;
  const BORDER_W = 3;

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={cam.root}>
        <CameraView style={StyleSheet.absoluteFill} facing="front" />

        {/* Dark overlay top */}
        <View style={[cam.mask, { top: 0, height: (height - FRAME_H) / 2 - 10 }]} />
        {/* Dark overlay bottom */}
        <View style={[cam.mask, { bottom: 0, height: (height - FRAME_H) / 2 - 10 }]} />
        {/* Dark overlay left */}
        <View style={[cam.maskSide, { left: 0, top: (height - FRAME_H) / 2 - 10, width: (width - FRAME_W) / 2, height: FRAME_H + 20 }]} />
        {/* Dark overlay right */}
        <View style={[cam.maskSide, { right: 0, top: (height - FRAME_H) / 2 - 10, width: (width - FRAME_W) / 2, height: FRAME_H + 20 }]} />

        {/* Scan frame */}
        <Animated.View style={[cam.frame, {
          width: FRAME_W, height: FRAME_H,
          transform: [{ scale: frameScale }],
        }]}>
          {/* Corner brackets */}
          {[
            { top: 0, left: 0, borderTopWidth: BORDER_W, borderLeftWidth: BORDER_W, borderTopLeftRadius: CORNER },
            { top: 0, right: 0, borderTopWidth: BORDER_W, borderRightWidth: BORDER_W, borderTopRightRadius: CORNER },
            { bottom: 0, left: 0, borderBottomWidth: BORDER_W, borderLeftWidth: BORDER_W, borderBottomLeftRadius: CORNER },
            { bottom: 0, right: 0, borderBottomWidth: BORDER_W, borderRightWidth: BORDER_W, borderBottomRightRadius: CORNER },
          ].map((s, i) => (
            <View key={i} style={[cam.corner, s]} />
          ))}

          {/* Scan line */}
          <Animated.View style={[cam.scanLine, {
            transform: [{
              translateY: scanLineY.interpolate({
                inputRange: [0, 1], outputRange: [0, FRAME_H - 2],
              }),
            }],
          }]} />
        </Animated.View>

        {/* Header */}
        <View style={cam.header}>
          <TouchableOpacity style={cam.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={cam.headerTitle}>Tongue Scan</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Instruction */}
        <View style={cam.instructionBox}>
          <Text style={cam.instructionLabel}>👅 Position your tongue in the frame</Text>
        </View>

        {/* Tip */}
        <View style={cam.tipBox}>
          <Animated.Text style={[cam.tipText, { opacity: tipOpacity }]}>
            💡 {TIPS[tipIndex]}
          </Animated.Text>
          <TouchableOpacity
            style={cam.captureBtn}
            onPress={() => { onClose(); Alert.alert('Scan Complete', 'Your tongue scan has been analysed. Results will appear shortly.'); }}
          >
            <LinearGradient colors={['#818CF8', '#4F46E5']} style={cam.captureBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
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
  frame: {
    position: 'absolute',
    alignSelf: 'center',
    top: '50%',
    marginTop: -90,
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute', width: 28, height: 28, borderColor: '#fff',
  },
  scanLine: {
    position: 'absolute', left: 8, right: 8, height: 2,
    backgroundColor: 'rgba(99,102,241,0.8)',
    shadowColor: '#818CF8', shadowOpacity: 1, shadowRadius: 6, elevation: 4,
  },
  header: {
    position: 'absolute', top: 28, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20,
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
  tipBox: {
    position: 'absolute', bottom: 52, left: 0, right: 0,
    alignItems: 'center', gap: 16,
  },
  tipText: { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  captureBtn: {
    shadowColor: '#4F46E5', shadowOpacity: 0.6, shadowRadius: 16, elevation: 10,
  },
  captureBtnInner: {
    width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)',
  },
  captureHint: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  permScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 16 },
  permTitle: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  permSub: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 21 },
  permBtn: { backgroundColor: BLUE, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40, marginTop: 8 },
  permBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cancelLink: { marginTop: 4 },
  cancelLinkText: { color: '#94A3B8', fontSize: 14 },
});

// ── Notification Sheet Content ────────────────────────────────────────────────
const NOTIFS = [
  { id: 1, icon: '💊', title: 'Time for your check-in!', time: '2 min ago', unread: true },
  { id: 2, icon: '😴', title: 'Sleep goal reached — 8h 20m', time: '1 hr ago', unread: true },
  { id: 3, icon: '🔥', title: '5-day streak! Keep it up', time: '3 hr ago', unread: false },
];

// ── Mood Sheet ────────────────────────────────────────────────────────────────
const MOODS = ['😄', '🙂', '😐', '😔', '😢'];
const MOOD_LABELS = ['Great', 'Good', 'Okay', 'Low', 'Sad'];

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ emoji, label, value, bgColor }: { emoji: string; label: string; value: string; bgColor: string }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconBg, { backgroundColor: bgColor }]}>
        <Text style={styles.statEmoji}>{emoji}</Text>
      </View>
      <View>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </View>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [scanVisible, setScanVisible] = useState(false);
  const [notifVisible, setNotifVisible] = useState(false);
  const [moodVisible, setMoodVisible] = useState(false);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden');
    }
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" hidden={true} />
      <LinearGradient
        colors={['#C2DDF5', '#D8ECFA', '#EEF6FD', '#ffffff']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 82 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Good afternoon, Mah</Text>
          <TouchableOpacity style={styles.notifBtn} onPress={() => setNotifVisible(true)}>
            <Ionicons name="notifications-outline" size={22} color="#333" />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>

        {/* Mascot */}
        <View style={styles.mascotWrap}>
          <Image source={require('./assets/mascot-dog.png')} style={styles.mascot} resizeMode="contain" />
        </View>

        {/* State of Mind Card */}
        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardSubLabel}>State of Mind</Text>
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>5 Days Striks 🔥</Text>
            </View>
          </View>
          <Text style={styles.cardQuestion}>How do you feel right now?</Text>
          <TouchableOpacity style={styles.logMoodBtn} onPress={() => setMoodVisible(true)}>
            <Ionicons name="add-circle" size={20} color={BLUE} />
            <Text style={styles.logMoodText}>Log a Mood</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Metal Health Statistics</Text>
          <View style={styles.statsRow}>
            <StatCard emoji="❤️" label="Heart Rate" value="91 BPM" bgColor="#FEE2E2" />
            <StatCard emoji="🌙" label="Sleep Duration" value="8h 20m" bgColor="#DBEAFE" />
          </View>
        </View>

        {/* Check-in Card */}
        <TouchableOpacity style={styles.checkinCard} onPress={() => setScanVisible(true)}>
          <View style={styles.checkinAvatar}>
            <Image source={require('./assets/mascot-dog.png')} style={styles.checkinAvatarImg} resizeMode="contain" />
          </View>
          <View style={styles.checkinText}>
            <Text style={styles.checkinTitle}>Feeling good, Mah?</Text>
            <Text style={styles.checkinSub}>Let's do a quick check-in!</Text>
          </View>
          <View style={styles.playBtn}>
            <Ionicons name="play" size={16} color="#333" />
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons name="pentagon" size={24} color="#111" />
          <Text style={styles.navLabelActive}>For You</Text>
          <View style={styles.activeDot} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Feather name="circle" size={24} color="#999" />
          <Text style={styles.navLabel}>Progress</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.fabWrap} onPress={() => setScanVisible(true)}>
          <LinearGradient colors={['#818CF8', '#7C3AED']} style={styles.fab} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="scan" size={26} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Feather name="bar-chart-2" size={24} color="#999" />
          <Text style={styles.navLabel}>Self-Care</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileEmoji}>👩</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Scan Camera */}
      <ScanScreen visible={scanVisible} onClose={() => setScanVisible(false)} />

      {/* Notification Sheet */}
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

      {/* Mood Sheet */}
      <BottomSheet visible={moodVisible} onClose={() => setMoodVisible(false)} snapHeight={300}>
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={styles.sheetTitle}>How are you feeling?</Text>
          <View style={styles.moodRow}>
            {MOODS.map((m, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.moodItem, selectedMood === i && styles.moodSelected]}
                onPress={() => setSelectedMood(i)}
              >
                <Text style={styles.moodEmoji}>{m}</Text>
                <Text style={[styles.moodLabel, selectedMood === i && styles.moodLabelActive]}>
                  {MOOD_LABELS[i]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.logBtn, selectedMood === null && styles.logBtnDisabled]}
            onPress={() => {
              if (selectedMood === null) return;
              setMoodVisible(false);
              Alert.alert('Mood Logged!', `You're feeling ${MOOD_LABELS[selectedMood]} today. 🌟`);
              setSelectedMood(null);
            }}
          >
            <Text style={styles.logBtnText}>Log Mood</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#C2DDF5' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 22, paddingTop: 18, paddingBottom: 4,
  },
  greeting: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  notifBtn: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  notifDot: {
    position: 'absolute', top: 9, right: 10, width: 8, height: 8,
    borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: '#fff',
  },

  mascotWrap: { alignItems: 'center', marginTop: 4, marginBottom: 8 },
  mascot: { width: 230, height: 230 },

  card: {
    backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 20, padding: 18,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardSubLabel: { fontSize: 13, color: '#94A3B8' },
  streakBadge: {
    borderWidth: 1.5, borderColor: BLUE, borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10,
  },
  streakText: { fontSize: 12, color: BLUE, fontWeight: '600' },
  cardQuestion: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 14 },
  logMoodBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#DBEAFE', borderRadius: 14, paddingVertical: 14, gap: 8,
  },
  logMoodText: { fontSize: 15, fontWeight: '700', color: BLUE },

  section: { paddingHorizontal: 16, marginTop: 22 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 18, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  statIconBg: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  statEmoji: { fontSize: 22 },
  statLabel: { fontSize: 11, color: '#94A3B8', marginBottom: 2 },
  statValue: { fontSize: 15, fontWeight: '700', color: '#0F172A' },

  checkinCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 20, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  checkinAvatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: '#0F172A',
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  checkinAvatarImg: { width: 52, height: 52 },
  checkinText: { flex: 1 },
  checkinTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  checkinSub: { fontSize: 13, color: '#64748B', marginTop: 2 },
  playBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
  },

  bottomNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: '#fff', paddingVertical: 10, paddingBottom: 10,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: -4 }, elevation: 12,
  },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  navLabel: { fontSize: 11, color: '#94A3B8', marginTop: 3 },
  navLabelActive: { fontSize: 11, color: '#0F172A', fontWeight: '600', marginTop: 3 },
  activeDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#0F172A', marginTop: 3 },
  fabWrap: { marginTop: -26 },
  fab: {
    width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#7C3AED', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
  profileAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#1D4ED8',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  profileEmoji: { fontSize: 22 },

  // Sheets
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 18 },
  notifRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  notifIconWrap: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#F8FAFC',
    alignItems: 'center', justifyContent: 'center',
  },
  notifIconUnread: { backgroundColor: '#EFF6FF' },
  notifText: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  notifTime: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: BLUE },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  moodItem: {
    alignItems: 'center', padding: 10, borderRadius: 16,
    borderWidth: 2, borderColor: 'transparent', flex: 1,
  },
  moodSelected: { borderColor: BLUE, backgroundColor: '#EFF6FF' },
  moodEmoji: { fontSize: 30, marginBottom: 4 },
  moodLabel: { fontSize: 10, color: '#94A3B8' },
  moodLabelActive: { color: BLUE, fontWeight: '600' },
  logBtn: { backgroundColor: BLUE, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  logBtnDisabled: { backgroundColor: '#CBD5E1' },
  logBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
