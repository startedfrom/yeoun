import { useRouter } from 'expo-router';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  AppHeader,
  Button,
  IconButton,
  Screen,
  SectionTitle,
  colors,
  radii,
  spacing,
  typography
} from '@gamdojang/ui';
import {
  useAcceptMessageRequest,
  useConversations,
  useMessageRequests,
  useRejectMessageRequest
} from '../../src/hooks/use-messages';
import { useNotifications } from '../../src/hooks/use-notifications';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function MailboxTabRoute() {
  const router = useRouter();

  const { data: requestsData, isLoading: reqLoading } = useMessageRequests();
  const { data: convData, isLoading: convLoading } = useConversations();
  const { mutate: acceptRequest, isPending: isAccepting } = useAcceptMessageRequest();
  const { mutate: rejectRequest, isPending: isRejecting } = useRejectMessageRequest();
  
  const { data: notifData } = useNotifications();
  const unreadNotifCount = notifData?.pages[0]?.unreadCount || 0;

  const requests = requestsData?.pages.flatMap(p => p.items) || [];
  const chats = convData?.pages.flatMap(p => p.items) || [];

  const handleAccept = (id: string) => {
    acceptRequest(id, {
      onSuccess: (data) => {
        router.push(`/chat/${data.conversationId}`);
      }
    });
  };

  const handleReject = (id: string) => {
    rejectRequest(id);
  };

  return (
    <Screen 
      header={
        <AppHeader 
          title="편지함" 
          rightSlot={
            <View>
              <IconButton
                name="bell"
                accessibilityLabel="알림"
                onPress={() => router.push('/notifications')}
              />
              {unreadNotifCount > 0 && (
                <View style={styles.badge} />
              )}
            </View>
          }
        />
      }
    >
      {(reqLoading || convLoading) && (
        <ActivityIndicator size="small" color={colors.lavender500} style={{ marginVertical: 20 }} />
      )}

      {requests.length > 0 && (
        <>
          <SectionTitle>메시지 요청함</SectionTitle>
          {requests.map((item) => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.nickname}>{item.fromUser.nickname}</Text>
              <Text style={styles.preview} numberOfLines={2}>
                {item.initialMessage || '새로운 메시지 요청이 있습니다.'}
              </Text>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Button 
                    variant="secondary" 
                    disabled={isRejecting || isAccepting} 
                    onPress={() => handleReject(item.id)}
                  >
                    거절
                  </Button>
                </View>
                <View style={{ flex: 1 }}>
                  <Button 
                    variant="primary"
                    disabled={isRejecting || isAccepting} 
                    onPress={() => handleAccept(item.id)}
                  >
                    수락
                  </Button>
                </View>
              </View>
            </View>
          ))}
        </>
      )}

      <SectionTitle>진행 중인 대화</SectionTitle>
      {chats.length === 0 && !convLoading && (
        <View style={styles.emptyContainer}>
          <Image 
            source={require('../../../../assets/mailbox_empty_transparent.png')} 
            style={styles.emptyImage} 
            resizeMode="contain" 
          />
          <Text style={styles.emptyText}>진행 중인 대화가 없습니다.</Text>
        </View>
      )}
      {chats.map((item) => (
        <Pressable 
          key={item.id} 
          style={styles.card}
          onPress={() => router.push(`/chat/${item.id}`)}
        >
          <View style={styles.chatHeader}>
            <View style={styles.titleRow}>
              <Text style={styles.nickname}>{item.partner.nickname}</Text>
              {item.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{item.unreadCount}</Text>
                </View>
              )}
            </View>
            <Text style={styles.time}>
              {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true, locale: ko })}
            </Text>
          </View>
          <Text style={styles.preview} numberOfLines={1}>{item.preview}</Text>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.warmGray100,
    padding: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
    marginHorizontal: spacing.lg
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  nickname: {
    ...typography.headingM,
    color: colors.ink900
  },
  preview: {
    ...typography.bodyM,
    color: colors.ink700
  },
  time: {
    ...typography.caption,
    color: colors.warmGray400
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 2, // 각진 동글뱅이
    backgroundColor: colors.pink500
  },
  unreadBadge: {
    backgroundColor: colors.lavender500,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm // 각진 동글뱅이
  },
  unreadText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: 'bold'
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md
  },
  emptyImage: {
    width: 120,
    height: 120,
    opacity: 0.8
  },
  emptyText: {
    ...typography.bodyM,
    color: colors.warmGray400,
    textAlign: 'center',
  }
});
