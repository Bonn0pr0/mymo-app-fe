import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Gradients, Shadows } from '../constants/colors';
import { useI18n } from '../i18n';
import type { Lang } from '../i18n';
import Toggle from '../components/Toggle';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

interface ProfileScreenProps {
  locationGranted: boolean;
  incognito: boolean;
  onToggleLocation: () => void;
  onToggleIncognito: () => void;
  onLogout: () => void;
}

export default function ProfileScreen({
  locationGranted, incognito, onToggleLocation, onToggleIncognito, onLogout,
}: ProfileScreenProps) {
  const { t, lang, setLang } = useI18n();

  const stats = [
    { n: '128', l: t('profile.moments') },
    { n: '12',  l: t('profile.friends') },
    { n: '38',  l: t('profile.places') },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={styles.heroWrap}>
        <LinearGradient colors={['#DDD0FF', '#BFA2FF', '#9C7CFF']} style={styles.heroBg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        <TouchableOpacity
          onPress={() => Toast.show({ type: 'info', text1: t('profile.settings'), text2: t('profile.settingsDesc') })}
          style={styles.settingsBtn}
        >
          <Ionicons name="settings-outline" size={20} color={Colors.textDark} />
        </TouchableOpacity>
      </View>

      {/* Profile card */}
      <View style={styles.card}>
        {/* Avatar */}
        <View style={styles.avatarRow}>
          <TouchableOpacity
            onPress={() => Toast.show({ type: 'info', text1: t('profile.changeAvatar'), text2: t('profile.changeAvatarDesc') })}
            style={styles.avatarWrap}
          >
            <LinearGradient colors={['#BFA2FF', '#9C7CFF']} style={styles.avatar}>
              <Text style={styles.avatarEmoji}>✨</Text>
            </LinearGradient>
          </TouchableOpacity>
          <View style={styles.avatarInfo}>
            <Text style={styles.handle}>{t('profile.handle')}</Text>
            <Text style={styles.joined}>{t('profile.joined')}</Text>
          </View>
          <TouchableOpacity
            onPress={() => Toast.show({ type: 'info', text1: t('profile.editProfile') })}
            style={styles.editBtn}
          >
            <Text style={styles.editText}>{t('common.edit')}</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          {stats.map(({ n, l }) => (
            <TouchableOpacity
              key={l}
              onPress={() => Toast.show({ type: 'info', text1: l, text2: `${n} ${l.toLowerCase()}` })}
              style={styles.statBox}
            >
              <Text style={styles.statN}>{n}</Text>
              <Text style={styles.statL}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Privacy group */}
      <View style={styles.group}>
        <SettingRow
          icon="location-outline"
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
          icon="glasses-outline"
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

      {/* Language group */}
      <View style={styles.group}>
        <View style={styles.row}>
          <View style={styles.rowIcon}>
            <Ionicons name="globe-outline" size={16} color={Colors.primary} />
          </View>
          <Text style={styles.rowLabel}>{t('profile.language')}</Text>
          <View style={styles.langTabs}>
            {(['vi', 'en'] as Lang[]).map(l => (
              <TouchableOpacity
                key={l}
                onPress={() => setLang(l)}
                style={[styles.langTab, lang === l && styles.langTabActive]}
              >
                {lang === l ? (
                  <LinearGradient colors={Gradients.primary} style={styles.langTabGrad}>
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

      {/* General settings */}
      <View style={styles.group}>
        <SettingRow
          icon="notifications-outline"
          label={t('profile.notifications')}
          right={<Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />}
          onPress={() => Toast.show({ type: 'info', text1: t('profile.notifications'), text2: t('profile.notificationsDesc') })}
        />
        <SettingRow
          icon="person-remove-outline"
          label={t('profile.blocked')}
          right={<Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />}
          onPress={() => Toast.show({ type: 'info', text1: t('profile.blocked'), text2: t('profile.blockedDesc') })}
        />
        <SettingRow
          icon="flash-outline"
          label={t('profile.getPlus')}
          right={
            <View style={styles.tryBadge}>
              <LinearGradient colors={Gradients.primary} style={styles.tryBadgeGrad}>
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

      {/* Logout */}
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

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function SettingRow({
  icon, label, hint, right, onPress, disabled,
}: {
  icon: string; label: string; hint?: string;
  right: React.ReactNode; onPress?: () => void; disabled?: boolean;
}) {
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryTint,
  },
  content: {
    paddingBottom: 40,
  },
  heroWrap: {
    height: 200,
    overflow: 'hidden',
  },
  heroBg: {
    ...StyleSheet.absoluteFill,
  },
  settingsBtn: {
    position: 'absolute',
    top: 56,
    right: 16,
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.soft,
  },
  card: {
    marginHorizontal: 20,
    marginTop: -56,
    backgroundColor: Colors.white,
    borderRadius: 28,
    padding: 20,
    ...Shadows.float,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
  },
  avatarWrap: {
    borderRadius: 40,
    borderWidth: 4,
    borderColor: Colors.white,
    ...Shadows.glow,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 32,
  },
  avatarInfo: {
    flex: 1,
  },
  handle: {
    fontSize: 17,
    fontWeight: '900',
    color: Colors.textDark,
  },
  joined: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 3,
  },
  editBtn: {
    backgroundColor: Colors.primaryTint,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  stats: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.primaryTint,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statN: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.textDark,
  },
  statL: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 3,
  },
  group: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 24,
    overflow: 'hidden',
    ...Shadows.soft,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primaryTint,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.primaryTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowInfo: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
  },
  rowHint: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  langTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.primaryTint,
    borderRadius: 16,
    padding: 3,
  },
  langTab: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  langTabActive: {},
  langTabGrad: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  langTabActiveText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 12,
  },
  langTabText: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  tryBadge: {
    borderRadius: 20,
    overflow: 'hidden',
    ...Shadows.glow,
  },
  tryBadgeGrad: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tryBadgeText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 11,
  },
  logoutBtn: {
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.primarySoft,
    backgroundColor: Colors.white,
    alignItems: 'center',
    ...Shadows.soft,
  },
  logoutText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
});
