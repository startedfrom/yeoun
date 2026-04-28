import React, { useRef, useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { View, StyleSheet, Animated, PanResponder, Dimensions, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { radii, colors, spacing } from '@gamdojang/ui';

const { width } = Dimensions.get('window');
const GRID_PADDING = spacing.lg * 2;
const GAP = spacing.md;
const ITEM_WIDTH = (width - GRID_PADDING - GAP) / 2;
const ITEM_HEIGHT = ITEM_WIDTH;
const HERO_WIDTH = width - GRID_PADDING;
const HERO_HEIGHT = ITEM_WIDTH * 1.25;
/** `getPositionForIndex`와 동일한 세로 간격 */
const ROW_STRIDE = ITEM_HEIGHT + GAP + spacing.md;

type PostLite = { postId: string; images: { imageUrl: string }[]; moodTags?: { accentColor?: string }[] };

function getPositionForIndex(index: number) {
  if (index === 0) {
    return { x: 0, y: 0 };
  }
  const innerIdx = index - 1;
  const col = innerIdx % 2;
  const row = Math.floor(innerIdx / 2);
  return {
    x: col * (ITEM_WIDTH + GAP),
    y: HERO_HEIGHT + GAP + row * ROW_STRIDE
  };
}

function indexFromDropPoint(cx: number, cy: number, len: number): number {
  if (len <= 0) return 0;
  if (len === 1) return 0;
  if (cy < HERO_HEIGHT + GAP * 0.35) return 0;
  const innerY = cy - (HERO_HEIGHT + GAP);
  const row = Math.max(0, Math.floor(innerY / ROW_STRIDE));
  const col = cx < ITEM_WIDTH + GAP * 0.5 ? 0 : 1;
  const idx = 1 + row * 2 + col;
  return Math.max(0, Math.min(len - 1, idx));
}

export function DraggablePostGrid({ posts: initialPosts }: { posts: PostLite[] }) {
  const router = useRouter();
  const [posts, setPosts] = useState<PostLite[]>(initialPosts);
  const postsRef = useRef(posts);
  postsRef.current = posts;

  const initialSigRef = useRef<string>('');
  useEffect(() => {
    const sig = initialPosts.map((p) => p.postId).join('|');
    if (sig !== initialSigRef.current) {
      initialSigRef.current = sig;
      setPosts(initialPosts);
    }
  }, [initialPosts]);

  const animByPostId = useRef(
    new Map<string, { pos: Animated.ValueXY; scale: Animated.Value }>()
  );

  const ensureAnim = useCallback((postId: string) => {
    let entry = animByPostId.current.get(postId);
    if (!entry) {
      entry = {
        pos: new Animated.ValueXY({ x: 0, y: 0 }),
        scale: new Animated.Value(1)
      };
      animByPostId.current.set(postId, entry);
    }
    return entry;
  }, []);

  const [activePostId, setActivePostId] = useState<string | null>(null);
  const dragOriginRef = useRef({ x: 0, y: 0 });
  const dragSizeRef = useRef({ w: ITEM_WIDTH, h: ITEM_HEIGHT });

  /** 슬롯 좌표 동기화: 드래그 중인 카드만 손 좌표 유지, 나머지는 격자에 고정 */
  useLayoutEffect(() => {
    if (activePostId) {
      posts.forEach((p, idx) => {
        if (p.postId === activePostId) return;
        ensureAnim(p.postId).pos.setValue(getPositionForIndex(idx));
      });
      return;
    }
    posts.forEach((p, idx) => {
      ensureAnim(p.postId).pos.setValue(getPositionForIndex(idx));
    });
  }, [posts, activePostId, ensureAnim]);

  const moveToIndex = useCallback((fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return;
    setPosts((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, item);
      return arr;
    });
  }, []);

  const panResponders = useRef(new Map<string, ReturnType<typeof PanResponder.create>>());

  const getPanResponder = useCallback(
    (postId: string) => {
      let created = panResponders.current.get(postId);
      if (created) return created;

      created = PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 || Math.abs(g.dy) > 8,
        onPanResponderGrant: () => {
          const idx = postsRef.current.findIndex((p) => p.postId === postId);
          if (idx < 0) return;
          setActivePostId(postId);
          const pos = getPositionForIndex(idx);
          dragOriginRef.current = { x: pos.x, y: pos.y };
          dragSizeRef.current =
            idx === 0 ? { w: HERO_WIDTH, h: HERO_HEIGHT } : { w: ITEM_WIDTH, h: ITEM_HEIGHT };

          const { pos: animPos, scale } = ensureAnim(postId);
          animPos.setOffset({ x: pos.x, y: pos.y });
          animPos.setValue({ x: 0, y: 0 });
          Animated.spring(scale, { toValue: 1.04, useNativeDriver: false, friction: 6 }).start();
        },
        onPanResponderMove: (_, g) => {
          const { pos: animPos } = ensureAnim(postId);
          animPos.setValue({ x: g.dx, y: g.dy });
        },
        onPanResponderRelease: (_, g) => {
          const idx = postsRef.current.findIndex((p) => p.postId === postId);
          if (idx < 0) {
            setActivePostId(null);
            return;
          }
          const { x: ox, y: oy } = dragOriginRef.current;
          const { w, h } = dragSizeRef.current;
          const left = ox + g.dx;
          const top = oy + g.dy;
          const cx = left + w / 2;
          const cy = top + h / 2;
          const targetIdx = indexFromDropPoint(cx, cy, postsRef.current.length);

          const { pos: animPos, scale } = ensureAnim(postId);
          animPos.flattenOffset();
          Animated.spring(scale, { toValue: 1, useNativeDriver: false, friction: 6 }).start();

          if (targetIdx !== idx) {
            moveToIndex(idx, targetIdx);
          }
          setActivePostId(null);
        },
        onPanResponderTerminate: (_, g) => {
          const idx = postsRef.current.findIndex((p) => p.postId === postId);
          const { pos: animPos, scale } = ensureAnim(postId);
          animPos.flattenOffset();
          Animated.spring(scale, { toValue: 1, useNativeDriver: false, friction: 6 }).start();
          if (idx >= 0) {
            const { x: ox, y: oy } = dragOriginRef.current;
            const { w, h } = dragSizeRef.current;
            const dx = g?.dx ?? 0;
            const dy = g?.dy ?? 0;
            const cx = ox + dx + w / 2;
            const cy = oy + dy + h / 2;
            const targetIdx = indexFromDropPoint(cx, cy, postsRef.current.length);
            if (targetIdx !== idx) moveToIndex(idx, targetIdx);
          }
          setActivePostId(null);
        }
      });
      panResponders.current.set(postId, created);
      return created;
    },
    [ensureAnim, moveToIndex]
  );

  const containerHeight =
    posts.length > 0 ? HERO_HEIGHT + GAP + Math.ceil((posts.length - 1) / 2) * ROW_STRIDE : 0;

  return (
    <View style={[styles.gridContainer, { height: containerHeight }]}>
      {posts.map((post, idx) => {
        const { pos, scale } = ensureAnim(post.postId);
        const isHero = idx === 0;
        const responder = getPanResponder(post.postId);

        return (
          <Animated.View
            key={post.postId}
            style={[
              styles.gridItem,
              {
                zIndex: activePostId === post.postId ? 50 : 1,
                width: isHero ? HERO_WIDTH : ITEM_WIDTH,
                height: isHero ? HERO_HEIGHT : ITEM_HEIGHT,
                transform: [...pos.getTranslateTransform(), { scale }]
              }
            ]}
            {...responder.panHandlers}
          >
            <View style={{ flex: 1 }}>
              <Pressable
                onPress={() => router.push(`/post/${post.postId}`)}
                disabled={activePostId === post.postId}
                style={{ flex: 1 }}
              >
                <View style={styles.imageWrapper}>
                  <Image source={{ uri: post.images[0].imageUrl }} style={styles.gridImage} />
                  <View
                    style={[
                      styles.moodBar,
                      { backgroundColor: post.moodTags?.[0]?.accentColor || colors.lavender400 }
                    ]}
                  />
                </View>
              </Pressable>
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    width: width - GRID_PADDING,
    alignSelf: 'center',
    position: 'relative'
  },
  gridItem: {
    position: 'absolute',
    overflow: 'hidden'
  },
  imageWrapper: {
    flex: 1,
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.warmGray100,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)'
  },
  gridImage: {
    width: '100%',
    height: '100%'
  },
  moodBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    opacity: 0.8
  }
});
