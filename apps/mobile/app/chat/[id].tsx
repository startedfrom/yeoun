import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useRef } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View, Pressable, Image } from 'react-native';

import {
  AppHeader,
  Button,
  Screen,
  colors,
  radii,
  spacing,
  typography
} from '@gamdojang/ui';
import { useCreateMessage, useMessages } from '../../src/hooks/use-messages';
import { useProfile } from '../../src/hooks/use-profile';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function ChatRoomRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = id || '';

  const { data: currentUser } = useProfile('me');
  const { data: messagesData, isLoading } = useMessages(conversationId);
  const { mutate: sendMessage, isPending: isSending } = useCreateMessage();

  const [text, setText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  const messages = messagesData?.pages.flatMap(p => p.items).reverse() || [];

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(
      { conversationId, data: { content: text.trim(), messageType: 'text' } },
      { onSuccess: () => setText('') }
    );
  };

  const partnerInfo = messages.find(m => m.sender.userId !== currentUser?.user.userId)?.sender;
  const title = partnerInfo?.nickname || '조용한 편지함';

  if (isLoading && messages.length === 0) {
    return (
      <Screen header={<AppHeader title="편지함" onBack={() => router.back()} />}>
        <ActivityIndicator size="large" color={colors.lavender500} style={{ marginTop: 100 }} />
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.cream50 }}
    >
      <Stack.Screen options={{ title: '편지함' }} />
      <AppHeader title={title} onBack={() => router.back()} />

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
      >
        <Text style={styles.chatNotice}>여기는 다정하고 안전한 공간입니다.</Text>

        {messages.map(msg => {
          const isMe = msg.sender.userId === currentUser?.user.userId;
          return (
            <View 
              key={msg.id} 
              style={[
                styles.messageWrapper,
                isMe ? styles.messageWrapperMe : styles.messageWrapperPartner
              ]}
            >
              {!isMe && (
                <Image source={{ uri: msg.sender.profileImageUrl }} style={styles.avatar} />
              )}
              <View style={styles.bubbleCol}>
                {!isMe && <Text style={styles.senderName}>{msg.sender.nickname}</Text>}
                <View style={[
                  styles.bubble,
                  isMe ? styles.bubbleMe : styles.bubblePartner
                ]}>
                  {msg.messageType === 'text' && (
                    <Text style={styles.messageText}>
                      {msg.content}
                    </Text>
                  )}
                  {msg.messageType === 'post_share' && msg.sharedPost && (
                    <Pressable style={styles.sharedPostCard} onPress={() => router.push(`/post/${msg.sharedPost?.postId}`)}>
                      <Image source={{ uri: msg.sharedPost.images[0]?.imageUrl }} style={styles.sharedImage} />
                      <View style={styles.sharedContent}>
                        <Text style={styles.sharedTitle}>공유된 여운</Text>
                        <Text numberOfLines={1} style={styles.sharedCaption}>{msg.sharedPost.caption}</Text>
                      </View>
                    </Pressable>
                  )}
                </View>
                <Text style={[styles.time, isMe ? styles.timeMe : styles.timePartner]}>
                  {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: ko })}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          placeholder="조용히 편지를 써볼까요..."
          value={text}
          onChangeText={setText}
          multiline
        />
        <Button
          variant="primary"
          disabled={isSending || !text.trim()}
          onPress={handleSend}
        >
          보내기
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.xl
  },
  chatNotice: {
    ...typography.caption,
    color: colors.warmGray400,
    textAlign: 'center',
    marginBottom: spacing.xl
  },
  messageWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    maxWidth: '85%'
  },
  messageWrapperMe: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end'
  },
  messageWrapperPartner: {
    alignSelf: 'flex-start',
    gap: spacing.sm
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.warmGray100,
    marginTop: 4
  },
  bubbleCol: {
    gap: 4
  },
  senderName: {
    ...typography.caption,
    color: colors.ink700,
    fontWeight: 'bold',
    marginLeft: 4
  },
  bubble: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: radii.xl,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 1
  },
  bubbleMe: {
    backgroundColor: colors.lavender50,
    borderBottomRightRadius: radii.sm,
    borderColor: colors.lavender100,
    borderWidth: 1
  },
  bubblePartner: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: radii.sm,
    borderColor: colors.warmGray100,
    borderWidth: 1
  },
  messageText: {
    ...typography.bodyL,
    lineHeight: 24,
    color: colors.ink900
  },
  time: {
    ...typography.caption,
    fontSize: 10,
    color: colors.warmGray400
  },
  timeMe: {
    alignSelf: 'flex-end',
    marginRight: 4
  },
  timePartner: {
    alignSelf: 'flex-start',
    marginLeft: 4
  },
  inputArea: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    borderTopWidth: 1,
    borderTopColor: colors.warmGray100,
    backgroundColor: colors.white,
    alignItems: 'center'
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    borderRadius: radii.lg,
    backgroundColor: colors.cream50,
    paddingHorizontal: spacing.lg,
    paddingTop: 14,
    color: colors.ink900,
    ...typography.bodyM
  },
  sharedPostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.warmGray100
  },
  sharedImage: {
    width: 48,
    height: 48,
    borderRadius: radii.sm
  },
  sharedContent: {
    flex: 1,
    gap: 2
  },
  sharedTitle: {
    ...typography.caption,
    color: colors.lavender500,
    fontWeight: 'bold'
  },
  sharedCaption: {
    ...typography.bodyM,
    color: colors.ink700
  }
});