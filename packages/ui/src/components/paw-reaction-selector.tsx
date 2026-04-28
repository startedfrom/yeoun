import { useCallback, useEffect, useRef, useState } from 'react';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { Image, Pressable, StyleSheet, Text, View, Animated, type ImageSourcePropType } from 'react-native';
import {
  PAW_LABELS,
  formatAverageMood,
  getPawLabelFromAverage,
  getPawScoreFromAverage,
  type PawScore,
  type ReactionSummary,
} from '@gamdojang/domain';

import { PAW_IMAGES } from '../paw-images';
import { safeHapticImpact, safeHapticSelection } from '../safe-haptics';
import { colors, spacing, typography } from '../tokens';

export type PawReactionSelectorProps = {
  summary: ReactionSummary;
  onChange?: (score: PawScore) => void;
  precision?: 1 | 2;
  /** 좁은 열에서 `flex-end`일 때 첫 발(슬쩍)이 잘리는 것을 막기 위해 사용 */
  stripAlign?: 'leading' | 'trailing';
  /** 값이 바뀔 때마다(보통 1씩 증가) 접힌 상태에서 발 선택 스트립을 펼침 */
  requestExpandNonce?: number;
  /** false면 접힌 필은 렌더하지 않음 — 외부(레일 등)에서만 펼칠 때 */
  showCollapsedTrigger?: boolean;
};

const PAW_SCORES: PawScore[] = [1, 2, 3, 4, 5];
const AUTO_COLLAPSE_MS = 4000;
const POST_SELECT_COLLAPSE_DELAY_MS = 150;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/* ── PawButton: extracted to fix useRef-inside-.map() hook violation ── */

type PawButtonProps = {
  score: PawScore;
  selected: boolean;
  entranceAnim: Animated.Value;
  onSelect: (score: PawScore) => void;
};

