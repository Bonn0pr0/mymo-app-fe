/**
 * ProfileScreen.tsx
 * Redesigned to look extremely modern, GenZ, and premium.
 * Includes interactive mood status selector, verified user badge, Unsplash banner and avatar,
 * web layout constraints, and sleek settings groups.
 */
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Platform, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Gradients, Shadows } from '../constants/colors';
import { useI18n } from '../i18n';
import type { Lang } from '../i18n';
import Toggle from '../components/Toggle';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SW } = Dimensions.get('window');

interface ProfileScreenProps {
  locationGranted: boolean;
  incognito: boolean;
  onToggleLocation: () => void;
  onToggleIncognito: () => void;
  onLogout: () => void;
}

const MOODS = [
  { emoji: '⚡', label: 'Lively' },
  { emoji: '🌸', label: 'Soft' },
  { emoji: '🍵', label: 'Chill' },
  { emoji: '🦋', label: 'Free' },
  { emoji: '🍿', label: 'Fun' },
];

export default function ProfileScreen({
  locationGranted, incognito, onToggleLocation, onToggleIncognito, onLogout,
}: ProfileScreenProps) {
  const { t, lang, setLang } = useI18n();
  const insets = useSafeAreaInsets();
  const [currentMood, setCurrentMood] = useState('🍵');

  const stats = [
    { n: '128', l: t('profile.moments'), icon: 'trail-sign-outline' },
    { n: '12',  l: t('profile.friends'), icon: 'people-outline' },
    { n: '38',  l: t('profile.places'), icon: 'location-outline' },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Cover / Hero image */}
      <View style={styles.heroWrap}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&fit=crop' }} // Colorful pastel linear color scheme
          style={styles.heroBg}
        />
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Toast.show({ type: 'info', text1: t('profile.settings'), text2: t('profile.settingsDesc') });
          }}
          style={[styles.settingsBtn, { top: Math.max(16, insets.top) }]}
        >
          <Ionicons name="settings-sharp" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Profile Card Overlay */}
      <View style={styles.profileCard}>
        {/* Avatar and main info */}
        <View style={styles.avatarRow}>
          <TouchableOpacity
            onPress={() => Toast.show({ type: 'info', text1: t('profile.changeAvatar'), text2: t('profile.changeAvatarDesc') })}
            style={styles.avatarBorder}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop' }} // matches user face in story tray
              style={styles.avatarImg}
            />
            <View style={styles.moodBadge}>
              <Text style={styles.moodBadgeText}>{currentMood}</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.avatarInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.handle}>Linn Nguyen</Text>
              <Ionicons name="checkmark-circle" size={16} color="#3B82F6" />
            </View>
            <Text style={styles.username}>@linn_nguyen99</Text>
            <Text style={styles.joined}>{t('profile.joined')}</Text>
          </View>
          <TouchableOpacity
            onPress={() => Toast.show({ type: 'info', text1: t('profile.editProfile') })}
            style={styles.editBtn}
          >
            <Text style={styles.editText}>{t('common.edit')}</Text>
          </TouchableOpacity>
        </View>

        {/* GenZ Mood Selector Widget */}
        <View style={styles.moodWidget}>
          <Text style={styles.widgetLabel}>Hôm nay bạn thế nào?</Text>
          <View style={styles.moodRow}>
            {MOODS.map(m => (
              <TouchableOpacity
                key={m.emoji}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCurrentMood(m.emoji);
                  Toast.show({ type: 'info', text1: `Tâm trạng: ${m.label} ${m.emoji}` });
                }}
                style={[
                  styles.moodTab,
                  currentMood === m.emoji && styles.moodTabActive
                ]}
              >
                <Text style={styles.moodEmoji}>{m.emoji}</Text>
                <Text style={styles.moodLabel}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Stats segment */}
        <View style={styles.stats}>
          {stats.map(({ n, l, icon }) => (
            <TouchableOpacity
              key={l}
              onPress={() => Toast.show({ type: 'info', text1: l, text2: `${n} ${l.toLowerCase()}` })}
              style={styles.statBox}
            >
              <View style={styles.statIconWrap}>
                <Ionicons name={icon as any} size={15} color={Colors.primary} />
              </View>
              <Text style={styles.statN}>{n}</Text>
              <Text style={styles.statL}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Privacy group */}
      <View style={styles.group}>
        <SettingRow
          icon="location"
          label={t('profile.shareLoc')}
          hint={t('profile.shareLocHint')}
          right={
            <Toggle
              on={locationGranted}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onToggleLocation();
              }}
            />
          }
        />
        <SettingRow
          icon="glasses"
          label={t('profile.incognito')}
          hint={t('profile.incognitoHint')}
          disabled={!locationGranted}
          right={
            <Toggle
              on={incognito && locationGranted}
              onPress={() => {
                if (!locationGranted) return;
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onToggleIncognito();
              }}
              disabled={!locationGranted}
            />
          }
        />
      </View>

      {/* Language Toggle pills */}
      <View style={styles.group}>
        <View style={styles.row}>
          <View style={styles.rowIcon}>
            <Ionicons name="globe" size={16} color={Colors.primary} />
          </View>
          <Text style={styles.rowLabel}>{t('profile.language')}</Text>
          <View style={styles.langTabs}>
            {(['vi', 'en'] as Lang[]).map(l => (
              <TouchableOpacity
                key={l}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setLang(l);
                }}
                style={[styles.langTab, lang === l && styles.langTabActive]}
              >
                {lang === l ? (
                  <LinearGradient colors={Gradients.primary as any} style={styles.langTabGrad}>
                    <Text style={styles.langTabActiveText}>{l === 'vi' ? 'VI' : 'EN'}</Text>
                  </LinearGradient>
                ) : (
                  <Text style={styles.langTabText}>{l === 'vi' ? 'VI' : 'EN'}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* General Settings */}
      <View style={styles.group}>
        <SettingRow
          icon="notifications"
          label={t('profile.notifications')}
          right={<Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />}
          onPress={() => Toast.show({ type: 'info', text1: t('profile.notifications'), text2: t('profile.notificationsDesc') })}
        />
        <SettingRow
          icon="shield-checkmark"
          label={t('profile.blocked')}
          right={<Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />}
          onPress={() => Toast.show({ type: 'info', text1: t('profile.blocked'), text2: t('profile.blockedDesc') })}
        />
        <SettingRow
          icon="sparkles"
          label={t('profile.getPlus')}
          right={
            <View style={styles.tryBadge}>
              <LinearGradient colors={Gradients.primary as any} style={styles.tryBadgeGrad}>
                <Text style={styles.tryBadgeText}>{t('common.try')}</Text>
              </LinearGradient>
            </View>
          }
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Toast.show({ type: 'success', text1: t('profile.plusUnlocked') });
          }}
        />
      </View>

      {/* Logout button */}
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onLogout();
        }}
        style={styles.logoutBtn}
        activeOpacity={0.85}
      >
        <Text style={styles.logoutText}>{t('common.logout')}</Text>
      </TouchableOpacity>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

