import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Dimensions, PanResponder, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Gradients, Shadows } from '../constants/colors';
import { useI18n } from '../i18n';
import type { Friend } from '../constants/data';
import { FRIENDS, VIBE_SPOTS } from '../constants/data';
import FriendSheet from '../components/FriendSheet';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

const { width: SW, height: SH } = Dimensions.get('window');

interface MapScreenProps {
  locationGranted: boolean;
  visibleOnMap: boolean;
  incognito: boolean;
  onFriendTap: (f: Friend) => void;
  selectedFriend: Friend | null;
  onCloseSheet: () => void;
  onMessage: (f: Friend) => void;
}

export default function MapScreen({
  locationGranted, visibleOnMap, incognito,
  onFriendTap, selectedFriend, onCloseSheet, onMessage,
}: MapScreenProps) {
  const { t, lang } = useI18n();
  const [showHeat, setShowHeat] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [scale, setScale] = useState(1);
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef({ x: 0, y: 0 });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        translateX.setValue(lastOffset.current.x + g.dx);
        translateY.setValue(lastOffset.current.y + g.dy);
      },
      onPanResponderRelease: (_, g) => {
        lastOffset.current = {
          x: lastOffset.current.x + g.dx,
          y: lastOffset.current.y + g.dy,
        };
      },
    })
  ).current;

  const recenter = () => {
    Animated.parallel([
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
    ]).start();
    lastOffset.current = { x: 0, y: 0 };
    Toast.show({ type: 'success', text1: t('map.centered') });
  };

  const MAP_W = SW;
  const MAP_H = SH * 0.85;

  return (
    <View style={styles.container}>
      {/* Pannable map */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.mapWrap, { transform: [{ translateX }, { translateY }] }]}
      >
        {/* Map background */}
        <LinearGradient
          colors={['#F6F2FF', '#E8DFFF', '#DDD0FF']}
          style={[styles.mapBg, { width: MAP_W, height: MAP_H }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Roads */}
          <View style={[styles.roadH, { top: '22%' }]} />
          <View style={[styles.roadH, { top: '55%' }]} />
          <View style={[styles.roadH, { top: '80%' }]} />
          <View style={[styles.roadV, { left: '27%' }]} />
          <View style={[styles.roadV, { left: '68%' }]} />
          {/* Water */}
          <View style={styles.water} />
          {/* Park */}
          <View style={[styles.park, { left: '5%', top: '60%', width: 100, height: 100, borderRadius: 50 }]} />
          <View style={[styles.park, { left: '68%', top: '75%', width: 130, height: 130, borderRadius: 65 }]} />

          {/* Vibe heatmap */}
          {showHeat && VIBE_SPOTS.map(s => (
            <View
              key={s.id}
              pointerEvents="none"
              style={[
                styles.heatBlob,
                {
                  left: `${s.x}%`,
                  top: `${s.y}%`,
                  width: s.r * 3.5,
                  height: s.r * 2.8,
                  borderRadius: s.r * 1.75,
                  backgroundColor: s.vibe === 'hot' ? 'rgba(255,61,110,0.35)' : 'rgba(124,91,255,0.3)',
                  opacity: s.intensity,
                  marginLeft: -(s.r * 1.75),
                  marginTop: -(s.r * 1.4),
                },
              ]}
            />
          ))}

          {/* Vibe labels */}
          {showHeat && VIBE_SPOTS.map(s => (
            <View
              key={`lbl-${s.id}`}
              pointerEvents="none"
              style={[styles.vibeLabel, { left: `${s.x}%`, top: `${s.y}%` }]}
            >
              <Text style={styles.vibeLabelText}>{s.emoji} {s.label}</Text>
            </View>
          ))}

          {/* Friend pins */}
          {FRIENDS.map(f => (
            <TouchableOpacity
              key={f.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onFriendTap(f);
              }}
              style={[styles.pin, { left: `${f.x}%`, top: `${f.y}%` }]}
            >
              <View style={[styles.pinAvatar, { backgroundColor: f.color, ...Shadows.glow }]}>
                <Text style={styles.pinEmoji}>{f.emoji}</Text>
                {f.status === 'active' && <View style={styles.pinActiveDot} />}
              </View>
              <View style={styles.pinNameTag}>
                <Text style={styles.pinName}>{f.name}</Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* My pin */}
          {visibleOnMap && (
            <View style={styles.myPin}>
              <View style={styles.myPinRing} />
              <View style={styles.myPinDot} />
            </View>
          )}

          {/* Incognito ghost */}
          {locationGranted && incognito && (
            <View style={styles.ghostPin}>
              <Ionicons name="glasses-outline" size={18} color={Colors.primary} />
            </View>
          )}
        </LinearGradient>
      </Animated.View>

      {/* Search bar + controls overlay */}
      <View style={styles.topBar} pointerEvents="box-none">
        <View style={styles.searchRow} pointerEvents="auto">
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={16} color={Colors.primary} />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder={t('map.search')}
              placeholderTextColor={Colors.textMuted}
              style={styles.searchInput}
            />
          </View>
          <TouchableOpacity
            onPress={() => {
              setShowHeat(v => !v);
              Toast.show({ type: 'info', text1: showHeat ? t('map.vibeOff') : t('map.vibeOn') });
            }}
            style={[styles.mapBtn, showHeat && styles.mapBtnActive]}
          >
            {showHeat
              ? <LinearGradient colors={Gradients.primary} style={styles.mapBtnGrad}><Ionicons name="flame" size={18} color={Colors.white} /></LinearGradient>
              : <Ionicons name="flame-outline" size={18} color={Colors.primary} />
            }
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => Toast.show({ type: 'info', text1: t('map.layersTitle'), text2: t('map.layersDesc') })}
            style={styles.mapBtn}
          >
            <Ionicons name="layers-outline" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {(!locationGranted || incognito) && (
          <View style={styles.invisibleBanner}>
            <Ionicons name={incognito ? 'glasses-outline' : 'location-outline'} size={14} color="#BFA2FF" />
            <Text style={styles.invisibleText}>{t('map.invisible')}</Text>
            <View style={styles.offBadge}><Text style={styles.offBadgeText}>{t('common.off')}</Text></View>
          </View>
        )}

        {showHeat && (
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.heatHot }]} />
              <Text style={styles.legendText}>{t('map.lively')}</Text>
            </View>
            <View style={styles.legendSep} />
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.heatCalm }]} />
              <Text style={styles.legendText}>{t('map.calm')}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Right zoom controls */}
      <View style={styles.rightControls}>
        <TouchableOpacity onPress={() => setScale(s => Math.min(s + 0.3, 3))} style={styles.zoomBtn}>
          <Ionicons name="add" size={20} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setScale(s => Math.max(s - 0.3, 0.5))} style={styles.zoomBtn}>
          <Ionicons name="remove" size={20} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={recenter} style={styles.zoomBtn}>
          <Ionicons name="locate-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Bottom friend chips */}
      <View style={styles.chipWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {FRIENDS.map(f => (
            <TouchableOpacity
              key={f.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onFriendTap(f);
              }}
              style={styles.chip}
            >
              <View style={[styles.chipAvatar, { backgroundColor: f.color }]}>
                <Text style={styles.chipEmoji}>{f.emoji}</Text>
              </View>
              <View>
                <Text style={styles.chipName}>{f.name}</Text>
                <Text style={styles.chipDist}>{f.distance}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Friend detail sheet */}
      {selectedFriend && (
        <FriendSheet
          friend={selectedFriend}
          onClose={onCloseSheet}
          onMessage={(f) => { onCloseSheet(); onMessage(f); }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryTint,
    overflow: 'hidden',
  },
  mapWrap: {
    ...StyleSheet.absoluteFill,
  },
  mapBg: {
    overflow: 'hidden',
  },
  roadH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: Colors.white,
    opacity: 0.85,
  },
  roadV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 9,
    backgroundColor: Colors.white,
    opacity: 0.85,
  },
  water: {
    position: 'absolute',
    left: '-5%',
    top: '28%',
    width: '120%',
    height: 70,
    backgroundColor: Colors.mapWater,
    opacity: 0.7,
    borderRadius: 35,
    transform: [{ rotate: '-2deg' }],
  },
  park: {
    position: 'absolute',
    backgroundColor: Colors.mapPark,
    opacity: 0.6,
  },
  heatBlob: {
    position: 'absolute',
  },
  vibeLabel: {
    position: 'absolute',
    transform: [{ translateX: -40 }, { translateY: -40 }],
  },
  vibeLabelText: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textDark,
    overflow: 'hidden',
  },
  pin: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -24 }, { translateY: -40 }],
  },
  pinAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  pinEmoji: {
    fontSize: 22,
  },
  pinActiveDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  pinNameTag: {
    marginTop: 4,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    ...Shadows.soft,
  },
  pinName: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textDark,
  },
  myPin: {
    position: 'absolute',
    top: '48%',
    left: '48%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  myPinRing: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239,68,68,0.3)',
  },
  myPinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    borderWidth: 3,
    borderColor: Colors.white,
    ...Shadows.glow,
  },
  ghostPin: {
    position: 'absolute',
    top: '48%',
    left: '48%',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 52,
    paddingHorizontal: 16,
    gap: 8,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...Shadows.soft,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.textDark,
  },
  mapBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...Shadows.soft,
  },
  mapBtnActive: {},
  mapBtnGrad: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  invisibleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(42,23,88,0.85)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  invisibleText: {
    flex: 1,
    color: Colors.white,
    fontSize: 12,
    fontWeight: '500',
  },
  offBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  offBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    gap: 8,
    ...Shadows.soft,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textDark,
  },
  legendSep: {
    width: 1,
    height: 12,
    backgroundColor: Colors.primarySoft,
  },
  rightControls: {
    position: 'absolute',
    right: 16,
    bottom: 160,
    gap: 8,
  },
  zoomBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.float,
  },
  chipWrap: {
    position: 'absolute',
    bottom: 110,
    left: 0,
    right: 0,
  },
  chips: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...Shadows.soft,
  },
  chipAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipEmoji: {
    fontSize: 14,
  },
  chipName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textDark,
  },
  chipDist: {
    fontSize: 10,
    color: Colors.textMuted,
  },
});
