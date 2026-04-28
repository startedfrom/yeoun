import { Stack, useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, StyleSheet, Text, View, Pressable, Image } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

import {
  AppHeader,
  Screen,
  colors,
  radii,
  spacing,
  typography,
  PixelIcon
} from '@gamdojang/ui';
import { useNotifications, useReadAllNotifications, useReadNotification } from '../../src/hooks/use-notifications';

export default function NotificationsRoute() {
  const router = useRouter();
  const { data: notifData, isLoading } = useNotifications();
  const { mutate: readNotif } = useReadNotification();
  const { mutate: readAll } = useReadAllNotifications();

  const notifications = notifData?.pages.flatMap(p => p.items) || [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePress = (notif: any) => {
    if (!notif.isRead) {
      readNotif(notif.id);
    }
    // Simple routing based on type
    if (notif.type === 'post_reaction' || notif.type === 'post_comment') {
       // Could route to post if we had postId in DTO, for now just simple read
    } else if (notif.type === 'message_received' || notif.type === 'message_request') {
      router.push('/(tabs)/mailbox');
    }
  };

  const getIconForType = (type: string) => {
    switch(type) {
      case 'post_reaction': return 'mood-card';
      case 'post_comment': return 'comment';
      case 'message_received':
      case 'message_request': return 'mailbox';
      default: return 'bell';
    }
  };

  return (
    <Screen 
      scroll={false}
      header={
        <>
          <Stack.Screen options={{ title: '알림' }} />
          <AppHeader 
            title="다정한 소식" 
            subtitle="내 해시카드에 도착한 소식들"
            onBack={() => router.back()} 
            rightSlot={
              <Pressable onPress={() => readAll()} style={styles.readAllBtn}>
                <Text style={styles.readAllText}>모두 읽음</Text>
              </Pressable>
            }
          />
        </>
      }
    >
      <View style={styles.container}>
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.lavender500} style={{ marginTop: 100 }} />
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Image 
              source={require('../../../../assets/notification_empty_transparent.png')} 
              style={styles.emptyImage} 
              resizeMode="contain" 
            />
            <Text style={styles.emptyText}>아직 도착한 소식이 없어요.</Text>
            <Text style={styles.emptySubText}>산책(탐색)하며 먼저 발자국을 남겨볼까요?</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => {
              return (
                <Pressable 
                  style={styles.ticketWrapper}
                  onPress={() => handlePress(item)}
                >
                  <View style={[styles.ticket, !item.isRead && styles.ticketUnread]}>
                    {/* Decorative Top Edge */}
                    <View style={styles.ticketTopEdge} />
                    
                    <View style={styles.ticketContent}>
                      <View style={styles.iconCircle}>
                        <PixelIcon 
                          name={getIconForType(item.type)} 
                          size={16} 
                          color={!item.isRead ? colors.pink500 : colors.warmGray400} 
                        />
                      </View>
                      
                      <View style={styles.textContainer}>
                        <Text style={[styles.title, !item.isRead && styles.titleUnread]}>
                          {item.title}
                        </Text>
                        <Text style={styles.body}>{item.body}</Text>
                        <View style={styles.metaRow}>
                          <Text style={styles.time}>
                            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: ko })}
                          </Text>
                          {!item.isRead && (
                            <View style={styles.unreadStamp}>
                              <Text style={styles.unreadStampText}>NEW</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>

                    {/* Decorative Bottom Edge */}
                    <View style={styles.ticketBottomEdge} />
                  </View>
                </Pressable>
              );
            }}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream50, // Warm background to contrast the white tickets
    marginHorizontal: -spacing.lg, // Extend background full width
    paddingHorizontal: spacing.lg,
  },
  readAllBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.warmGray200,
  },
  readAllText: {
    ...typography.caption,
    color: colors.ink700,
    fontWeight: 'bold'
  },
  list: {
    gap: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 120
  },
  ticketWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  ticket: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.warmGray200,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    position: 'relative',
    overflow: 'hidden'
  },
  ticketUnread: {
    backgroundColor: colors.lavender50,
    borderColor: colors.lavender200,
  },
  ticketTopEdge: {
    position: 'absolute',
    top: -4,
    left: 0,
    right: 0,
    height: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmGray200,
    borderStyle: 'dashed',
    opacity: 0.5
  },
  ticketBottomEdge: {
    position: 'absolute',
    bottom: -4,
    left: 0,
    right: 0,
    height: 8,
    borderTopWidth: 1,
    borderTopColor: colors.warmGray200,
    borderStyle: 'dashed',
    opacity: 0.5
  },
  ticketContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.warmGray200,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2
  },
  textContainer: {
    flex: 1,
    gap: 4
  },
  title: {
    ...typography.bodyM,
    fontWeight: '600',
    color: colors.ink900
  },
  titleUnread: {
    color: colors.lavender500,
    fontWeight: 'bold'
  },
  body: {
    ...typography.bodyM,
    color: colors.ink700,
    lineHeight: 22
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs
  },
  time: {
    ...typography.caption,
    color: colors.warmGray400
  },
  unreadStamp: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: colors.pink500,
    borderRadius: radii.pill,
  },
  unreadStampText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.white,
    fontFamily: 'DungGeunMo',
    letterSpacing: 1
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
    gap: spacing.sm
  },
  emptyImage: {
    width: 140,
    height: 140,
    opacity: 0.9,
    marginBottom: spacing.md
  },
  emptyText: {
    ...typography.bodyL,
    color: colors.ink900,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  emptySubText: {
    ...typography.bodyM,
    color: colors.warmGray400,
    textAlign: 'center'
  }
});