/**
 * HolographicCard
 *
 * 평균 감도(averagePawScore)에 따라 등급이 달라지는 수집형 카드. (젤리 문구·바: ≥4.5)
 * - 등급별 배경 패턴 (View + 이모지/텍스트 기반)
 * - idle shimmer 루프 애니메이션 (Animated + opacity/position)
 * - 드래그 → 광원 위치 실시간 반응
 *
 * 의존성: react-native 기본 (Animated, PanResponder)만 사용
 */

import type { PawScore } from '@gamdojang/domain';
import React, { useRef, useCallback, useEffect } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  Image,
  type ViewStyle,
} from 'react-native';

import { CARD_PAW_IMAGES, colors, radii, spacing, typography } from '@gamdojang/ui';

export type PawGrade = '슬쩍' | '콕' | '꾹' | '폭닥' | '젤리';

/** 등급 문구·바 세그먼트용 (배지 왼쪽 PNG는 `hashCardBadgePawScore`와 별도) */
export function getGrade(avg: number): PawGrade {
  if (!Number.isFinite(avg)) return '슬쩍';
  if (avg >= 4.5) return '젤리';
  if (avg >= 4.0) return '폭닥';
  if (avg >= 3.0) return '꾹';
  if (avg >= 2.0) return '콕';
  return '슬쩍';
}

/** 해시카드 배지 PNG 단계: 젤리 4.5~5 완화, 3≤x<4는 슬쩍(1) 이미지. 그 외는 0 → 문구만 */
export function hashCardBadgePawScore(avg: number): 0 | PawScore {
  if (!Number.isFinite(avg)) return 0;
  const a = avg;
  if (a >= 4.5) return 5;
  if (a >= 4.0 && a < 4.5) return 4;
  if (a >= 3 && a < 4) return 1;
  if (a >= 2.5 && a < 3) return 3;
  if (a >= 2 && a < 2.5) return 2;
  if (a >= 1 && a < 2) return 1;
  return 0;
}

type GradeMeta = {
  paws: number;
  shimmerColor: string;
  shimmerOpacityMax: number;
  patternChar: string | null;
  patternCharColor: string;
  borderColor: string;
  glowColor: string;
  hint: string; // 등급 마이크로카피
  image: any;
};

export const GRADE_META: Record<PawGrade, GradeMeta> = {
  슬쩍: {
    paws: 1,
    shimmerColor: 'transparent',
    shimmerOpacityMax: 0,
    patternChar: null,
    patternCharColor: 'transparent',
    borderColor: colors.warmGray200,
    glowColor: 'transparent',
    hint: '여운을 받으면 감도가 쌓여요 🐾',
    image: CARD_PAW_IMAGES[1],
  },
  콕: {
    paws: 2,
    shimmerColor: colors.lavender300,
    shimmerOpacityMax: 0.28,
    patternChar: '·',
    patternCharColor: colors.lavender400,
    borderColor: colors.lavender300,
    glowColor: colors.lavender200,
    hint: '여운이 스밀수록 등급이 올라요 🐾🐾',
    image: CARD_PAW_IMAGES[2],
  },
  꾹: {
    paws: 3,
    shimmerColor: colors.lavender400,
    shimmerOpacityMax: 0.45,
    patternChar: '✦',
    patternCharColor: colors.lavender400,
    borderColor: colors.lavender400,
    glowColor: colors.lavender300,
    hint: '무드가 보라빛으로 빛나고 있어요 🐾🐾🐾',
    image: CARD_PAW_IMAGES[3],
  },
  폭닥: {
    paws: 4,
    shimmerColor: colors.sky400,
    shimmerOpacityMax: 0.55,
    patternChar: '★',
    patternCharColor: colors.lavender500,
    borderColor: colors.lavender500,
    glowColor: colors.lavender400,
    hint: '묵직한 여운으로 주변에 스며들어요 🐾🐾',
    image: CARD_PAW_IMAGES[4],
  },
  젤리: {
    paws: 5,
    shimmerColor: colors.pink300,
    shimmerOpacityMax: 0.7,
    patternChar: '✦',
    patternCharColor: colors.pink400,
    borderColor: colors.lavender500,
    glowColor: colors.lavender400,
    hint: '',
    image: CARD_PAW_IMAGES[5],
  },
};

// ─────────────────────────────────────────────
// Background Pattern (순수 View/Text 기반)
// ─────────────────────────────────────────────

