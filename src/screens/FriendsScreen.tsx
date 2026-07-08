/**
 * FriendsScreen.tsx
 * Redesigned to look exactly like the Facebook Messenger chats screen.
 * Features a horizontal story tray, status rings, user story posting,
 * search filtering, and interactive full-screen story viewing.
 */
import React, { useState, useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, ScrollView, Image, Modal, Dimensions, SafeAreaView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Gradients, Shadows } from '../constants/colors';
import { useI18n } from '../i18n';
import type { Friend } from '../constants/data';
import {
  getFriends,
  getFriendSuggestions,
  getFriendRequests,
  getSentRequests,
  requestFriend,
  type FriendSummary,
} from '../services/friendsApi';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Extended Mock Data for Messenger UI ─────────────────────────────────────
const MOCK_AVATARS: { [id: string]: string } = {
  '1': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop', // Léa
  '2': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop', // Noah
  '3': 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop', // Maya
  '4': 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop', // Kai
  '5': 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop', // Zoe
};

const MOCK_STORIES: { [id: string]: string } = {
  '1': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&fit=crop', // Beach sunset
  '2': 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&fit=crop', // Mountains
  '4': 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&fit=crop', // Forest
};

const MOCK_CHAT_DETAILS: { [id: string]: { message: string; time: string } } = {
  '1': { message: 'How are you doing?', time: '1:00 pm' },
  '2': { message: 'Long time no see!!', time: '12:00 am' },
  '3': { message: 'Glad to know you in person!', time: '3:30 pm' },
  '4': { message: 'I\'m doing fine and how about you?', time: 'Yesterday' },
  '5': { message: 'What is your real name?', time: 'Monday' },
};

// ─── Interfaces ──────────────────────────────────────────────────────────────
interface FriendsScreenProps {
  onFriendTap: (f: Friend) => void;
  onChat: (f: Friend) => void;
  onAdd: () => void;
}

interface Story {
  friendId: string;
  name: string;
  avatar: string;
  storyImg: string;
}

