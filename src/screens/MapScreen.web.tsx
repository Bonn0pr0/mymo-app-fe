/**
 * MapScreen.web.tsx — Web platform implementation.
 * Uses Mapbox GL JS (mapbox-gl) directly in the browser.
 * Native platform → see MapScreen.native.tsx (@rnmapbox/maps).
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Dimensions, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Gradients, Shadows } from '../constants/colors';
import { useI18n } from '../i18n';
import type { Friend } from '../constants/data';
import { FRIENDS, VIBE_SPOTS } from '../constants/data';
import FriendSheet from '../components/FriendSheet';
import Toast from 'react-native-toast-message';

// ─── Mapbox GL JS (web-only) ──────────────────────────────────────────────────
import mapboxgl from 'mapbox-gl';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYm9uZHpwcm9ubzEiLCJhIjoiY21yMXExczYwMHMwejJwcHJ1b3NzY216bSJ9.YrjzCaT5z32W_kCTOwQOGw';
mapboxgl.accessToken = MAPBOX_TOKEN;

// ─── Default center: Ho Chi Minh City ────────────────────────────────────────
const DEFAULT_CENTER: [number, number] = [106.6297, 10.8231];
const DEFAULT_ZOOM = 13;

// ─── Custom MYMO Purple style for Mapbox ─────────────────────────────────────
const MYMO_STYLE: mapboxgl.Style = {
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
    { id: 'background',      type: 'background', paint: { 'background-color': '#F6F2FF' } },
    { id: 'landuse',         type: 'fill',   source: 'composite', 'source-layer': 'landuse',
      paint: { 'fill-color': '#EDE8FF', 'fill-opacity': 0.9 } },
    { id: 'landcover',       type: 'fill',   source: 'composite', 'source-layer': 'landcover',
      paint: { 'fill-color': '#D8CCFF', 'fill-opacity': 0.7 } },
    { id: 'national-park',   type: 'fill',   source: 'composite', 'source-layer': 'landuse',
      filter: ['==', ['get', 'class'], 'national_park'],
      paint: { 'fill-color': '#C8BBFF', 'fill-opacity': 0.8 } },
    { id: 'water',           type: 'fill',   source: 'composite', 'source-layer': 'water',
      paint: { 'fill-color': '#B8A9FF', 'fill-opacity': 0.85 } },
    { id: 'water-stroke',    type: 'line',   source: 'composite', 'source-layer': 'water',
      paint: { 'line-color': '#9C87FF', 'line-width': 1.5, 'line-opacity': 0.6 } },
    { id: 'building',        type: 'fill',   source: 'composite', 'source-layer': 'building',
      paint: { 'fill-color': '#DDD4FF', 'fill-opacity': 0.75 } },
    { id: 'building-outline',type: 'line',   source: 'composite', 'source-layer': 'building',
      paint: { 'line-color': '#C4B5FF', 'line-width': 0.5 } },
    { id: 'road-case',       type: 'line',   source: 'composite', 'source-layer': 'road',
      filter: ['==', ['geometry-type'], 'LineString'],
      paint: { 'line-color': '#C8BCFF',
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1, 16, 6] as any,
        'line-opacity': 0.5 } },
    { id: 'road',            type: 'line',   source: 'composite', 'source-layer': 'road',
      filter: ['==', ['geometry-type'], 'LineString'],
      paint: { 'line-color': '#EEE9FF',
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.8, 16, 5] as any } },
    { id: 'road-major',      type: 'line',   source: 'composite', 'source-layer': 'road',
      filter: ['in', ['get', 'class'], ['literal', ['primary','secondary','tertiary','trunk']]],
      paint: { 'line-color': '#FFFFFF',
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1.5, 16, 8] as any } },
    { id: 'road-highway',    type: 'line',   source: 'composite', 'source-layer': 'road',
      filter: ['in', ['get', 'class'], ['literal', ['motorway','motorway_link']]],
      paint: { 'line-color': '#EDE8FF',
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 2, 16, 10] as any } },
    { id: 'road-label',      type: 'symbol', source: 'composite', 'source-layer': 'road',
      layout: {
        'text-field': ['get', 'name'] as any,
        'text-font': ['DIN Pro Regular', 'Arial Unicode MS Regular'],
        'text-size': 10,
        'symbol-placement': 'line',
      },
      paint: { 'text-color': '#7C5BFF', 'text-halo-color': '#FFFFFF', 'text-halo-width': 2 } },
    { id: 'place-label',     type: 'symbol', source: 'composite', 'source-layer': 'place_label',
      layout: {
        'text-field': ['get', 'name'] as any,
        'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 8, 10, 14, 16] as any,
      },
      paint: { 'text-color': '#3A2470', 'text-halo-color': '#F6F2FF', 'text-halo-width': 2 } },
  ],
};

// ─── Compute realistic latlng from x/y % offsets around HCMC ─────────────────
const friendCoords = FRIENDS.map(f => ({
  ...f,
  lng: DEFAULT_CENTER[0] + (f.x - 50) * 0.0008,
  lat: DEFAULT_CENTER[1] + (50 - f.y) * 0.0006,
}));

const vibeCoords = VIBE_SPOTS.map(s => ({
  ...s,
  lng: DEFAULT_CENTER[0] + (s.x - 50) * 0.0008,
  lat: DEFAULT_CENTER[1] + (50 - s.y) * 0.0006,
}));

// ─── Props ────────────────────────────────────────────────────────────────────
interface MapScreenProps {
  locationGranted: boolean;
  visibleOnMap: boolean;
  incognito: boolean;
  onFriendTap: (f: Friend) => void;
  selectedFriend: Friend | null;
  onCloseSheet: () => void;
  onMessage: (f: Friend) => void;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function MapScreen({
  locationGranted, visibleOnMap, incognito,
  onFriendTap, selectedFriend, onCloseSheet, onMessage,
}: MapScreenProps) {
  const { t } = useI18n();
  const [showHeat, setShowHeat] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [cssLoaded, setCssLoaded] = useState(false);

  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const heatMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const MAP_CONTAINER_ID = 'mymo-mapbox-container';

  // ── Inject mapbox-gl CSS once and wait for it to load ──────────────────────
  useEffect(() => {
    const existing = document.getElementById('mapbox-gl-css');
    if (existing) {
      setCssLoaded(true);
      return;
    }
    const link = document.createElement('link');
    link.id = 'mapbox-gl-css';
    link.rel = 'stylesheet';
    link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.9.4/mapbox-gl.css';
    link.onload = () => setCssLoaded(true);
    link.onerror = () => setCssLoaded(true); // Fallback to avoid blocking completely
    document.head.appendChild(link);
  }, []);

  // ── Init map after CSS is loaded ───────────────────────────────────────────
  useEffect(() => {
    if (!cssLoaded) return;
    const container = document.getElementById(MAP_CONTAINER_ID);
    if (!container || mapRef.current) return;

    const map = new mapboxgl.Map({
      container,
      style: MYMO_STYLE as mapboxgl.Style,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
      logoPosition: 'bottom-left',
    });

    mapRef.current = map;

    map.on('load', () => {
      // Force resize to ensure correct canvas sizing
      map.resize();
      setTimeout(() => {
        map.resize();
      }, 150);

      // ── Friend markers ──────────────────────────────────────────────────
      friendCoords.forEach(f => {
        const el = document.createElement('div');
        el.style.cssText = `
          display:flex; flex-direction:column; align-items:center; cursor:pointer;
        `;

        const ring = document.createElement('div');
        ring.style.cssText = `
          width:48px; height:48px; border-radius:50%;
          background:${f.color}; border:3px solid #fff;
          display:flex; align-items:center; justify-content:center;
          font-size:22px; box-shadow:0 4px 16px rgba(124,91,255,0.4);
          position:relative;
        `;
        ring.textContent = f.emoji;

        if (f.status === 'active') {
          const dot = document.createElement('div');
          dot.style.cssText = `
            position:absolute; bottom:0; right:0;
            width:12px; height:12px; border-radius:50%;
            background:#10B981; border:2px solid #fff;
          `;
          ring.appendChild(dot);
        }

        const nameTag = document.createElement('div');
        nameTag.style.cssText = `
          margin-top:4px; background:rgba(255,255,255,0.95);
          padding:2px 8px; border-radius:10px;
          font-size:10px; font-weight:700; color:#2A1758;
          box-shadow:0 2px 8px rgba(124,91,255,0.12); white-space:nowrap;
        `;
        nameTag.textContent = f.name;

        el.appendChild(ring);
        el.appendChild(nameTag);
        el.addEventListener('click', () => onFriendTap(f));

        const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([f.lng, f.lat])
          .addTo(map);
        markersRef.current.push(marker);
      });

      // ── Vibe heatmap markers ────────────────────────────────────────────
      vibeCoords.forEach(s => {
        const size = s.r * 5;
        const el = document.createElement('div');
        const color = s.vibe === 'hot'
          ? `rgba(255,61,110,${s.intensity * 0.4})`
          : `rgba(124,91,255,${s.intensity * 0.35})`;
        el.style.cssText = `
          width:${size}px; height:${size}px; border-radius:50%;
          background:${color}; pointer-events:none;
        `;
        const blobMarker = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat([s.lng, s.lat])
          .addTo(map);

        const labelEl = document.createElement('div');
        labelEl.style.cssText = `
          background:rgba(255,255,255,0.92); padding:2px 7px; border-radius:10px;
          font-size:9px; font-weight:700; color:#2A1758; white-space:nowrap;
          pointer-events:none; box-shadow:0 2px 8px rgba(124,91,255,0.12);
        `;
        labelEl.textContent = `${s.emoji} ${s.label}`;
        const labelMarker = new mapboxgl.Marker({ element: labelEl, anchor: 'bottom' })
          .setLngLat([s.lng, s.lat])
          .addTo(map);

        heatMarkersRef.current.push(blobMarker, labelMarker);
      });

      // ── My location marker ──────────────────────────────────────────────
      const myEl = document.createElement('div');
      myEl.style.cssText = `
        width:32px; height:32px; border-radius:50%;
        display:flex; align-items:center; justify-content:center;
        background:rgba(239,68,68,0.2); position:relative;
      `;
      const myDot = document.createElement('div');
      myDot.style.cssText = `
        width:16px; height:16px; border-radius:50%;
        background:#EF4444; border:3px solid #fff;
        box-shadow:0 4px 16px rgba(124,91,255,0.4);
      `;
      myEl.appendChild(myDot);
      userMarkerRef.current = new mapboxgl.Marker({ element: myEl, anchor: 'center' })
        .setLngLat(DEFAULT_CENTER)
        .addTo(map);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = [];
      heatMarkersRef.current = [];
      userMarkerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cssLoaded]);

  // ── Show/hide user pin based on permission ─────────────────────────────────
  useEffect(() => {
    if (!userMarkerRef.current) return;
    const el = userMarkerRef.current.getElement() as HTMLElement;
    el.style.display = visibleOnMap ? 'flex' : 'none';
  }, [visibleOnMap]);

  // ── Show/hide heat blobs ────────────────────────────────────────────────────
  useEffect(() => {
    heatMarkersRef.current.forEach(m => {
      const el = m.getElement() as HTMLElement;
      el.style.display = showHeat ? '' : 'none';
    });
  }, [showHeat]);

  // ── Fly to selected friend ───────────────────────────────────────────────
  useEffect(() => {
    if (!selectedFriend || !mapRef.current) return;
    const friend = friendCoords.find(f => f.id === selectedFriend.id);
    if (friend) {
      mapRef.current.flyTo({
        center: [friend.lng, friend.lat],
        zoom: 15,
        duration: 1000,
      });
    }
  }, [selectedFriend]);

  // ── Recenter ───────────────────────────────────────────────────────────────
  const recenter = useCallback(() => {
    mapRef.current?.flyTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM, duration: 800 });
    Toast.show({ type: 'success', text1: t('map.centered') });
  }, [t]);

  // ── Zoom ───────────────────────────────────────────────────────────────────
  const zoomIn  = useCallback(() => mapRef.current?.zoomIn(), []);
  const zoomOut = useCallback(() => mapRef.current?.zoomOut(), []);

  return (
    <View style={styles.container}>
      {/* ── Real Mapbox GL map container ── */}
      <View nativeID={MAP_CONTAINER_ID} style={styles.map} />

      {/* ── Incognito ghost overlay ── */}
      {locationGranted && incognito && (
        <View style={styles.ghostPin} pointerEvents="none">
          <Ionicons name="glasses-outline" size={18} color={Colors.primary} />
        </View>
      )}

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
              ? <LinearGradient colors={Gradients.primary} style={styles.mapBtnGrad}>
                  <Ionicons name="flame" size={18} color={Colors.white} />
                </LinearGradient>
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
        <TouchableOpacity onPress={zoomIn}   style={styles.zoomBtn}>
          <Ionicons name="add"            size={20} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={zoomOut}  style={styles.zoomBtn}>
          <Ionicons name="remove"         size={20} color={Colors.primary} />
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
              onPress={() => onFriendTap(f)}
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
          onMessage={f => { onCloseSheet(); onMessage(f); }}
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
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: '100%',
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
