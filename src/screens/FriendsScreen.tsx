import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Gradients, Shadows } from '../constants/colors';
import { useI18n } from '../i18n';
import type { Friend } from '../constants/data';
import { FRIENDS } from '../constants/data';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

interface FriendsScreenProps {
  onFriendTap: (f: Friend) => void;
  onChat: (f: Friend) => void;
  onAdd: () => void;
}

export default function FriendsScreen({ onFriendTap, onChat, onAdd }: FriendsScreenProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState([
    { name: 'Sasha', emoji: '🦋', color: '#FFB8E0' },
    { name: 'Eli',   emoji: '⚡', color: '#FFE39A' },
  ]);

  const filtered = FRIENDS.filter(f =>
    f.name.toLowerCase().includes(query.toLowerCase()) ||
    f.place.toLowerCase().includes(query.toLowerCase())
  );

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleAccept = (name: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setRequests(r => r.filter(x => x.name !== name));
    Toast.show({ type: 'success', text1: `${name} ${t('friends.nowFriend')}` });
  };

  const handleReject = (name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRequests(r => r.filter(x => x.name !== name));
    Toast.show({ type: 'info', text1: `${t('friends.dismissed')} ${name}` });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t('friends.title')}</Text>
          <Text style={styles.subtitle}>{t('friends.subtitle')}</Text>
        </View>
        <TouchableOpacity onPress={onAdd} activeOpacity={0.85} style={styles.addBtn}>
          <LinearGradient colors={Gradients.primary} style={styles.addBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="person-add" size={18} color={Colors.white} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={16} color={Colors.primary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('friends.search')}
          placeholderTextColor={Colors.textMuted}
          style={styles.searchInput}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={f => f.id}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={() => (
          <>
            {/* Requests */}
            {requests.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionLabel}>{t('friends.requests')} · {requests.length}</Text>
                  <TouchableOpacity onPress={() => Toast.show({ type: 'info', text1: t('friends.allRequests'), text2: t('friends.allRequestsDesc') })}>
                    <Text style={styles.seeAll}>{t('common.seeAll')}</Text>
                  </TouchableOpacity>
                </View>
                {requests.map(r => (
                  <View key={r.name} style={styles.requestCard}>
                    <View style={[styles.requestAvatar, { backgroundColor: r.color }]}>
                      <Text style={styles.requestEmoji}>{r.emoji}</Text>
                    </View>
                    <View style={styles.requestInfo}>
                      <Text style={styles.requestName}>{r.name}</Text>
                      <Text style={styles.requestSub}>{t('friends.wantsToShare')}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleReject(r.name)} style={styles.rejectBtn}>
                      <Ionicons name="close" size={16} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleAccept(r.name)} style={styles.acceptBtn}>
                      <LinearGradient colors={Gradients.primary} style={styles.acceptGrad}>
                        <Ionicons name="checkmark" size={16} color={Colors.white} />
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            {/* Friends label */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>{t('friends.sharing')} · {filtered.length}</Text>
              <Text style={styles.tipText}>{t('friends.doubleTap')}</Text>
            </View>
          </>
        )}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('friends.noMatch')} "{query}"</Text>
          </View>
        )}
        renderItem={({ item: f }) => (
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onFriendTap(f);
            }}
            onLongPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onChat(f);
            }}
            style={styles.friendCard}
            activeOpacity={0.88}
          >
            <View style={styles.friendAvatarWrap}>
              <View style={[styles.friendAvatar, { backgroundColor: f.color }]}>
                <Text style={styles.friendEmoji}>{f.emoji}</Text>
              </View>
              {f.status === 'active' && <View style={styles.activeDot} />}
            </View>
            <View style={styles.friendInfo}>
              <Text style={styles.friendName}>{f.name}</Text>
              <View style={styles.friendPlaceRow}>
                <Ionicons name="location-outline" size={11} color={Colors.textMuted} />
                <Text style={styles.friendPlace}>{f.place} · {f.distance}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onChat(f);
              }}
              style={styles.chatBtn}
            >
              <LinearGradient colors={Gradients.primary} style={styles.chatBtnGrad}>
                <Ionicons name="chatbubble-ellipses" size={14} color={Colors.white} />
              </LinearGradient>
            </TouchableOpacity>
            <View style={styles.batteryBox}>
              <Text style={styles.batteryPct}>{f.battery}%</Text>
              <View style={styles.batteryTrack}>
                <LinearGradient
                  colors={Gradients.primary}
                  style={[styles.batteryFill, { width: `${f.battery}%` }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryTint,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.textDark,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  addBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Shadows.glow,
  },
  addBtnGrad: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 4,
    ...Shadows.soft,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.textDark,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 8,
    paddingTop: 12,
  },
  section: {
    marginBottom: 8,
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  seeAll: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  tipText: {
    fontSize: 10,
    color: Colors.primaryLight,
    fontWeight: '500',
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 12,
    ...Shadows.soft,
  },
  requestAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestEmoji: {
    fontSize: 22,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textDark,
  },
  requestSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  rejectBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primaryTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    ...Shadows.glow,
  },
  acceptGrad: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 12,
    ...Shadows.soft,
  },
  friendAvatarWrap: {
    position: 'relative',
  },
  friendAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.soft,
  },
  friendEmoji: {
    fontSize: 22,
  },
  activeDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textDark,
  },
  friendPlaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  friendPlace: {
    fontSize: 11,
    color: Colors.textMuted,
    flex: 1,
  },
  chatBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    overflow: 'hidden',
    ...Shadows.glow,
  },
  chatBtnGrad: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  batteryBox: {
    alignItems: 'flex-end',
    minWidth: 40,
  },
  batteryPct: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  batteryTrack: {
    width: 40,
    height: 5,
    backgroundColor: Colors.primarySoft,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 3,
  },
  batteryFill: {
    height: '100%',
    borderRadius: 3,
  },
  empty: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    ...Shadows.soft,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
});
