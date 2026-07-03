import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Gradients, Shadows } from '../constants/colors';
import { useI18n } from '../i18n';
import type { Friend } from '../constants/data';
import SparkleField from './SparkleField';
import Toast from 'react-native-toast-message';

interface ChatScreenProps {
  friend: Friend;
  onClose: () => void;
}

interface Message {
  id: string;
  from: 'me' | 'them';
  text: string;
}

export default function ChatScreen({ friend, onClose }: ChatScreenProps) {
  const { t } = useI18n();
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: 'm1', from: 'them', text: t('chat.msg1') },
    { id: 'm2', from: 'them', text: t('chat.msg2') },
    { id: 'm3', from: 'me',   text: t('chat.msg3') },
  ]);
  const flatRef = useRef<FlatList>(null);

  const send = () => {
    const v = text.trim();
    if (!v) return;
    const newMsg: Message = { id: String(Date.now()), from: 'me', text: v };
    setMessages(m => [...m, newMsg]);
    setText('');
    Toast.show({ type: 'success', text1: t('chat.sent') });
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);

    // Simulate reply after 1s
    setTimeout(() => {
      const replies = ['✨', '🌸', '💜', 'Nice!', 'hahaha', 'omg where are you'];
      const reply: Message = {
        id: String(Date.now() + 1),
        from: 'them',
        text: replies[Math.floor(Math.random() * replies.length)],
      };
      setMessages(m => [...m, reply]);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }, 1000);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.primary} />
        </TouchableOpacity>
        <View style={[styles.avatar, { backgroundColor: friend.color }]}>
          <Text style={styles.avatarEmoji}>{friend.emoji}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{friend.name}</Text>
          <View style={styles.onlineRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>{t('chat.online')}</Text>
          </View>
        </View>
        <Ionicons name="sparkles" size={18} color={Colors.primaryLight} />
      </View>

      {/* Messages */}
      <View style={styles.msgWrap}>
        <SparkleField count={8} />
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={styles.msgList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.from === 'me' ? styles.bubbleMe : styles.bubbleThem]}>
              {item.from === 'me' ? (
                <LinearGradient
                  colors={Gradients.primary}
                  style={styles.bubbleMeGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.bubbleMeText}>{item.text}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.bubbleThemView}>
                  <Text style={styles.bubbleThemText}>{item.text}</Text>
                </View>
              )}
            </View>
          )}
        />
      </View>

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.inputBar}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={t('chat.placeholder')}
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            returnKeyType="send"
            onSubmitEditing={send}
          />
          <TouchableOpacity onPress={send} activeOpacity={0.85} style={styles.sendBtn}>
            <LinearGradient colors={Gradients.primary} style={styles.sendGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Ionicons name="send" size={16} color={Colors.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    ...Shadows.soft,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Colors.primaryTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
    ...Shadows.glow,
  },
  avatarEmoji: {
    fontSize: 18,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textDark,
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  onlineText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
  },
  msgWrap: {
    flex: 1,
  },
  msgList: {
    padding: 16,
    gap: 10,
    paddingBottom: 20,
  },
  bubble: {
    maxWidth: '78%',
  },
  bubbleMe: {
    alignSelf: 'flex-end',
  },
  bubbleThem: {
    alignSelf: 'flex-start',
  },
  bubbleMeGrad: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    borderBottomRightRadius: 6,
    ...Shadows.glow,
  },
  bubbleMeText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  bubbleThemView: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    borderBottomLeftRadius: 6,
    ...Shadows.soft,
  },
  bubbleThemText: {
    color: Colors.textDark,
    fontSize: 14,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
    ...Shadows.float,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.primaryTint,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textDark,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    overflow: 'hidden',
    ...Shadows.glow,
  },
  sendGrad: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