// ─── Component Helpers ────────────────────────────────────────────────────────
interface SettingRowProps {
  icon: string;
  label: string;
  hint?: string;
  right: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
}

function SettingRow({ icon, label, hint, right, onPress, disabled }: SettingRowProps) {
  const Comp = onPress ? TouchableOpacity : View;
  return (
    <Comp
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.row, disabled && styles.rowDisabled]}
    >
      <View style={styles.rowIcon}>
        <Ionicons name={icon as any} size={16} color={Colors.primary} />
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowLabel}>{label}</Text>
        {hint && <Text style={styles.rowHint}>{hint}</Text>}
      </View>
      {right}
    </Comp>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFF', // Light greyish lavender
    ...Platform.select({
      web: {
        maxWidth: 500,
        width: '100%',
        marginHorizontal: 'auto',
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: '#F2F2F2',
      },
      default: {},
    }),
  },
  content: {
    paddingBottom: 40,
  },
  heroWrap: {
    height: 180,
    overflow: 'hidden',
    position: 'relative',
  },
  heroBg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  settingsBtn: {
    position: 'absolute',
    right: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Profile card ──
  profileCard: {
    marginHorizontal: 16,
    marginTop: -52,
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F2EEFF',
    ...Shadows.float,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBorder: {
    position: 'relative',
    borderRadius: 36,
    borderWidth: 3,
    borderColor: Colors.white,
    backgroundColor: '#EEE',
    ...Shadows.glow,
  },
  avatarImg: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  moodBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.soft,
  },
  moodBadgeText: {
    fontSize: 13,
  },
  avatarInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  handle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textDark,
  },
  username: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  joined: {
    fontSize: 10,
    color: Colors.primaryLight,
    fontWeight: '600',
    marginTop: 4,
  },
  editBtn: {
    backgroundColor: '#F5F2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  editText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },

  // ── Mood widget ──
  moodWidget: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F6F5FC',
  },
  widgetLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textDark,
    marginBottom: 8,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodTab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#FAF9FF',
    borderWidth: 1,
    borderColor: '#F0EEFC',
  },
  moodTabActive: {
    backgroundColor: '#EBE5FF',
    borderColor: '#7C5BFF',
  },
  moodEmoji: {
    fontSize: 16,
  },
  moodLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },

  // ── Stats ──
  stats: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FAF9FF',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F2EEFF',
  },
  statIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F2EEFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statN: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textDark,
  },
  statL: {
    fontSize: 8,
    fontWeight: '800',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 2,
  },

  // ── List groups ──
  group: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F6F5FC',
    ...Shadows.soft,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F2FF',
  },
  rowDisabled: {
    opacity: 0.5,
  },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: Colors.primaryTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowInfo: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textDark,
  },
  rowHint: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  langTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.primaryTint,
    borderRadius: 14,
    padding: 3,
  },
  langTab: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  langTabActive: {},
  langTabGrad: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  langTabActiveText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 11,
  },
  langTabText: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    color: Colors.primary,
    fontWeight: '800',
    fontSize: 11,
  },
  tryBadge: {
    borderRadius: 14,
    overflow: 'hidden',
    ...Shadows.glow,
  },
  tryBadgeGrad: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tryBadgeText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 9,
  },
  logoutBtn: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFE3E8',
    backgroundColor: '#FFF5F6',
    alignItems: 'center',
  },
  logoutText: {
    color: '#FF3D6E',
    fontWeight: '800',
    fontSize: 13,
  },
});
