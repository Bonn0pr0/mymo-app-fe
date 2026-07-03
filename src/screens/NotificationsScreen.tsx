import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients, Shadows } from '../constants/colors';
import { useI18n } from '../i18n';
import { NOTIFS } from '../constants/data';
import type { Notif } from '../constants/data';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

export default function NotificationsScreen() {
  const { t } = useI18n();
  const [items, setItems] = useState<Notif[]>(NOTIFS);
  const [refreshing, setRefreshing] = useState(false);

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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t('notif.title')}</Text>
          <Text style={styles.subtitle}>{t('notif.subtitle')}</Text>
        </View>
        {items.length > 0 && (
          <TouchableOpacity onPress={clearAll} style={styles.clearBtn}>
            <Text style={styles.clearText}>{t('common.clear')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={items}
        keyExtractor={n => n.id}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="notifications-outline" size={28} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>{t('notif.allCaughtUp')}</Text>
            <Text style={styles.emptySub}>{t('notif.newWillShow')}</Text>
          </View>
        )}
        renderItem={({ item: n }) => <NotifItem notif={n} onPress={() => {
          if (n.type === 'request') {
            Toast.show({ type: 'success', text1: `${n.who} ${t('notif.accepted')}` });
            remove(n.id);
          } else {
            Toast.show({ type: 'info', text1: n.who, text2: t(n.textKey) });
            remove(n.id);
          }
        }} onAccept={() => {
          Toast.show({ type: 'success', text1: `${n.who} ${t('notif.accepted')}` });
          remove(n.id);
        }} />}
      />
    </View>
  );
}

function NotifItem({ notif, onPress, onAccept }: { notif: Notif; onPress: () => void; onAccept: () => void }) {
  const { t } = useI18n();
  return (
    <TouchableOpacity onPress={onPress} style={styles.notifCard} activeOpacity={0.88}>
      <View style={styles.notifAvatar}>
        <Text style={styles.notifEmoji}>{notif.emoji}</Text>
      </View>
      <View style={styles.notifInfo}>
        <Text style={styles.notifText} numberOfLines={2}>
          <Text style={styles.notifWho}>{notif.who} </Text>
          <Text style={styles.notifSub}>{t(notif.textKey)}</Text>
        </Text>
        <Text style={styles.notifTime}>{notif.time}</Text>
      </View>
      {notif.type === 'request' ? (
        <TouchableOpacity onPress={onAccept} activeOpacity={0.88} style={styles.acceptBtn}>
          <LinearGradient colors={Gradients.primary} style={styles.acceptGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.acceptText}>{t('common.accept')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      ) : notif.type === 'like' ? (
        <Ionicons name="heart" size={20} color="#FF8FB8" />
      ) : notif.type === 'nearby' ? (
        <Ionicons name="navigate" size={20} color={Colors.primary} />
      ) : (
        <Ionicons name="chatbubble-ellipses" size={20} color={Colors.primary} />
      )}
    </TouchableOpacity>
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
  clearBtn: {
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    ...Shadows.soft,
  },
  clearText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 8,
  },
  empty: {
    backgroundColor: Colors.white,
    borderRadius: 28,
    padding: 36,
    alignItems: 'center',
    marginTop: 20,
    ...Shadows.soft,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: Colors.primaryTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textDark,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 5,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 14,
    ...Shadows.soft,
  },
  notifAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifEmoji: {
    fontSize: 22,
  },
  notifInfo: {
    flex: 1,
  },
  notifText: {
    fontSize: 13,
    lineHeight: 18,
  },
  notifWho: {
    fontWeight: '700',
    color: Colors.textDark,
  },
  notifSub: {
    color: Colors.textMuted,
  },
  notifTime: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 3,
  },
  acceptBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    ...Shadows.glow,
  },
  acceptGrad: {
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  acceptText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 12,
  },
});
