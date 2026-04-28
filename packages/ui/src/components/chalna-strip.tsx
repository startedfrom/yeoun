import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useState } from 'react';

import {
  type ChalnaCardModel,
  chalnaSecondsRemainingFromExpiry,
  isChalnaLiveByExpiresAt,
} from '@gamdojang/domain';

import { colors, radii, shadows, spacing, typography } from '../tokens';

type ChalnaStripProps = {
  items: ChalnaCardModel[];
  onPressItem?: (postId: string) => void;
};

function formatRemaining(seconds: number) {
  if (seconds <= 0) return '0M';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `-${hours}H`;
  return `-${mins}M`;
}

function ChalnaItem({ item, onPressItem }: { item: ChalnaCardModel; onPressItem?: (postId: string) => void }) {
  const remaining = chalnaSecondsRemainingFromExpiry(item.expiresAt);

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={`찰나 ${item.author.nickname}, 게시물 열기`}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPressItem?.(item.postId);
      }}
      style={styles.card}
    >
      {/* 1. Header Strip - Expiration Warning */}
      <View style={[styles.headerStrip, item.hasUnread && styles.headerStripUnread]}>
        <Text style={[styles.remainingText, item.hasUnread && styles.remainingTextUnread]}>
          EXPIRES {formatRemaining(remaining)}
        </Text>
      </View>

      {/* 2. Photo Content */}
      <View style={styles.imageFrame}>
        <Image source={{ uri: item.thumbnailImageUrl }} style={styles.image} />
      </View>

      {/* 3. Footer with Nickname */}
      <View style={styles.footerStrip}>
        <Text numberOfLines={1} style={styles.nickname}>
          @{item.author.nickname}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export function ChalnaStrip({ items, onPressItem }: ChalnaStripProps) {
  const [wave, setWave] = useState(0);
  const liveItems = useMemo(
    () => items.filter((c) => isChalnaLiveByExpiresAt(c.expiresAt)),
    [items, wave]
  );

  useEffect(() => {
    if (items.length === 0) return;
    const id = setInterval(() => setWave((w) => w + 1), 1000);
    return () => clearInterval(id);
  }, [items]);

  if (liveItems.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      keyboardShouldPersistTaps="always"
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {liveItems.map((item) => (
        <ChalnaItem key={item.postId} item={item} onPressItem={onPressItem} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  card: {
    width: 96,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.lavender400,
    borderRadius: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  headerStrip: {
    backgroundColor: colors.warmGray200,
    borderBottomWidth: 2,
    borderBottomColor: colors.lavender400,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerStripUnread: {
    backgroundColor: colors.lavender400,
  },
  remainingText: {
    ...typography.caption,
    fontFamily: 'DungGeunMo',
    color: colors.lavender400,
  },
  remainingTextUnread: {
    color: colors.white,
  },
  imageFrame: {
    width: '100%',
    aspectRatio: 1,
    borderBottomWidth: 2,
    borderBottomColor: colors.lavender400,
    backgroundColor: colors.ink100,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  footerStrip: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    backgroundColor: colors.white,
  },
  nickname: {
    ...typography.caption,
    fontFamily: 'DungGeunMo',
    color: colors.ink900,
    textAlign: 'center',
  }
});
