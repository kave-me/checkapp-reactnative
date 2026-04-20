import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  Dimensions, Image, Platform, Modal, Animated, Alert, PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as NavigationBar from 'expo-navigation-bar';
import { useEffect, useState, useRef } from 'react';
import ScanScreen from './ScanScreen';

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
      <Animated.View style={[sh.backdrop, { opacity: backdropOpacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[sh.container, { transform: [{ translateY }] }]}>
        <LinearGradient
          colors={['rgba(0,0,0,0.10)', 'transparent']}
          style={sh.topShadow}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          pointerEvents="none"
        />
        <View {...panResponder.panHandlers} style={sh.handleZone}>
          <View style={sh.handle} />
        </View>
        {children}
      </Animated.View>
    </Modal>
  );
}

const sh = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  container: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: 32,
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: -4 }, elevation: 20,
  },
  topShadow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 28,
    borderTopLeftRadius: 24, borderTopRightRadius: 24, zIndex: 1,
  },
  handleZone: { paddingVertical: 12, alignItems: 'center', zIndex: 2 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1' },
});

// ── Notifications ─────────────────────────────────────────────────────────────
const NOTIFS = [
  { id: 1, icon: '💊', title: 'Time for your check-in!', time: '2 min ago', unread: true },
  { id: 2, icon: '😴', title: 'Sleep goal reached — 8h 20m', time: '1 hr ago', unread: true },
  { id: 3, icon: '🔥', title: '5-day streak! Keep it up', time: '3 hr ago', unread: false },
];

// ── Chart helpers ─────────────────────────────────────────────────────────────
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
            <TouchableOpacity style={[styles.statCard, { backgroundColor: PURPLE }]}
              onPress={() => Alert.alert('Stress Indicator', 'Your stress level is High. Consider taking a break.')}>
              <Text style={styles.statCardLabel}>Stress Indicator</Text>
              <StressBarChart />
              <View style={styles.statCardBottom}>
                <Text style={styles.statCardValue}>High</Text>
                <View style={styles.arrowBtn}><Feather name="arrow-up-right" size={14} color="#333" /></View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.statCard, { backgroundColor: TEAL }]}
              onPress={() => Alert.alert('Sleep Duration', 'You slept 8h 20m last night. Great job!')}>
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

      <ScanScreen
        visible={scanVisible}
        onClose={() => setScanVisible(false)}
        accentColor={PURPLE}
        accentGradient={['#A78BFF', PURPLE]}
      />

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
