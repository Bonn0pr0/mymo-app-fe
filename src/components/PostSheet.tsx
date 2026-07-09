import React, { useRef, useEffect } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet, Animated,
  Platform, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../constants/colors';
import { useI18n } from '../i18n';
import type { PostView } from '../services/postApi';

interface PostSheetProps {
  post: PostView;
  onClose: () => void;
}

export default function PostSheet({ post, onClose }: PostSheetProps) {
  const { t } = useI18n();
  const slideAnim = useRef(new Animated.Value(400)).current;
  const useNativeDriver = Platform.OS !== 'web';

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver,
      tension: 65,
      friction: 11,
    }).start();
  }, [slideAnim, useNativeDriver]);

  const close = () => {
    Animated.timing(slideAnim, {
      toValue: 400,
      duration: 250,
      useNativeDriver,
    }).start(onClose);
  };

  const caption = post.caption?.startsWith('cam.')
    ? t(post.caption as Parameters<typeof t>[0])
    : (post.caption || '');

  return (
    <Modal transparent animationType="fade" statusBarTranslucent onRequestClose={close}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={close} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <View style={styles.avatar}>
            {post.avatarUrl ? (
              <Image source={{ uri: post.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={18} color={Colors.primary} />
            )}
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{post.displayName}</Text>
            <Text style={styles.caption} numberOfLines={2}>{caption}</Text>
          </View>
        </View>

        {post.thumbnailUrl && (
          <Image source={{ uri: post.thumbnailUrl }} style={styles.thumbnail} resizeMode="cover" />
        )}

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Ionicons name="heart-outline" size={16} color={Colors.primary} />
            <Text style={styles.statText}>{post.likeCount}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="chatbubble-outline" size={16} color={Colors.primary} />
            <Text style={styles.statText}>{post.commentCount}</Text>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(42,23,88,0.35)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 36,
    ...Shadows.float,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primarySoft,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryTint,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 40,
    height: 40,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textDark,
  },
  caption: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  thumbnail: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    backgroundColor: Colors.primaryTint,
  },
  stats: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 14,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textDark,
  },
});
