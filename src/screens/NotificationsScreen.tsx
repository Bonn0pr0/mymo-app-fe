/**
 * NotificationsScreen.tsx
 * Friend request notifications with accept/reject actions.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, RefreshControl, Image, Platform, DeviceEventEmitter,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients, Shadows } from '../constants/colors';
import { useI18n } from '../i18n';
import {
  getFriendRequests,
  acceptFriend,
  rejectFriend,
  type PendingFriendRequest,
} from '../services/friendsApi';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllRead,
  deleteNotification,
  type NotificationItem,
} from '../services/notificationsApi';
import FriendRequestsSection from '../components/FriendRequestsSection';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type NotifFilter = 'all' | 'requests' | 'likes';

interface ScreenItem {
  id: string;
  type: 'request' | 'friend_accepted' | 'friend_rejected' | 'like' | 'info';
  who: string;
  textKey: string;
  time: string;
  avatarUrl?: string | null;
  requesterId?: string;
  notificationId?: string;
}

interface NotificationsScreenProps {
  isActive?: boolean;
  onUnreadCountChange?: (count: number) => void;
}

export default function NotificationsScreen({
  isActive = true,
  onUnreadCountChange,
}: NotificationsScreenProps) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<NotifFilter>('all');
  const [friendRequests, setFriendRequests] = useState<PendingFriendRequest[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await getFriendRequests();
      setFriendRequests(res || []);
    } catch {
      setFriendRequests([]);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await getNotifications();
      setNotifications(res || []);
      const uc = await getUnreadCount();
      onUnreadCountChange?.(uc);
    } catch {
      setNotifications([]);
      onUnreadCountChange?.(0);
    }
  }, [onUnreadCountChange]);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchRequests(), fetchNotifications()]);
  }, [fetchRequests, fetchNotifications]);

  useEffect(() => {
    refreshAll();
    const sub1 = DeviceEventEmitter.addListener('friend:requested', refreshAll);
    const sub2 = DeviceEventEmitter.addListener('friend:accepted', refreshAll);
    const sub3 = DeviceEventEmitter.addListener('friends:refetch', refreshAll);
    return () => {
      sub1.remove();
      sub2.remove();
      sub3.remove();
    };
  }, [refreshAll]);

  useEffect(() => {
    if (!isActive) return;
    refreshAll();
    const timer = setInterval(refreshAll, 15000);
    return () => clearInterval(timer);
  }, [isActive, refreshAll]);

  const handleRefresh = () => {
    setRefreshing(true);
    refreshAll().finally(() => setRefreshing(false));
  };

  const handleAccept = async (requesterId: string, displayName: string, notificationId?: string) => {
    try {
      await acceptFriend(requesterId);
      setFriendRequests(prev => prev.filter(r => r.userId !== requesterId));
      if (notificationId) {
        try { await markAsRead(notificationId); } catch { /* ignore */ }
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }
      DeviceEventEmitter.emit('friend:accepted', { userId: requesterId });
      DeviceEventEmitter.emit('friends:refetch');
      Toast.show({ type: 'success', text1: `${displayName} ${t('friends.nowFriend')}` });
      await fetchNotifications();
    } catch (err) {
      Toast.show({ type: 'error', text1: String(err instanceof Error ? err.message : 'Unable to accept') });
    }
  };

  const handleReject = async (requesterId: string, displayName: string, notificationId?: string) => {
    try {
      await rejectFriend(requesterId);
      setFriendRequests(prev => prev.filter(r => r.userId !== requesterId));
      if (notificationId) {
        try { await deleteNotification(notificationId); } catch { /* ignore */ }
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }
      Toast.show({ type: 'info', text1: `${t('friends.dismissed')} ${displayName}` });
      await fetchNotifications();
    } catch (err) {
      Toast.show({ type: 'error', text1: String(err instanceof Error ? err.message : 'Unable to reject') });
    }
  };

  const requestIds = new Set(friendRequests.map(r => r.userId));

  const notificationItems: ScreenItem[] = notifications
    .filter(nt => {
      if (nt.type === 'request') {
        const requesterId = nt.referenceId || nt.senderId;
        return !requestIds.has(requesterId || '');
      }
      return true;
    })
    .map(nt => ({
      id: nt.id,
      type: nt.type as ScreenItem['type'],
      who: nt.title || t('friends.someone'),
      textKey: nt.type === 'friend_accepted'
        ? 'notif.text.accepted'
        : nt.type === 'friend_rejected'
        ? 'notif.text.rejected'
        : nt.type === 'request'
        ? 'notif.text.request'
        : 'notif.text.generic',
      time: nt.createdAt ? new Date(nt.createdAt).toLocaleString() : t('common.now'),
      requesterId: nt.referenceId || nt.senderId,
      notificationId: nt.id,
    }));

  const allItems = [...notificationItems];

  const filteredItems = allItems.filter(n => {
    if (activeFilter === 'requests') {
      return friendRequests.length > 0 || n.type === 'request' || n.type === 'friend_accepted' || n.type === 'friend_rejected';
    }
    if (activeFilter === 'likes') return n.type === 'like';
    return true;
  });

  const clearAll = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try { await markAllRead(); } catch { /* ignore */ }
    setNotifications([]);
    Toast.show({ type: 'success', text1: t('notif.allDone') });
    onUnreadCountChange?.(0);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(16, insets.top) }]}>
        <View>
          <Text style={styles.title}>{t('notif.title')}</Text>
          <Text style={styles.subtitle}>{t('notif.subtitle')}</Text>
        </View>
        {allItems.length > 0 && (
          <TouchableOpacity onPress={clearAll} style={styles.clearBtn} activeOpacity={0.8}>
            <Text style={styles.clearText}>{t('common.clear')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterRow}>
        {(['all', 'requests', 'likes'] as NotifFilter[]).map(filter => {
          const isActiveTab = activeFilter === filter;
          const count = (filter === 'requests'
            ? friendRequests.length + notificationItems.filter(n =>
              n.type === 'request' || n.type === 'friend_accepted' || n.type === 'friend_rejected'
            ).length
            : allItems.filter(n => {
              if (filter === 'likes') return n.type === 'like';
              return true;
            }).length);

          return (
            <TouchableOpacity
              key={filter}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveFilter(filter);
              }}
              style={[styles.filterTab, isActiveTab && styles.filterTabActive]}
            >
              {isActiveTab ? (
                <LinearGradient colors={Gradients.primary as any} style={styles.filterTabGrad}>
                  <Text style={styles.filterTabTextActive}>
                    {filter === 'all' ? 'Tất cả' : filter === 'requests' ? 'Yêu cầu' : 'Yêu thích'} ({count})
                  </Text>
                </LinearGradient>
              ) : (
                <Text style={styles.filterTabText}>
                  {filter === 'all' ? 'Tất cả' : filter === 'requests' ? 'Yêu cầu' : 'Yêu thích'}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {friendRequests.length > 0 && activeFilter !== 'likes' && (
        <FriendRequestsSection
          requests={friendRequests}
          compact
          onAccept={(request) => handleAccept(request.userId, request.displayName)}
          onReject={(request) => handleReject(request.userId, request.displayName)}
        />
      )}

      <FlatList
        data={filteredItems}
        keyExtractor={item => item.id}
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
        renderItem={({ item }) => (
          <NotifItem
            item={item}
            onAccept={() => {
              if (!item.requesterId) return;
              handleAccept(item.requesterId, item.who, item.notificationId);
            }}
            onReject={() => {
              if (!item.requesterId) return;
              handleReject(item.requesterId, item.who, item.notificationId);
            }}
          />
        )}
      />
    </View>
  );
}

function NotifItem({
  item,
  onAccept,
  onReject,
}: {
  item: ScreenItem;
  onAccept: () => void;
  onReject: () => void;
}) {
  const { t } = useI18n();
  const avatarUrl = item.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop';

  return (
    <View style={styles.notifCard}>
      <View style={styles.notifMainRow}>
        <View style={styles.avatarWrap}>
          <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
          <View style={styles.emojiBadge}>
            <Text style={styles.emojiBadgeText}>
              {item.type === 'request' ? '👋' : item.type === 'friend_accepted' ? '✅' : '🔔'}
            </Text>
          </View>
        </View>

        <View style={styles.notifInfo}>
          <Text style={styles.notifText}>
            <Text style={styles.notifWho}>{item.who}</Text>{' '}
            <Text style={styles.notifSub}>{t(item.textKey as Parameters<typeof t>[0])}</Text>
          </Text>
          <Text style={styles.notifTime}>{item.time}</Text>
        </View>
      </View>

      <View style={styles.actionCol}>
        {item.type === 'request' ? (
          <View style={styles.actionRow}>
            <TouchableOpacity onPress={onAccept} activeOpacity={0.8} style={styles.acceptBtn}>
              <LinearGradient colors={Gradients.primary as any} style={styles.acceptGrad}>
                <Text style={styles.acceptText}>{t('common.accept')}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={onReject} activeOpacity={0.8} style={styles.rejectBtn}>
              <Text style={styles.rejectText}>{t('common.reject')}</Text>
            </TouchableOpacity>
          </View>
        ) : item.type === 'like' ? (
          <View style={styles.likeBadge}>
            <Ionicons name="heart" size={16} color="#FF3D6E" />
          </View>
        ) : (
          <View style={[styles.likeBadge, { backgroundColor: '#F0FDF4' }]}>
            <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFF',
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
  actionCol: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  rejectBtn: {
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  rejectText: {
    color: Colors.textMuted,
    fontWeight: '800',
    fontSize: 10,
  },
});
