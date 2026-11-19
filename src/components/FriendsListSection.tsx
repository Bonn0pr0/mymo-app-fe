import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../constants/colors';
import { useI18n } from '../i18n';
import type { FriendSummary } from '../services/friendsApi';
import { avatarUri } from '../constants/defaultAvatar';
import type { OpenChatParams } from './ConversationsSection';
import type { FriendProfileParams } from '../screens/FriendProfileScreen';

interface FriendsListSectionProps {
  friends: FriendSummary[];
  onlineUserIds: ReadonlySet<string>;
  onOpenChat: (params: OpenChatParams) => void;
  onViewProfile: (params: FriendProfileParams) => void;
  onManage: (friend: FriendSummary) => void;
  emptyLabel?: string;
}

export default function FriendsListSection({
  friends,
  onlineUserIds,
  onOpenChat,
  onViewProfile,
  onManage,
  emptyLabel,
}: FriendsListSectionProps) {
  const { t } = useI18n();
  const [filterQuery, setFilterQuery] = useState('');

  const filteredFriends = useMemo(() => {
    if (!filterQuery.trim()) return friends;
    const q = filterQuery.toLowerCase().trim();
    return friends.filter(f =>
      (f.displayName || '').toLowerCase().includes(q) ||
      (f.username || '').toLowerCase().includes(q)
    );
  }, [friends, filterQuery]);

  if (friends.length === 0) {
    if (!emptyLabel) return null;
    return (
      <View style={styles.wrap}>
        <View style={styles.titleRow}>
          <Ionicons name="people-outline" size={17} color={Colors.primary} />
          <Text style={styles.title}>{t('friends.myFriends')}</Text>
        </View>
        <Text style={styles.empty}>{emptyLabel}</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <Ionicons name="people-outline" size={17} color={Colors.primary} />
        <Text style={styles.title}>{t('friends.myFriends')}</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{friends.length}</Text>
        </View>
      </View>

      {friends.length > 5 && (
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={15} color={Colors.textMuted} />
          <TextInput
            value={filterQuery}
            onChangeText={setFilterQuery}
            placeholder={t('friends.searchFriends')}
            placeholderTextColor={Colors.textMuted}
            style={styles.searchInput}
          />
          {filterQuery.length > 0 && (
            <TouchableOpacity onPress={() => setFilterQuery('')}>
              <Ionicons name="close-circle" size={15} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {filteredFriends.map(friend => {
        const isOnline = !!friend.userId && (onlineUserIds.has(friend.userId) || !!friend.isOnline);

        return (
          <View key={friend.userId} style={styles.card}>
            <TouchableOpacity
              style={styles.avatarName}
              activeOpacity={0.75}
              onPress={() => onViewProfile({
                userId: friend.userId,
                displayName: friend.displayName || friend.username,
                avatarUrl: friend.avatarUrl,
              })}
            >
              <View style={styles.avatarWrap}>
                <Image source={{ uri: avatarUri(friend.avatarUrl) }} style={styles.avatar} />
                <View style={[styles.dot, isOnline ? styles.dotOn : styles.dotOff]} />
              </View>
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>{friend.displayName || friend.username}</Text>
                <View style={styles.subRow}>
                  {isOnline ? (
                    <Text style={styles.onlineText}>● {t('friends.online')}</Text>
                  ) : (
                    <Text style={styles.sub} numberOfLines={1}>@{friend.username || 'user'}</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.chatBtn}
                activeOpacity={0.8}
                onPress={() => onOpenChat({
                  userId: friend.userId,
                  title: friend.displayName || friend.username,
                  avatarUrl: friend.avatarUrl,
                })}
              >
                <Ionicons name="chatbubble-ellipses" size={16} color={Colors.primary} />
                <Text style={styles.chatBtnText}>{t('friends.chat')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.moreBtn}
                activeOpacity={0.7}
                onPress={() => onManage(friend)}
              >
                <Ionicons name="ellipsis-horizontal" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textDark,
  },
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  countText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  empty: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FB',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    marginBottom: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.textDark,
    padding: 0,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0EDF8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.soft,
  },
  avatarName: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryTint,
  },
  dot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  dotOn: {
    backgroundColor: Colors.activeGreen,
  },
  dotOff: {
    backgroundColor: '#C9C1DC',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textDark,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  sub: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  onlineText: {
    fontSize: 12,
    color: Colors.activeGreen,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F7F2FD',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8DFF7',
  },
  chatBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  moreBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
