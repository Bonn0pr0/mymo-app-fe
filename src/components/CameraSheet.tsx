import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet, Animated,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Gradients, Shadows } from '../constants/colors';
import { useI18n } from '../i18n';
import Toast from 'react-native-toast-message';

interface CameraSheetProps {
  locationGranted: boolean;
  onClose: () => void;
  onRequestLocation: () => void;
}

export default function CameraSheet({ locationGranted, onClose, onRequestLocation }: CameraSheetProps) {
  const { t } = useI18n();
  const [captured, setCaptured] = useState(false);
  const slideAnim = useRef(new Animated.Value(800)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 10,
    }).start();
  }, []);

  const close = () => {
    Animated.timing(slideAnim, {
      toValue: 800,
      duration: 300,
      useNativeDriver: true,
    }).start(onClose);
  };

  return (
    <Modal transparent={false} animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
        <LinearGradient colors={['#1a0f33', '#2A1758', '#1a0f33']} style={StyleSheet.absoluteFill} />

        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={close} style={styles.topBtn}>
            <Ionicons name="close" size={22} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.locationBadge}>
            <Ionicons name="location" size={12} color={Colors.primaryLight} />
            <Text style={styles.locationText}>
              {locationGranted ? t('cam.live') : t('cam.locOff')}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => Toast.show({ type: 'info', text1: t('cam.gallery'), text2: t('cam.galleryDesc') })}
            style={styles.topBtn}
          >
            <Ionicons name="images-outline" size={22} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Viewfinder */}
        <View style={styles.viewfinder}>
          {!captured ? (
            <>
              <LinearGradient
                colors={['rgba(156,124,255,0.3)', 'transparent', 'rgba(124,91,255,0.2)']}
                style={StyleSheet.absoluteFill}
              />
              {/* Corner brackets */}
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />

              <View style={styles.frameHint}>
                <Ionicons name="sparkles" size={22} color="rgba(232,223,255,0.9)" />
                <Text style={styles.frameHintText}>{t('cam.frame')}</Text>
              </View>
            </>
          ) : (
            <>
              <LinearGradient
                colors={['#FFB8E0', '#BFA2FF', '#7CC4FF']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={styles.capturedBadge}>
                <Ionicons name="checkmark-circle" size={22} color={Colors.white} />
                <Text style={styles.capturedText}>{t('cam.captured')}</Text>
              </View>
            </>
          )}

          {locationGranted && !captured && (
            <View style={styles.geoTag}>
              <Ionicons name="location" size={13} color={Colors.primaryLight} />
              <Text style={styles.geoTagText}>Sunset Blvd · {t('common.now')}</Text>
            </View>
          )}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {!captured ? (
            <View style={styles.captureRow}>
              <TouchableOpacity
                onPress={() => Toast.show({ type: 'success', text1: t('cam.filter'), text2: t('cam.filterDesc') })}
                style={styles.controlBtn}
              >
                <Ionicons name="sparkles" size={22} color={Colors.white} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setCaptured(true)}
                style={styles.shutterOuter}
                activeOpacity={0.85}
              >
                <LinearGradient colors={Gradients.primary} style={styles.shutterInner} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => Toast.show({ type: 'info', text1: t('cam.flip') })}
                style={styles.controlBtn}
              >
                <Ionicons name="camera-reverse-outline" size={22} color={Colors.white} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.postActions}>
              <TouchableOpacity
                onPress={() => {
                  if (locationGranted) {
                    Toast.show({ type: 'success', text1: t('cam.posted'), text2: t('cam.postedDesc') });
                    close();
                  } else {
                    onRequestLocation();
                  }
                }}
                activeOpacity={0.85}
                style={styles.postBtn}
              >
                <LinearGradient colors={Gradients.primary} style={styles.postBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Ionicons name="send" size={16} color={Colors.white} />
                  <Text style={styles.postBtnText}>{t('cam.postNow')}</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  Toast.show({ type: 'success', text1: t('cam.saved') });
                  close();
                }}
                style={styles.saveBtn}
                activeOpacity={0.85}
              >
                <Ionicons name="download-outline" size={16} color={Colors.white} />
                <Text style={styles.saveBtnText}>{t('cam.save')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setCaptured(false)} style={styles.retakeBtn}>
                <Text style={styles.retakeBtnText}>{t('common.retake')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
}

const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a0f33',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: (StatusBar.currentHeight ?? 44) + 8,
    paddingBottom: 12,
  },
  topBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  locationText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '600',
  },
  viewfinder: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 36,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2A1758',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  cornerTL: {
    top: 16, left: 16,
    borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 16, right: 16,
    borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 16, left: 16,
    borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 16, right: 16,
    borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS,
    borderBottomRightRadius: 8,
  },
  frameHint: {
    backgroundColor: 'rgba(30,15,60,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    gap: 6,
  },
  frameHintText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  capturedBadge: {
    backgroundColor: 'rgba(30,15,60,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    gap: 6,
  },
  capturedText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  geoTag: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(30,15,60,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  geoTagText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '600',
  },
  controls: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 16,
  },
  captureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  controlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.glow,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  postActions: {
    gap: 10,
  },
  postBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Shadows.glow,
  },
  postBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  postBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
  },
  saveBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  retakeBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  retakeBtnText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    fontWeight: '600',
  },
});
