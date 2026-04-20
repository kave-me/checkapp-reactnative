import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions,
  Modal, Animated, Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const FRAME_W = width * 0.8;
const FRAME_H = 148;
// Position frame at ~52% from top — mouth area in front-camera selfie
const FRAME_TOP = height * 0.52 - FRAME_H / 2;
const FRAME_LEFT = (width - FRAME_W) / 2;
const CORNER_SIZE = 26;
const CORNER_THICKNESS = 3;
const CORNER_RADIUS = 14;

const STEPS = [
  { icon: '📱', label: 'Hold phone at face level' },
  { icon: '👄', label: 'Open your mouth wide' },
  { icon: '👅', label: 'Stick your tongue out fully' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  accentColor: string;
  accentGradient: [string, string];
}

export default function ScanScreen({ visible, onClose, accentColor, accentGradient }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState(0);
  const [scanning, setScanning] = useState(false);

  const scanLineY = useRef(new Animated.Value(0)).current;
  const stepOpacity = useRef(new Animated.Value(1)).current;
  const frameGlow = useRef(new Animated.Value(0)).current;
  const scanLineOpacity = useRef(new Animated.Value(0)).current;

  // Advance steps every 2.5s
  useEffect(() => {
    if (!visible) return;
    setStep(0);
    setScanning(false);

    const interval = setInterval(() => {
      Animated.timing(stepOpacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
        setStep(s => {
          const next = s + 1;
          if (next >= STEPS.length) {
            setScanning(true);
            clearInterval(interval);
            // Show scan line once ready
            Animated.timing(scanLineOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
          }
          return Math.min(next, STEPS.length - 1);
        });
        Animated.timing(stepOpacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
      });
    }, 2500);

    // Frame glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(frameGlow, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(frameGlow, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    return () => clearInterval(interval);
  }, [visible]);

  // Scan line sweeps once ready
  useEffect(() => {
    if (!scanning) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineY, { toValue: FRAME_H, duration: 1600, useNativeDriver: true }),
        Animated.timing(scanLineY, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, [scanning]);

  if (!visible) return null;

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <Modal visible animationType="slide" onRequestClose={onClose}>
        <View style={s.permRoot}>
          <View style={s.permIcon}>
            <Ionicons name="camera-outline" size={48} color="#64748B" />
          </View>
          <Text style={s.permTitle}>Camera Permission Required</Text>
          <Text style={s.permSub}>
            We use your front camera to scan your tongue and analyse health indicators.
            Your data stays on-device.
          </Text>
          <TouchableOpacity
            style={[s.permBtn, { backgroundColor: accentColor }]}
            onPress={requestPermission}
          >
            <Text style={s.permBtnText}>Allow Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={s.permCancel}>
            <Text style={s.permCancelText}>Not now</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  const handleCapture = () => {
    onClose();
    setTimeout(() => {
      Alert.alert('Scan Complete ✓', 'Your tongue has been analysed. Results will appear in your dashboard shortly.');
    }, 400);
  };

  return (
    <Modal visible animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={s.root}>
        {/* Live camera */}
        <CameraView style={StyleSheet.absoluteFill} facing="front" />

        {/* Seamless dark overlay — 4 pieces around the clear window */}
        {/* Top */}
        <View style={[s.mask, { top: 0, left: 0, right: 0, height: FRAME_TOP }]} />
        {/* Bottom */}
        <View style={[s.mask, { top: FRAME_TOP + FRAME_H, left: 0, right: 0, bottom: 0 }]} />
        {/* Left */}
        <View style={[s.mask, { top: FRAME_TOP, left: 0, width: FRAME_LEFT, height: FRAME_H }]} />
        {/* Right */}
        <View style={[s.mask, { top: FRAME_TOP, right: 0, width: FRAME_LEFT, height: FRAME_H }]} />

        {/* ── Corner brackets — no shadow, no overflow ── */}
        <View style={[s.frameWrap, { top: FRAME_TOP, left: FRAME_LEFT, width: FRAME_W, height: FRAME_H }]}>
          {/* Animated frame border opacity */}
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: frameGlow }]}>
            {/* TL */}
            <View style={[s.corner, {
              top: 0, left: 0,
              borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS,
              borderTopLeftRadius: CORNER_RADIUS,
              borderColor: scanning ? accentColor : '#fff',
            }]} />
            {/* TR */}
            <View style={[s.corner, {
              top: 0, right: 0,
              borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS,
              borderTopRightRadius: CORNER_RADIUS,
              borderColor: scanning ? accentColor : '#fff',
            }]} />
            {/* BL */}
            <View style={[s.corner, {
              bottom: 0, left: 0,
              borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS,
              borderBottomLeftRadius: CORNER_RADIUS,
              borderColor: scanning ? accentColor : '#fff',
            }]} />
            {/* BR */}
            <View style={[s.corner, {
              bottom: 0, right: 0,
              borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS,
              borderBottomRightRadius: CORNER_RADIUS,
              borderColor: scanning ? accentColor : '#fff',
            }]} />
          </Animated.View>

          {/* Scan line — plain, no shadow */}
          {scanning && (
            <Animated.View style={[s.scanLine, {
              backgroundColor: accentColor,
              transform: [{ translateY: scanLineY }],
            }]} />
          )}
        </View>

        {/* ── Top bar ── */}
        <View style={s.topBar}>
          <TouchableOpacity style={s.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={s.topTitle}>Tongue Analysis</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* ── Step dots (above frame) ── */}
        <View style={[s.stepDots, { top: FRAME_TOP - 44 }]}>
          {STEPS.map((_, i) => (
            <View key={i} style={[s.dot, {
              backgroundColor: i <= step ? '#fff' : 'rgba(255,255,255,0.3)',
              width: i === step ? 20 : 8,
            }]} />
          ))}
        </View>

        {/* ── Bottom panel ── */}
        <View style={s.bottomPanel}>
          {/* Instruction */}
          <Animated.View style={{ opacity: stepOpacity, alignItems: 'center', marginBottom: 20 }}>
            <Text style={s.stepIcon}>{STEPS[step].icon}</Text>
            <Text style={s.stepLabel}>
              {scanning ? 'Stay still — scanning…' : STEPS[step].label}
            </Text>
            <Text style={s.stepSub}>
              Step {step + 1} of {STEPS.length}
              {scanning ? ' · Ready' : ''}
            </Text>
          </Animated.View>

          {/* Capture button */}
          <TouchableOpacity
            style={[s.captureWrap, !scanning && s.captureDimmed]}
            onPress={scanning ? handleCapture : undefined}
            activeOpacity={scanning ? 0.8 : 1}
          >
            <LinearGradient
              colors={scanning ? accentGradient : ['#374151', '#374151']}
              style={s.captureBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="scan" size={30} color={scanning ? '#fff' : '#6B7280'} />
            </LinearGradient>
          </TouchableOpacity>
          <Text style={s.captureHint}>{scanning ? 'Tap to capture' : 'Follow the steps above'}</Text>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  mask: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.72)' },
  frameWrap: { position: 'absolute' },
  corner: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE },
  scanLine: {
    position: 'absolute',
    left: CORNER_SIZE,
    right: CORNER_SIZE,
    height: 2,
    borderRadius: 1,
  },

  topBar: {
    position: 'absolute',
    top: 36,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  topTitle: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  stepDots: {
    position: 'absolute',
    left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: { height: 8, borderRadius: 4, backgroundColor: '#fff' },

  bottomPanel: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 28,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  stepIcon: { fontSize: 36, marginBottom: 10 },
  stepLabel: { fontSize: 18, fontWeight: '700', color: '#F1F5F9', textAlign: 'center', marginBottom: 4 },
  stepSub: { fontSize: 13, color: '#64748B', textAlign: 'center' },

  captureWrap: { marginTop: 4, marginBottom: 10 },
  captureDimmed: { opacity: 0.6 },
  captureBtn: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.15)',
  },
  captureHint: { fontSize: 12, color: '#475569' },

  permRoot: {
    flex: 1, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', padding: 40, gap: 14,
  },
  permIcon: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  permTitle: { fontSize: 20, fontWeight: '700', color: '#0F172A', textAlign: 'center' },
  permSub: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22 },
  permBtn: { borderRadius: 14, paddingVertical: 15, paddingHorizontal: 40, marginTop: 8 },
  permBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  permCancel: { marginTop: 4 },
  permCancelText: { color: '#94A3B8', fontSize: 14 },
});