function PawButton({ score, selected, entranceAnim, onSelect }: PawButtonProps) {
  const pressScale = useRef(new Animated.Value(1)).current;
  const label = PAW_LABELS[score];

  return (
    <AnimatedPressable
      onPressIn={() => {
        safeHapticSelection();
        Animated.spring(pressScale, {
          toValue: 0.82,
          useNativeDriver: true,
          friction: 5,
        }).start();
      }}
      onPressOut={() => {
        Animated.spring(pressScale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 5,
        }).start();
      }}
      onPress={() => onSelect(score)}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${label} 선택`}
      style={[
        styles.pawButton,
        selected && styles.pawButtonSelected,
        {
          opacity: entranceAnim,
          transform: [{ scale: Animated.multiply(entranceAnim, pressScale) }],
        },
      ]}
    >
      <Image
        source={PAW_IMAGES[score] as ImageSourcePropType}
        style={styles.pawImage}
        resizeMode="contain"
      />
      <Text style={[styles.pawLabel, selected && styles.pawLabelSelected]} numberOfLines={1}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

/* ── Main selector ── */

export function PawReactionSelector({
  summary,
  precision = 1,
  onChange,
  stripAlign = 'trailing',
  requestExpandNonce,
  showCollapsedTrigger = true,
}: PawReactionSelectorProps) {
  const stripSelfAlign =
    stripAlign === 'leading' ? ('flex-start' as const) : ('flex-end' as const);
  const [expanded, setExpanded] = useState(false);
  const selectedScore = summary.myScore;
  const averageScoreText = formatAverageMood(summary.averageScore, precision);
  const averageGradeLabel = getPawLabelFromAverage(summary.averageScore);
  const averageGradePawScore = getPawScoreFromAverage(summary.averageScore);

  const triggerScale = useRef(new Animated.Value(1)).current;
  const entranceAnims = useRef(PAW_SCORES.map(() => new Animated.Value(0))).current;
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const postSelectDelayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (collapseTimer.current) {
      clearTimeout(collapseTimer.current);
      collapseTimer.current = null;
    }
    if (postSelectDelayTimer.current) {
      clearTimeout(postSelectDelayTimer.current);
      postSelectDelayTimer.current = null;
    }
  }, []);

  const collapse = useCallback(() => {
    clearTimer();
    Animated.stagger(
      30,
      [...entranceAnims].reverse().map((anim) =>
        Animated.timing(anim, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        })
      )
    ).start(() => setExpanded(false));
  }, [clearTimer, entranceAnims]);

  const expand = useCallback(() => {
    setExpanded(true);
    entranceAnims.forEach((a) => a.setValue(0));

    Animated.stagger(
      50,
      entranceAnims.map((anim) =>
        Animated.spring(anim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 15,
        })
      )
    ).start();

    clearTimer();
    collapseTimer.current = setTimeout(collapse, AUTO_COLLAPSE_MS);
  }, [entranceAnims, clearTimer, collapse]);

  const lastExternalExpandRef = useRef(0);
  useEffect(() => {
    if (requestExpandNonce === undefined || requestExpandNonce < 1) return;
    if (requestExpandNonce <= lastExternalExpandRef.current) return;
    lastExternalExpandRef.current = requestExpandNonce;
    if (expanded) {
      clearTimer();
      collapseTimer.current = setTimeout(collapse, AUTO_COLLAPSE_MS);
      return;
    }
    safeHapticImpact(ImpactFeedbackStyle.Light);
    expand();
  }, [requestExpandNonce, expanded, expand, clearTimer, collapse]);

  useEffect(() => clearTimer, [clearTimer]);

  const handleSelect = useCallback(
    (score: PawScore) => {
      safeHapticImpact(ImpactFeedbackStyle.Medium);
      onChange?.(score);
      clearTimer();
      postSelectDelayTimer.current = setTimeout(() => {
        postSelectDelayTimer.current = null;
        Animated.stagger(
          30,
          [...entranceAnims].reverse().map((anim) =>
            Animated.timing(anim, {
              toValue: 0,
              duration: 100,
              useNativeDriver: true,
            })
          )
        ).start(() => setExpanded(false));
      }, POST_SELECT_COLLAPSE_DELAY_MS);
    },
    [onChange, clearTimer, entranceAnims]
  );

  /* ── Expanded: inline 5-paw row ── */

  if (expanded) {
    /* View only: outer Pressable would render as <button> on web and nest PawButtons (invalid DOM). */
    return (
      <View style={styles.expandedOuter}>
        <View style={styles.expandedRow}>
          {PAW_SCORES.map((score, i) => (
            <PawButton
              key={score}
              score={score}
              selected={selectedScore === score}
              entranceAnim={entranceAnims[i]}
              onSelect={handleSelect}
            />
          ))}
        </View>
      </View>
    );
  }

  /* ── Collapsed: trigger pill (또는 숨김) ── */

  if (!showCollapsedTrigger) {
    return <View />;
  }

  return (
    <AnimatedPressable
      style={[
        styles.triggerContainer,
        { alignSelf: stripSelfAlign, transform: [{ scale: triggerScale }] },
      ]}
      onPress={() => {
        safeHapticImpact(ImpactFeedbackStyle.Light);
        expand();
      }}
      onPressIn={() => {
        Animated.spring(triggerScale, {
          toValue: 0.95,
          useNativeDriver: true,
          friction: 6,
        }).start();
      }}
      onPressOut={() => {
        Animated.spring(triggerScale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 6,
        }).start();
      }}
      accessibilityRole="button"
      accessibilityLabel={
        selectedScore
          ? summary.reactionsCount > 0
            ? `여운: ${PAW_LABELS[selectedScore]}, 평균 ${averageGradeLabel} ${averageScoreText}점`
            : `여운: ${PAW_LABELS[selectedScore]}`
          : summary.reactionsCount > 0
            ? `여운 남기기, 평균 ${averageGradeLabel} ${averageScoreText}점`
            : '여운 남기기'
      }
    >
      <View style={styles.triggerLeft}>
        {selectedScore ? (
          <Image
            source={PAW_IMAGES[selectedScore] as ImageSourcePropType}
            style={styles.triggerImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.triggerEmptyPaw} />
        )}
        <Text style={styles.triggerText}>
          {selectedScore ? PAW_LABELS[selectedScore] : '여운 남기기'}
        </Text>
      </View>
      {summary.reactionsCount > 0 ? (
        <View style={styles.triggerMetrics} accessibilityRole="text" accessibilityLabel={`평균 ${averageGradeLabel} ${averageScoreText}점`}>
          <Image
            accessible={false}
            source={PAW_IMAGES[averageGradePawScore] as ImageSourcePropType}
            style={styles.triggerMetricGradePaw}
            resizeMode="contain"
          />
          <Text style={styles.triggerMetricDot}>·</Text>
          <Text style={styles.triggerMetricScore} numberOfLines={1}>
            {averageScoreText}점
          </Text>
        </View>
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  /* ── Trigger (collapsed pill) ── */
  triggerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    minHeight: 44,
    borderRadius: 0,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.lavender400,
    maxWidth: '100%',
  },
  triggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
    minWidth: 0,
  },
  triggerImage: {
    width: 24,
    height: 24,
  },
  triggerEmptyPaw: {
    width: 24,
    height: 24,
    borderRadius: 0,
    borderWidth: 2,
    borderColor: colors.ink200,
    borderStyle: 'solid',
  },
  triggerText: {
    ...typography.bodyM,
    fontFamily: 'DungGeunMo',
    color: colors.lavender400,
  },
  triggerMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 5,
    paddingLeft: spacing.md,
    marginLeft: spacing.xs,
    borderLeftWidth: 1,
    borderLeftColor: colors.ink200,
  },
  triggerMetricGradePaw: {
    width: 22,
    height: 22,
  },
  triggerMetricDot: {
    ...typography.bodyM,
    fontFamily: 'DungGeunMo',
    color: colors.warmGray400,
    marginTop: -1,
  },
  triggerMetricScore: {
    ...typography.bodyS,
    fontFamily: 'DungGeunMo',
    color: colors.ink700,
    fontWeight: '600',
  },

  /** 좁은 열(조각찾기 2열 등)에서 한 줄 5칸이 옆 열로 넘치지 않게 전체 너비 + 줄바꿈 */
  expandedOuter: {
    alignSelf: 'stretch',
    width: '100%',
  },
  expandedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'stretch',
    justifyContent: 'center',
    alignSelf: 'stretch',
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 0,
    borderWidth: 2,
    borderColor: colors.lavender400,
  },

  /* ── Individual paw button ── */
  pawButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: 4,
    borderRadius: 0,
    flexBasis: '32%',
    flexGrow: 1,
    minWidth: 0,
    maxWidth: '34%',
    minHeight: 48,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderRightColor: colors.ink100,
    borderBottomColor: colors.ink100,
  },
  pawButtonSelected: {
    backgroundColor: colors.lavender400,
  },
  pawImage: {
    width: 28,
    height: 28,
    marginBottom: 2,
  },
  pawLabel: {
    ...typography.reaction,
    fontFamily: 'DungGeunMo',
    color: colors.ink700,
    opacity: 0.7,
  },
  pawLabelSelected: {
    opacity: 1,
    color: colors.white,
  },
});
