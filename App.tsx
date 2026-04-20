import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  Platform,
  Modal,
  Animated,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as NavigationBar from 'expo-navigation-bar';
import { useEffect, useState, useRef } from 'react';

const { width, height } = Dimensions.get('window');
const BLUE = '#2563EB';

// ── Scan Modal ────────────────────────────────────────────────────────────────
function ScanModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    const pulse = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration: 1400, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );
    const a1 = pulse(ring1, 0);
    const a2 = pulse(ring2, 700);
    a1.start(); a2.start();
    return () => { a1.stop(); a2.stop(); };
  }, [visible]);

  const ringStyle = (val: Animated.Value) => ({
    opacity: val.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 0.2, 0] }),
    transform: [{ scale: val.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] }) }],
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={modal.overlay}>
        <View style={modal.box}>
          <Text style={modal.title}>Scanning...</Text>
          <View style={modal.scanRingWrap}>
            <Animated.View style={[modal.ring, ringStyle(ring1)]} />
            <Animated.View style={[modal.ring, ringStyle(ring2)]} />
            <View style={modal.scanIcon}>
              <Ionicons name="scan" size={48} color={BLUE} />
            </View>
          </View>
          <Text style={modal.scanHint}>Point your camera at your tongue</Text>
          <TouchableOpacity style={modal.closeBtn} onPress={onClose}>
            <Text style={modal.closeBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Notifications Modal ───────────────────────────────────────────────────────
const NOTIFS = [
  { id: 1, icon: '💊', title: 'Time for your check-in!', time: '2 min ago' },
  { id: 2, icon: '😴', title: 'Sleep goal reached — 8h 20m', time: '1 hr ago' },
  { id: 3, icon: '🔥', title: '5-day streak! Keep it up', time: '3 hr ago' },
];

function NotifModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={modal.overlay} activeOpacity={1} onPress={onClose}>
        <View style={modal.notifSheet}>
          <View style={modal.notifHandle} />
          <Text style={modal.title}>Notifications</Text>
          {NOTIFS.map(n => (
            <View key={n.id} style={modal.notifRow}>
              <Text style={modal.notifIcon}>{n.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={modal.notifText}>{n.title}</Text>
                <Text style={modal.notifTime}>{n.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ── Mood Modal ────────────────────────────────────────────────────────────────
const MOODS = ['😄', '🙂', '😐', '😔', '😢'];
const MOOD_LABELS = ['Great', 'Good', 'Okay', 'Low', 'Sad'];

function MoodModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={modal.overlay} activeOpacity={1} onPress={onClose}>
        <View style={modal.moodSheet}>
          <View style={modal.notifHandle} />
          <Text style={modal.title}>How are you feeling?</Text>
          <View style={modal.moodRow}>
            {MOODS.map((m, i) => (
              <TouchableOpacity
                key={i}
                style={[modal.moodItem, selected === i && modal.moodSelected]}
                onPress={() => setSelected(i)}
              >
                <Text style={modal.moodEmoji}>{m}</Text>
                <Text style={modal.moodLabel}>{MOOD_LABELS[i]}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[modal.logBtn, !selected && selected !== 0 && modal.logBtnDisabled]}
            onPress={() => { onClose(); Alert.alert('Mood logged!', `You're feeling ${MOOD_LABELS[selected ?? 0]} today.`); setSelected(null); }}
          >
            <Text style={modal.logBtnText}>Log Mood</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

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
            <TouchableOpacity style={styles.streakBadge}>
              <Text style={styles.streakText}>5 Days Striks 🔥</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.cardQuestion}>How do you feel right now?</Text>
          <TouchableOpacity style={styles.logMoodBtn} onPress={() => setMoodVisible(true)}>
            <Ionicons name="add-circle" size={20} color={BLUE} />
            <Text style={styles.logMoodText}>Log a Mood</Text>
          </TouchableOpacity>
        </View>

        {/* Mental Health Statistics */}
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

      <ScanModal visible={scanVisible} onClose={() => setScanVisible(false)} />
      <NotifModal visible={notifVisible} onClose={() => setNotifVisible(false)} />
      <MoodModal visible={moodVisible} onClose={() => setMoodVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#C2DDF5' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 4,
  },
  greeting: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  notifBtn: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  notifDot: {
    position: 'absolute', top: 9, right: 10, width: 8, height: 8,
    borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: '#fff',
  },

  mascotWrap: { alignItems: 'center', marginTop: 4, marginBottom: 8 },
  mascot: { width: 230, height: 230 },

  card: {
    backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 20, padding: 18,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardSubLabel: { fontSize: 13, color: '#94A3B8' },
  streakBadge: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5,
    borderColor: BLUE, borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10,
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
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  statIconBg: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  statEmoji: { fontSize: 22 },
  statLabel: { fontSize: 11, color: '#94A3B8', marginBottom: 2 },
  statValue: { fontSize: 15, fontWeight: '700', color: '#0F172A' },

  checkinCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 20,
    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
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
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 }, elevation: 12,
  },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  navLabel: { fontSize: 11, color: '#94A3B8', marginTop: 3 },
  navLabelActive: { fontSize: 11, color: '#0F172A', fontWeight: '600', marginTop: 3 },
  activeDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#0F172A', marginTop: 3 },
  fabWrap: { marginTop: -26 },
  fab: {
    width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#7C3AED', shadowOpacity: 0.4, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
  profileAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#1D4ED8',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  profileEmoji: { fontSize: 22 },
});

const modal = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end', alignItems: 'center',
  },
  box: {
    width: width - 40, backgroundColor: '#fff', borderRadius: 24,
    padding: 28, alignItems: 'center', marginBottom: 40,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 24 },

  // Scan
  scanRingWrap: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  ring: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    borderWidth: 2, borderColor: BLUE,
  },
  scanIcon: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center',
  },
  scanHint: { fontSize: 14, color: '#64748B', marginBottom: 24, textAlign: 'center' },
  closeBtn: {
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 32,
  },
  closeBtnText: { fontSize: 15, fontWeight: '600', color: '#64748B' },

  // Notifications
  notifSheet: {
    width, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 32,
  },
  notifHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0',
    alignSelf: 'center', marginBottom: 16,
  },
  notifRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  notifIcon: { fontSize: 28 },
  notifText: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  notifTime: { fontSize: 12, color: '#94A3B8', marginTop: 2 },

  // Mood
  moodSheet: {
    width, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 32,
  },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  moodItem: {
    alignItems: 'center', padding: 10, borderRadius: 16,
    borderWidth: 2, borderColor: 'transparent',
  },
  moodSelected: { borderColor: BLUE, backgroundColor: '#EFF6FF' },
  moodEmoji: { fontSize: 32, marginBottom: 4 },
  moodLabel: { fontSize: 11, color: '#64748B' },
  logBtn: {
    backgroundColor: BLUE, borderRadius: 14, paddingVertical: 14,
    alignItems: 'center',
  },
  logBtnDisabled: { backgroundColor: '#CBD5E1' },
  logBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
