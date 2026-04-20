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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as NavigationBar from 'expo-navigation-bar';
import { useEffect } from 'react';

const { width } = Dimensions.get('window');
const BLUE = '#2563EB';

function StatCard({
  emoji,
  label,
  value,
  bgColor,
}: {
  emoji: string;
  label: string;
  value: string;
  bgColor: string;
}) {
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

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setBehaviorAsync('overlay-swipe');
    }
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" hidden={true} />
      <LinearGradient
        colors={['#BFD9F2', '#D6E9F8', '#F0F8FF', '#ffffff']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.55 }}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 82 }}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Good afternoon, Mah</Text>
          <TouchableOpacity style={styles.notifBtn}>
            <Ionicons name="notifications-outline" size={22} color="#333" />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>

        {/* Mascot */}
        <View style={styles.mascotWrap}>
          <Image
            source={require('./assets/mascot.png')}
            style={styles.mascot}
            resizeMode="contain"
          />
        </View>

        {/* State of Mind Card */}
        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardSubLabel}>State of Mind</Text>
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>5 Days Striks </Text>
              <Text style={styles.streakFire}>🔥</Text>
            </View>
          </View>
          <Text style={styles.cardQuestion}>How do you feel right now?</Text>
          <TouchableOpacity style={styles.logMoodBtn}>
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
        <View style={styles.checkinCard}>
          <View style={styles.checkinAvatar}>
            <Image
              source={require('./assets/mascot.png')}
              style={styles.checkinAvatarImg}
              resizeMode="contain"
            />
          </View>
          <View style={styles.checkinText}>
            <Text style={styles.checkinTitle}>Feeling good, Mah?</Text>
            <Text style={styles.checkinSub}>Let's do a quick check-in!</Text>
          </View>
          <TouchableOpacity style={styles.playBtn}>
            <Ionicons name="play" size={16} color="#333" />
          </TouchableOpacity>
        </View>

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
        <TouchableOpacity style={styles.fabWrap}>
          <LinearGradient
            colors={['#818CF8', '#7C3AED']}
            style={styles.fab}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
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
    </View>
  );
}

const CARD_WIDTH = (width - 52) / 2;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#BFD9F2' },

  // Header
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
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  notifDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#fff',
  },

  // Mascot
  mascotWrap: { alignItems: 'center', marginTop: 8, marginBottom: 4 },
  mascot: { width: 220, height: 220 },

  // State of Mind card
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardSubLabel: { fontSize: 13, color: '#94A3B8' },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: BLUE,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  streakText: { fontSize: 12, color: BLUE, fontWeight: '600' },
  streakFire: { fontSize: 13 },
  cardQuestion: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 14 },
  logMoodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DBEAFE',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  logMoodText: { fontSize: 15, fontWeight: '700', color: BLUE },

  // Stats
  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statEmoji: { fontSize: 22 },
  statLabel: { fontSize: 11, color: '#94A3B8', marginBottom: 2 },
  statValue: { fontSize: 15, fontWeight: '700', color: '#0F172A' },

  // Check-in card
  checkinCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  checkinAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0F172A',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkinAvatarImg: { width: 48, height: 48 },
  checkinText: { flex: 1 },
  checkinTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  checkinSub: { fontSize: 13, color: '#64748B', marginTop: 2 },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Bottom Nav
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingBottom: 10,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  navLabel: { fontSize: 11, color: '#94A3B8', marginTop: 3 },
  navLabelActive: { fontSize: 11, color: '#0F172A', fontWeight: '600', marginTop: 3 },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#0F172A',
    marginTop: 3,
  },
  fabWrap: { marginTop: -26 },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileEmoji: { fontSize: 22 },
});
