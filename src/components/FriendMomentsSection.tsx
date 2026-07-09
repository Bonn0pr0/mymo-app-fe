import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DeviceEventEmitter } from 'react-native';
import { Colors, Shadows } from '../constants/colors';
import { useI18n } from '../i18n';
import PostSheet from './PostSheet';
import {
  getFriendsFeed,
  getFeed,
  toPostView,
  type FeedPost,
  type PostView,
} from '../services/postApi';

interface FriendMomentsSectionProps {
  friendNames: Record<string, { name: string; avatar?: string | null }>;
}

export default function FriendMomentsSection({ friendNames }: FriendMomentsSectionProps) {
  const { t } = useI18n();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<PostView | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPosts = useCallback(async () => {
    const friendIds = new Set(Object.keys(friendNames));
    try {
      const feed = await getFriendsFeed();
      setPosts(feed);
    } catch {
      try {
        const feed = await getFeed();
        setPosts(feed.filter(p => friendIds.has(p.userId)));
      } catch {
        setPosts([]);
      }
    } finally {
      setLoading(false);
    }
  }, [friendNames]);

  useEffect(() => {
    loadPosts();
    const sub = DeviceEventEmitter.addListener('post:created', loadPosts);
    return () => sub.remove();
  }, [loadPosts]);

  if (loading || posts.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <Ionicons name="images-outline" size={16} color={Colors.primary} />
        <Text style={styles.title}>{t('friends.moments')}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {posts.map(post => {
          const friend = friendNames[post.userId];
          const thumb = toPostView(post, friend?.name, friend?.avatar).thumbnailUrl;
          return (
            <TouchableOpacity
              key={post.postId}
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => setSelectedPost(toPostView(post, friend?.name, friend?.avatar))}
            >
              {thumb ? (
                <Image source={{ uri: thumb }} style={styles.thumb} resizeMode="cover" />
              ) : (
                <View style={styles.thumbFallback}>
                  <Ionicons name="image-outline" size={24} color={Colors.primary} />
                </View>
              )}
              <View style={styles.cardFooter}>
                <Text style={styles.author} numberOfLines={1}>
                  {friend?.name || t('friends.someone')}
                </Text>
                <Text style={styles.time}>
                  {new Date(post.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {selectedPost && (
        <PostSheet post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDF8',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textDark,
  },
  row: {
    paddingHorizontal: 16,
    gap: 10,
  },
  card: {
    width: 120,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    ...Shadows.soft,
  },
  thumb: {
    width: 120,
    height: 120,
    backgroundColor: Colors.primaryTint,
  },
  thumbFallback: {
    width: 120,
    height: 120,
    backgroundColor: Colors.primaryTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFooter: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  author: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textDark,
  },
  time: {
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
