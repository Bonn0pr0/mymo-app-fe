/**
 * NotificationsScreen.tsx
 * Redesigned to look extremely modern, GenZ, and premium.
 * Includes layout limits for web app view, dynamic tab filtering (All, Likes, Requests),
 * Unsplash profile pictures, and glassmorphism styling.
 */
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, RefreshControl, Image, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients, Shadows } from '../constants/colors';
import { useI18n } from '../i18n';
import { NOTIFS } from '../constants/data';
import type { Notif } from '../constants/data';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type NotifFilter = 'all' | 'requests' | 'likes';

// Unsplash profile pictures for notifications to look premium
const NOTIF_AVATARS: { [name: string]: string } = {
  'Léa': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop',
  'Noah': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop',
  'Maya': 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop',
  'Kai': 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&h=120&fit=crop',
  'Zoe': 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&h=120&fit=crop',
  'Alex': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop',
};

export default function NotificationsScreen() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  
  const [items, setItems] = useState<Notif[]>(NOTIFS);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<NotifFilter>('all');

  const remove = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setItems(s => s.filter(x => x.id !== id));
  };

  const clearAll = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setItems([]);
    Toast.show({ type: 'success', text1: t('notif.allDone') });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  // Filter notifs dynamically
  const filteredItems = items.filter(n => {
    if (activeFilter === 'requests') return n.type === 'request';
    if (activeFilter === 'likes') return n.type === 'like';
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(16, insets.top) }]}>
        <View>
          <Text style={styles.title}>{t('notif.title')}</Text>
          <Text style={styles.subtitle}>{t('notif.subtitle')}</Text>
        </View>
        {items.length > 0 && (
          <TouchableOpacity onPress={clearAll} style={styles.clearBtn} activeOpacity={0.8}>
            <Text style={styles.clearText}>{t('common.clear')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['all', 'requests', 'likes'] as NotifFilter[]).map(filter => {
          const isActive = activeFilter === filter;
          const count = items.filter(n => {
            if (filter === 'requests') return n.type === 'request';
            if (filter === 'likes') return n.type === 'like';
            return true;
          }).length;

          return (
            <TouchableOpacity
              key={filter}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveFilter(filter);
              }}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
            >
              {isActive ? (
                <LinearGradient colors={Gradients.primary as any} style={styles.filterTabGrad}>
                  <Text style={styles.filterTabTextActive}>
                    {filter === 'all' ? 'Tất cả' : filter === 'requests' ? 'Yêu cầu' : 'Yêu thích'} ({count})
                  </Text>
                </LinearGradient>
              ) : (
                <Text style={styles.filterTabText}>
                  {filter === 'all' ? 'Tất cả' : filter === 'requests' ? 'Yêu cầu' : 'Yêu thích'} ({count})
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Notifs list */}
      <FlatList
        data={filteredItems}
        keyExtractor={n => n.id}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="notifications-off-outline" size={28} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>{t('notif.allCaughtUp')}</Text>
            <Text style={styles.emptySub}>{t('notif.newWillShow')}</Text>
          </View>
        )}
        renderItem={({ item: n }) => (
          <NotifItem
            notif={n}
            onPress={() => {
              if (n.type === 'request') {
                Toast.show({ type: 'success', text1: `${n.who} ${t('notif.accepted')}` });
                remove(n.id);
              } else {
                Toast.show({ type: 'info', text1: n.who, text2: t(n.textKey) });
                remove(n.id);
              }
            }}
            onAccept={() => {
              Toast.show({ type: 'success', text1: `${n.who} ${t('notif.accepted')}` });
              remove(n.id);
            }}
            onDismiss={() => remove(n.id)}
          />
        )}
      />
    </View>
  );
}

interface NotifItemProps {
  notif: Notif;
  onPress: () => void;
  onAccept: () => void;
  onDismiss: () => void;
}

function NotifItem({ notif, onPress, onAccept, onDismiss }: NotifItemProps) {
  const { t } = useI18n();
  const avatarUrl = NOTIF_AVATARS[notif.who] || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop';

  return (
    <View style={styles.notifCard}>
      <TouchableOpacity onPress={onPress} style={styles.notifMainRow} activeOpacity={0.8}>
        {/* Left side: Styled Avatar */}
        <View style={styles.avatarWrap}>
          <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
          <View style={styles.emojiBadge}>
            <Text style={styles.emojiBadgeText}>{notif.emoji}</Text>
          </View>
        </View>

        {/* Middle text */}
        <View style={styles.notifInfo}>
          <Text style={styles.notifText}>
            <Text style={styles.notifWho}>{notif.who}</Text>{' '}
            <Text style={styles.notifSub}>{t(notif.textKey)}</Text>
          </Text>
          <Text style={styles.notifTime}>{notif.time}</Text>
        </View>
      </TouchableOpacity>

      {/* Right side interactive actions */}
      <View style={styles.actionCol}>
        {notif.type === 'request' ? (
          <TouchableOpacity onPress={onAccept} activeOpacity={0.8} style={styles.acceptBtn}>
            <LinearGradient colors={Gradients.primary as any} style={styles.acceptGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.acceptText}>{t('common.accept')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : notif.type === 'like' ? (
          <View style={styles.likeBadge}>
            <Ionicons name="heart" size={16} color="#FF3D6E" />
          </View>
        ) : notif.type === 'nearby' ? (
          <View style={[styles.likeBadge, { backgroundColor: '#EEF2FF' }]}>
            <Ionicons name="navigate" size={16} color={Colors.primary} />
          </View>
        ) : (
          <View style={[styles.likeBadge, { backgroundColor: '#F0FDF4' }]}>
            <Ionicons name="chatbubble" size={16} color="#22C55E" />
          </View>
        )}
        
        {/* Close/Dismiss Button */}
        <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn}>
          <Ionicons name="close" size={14} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.textDark,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  clearBtn: {
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBE8FF',
    ...Shadows.soft,
  },
  clearText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },

  // ── Tabs ──
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  filterTab: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0EFFC',
    overflow: 'hidden',
  },
  filterTabActive: {
    borderColor: 'transparent',
    ...Shadows.soft,
  },
  filterTabGrad: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterTabText: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  filterTabTextActive: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.white,
  },

  // ── List ──
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 10,
    paddingTop: 8,
  },
  empty: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 36,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#F2EEFF',
    ...Shadows.soft,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: Colors.primaryTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textDark,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },

  // ── Notif Card ──
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F6F5FC',
    ...Shadows.soft,
  },
  notifMainRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEE',
  },
  emojiBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.soft,
  },
  emojiBadgeText: {
    fontSize: 12,
  },
  notifInfo: {
    flex: 1,
  },
  notifText: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textDark,
  },
  notifWho: {
    fontWeight: '800',
    color: Colors.textDark,
  },
  notifSub: {
    color: '#4B3E72',
  },
  notifTime: {
    fontSize: 10,
    color: Colors.primaryLight,
    fontWeight: '600',
    marginTop: 2,
  },

  // ── Actions column ──
  actionCol: {
    alignItems: 'flex-end',
    gap: 8,
    marginLeft: 8,
  },
  acceptBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    ...Shadows.glow,
  },
  acceptGrad: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  acceptText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 10,
  },
  likeBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF0F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissBtn: {
    padding: 3,
  },
});
