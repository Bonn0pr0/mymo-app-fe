import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Dimensions, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Mapbox, { Camera, MapView, MarkerView, UserLocation } from '@rnmapbox/maps';
import { Colors, Gradients, Shadows } from '../constants/colors';
import { useI18n } from '../i18n';
import type { Friend } from '../constants/data';
import { FRIENDS, VIBE_SPOTS } from '../constants/data';
import FriendSheet from '../components/FriendSheet';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

Mapbox.setAccessToken('pk.eyJ1IjoiYm9uZHpwcm9ubzEiLCJhIjoiY21yMXExczYwMHMwejJwcHJ1b3NzY216bSJ9.YrjzCaT5z32W_kCTOwQOGw');

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Custom Mapbox Style JSON — Purple MYMO palette ──────────────────────────
const MYMO_MAP_STYLE: object = {
  version: 8,
  name: 'MYMO Purple',
  glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}',
  sprite: 'mapbox://sprites/mapbox/streets-v11',
  sources: {
    composite: {
      type: 'vector',
      url: 'mapbox://mapbox.mapbox-streets-v8,mapbox.mapbox-terrain-v2',
    },
  },
  layers: [
    // Background
    { id: 'background', type: 'background', paint: { 'background-color': '#F6F2FF' } },
    // Land
    { id: 'landuse', type: 'fill', source: 'composite', 'source-layer': 'landuse',
      paint: { 'fill-color': '#EDE8FF', 'fill-opacity': 0.9 } },
    // Parks & nature
    { id: 'landcover', type: 'fill', source: 'composite', 'source-layer': 'landcover',
      paint: { 'fill-color': '#D8CCFF', 'fill-opacity': 0.7 } },
    // Water fill
    { id: 'water', type: 'fill', source: 'composite', 'source-layer': 'water',
      paint: { 'fill-color': '#B8A9FF', 'fill-opacity': 0.85 } },
    // Water stroke
    { id: 'water-stroke', type: 'line', source: 'composite', 'source-layer': 'water',
      paint: { 'line-color': '#9C87FF', 'line-width': 1.5, 'line-opacity': 0.6 } },
    // Building fill
    { id: 'building', type: 'fill', source: 'composite', 'source-layer': 'building',
      paint: { 'fill-color': '#DDD4FF', 'fill-opacity': 0.75 } },
    // Building outline
    { id: 'building-outline', type: 'line', source: 'composite', 'source-layer': 'building',
      paint: { 'line-color': '#C4B5FF', 'line-width': 0.5 } },
    // Road casings (subtle outline)
    { id: 'road-case', type: 'line', source: 'composite', 'source-layer': 'road',
      filter: ['all', ['==', ['geometry-type'], 'LineString']],
      paint: { 'line-color': '#C8BCFF', 'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1, 16, 6], 'line-opacity': 0.6 } },
    // Roads
    { id: 'road', type: 'line', source: 'composite', 'source-layer': 'road',
      filter: ['all', ['==', ['geometry-type'], 'LineString']],
      paint: { 'line-color': '#F0ECFF', 'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.8, 16, 5] } },
    // Major roads
    { id: 'road-major', type: 'line', source: 'composite', 'source-layer': 'road',
      filter: ['in', 'class', 'primary', 'secondary', 'tertiary', 'trunk'],
      paint: { 'line-color': '#FFFFFF', 'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1.5, 16, 8] } },
    // Highway
    { id: 'road-highway', type: 'line', source: 'composite', 'source-layer': 'road',
      filter: ['in', 'class', 'motorway', 'motorway_link'],
      paint: { 'line-color': '#EDE8FF', 'line-width': ['interpolate', ['linear'], ['zoom'], 10, 2, 16, 10] } },
    // Road labels
    { id: 'road-label', type: 'symbol', source: 'composite', 'source-layer': 'road',
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['DIN Pro Regular', 'Arial Unicode MS Regular'],
        'text-size': 10,
        'symbol-placement': 'line',
      },
      paint: { 'text-color': '#7C5BFF', 'text-halo-color': '#FFFFFF', 'text-halo-width': 2 } },
    // Place labels
    { id: 'place-label', type: 'symbol', source: 'composite', 'source-layer': 'place_label',
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 8, 10, 14, 16],
      },
      paint: { 'text-color': '#3A2470', 'text-halo-color': '#F6F2FF', 'text-halo-width': 2 } },
  ],
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface MapScreenProps {
  locationGranted: boolean;
  visibleOnMap: boolean;
  incognito: boolean;
  onFriendTap: (f: Friend) => void;
  selectedFriend: Friend | null;
  onCloseSheet: () => void;
  onMessage: (f: Friend) => void;
}

// ─── Ho Chi Minh City default coords ─────────────────────────────────────────
const DEFAULT_CENTER: [number, number] = [106.6297, 10.8231];
const DEFAULT_ZOOM = 13;

export default function MapScreen({
  locationGranted, visibleOnMap, incognito,
  onFriendTap, selectedFriend, onCloseSheet, onMessage,
}: MapScreenProps) {
  const { t } = useI18n();
  const [showHeat, setShowHeat] = useState(true);
  const [searchText, setSearchText] = useState('');
  const cameraRef = useRef<Camera>(null);

  // Realistic coords derived from FRIENDS x/y % offsets around HCMC
  const friendCoords = React.useMemo(() => FRIENDS.map(f => ({
    ...f,
    lng: DEFAULT_CENTER[0] + (f.x - 50) * 0.0008,
    lat: DEFAULT_CENTER[1] + (50 - f.y) * 0.0006,
  })), []);

  // Vibe blob coords
  const vibeCoords = React.useMemo(() => VIBE_SPOTS.map(s => ({
    ...s,
    lng: DEFAULT_CENTER[0] + (s.x - 50) * 0.0008,
    lat: DEFAULT_CENTER[1] + (50 - s.y) * 0.0006,
  })), []);

  // ── Fly to selected friend ───────────────────────────────────────────────
  useEffect(() => {
    if (!selectedFriend || !cameraRef.current) return;
    const friend = friendCoords.find(f => f.id === selectedFriend.id);
    if (friend) {
      cameraRef.current.flyTo([friend.lng, friend.lat], 800);
      cameraRef.current.zoomTo(15, 800);
    }
  }, [selectedFriend, friendCoords]);

  const recenter = useCallback(() => {
    cameraRef.current?.flyTo(DEFAULT_CENTER, 800);
    cameraRef.current?.zoomTo(DEFAULT_ZOOM, 800);
    Toast.show({ type: 'success', text1: t('map.centered') });
  }, [t]);

  return (
    <View style={styles.container}>
      {/* ── Real Mapbox Map ── */}
      <MapView
        style={styles.map}
        styleJSON={JSON.stringify(MYMO_MAP_STYLE)}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={false}
        scaleBarEnabled={false}
      >
        <Camera
          ref={cameraRef}
          centerCoordinate={DEFAULT_CENTER}
          zoomLevel={DEFAULT_ZOOM}
          animationMode="flyTo"
          animationDuration={0}
        />

        {/* User location dot */}
        {visibleOnMap && (
          <UserLocation
            visible
            renderMode={"normal" as any}
            androidRenderMode="compass"
          />
        )}

        {/* Vibe heatmap blobs as MarkerViews */}
        {showHeat && vibeCoords.map(s => (
          <MarkerView
            key={`vibe-${s.id}`}
            coordinate={[s.lng, s.lat]}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View
              pointerEvents="none"
              style={[
                styles.heatBlob,
                {
                  width: s.r * 5,
                  height: s.r * 5,
                  borderRadius: s.r * 2.5,
                  backgroundColor: s.vibe === 'hot'
                    ? `rgba(255,61,110,${s.intensity * 0.4})`
                    : `rgba(124,91,255,${s.intensity * 0.35})`,
                },
              ]}
            />
          </MarkerView>
        ))}

        {/* Vibe labels */}
        {showHeat && vibeCoords.map(s => (
          <MarkerView
            key={`vibe-lbl-${s.id}`}
            coordinate={[s.lng, s.lat]}
            anchor={{ x: 0.5, y: 2.2 }}
          >
            <View pointerEvents="none" style={styles.vibeLabelWrap}>
              <Text style={styles.vibeLabelText}>{s.emoji} {s.label}</Text>
            </View>
          </MarkerView>
        ))}

        {/* Friend pins */}
        {friendCoords.map(f => (
          <MarkerView
            key={`friend-${f.id}`}
            coordinate={[f.lng, f.lat]}
            anchor={{ x: 0.5, y: 1 }}
          >
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onFriendTap(f);
              }}
              style={styles.pin}
            >
              <View style={[styles.pinAvatar, { backgroundColor: f.color }, Shadows.glow as any]}>
                <Text style={styles.pinEmoji}>{f.emoji}</Text>
                {f.status === 'active' && <View style={styles.pinActiveDot} />}
              </View>
              <View style={styles.pinNameTag}>
                <Text style={styles.pinName}>{f.name}</Text>
              </View>
            </TouchableOpacity>
          </MarkerView>
        ))}

        {/* Incognito ghost pin */}
        {locationGranted && incognito && (
          <MarkerView
            key="ghost-pin"
            coordinate={DEFAULT_CENTER}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.ghostPin}>
              <Ionicons name="glasses-outline" size={18} color={Colors.primary} />
            </View>
          </MarkerView>
        )}
      </MapView>

      {/* ── Search bar + controls overlay ── */}
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

      {/* ── Right zoom / locate controls ── */}
      <View style={styles.rightControls}>
        <TouchableOpacity
          onPress={() => cameraRef.current?.zoomTo(
            Math.min((DEFAULT_ZOOM + 1), 20), 300
          )}
          style={styles.zoomBtn}
        >
          <Ionicons name="add" size={20} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => cameraRef.current?.zoomTo(
            Math.max((DEFAULT_ZOOM - 1), 1), 300
          )}
          style={styles.zoomBtn}
        >
          <Ionicons name="remove" size={20} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={recenter} style={styles.zoomBtn}>
          <Ionicons name="locate-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* ── Bottom friend chips ── */}
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

      {/* ── Friend detail sheet ── */}
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryTint,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFill,
  },

  // ── Vibe heatmap blobs ──
  heatBlob: {
    // sizing done inline
  },
  vibeLabelWrap: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    ...Shadows.soft,
  },
  vibeLabelText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textDark,
  },

  // ── Friend pins ──
  pin: {
    alignItems: 'center',
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

  // ── Ghost / incognito pin ──
  ghostPin: {
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

  // ── Overlay UI ──
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
    backgroundColor: 'rgba(255,255,255,0.95)',
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
    backgroundColor: 'rgba(255,255,255,0.95)',
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
    backgroundColor: 'rgba(255,255,255,0.95)',
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
    backgroundColor: 'rgba(255,255,255,0.95)',
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
    backgroundColor: 'rgba(255,255,255,0.95)',
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