export default function FriendsScreen({ onFriendTap, onChat, onAdd }: FriendsScreenProps) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [friends, setFriends] = useState<FriendSummary[]>([]);
  const [suggestions, setSuggestions] = useState<FriendSummary[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendSummary[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Story state
  const [myStory, setMyStory] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [storyTimer, setStoryTimer] = useState<number>(0);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);

  // New Story Creation Modal State
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
  const [newStoryText, setNewStoryText] = useState('');
  const [storyBgGrad, setStoryBgGrad] = useState(0);

  type FriendView = Friend & { avatar: string; lastMsg: string; lastTime: string; hasStory: boolean; storyImg: string };

  const mapFriendSummary = (item: FriendSummary): FriendView => {
    const name = item.displayName || item.username;
    const status = item.mutualFriendsCount && item.mutualFriendsCount > 0 ? 'active' : 'idle';
    const hash = item.userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const x = 20 + (hash % 60);
    const y = 20 + ((hash >> 3) % 60);
    const avatar = item.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop';

    return {
      id: item.userId,
      name,
      emoji: '👋',
      color: '#7CC4FF',
      place: item.mutualFriendsCount ? `${item.mutualFriendsCount} mutual` : 'Friend',
      distance: item.requestedAt ? 'Requested' : 'Online',
      status: status as 'active' | 'idle' | 'moving',
      battery: 100,
      x,
      y,
      avatar,
      lastMsg: item.requestedAt ? 'Request pending' : 'Say hello',
      lastTime: item.requestedAt ? new Date(item.requestedAt).toLocaleDateString() : 'Now',
      hasStory: false,
      storyImg: '',
    };
  };

  const friendsWithStatus = friends.map(mapFriendSummary);
  const filteredFriends = friendsWithStatus.filter(f =>
    f.name.toLowerCase().includes(query.toLowerCase())
  );

  // Get list of friends who have active stories
  const activeStories: Story[] = [];
  
  // If user has posted their own story
  if (myStory) {
    activeStories.push({
      friendId: 'me',
      name: 'Your Story',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
      storyImg: myStory,
    });
  }

  friendsWithStatus.forEach(f => {
    if (f.hasStory) {
      activeStories.push({
        friendId: f.id,
        name: f.name,
        avatar: f.avatar,
        storyImg: f.storyImg,
      });
    }
  });

  // Story Autoplay logic
  useEffect(() => {
    let interval: any;
    if (selectedStory) {
      setStoryTimer(0);
      interval = setInterval(() => {
        setStoryTimer(prev => {
          if (prev >= 1) {
            // Next story or close
            const nextIdx = activeStoryIndex + 1;
            if (nextIdx < activeStories.length) {
              setActiveStoryIndex(nextIdx);
              setSelectedStory(activeStories[nextIdx]);
            } else {
              setSelectedStory(null);
            }
            return 0;
          }
          return prev + 0.02; // Progress step
        });
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedStory, activeStoryIndex, activeStories.length]);

  const handlePostStory = () => {
    if (!newStoryText.trim()) {
      Toast.show({ type: 'error', text1: 'Vui lòng nhập nội dung story!' });
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // We render a colored canvas or generate a text story image placeholder
    // For simplicity, we create a colorful dynamic status story placeholder
    setMyStory(`text-story:${newStoryText}:${storyBgGrad}`);
    setNewStoryText('');
    setIsCreateStoryOpen(false);
    Toast.show({ type: 'success', text1: 'Đã đăng story thành công! ✨' });
  };

  const fetchFriendData = async () => {
    setIsLoading(true);
    try {
      const [friendsRes, suggestionsRes, requestsRes, sentRes] = await Promise.all([
        getFriends(),
        getFriendSuggestions(),
        getFriendRequests(),
        getSentRequests(),
      ]);
      setFriends(friendsRes);
      setSuggestions(suggestionsRes);
      setFriendRequests(requestsRes);
      setSentRequests(sentRes);
    } catch (error) {
      Toast.show({ type: 'error', text1: String(error instanceof Error ? error.message : 'Unable to load friends') });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFriendData();
    const sub = DeviceEventEmitter.addListener('friend:accepted', () => {
      fetchFriendData();
    });
    const sub2 = DeviceEventEmitter.addListener('friends:refetch', () => {
      fetchFriendData();
    });
    return () => {
      sub.remove();
      sub2.remove();
    };
  }, []);

  const grads = [
    ['#9C7CFF', '#7C5BFF'], // Purple
    ['#FF8FB8', '#FF3D6E'], // Warm pink
    ['#7CC4FF', '#3B82F6'], // Ocean blue
    ['#FBBF24', '#EF4444'], // Sunset yellow
  ];

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: Math.max(12, insets.top) }]}>
        {/* User avatar on the left */}
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop' }}
          style={styles.headerAvatar}
        />
        <Text style={styles.headerTitle}>Chats</Text>
        {/* Compose/Add friend button on the right */}
        <TouchableOpacity onPress={onAdd} style={styles.headerBtn} activeOpacity={0.8}>
          <Ionicons name="create" size={20} color={Colors.textDark} />
        </TouchableOpacity>
      </View>

      {/* ── Search Bar ── */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search"
          placeholderTextColor={Colors.textMuted}
          style={styles.searchInput}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Main List ── */}
      <FlatList
        data={filteredFriends}
        keyExtractor={f => f.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={() => (
          <View style={styles.storyTrayWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storyTray}>
              {/* Add Story Button (Your Story) */}
              <View style={styles.storyCol}>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (myStory) {
                      // View my story
                      setActiveStoryIndex(0);
                      setSelectedStory(activeStories[0]);
                    } else {
                      setIsCreateStoryOpen(true);
                    }
                  }}
                  style={[
                    styles.storyAvatarWrap,
                    myStory && styles.storyRingActive
                  ]}
                  activeOpacity={0.85}
                >
                  {myStory ? (
                    <Image
                      source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop' }}
                      style={styles.storyAvatar}
                    />
                  ) : (
                    <View style={styles.createStoryBtn}>
                      <Ionicons name="add" size={24} color={Colors.textDark} />
                    </View>
                  )}
                </TouchableOpacity>
                <Text style={styles.storyName}>Your Story</Text>
              </View>

              {/* Friends Stories */}
              {friendsWithStatus.map(f => {
                if (!f.hasStory) return null;
                const storyIdx = activeStories.findIndex(s => s.friendId === f.id);
                return (
                  <View key={`story-${f.id}`} style={styles.storyCol}>
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setActiveStoryIndex(storyIdx);
                        setSelectedStory(activeStories[storyIdx]);
                      }}
                      style={[styles.storyAvatarWrap, styles.storyRingActive]}
                      activeOpacity={0.85}
                    >
                      <Image source={{ uri: f.avatar }} style={styles.storyAvatar} />
                      {f.status === 'active' && <View style={styles.storyActiveDot} />}
                    </TouchableOpacity>
                    <Text style={styles.storyName} numberOfLines={1}>
                      {f.name.split(' ')[0]}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}
        renderItem={({ item: f }) => (
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onChat(f);
            }}
            onLongPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onFriendTap(f);
            }}
            style={styles.chatItem}
            activeOpacity={0.7}
          >
            {/* Left side: Avatar wrapped in story ring (if they have a story) */}
            <View style={styles.chatAvatarWrap}>
              <TouchableOpacity
                onPress={() => {
                  if (f.hasStory) {
                    const storyIdx = activeStories.findIndex(s => s.friendId === f.id);
                    setActiveStoryIndex(storyIdx);
                    setSelectedStory(activeStories[storyIdx]);
                  } else {
                    onChat(f);
                  }
                }}
                disabled={!f.hasStory}
                activeOpacity={0.8}
                style={[
                  styles.avatarBorder,
                  f.hasStory && styles.storyRingActive
                ]}
              >
                <Image source={{ uri: f.avatar }} style={styles.chatAvatar} />
              </TouchableOpacity>
              {f.status === 'active' && <View style={styles.chatActiveDot} />}
            </View>

            {/* Middle: Name + message snippet */}
            <View style={styles.chatInfo}>
              <Text style={styles.chatName}>{f.name}</Text>
              <Text style={styles.chatMsg} numberOfLines={1}>
                {f.lastMsg} · {f.lastTime}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* ── Fullscreen Story Viewer Modal ── */}
      <Modal visible={!!selectedStory} transparent animationType="fade" onRequestClose={() => setSelectedStory(null)}>
        {selectedStory && (
          <SafeAreaView style={styles.storyModal}>
            {/* Background tap handlers */}
            <View style={StyleSheet.absoluteFill}>
              {selectedStory.storyImg.startsWith('text-story:') ? (
                <LinearGradient
                  colors={grads[parseInt(selectedStory.storyImg.split(':')[2]) || 0] as any}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.storyTextContentWrap}>
                    <Text style={styles.storyTextContent}>{selectedStory.storyImg.split(':')[1]}</Text>
                  </View>
                </LinearGradient>
              ) : (
                <Image source={{ uri: selectedStory.storyImg }} style={styles.storyFullImage} resizeMode="cover" />
              )}
            </View>

            {/* Story header controls & progress bar */}
            <View style={styles.storyModalHeader}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${storyTimer * 100}%` }]} />
              </View>
              <View style={styles.storyUserRow}>
                <Image source={{ uri: selectedStory.avatar }} style={styles.storyUserAvatar} />
                <Text style={styles.storyUserName}>{selectedStory.name}</Text>
                <TouchableOpacity onPress={() => setSelectedStory(null)} style={styles.storyCloseBtn}>
                  <Ionicons name="close" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Bottom reply box */}
            <View style={styles.storyReplyRow}>
              <TextInput
                placeholder="Send message..."
                placeholderTextColor="rgba(255,255,255,0.7)"
                style={styles.storyReplyInput}
              />
              <TouchableOpacity onPress={() => {
                Toast.show({ type: 'success', text1: 'Đã gửi phản hồi!' });
                setSelectedStory(null);
              }}>
                <Ionicons name="send" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        )}
      </Modal>

      {/* ── Create Story Modal ── */}
      <Modal visible={isCreateStoryOpen} transparent animationType="slide" onRequestClose={() => setIsCreateStoryOpen(false)}>
        <View style={styles.createStoryModal}>
          <View style={styles.createStoryCard}>
            <View style={styles.createStoryHeader}>
              <Text style={styles.createStoryTitle}>Đăng Story mới</Text>
              <TouchableOpacity onPress={() => setIsCreateStoryOpen(false)}>
                <Ionicons name="close-circle" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Colored background selector preview */}
            <LinearGradient
              colors={grads[storyBgGrad] as any}
              style={styles.createStoryPreview}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <TextInput
                value={newStoryText}
                onChangeText={setNewStoryText}
                placeholder="Nhập suy nghĩ của bạn hôm nay..."
                placeholderTextColor="rgba(255,255,255,0.8)"
                multiline
                maxLength={80}
                style={styles.createStoryInput}
              />
            </LinearGradient>

            {/* Gradient Selector dots */}
            <View style={styles.gradRow}>
              {grads.map((g, i) => (
                <TouchableOpacity
                  key={`grad-${i}`}
                  onPress={() => setStoryBgGrad(i)}
                  style={[
                    styles.gradDot,
                    storyBgGrad === i && styles.gradDotActive
                  ]}
                >
                  <LinearGradient colors={g as any} style={styles.gradDotFill} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Action buttons */}
            <TouchableOpacity onPress={handlePostStory} style={styles.postStoryBtn}>
              <LinearGradient colors={(Gradients.primary as any)} style={styles.postStoryBtnGrad}>
                <Text style={styles.postStoryBtnText}>Đăng Story 🚀</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
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
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EEE',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textDark,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 16,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textDark,
  },
  listContent: {
    paddingBottom: 120,
  },

  // ── Story tray ──
  storyTrayWrap: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    marginBottom: 8,
  },
  storyTray: {
    paddingHorizontal: 16,
    gap: 12,
  },
  storyCol: {
    alignItems: 'center',
    width: 68,
  },
  storyAvatarWrap: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  storyRingActive: {
    borderColor: '#3B82F6', // Blue story border
  },
  storyAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#EEE',
  },
  storyActiveDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  createStoryBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyName: {
    fontSize: 11,
    color: Colors.textDark,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },

  // ── Chat items list ──
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chatAvatarWrap: {
    position: 'relative',
  },
  avatarBorder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2.5,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EEE',
  },
  chatActiveDot: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#10B981',
    borderWidth: 2.5,
    borderColor: Colors.white,
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  chatName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textDark,
  },
  chatMsg: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 3,
  },

  // ── Story view modal ──
  storyModal: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'space-between',
  },
  storyFullImage: {
    ...StyleSheet.absoluteFill,
  },
  storyTextContentWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  storyTextContent: {
    fontSize: 24,
    color: '#FFF',
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 34,
  },
  storyModalHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  progressBarBg: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFF',
  },
  storyUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  storyUserAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  storyUserName: {
    flex: 1,
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  storyCloseBtn: {
    padding: 4,
  },
  storyReplyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  storyReplyInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#FFF',
    fontSize: 14,
  },

  // ── Create story modal ──
  createStoryModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  createStoryCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 16,
  },
  createStoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  createStoryTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textDark,
  },
  createStoryPreview: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  createStoryInput: {
    width: '100%',
    textAlign: 'center',
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  gradRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 4,
  },
  gradDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradDotActive: {
    borderColor: Colors.primary,
  },
  gradDotFill: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  postStoryBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    ...Shadows.glow,
  },
  postStoryBtnGrad: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  postStoryBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
});