function GradePattern({ grade }: { grade: PawGrade }) {
  const meta = GRADE_META[grade];
  if (!meta.patternChar) return null;

  // 카드 위에 깔리는 텍스트 패턴 행렬
  const rows = 5;
  const cols = 9;

  return (
    <View style={patternStyles.container} pointerEvents="none">
      {Array.from({ length: rows }).map((_, row) => (
        <View key={row} style={patternStyles.row}>
          {Array.from({ length: cols }).map((_, col) => {
            // 체크보드 식으로 일부만 보임 (너무 빽빽하지 않게)
            const show = (row + col) % 2 === 0;
            return (
              <Text
                key={col}
                style={[
                  patternStyles.char,
                  {
                    color: show ? meta.patternCharColor : 'transparent',
                    opacity: grade === '젤리'
                      ? (show ? 0.22 : 0)
                      : grade === '폭닥'
                      ? (show ? 0.16 : 0)
                      : (show ? 0.12 : 0),
                    fontSize: grade === '꾹' || grade === '젤리' ? 10 : 12,
                  },
                ]}
              >
                {meta.patternChar}
              </Text>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const patternStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'column',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 8,
    overflow: 'hidden',
    borderRadius: radii.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  char: {
    fontFamily: 'DungGeunMo',
    fontWeight: '700',
  },
});

// ─────────────────────────────────────────────
// Shimmer Layer (두 개의 Animated.View — X/Y로 이동)
// ─────────────────────────────────────────────

function ShimmerLayer({
  grade,
  shimmerX,
  shimmerY,
  shimmerOpacity,
}: {
  grade: PawGrade;
  shimmerX: Animated.Value;
  shimmerY: Animated.Value;
  shimmerOpacity: Animated.Value;
}) {
  const meta = GRADE_META[grade];
  if (meta.shimmerOpacityMax === 0) return null;

  // 젤리 등급은 shimmer가 2개 (레인보우 효과)
  const layers = grade === '젤리'
    ? [
        { color: colors.lavender300, offset: { x: 0, y: 0 } },
        { color: colors.pink300, offset: { x: 20, y: -20 } },
        { color: colors.sky300, offset: { x: -20, y: 20 } },
      ]
    : [{ color: meta.shimmerColor, offset: { x: 0, y: 0 } }];

  return (
    <>
      {layers.map((layer, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={[
            shimmerStyles.blob,
            {
              backgroundColor: layer.color,
              opacity: shimmerOpacity,
              transform: [
                {
                  translateX: Animated.add(shimmerX, new Animated.Value(layer.offset.x)),
                },
                {
                  translateY: Animated.add(shimmerY, new Animated.Value(layer.offset.y)),
                },
              ],
            },
          ]}
        />
      ))}
    </>
  );
}

const shimmerStyles = StyleSheet.create({
  blob: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    // blur 효과 대신 큰 반투명 원으로 광원 표현
  },
});

// ─────────────────────────────────────────────
// Paw Grade Badge
// ─────────────────────────────────────────────

function PawGradeBadge({ grade, avgScore }: { grade: PawGrade; avgScore: number }) {
  const meta = GRADE_META[grade];
  const isElite = grade === '젤리' || grade === '폭닥';
  const badgePaw = hashCardBadgePawScore(avgScore);
  const avgLabel = Number.isFinite(avgScore) ? `${avgScore.toFixed(1)}발` : '—';

  const RAINBOW_BAR_COLORS = [
    colors.pink300,
    colors.butter300,
    colors.mint300,
    colors.sky300,
    colors.lavender300,
  ];

  // Dynamic Pokdak styling
  let customStyle: any = null;
  if (grade === '폭닥') {
    if (Number.isFinite(avgScore) && avgScore.toFixed(1) === '4.6') {
      customStyle = {
        backgroundColor: colors.lavender50,
        borderColor: colors.lavender300,
      };
    } else {
      customStyle = {
        backgroundColor: colors.lavender50,
        borderColor: colors.lavender400,
      };
    }
  }

  return (
    <View style={badgeStyles.container}>
      <View style={[
        badgeStyles.inner, 
        isElite && badgeStyles.innerElite,
        customStyle
      ]}>
        {badgePaw === 0 ? (
          <Text
            style={badgeStyles.badgePawPlaceholder}
            numberOfLines={2}
            accessibilityLabel="감도 구간 없음, 조각을 올려 확인"
          >
            조각을 올려 확인
          </Text>
        ) : (
          <Image
            source={CARD_PAW_IMAGES[badgePaw]}
            style={{ width: 18, height: 18, marginRight: 6 }}
            resizeMode="contain"
            accessibilityLabel={`${grade} 등급 발바닥`}
          />
        )}
        <View style={badgeStyles.pawsContainer}>
          {[1, 2, 3, 4, 5].map((p, i) => {
            const isActive = p <= meta.paws;
            return (
              <View
                key={p}
                style={[
                  badgeStyles.barSegment,
                  { 
                    backgroundColor: isActive ? RAINBOW_BAR_COLORS[i] : colors.warmGray200,
                    opacity: isActive ? 1 : 0.3
                  }
                ]}
              />
            );
          })}
        </View>
        <View style={badgeStyles.textCol}>
          <Text style={[
            badgeStyles.gradeName, 
            isElite && badgeStyles.gradeNameElite,
            grade === '폭닥' && avgScore < 4.5 && { color: colors.lavender400 }
          ]}>
            {grade} 등급
          </Text>
          <Text style={badgeStyles.avgScore}>평균 감도 {avgLabel}</Text>
        </View>
      </View>
      {meta.hint ? <Text style={badgeStyles.hint}>{meta.hint}</Text> : null}
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: 8,
    alignItems: 'flex-end',
    gap: 4,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.xs,
    backgroundColor: colors.lavender50,
    borderWidth: 1,
    borderColor: colors.lavender200,
  },
  innerElite: {
    backgroundColor: colors.lavender100,
    borderColor: colors.lavender400,
  },
  pawsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  barSegment: {
    width: 22,
    height: 8,
    borderRadius: 1,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  textCol: {
    gap: 1,
  },
  gradeName: {
    ...typography.caption,
    fontFamily: 'DungGeunMo',
    color: colors.lavender500,
    fontWeight: '700',
  },
  gradeNameElite: {
    color: colors.lavender500,
  },
  avgScore: {
    ...typography.caption,
    fontFamily: 'DungGeunMo',
    color: colors.warmGray400,
    fontSize: 10,
  },
  hint: {
    ...typography.caption,
    fontFamily: 'DungGeunMo',
    color: colors.warmGray400,
    fontSize: 11,
    textAlign: 'right',
  },
  badgePawPlaceholder: {
    ...typography.caption,
    fontFamily: 'DungGeunMo',
    fontSize: 9,
    lineHeight: 12,
    color: colors.warmGray400,
    maxWidth: 76,
    marginRight: 4,
  },
});

// ─────────────────────────────────────────────
// Main: HolographicCard
// ─────────────────────────────────────────────

type HolographicCardProps = {
  accentColor: string;
  averagePawScore: number;
  user: { nickname: string; profileImageUrl: string };
  bio?: string;
  representativeMoodTags: { id: string; name: string; accentColor: string }[];
  followersCount: number;
  receivedReactionsCount: number;
  style?: ViewStyle;
  onEditPress?: () => void;
};

export function HolographicCard({
  accentColor,
  averagePawScore,
  user,
  bio,
  representativeMoodTags,
  followersCount,
  receivedReactionsCount,
  style,
  onEditPress,
}: HolographicCardProps) {
  const grade = getGrade(averagePawScore);
  const meta = GRADE_META[grade];

  // Measured card dims
  const cardDims = useRef({ width: 0, height: 0 });

  // Shimmer state — X/Y offset from center (-80 to +80), opacity
  const shimmerX = useRef(new Animated.Value(0)).current;
  const shimmerY = useRef(new Animated.Value(0)).current;
  const shimmerOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(1)).current;

  // ── Idle loop ──
  const idleLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  const startIdleLoop = useCallback(() => {
    if (meta.shimmerOpacityMax === 0) return;
    idleLoopRef.current?.stop();
    // idle 강도: max의 85% (기존 65% → 강화)
    const idleMax = meta.shimmerOpacityMax * 0.85;

    idleLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(shimmerX, { toValue: 70, duration: 2000, useNativeDriver: true }),
          Animated.timing(shimmerY, { toValue: -50, duration: 2000, useNativeDriver: true }),
          Animated.timing(shimmerOpacity, { toValue: idleMax, duration: 800, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(shimmerX, { toValue: -70, duration: 2000, useNativeDriver: true }),
          Animated.timing(shimmerY, { toValue: 50, duration: 2000, useNativeDriver: true }),
          Animated.timing(shimmerOpacity, { toValue: idleMax * 0.5, duration: 800, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(shimmerX, { toValue: 0, duration: 1600, useNativeDriver: true }),
          Animated.timing(shimmerY, { toValue: 0, duration: 1600, useNativeDriver: true }),
          Animated.timing(shimmerOpacity, { toValue: idleMax * 0.8, duration: 700, useNativeDriver: true }),
        ]),
      ])
    );
    idleLoopRef.current.start();
  }, [grade]);

  const stopIdleLoop = useCallback(() => {
    idleLoopRef.current?.stop();
  }, []);

  useEffect(() => {
    startIdleLoop();
    return () => stopIdleLoop();
  }, [startIdleLoop, stopIdleLoop]);

  // ── PanResponder ──
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => meta.shimmerOpacityMax > 0,
      onMoveShouldSetPanResponder: () => meta.shimmerOpacityMax > 0,

      onPanResponderGrant: () => {
        stopIdleLoop();
        Animated.spring(cardScale, { toValue: 0.972, useNativeDriver: true, friction: 8 }).start();
      },

      onPanResponderMove: (_, gs) => {
        const clampedX = Math.max(-90, Math.min(90, gs.dx));
        const clampedY = Math.max(-60, Math.min(60, gs.dy));
        shimmerX.setValue(clampedX);
        shimmerY.setValue(clampedY);
        shimmerOpacity.setValue(meta.shimmerOpacityMax);
      },

      onPanResponderRelease: () => {
        Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
        Animated.parallel([
          Animated.spring(shimmerX, { toValue: 0, useNativeDriver: true, friction: 5 }),
          Animated.spring(shimmerY, { toValue: 0, useNativeDriver: true, friction: 5 }),
        ]).start(() => startIdleLoop());
      },
    })
  ).current;

  // Entrance animation + 1회 demo sweep (어포던스)
  const entranceY = useRef(new Animated.Value(24)).current;
  const entranceOpacity = useRef(new Animated.Value(0)).current;
  // 힌트 텍스트 opacity (demo 후 fade out)
  const hintOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. 카드 진입
    Animated.parallel([
      Animated.spring(entranceY, { toValue: 0, useNativeDriver: true, friction: 7, tension: 50 }),
      Animated.timing(entranceOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      if (meta.shimmerOpacityMax === 0) return;

      // 2. 힌트 텍스트 fade in
      Animated.timing(hintOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();

      // 3. 자동 demo sweep: 좌→우→중앙 (1회)
      stopIdleLoop();
      shimmerOpacity.setValue(meta.shimmerOpacityMax * 0.9);
      Animated.sequence([
        Animated.parallel([
          Animated.timing(shimmerX, { toValue: -80, duration: 600, useNativeDriver: true }),
          Animated.timing(shimmerY, { toValue: -30, duration: 600, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(shimmerX, { toValue: 80, duration: 700, useNativeDriver: true }),
          Animated.timing(shimmerY, { toValue: 30, duration: 700, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(shimmerX, { toValue: 0, duration: 500, useNativeDriver: true }),
          Animated.timing(shimmerY, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]),
      ]).start(() => {
        // 힌트 3초 후 fade out
        setTimeout(() => {
          Animated.timing(hintOpacity, { toValue: 0, duration: 600, useNativeDriver: true }).start();
        }, 3000);
        startIdleLoop();
      });
    });
  }, []);

  return (
    <Animated.View
      style={[
        cardWrapStyles.wrapper,
        style,
        { opacity: entranceOpacity, transform: [{ translateY: entranceY }] },
      ]}
    >
      {/* Glow halo behind the card */}
      {meta.shimmerOpacityMax > 0 && (
        <View
          style={[
            cardWrapStyles.glow,
            {
              shadowColor: meta.glowColor,
              shadowOpacity: grade === '젤리' ? 0.7 : 0.4,
              shadowRadius: grade === '젤리' ? 28 : 16,
            },
          ]}
        />
      )}

      <Animated.View
        style={[
          cardWrapStyles.card,
          {
            backgroundColor: accentColor,
            borderColor: meta.borderColor,
            transform: [{ scale: cardScale }],
          },
        ]}
        onLayout={(e) => {
          cardDims.current = {
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height,
          };
        }}
        {...panResponder.panHandlers}
      >
        {/* Background pattern */}
        <GradePattern grade={grade} />

        {/* Card inner glass surface */}
        <View style={cardWrapStyles.inner}>
          {/* 카드 상단 반짝임 하이라이트 선 */}
          <View style={cardWrapStyles.edgeHighlight} />
          
          {/* Header */}
          <View style={cardWrapStyles.header}>
            <View style={[cardWrapStyles.avatarRing, { borderColor: accentColor }]}>
              <Image
                key={user.profileImageUrl}
                source={{ uri: user.profileImageUrl }}
                style={cardWrapStyles.avatar}
              />
            </View>
            <View style={cardWrapStyles.titleArea}>
              <Text style={cardWrapStyles.nickname} numberOfLines={1}>
                {user.nickname}
              </Text>
              {bio ? (
                <Text style={cardWrapStyles.bio} numberOfLines={5}>
                  {bio}
                </Text>
              ) : null}
            </View>
            {/* 카드 교을 값 편집 버튼 */}
            {onEditPress && (
              <Pressable
                onPress={onEditPress}
                style={cardWrapStyles.editBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={cardWrapStyles.editBtnText}>✎</Text>
              </Pressable>
            )}
          </View>

          {/* Mood tags */}
          {representativeMoodTags.length > 0 && (
            <View style={cardWrapStyles.tagRow}>
              {representativeMoodTags.slice(0, 4).map((tag) => (
                <View
                  key={tag.id}
                  style={[cardWrapStyles.tag, { backgroundColor: tag.accentColor + '28' }]}
                >
                  <Text style={[cardWrapStyles.tagText, { color: tag.accentColor }]}>
                    #{tag.name}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Stats */}
          <View style={cardWrapStyles.statsRow}>
            <View style={cardWrapStyles.statItem}>
              <Text style={cardWrapStyles.statVal}>{followersCount}</Text>
              <Text style={cardWrapStyles.statLabel}>팔로워</Text>
            </View>
            <View style={cardWrapStyles.statDivider} />
            <View style={cardWrapStyles.statItem}>
              <Text style={cardWrapStyles.statVal}>{receivedReactionsCount}</Text>
              <Text style={cardWrapStyles.statLabel}>받은 여운</Text>
            </View>
          </View>
        </View>

        {/* Shimmer light blob */}
        <ShimmerLayer
          grade={grade}
          shimmerX={shimmerX}
          shimmerY={shimmerY}
          shimmerOpacity={shimmerOpacity}
        />
      </Animated.View>

      {/* Grade badge + hint */}
      <PawGradeBadge grade={grade} avgScore={averagePawScore} />

      {/* 드래그 힌트 텍스트 (1회 데모 후 fade out) */}
      {meta.shimmerOpacityMax > 0 && (
        <Animated.Text
          style={[
            hintStyles.text,
            { opacity: hintOpacity },
          ]}
        >
          ✦ 카드를 드래그해봐요
        </Animated.Text>
      )}
    </Animated.View>
  );
}

const cardWrapStyles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  glow: {
    position: 'absolute',
    top: 10,
    left: spacing.lg + 4,
    right: spacing.lg + 4,
    bottom: 30,
    borderRadius: radii.xl,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  card: {
    marginHorizontal: spacing.lg,
    aspectRatio: 1.72,
    borderRadius: radii.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.4)', // 투명하게 변경
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  inner: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  edgeHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  avatarRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2.5,
    padding: 2,
    backgroundColor: colors.white,
  },
  editBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  editBtnText: {
    fontSize: 14,
    color: colors.lavender500,
    fontFamily: 'DungGeunMo',
    lineHeight: 18,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    backgroundColor: colors.warmGray100,
  },
  titleArea: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  nickname: {
    ...typography.headingM,
    fontFamily: 'DungGeunMo',
    color: colors.ink800,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bio: {
    ...typography.caption,
    fontFamily: 'DungGeunMo',
    color: colors.warmGray600,
    lineHeight: 18,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.xs,
  },
  tagText: {
    ...typography.caption,
    fontFamily: 'DungGeunMo',
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  statVal: {
    ...typography.bodyM,
    fontFamily: 'DungGeunMo',
    color: colors.ink900,
    fontWeight: '700',
  },
  statLabel: {
    ...typography.caption,
    fontFamily: 'DungGeunMo',
    color: colors.warmGray400,
  },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
});

const hintStyles = StyleSheet.create({
  text: {
    ...typography.caption,
    fontFamily: 'DungGeunMo',
    color: colors.lavender400,
    textAlign: 'center',
    paddingTop: 6,
    paddingBottom: 2,
    letterSpacing: 0.5,
  },
});
