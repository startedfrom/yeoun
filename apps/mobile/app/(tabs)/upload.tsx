import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Pressable, StyleSheet, Text, TextInput, View, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { z } from 'zod';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

import {
  AppHeader,
  Button,
  Screen,
  TagChip,
  colors,
  radii,
  spacing,
  typography,
  PixelIcon
} from '@gamdojang/ui';

import { useMoodTags } from '../../src/hooks/use-mood-tags';
import { useCreatePost } from '../../src/hooks/use-posts';

const uploadSchema = z.object({
  postType: z.enum(['regular', 'chalna']),
  images: z.array(
    z.object({
      imageUrl: z.string(),
      width: z.number(),
      height: z.number()
    })
  ).min(1, '현상할 사진을 최소 1장 골라주세요.'),
  caption: z.string().min(1, '이 순간의 무드를 짧게라도 남겨주세요.'),
  visibility: z.enum(['public', 'followers_only', 'private']),
  moodTagIds: z.array(z.string()).min(1, '어떤 무드인지 태그를 골라주세요.'),
  expiresInHours: z.union([z.literal('1'), z.literal('2'), z.literal('3'), z.literal('6')]).optional()
});

type UploadValues = z.infer<typeof uploadSchema>;

/** 기록 남기기 추천 해시 — API 시드 slug 순서 (없으면 이름으로 더미 표시, 제출 시 서버가 이름→태그 해석) */
const UPLOAD_STICKER_SLUGS = [
  'daily-look',
  'today-coordi',
  'ootd-ko',
  'ootd',
  'womens-coordi',
  'vintage-look',
  'mood-coordi',
  'effortless-chic',
  'casual-look',
  'layered-look',
  'knit-coordi',
  'fall-coordi'
] as const;

const FALLBACK_BY_SLUG: Record<(typeof UPLOAD_STICKER_SLUGS)[number], { name: string; accentColor: string }> = {
  'daily-look': { name: '데일리룩', accentColor: '#B995FF' },
  'today-coordi': { name: '오늘의코디', accentColor: '#8DC8FF' },
  'ootd-ko': { name: '오오티디', accentColor: '#FFE9A8' },
  ootd: { name: 'ootd', accentColor: '#FFBEDB' },
  'womens-coordi': { name: '여자코디', accentColor: '#BDF5DA' },
  'vintage-look': { name: '빈티지룩', accentColor: '#FFC9A8' },
  'mood-coordi': { name: '감성코디', accentColor: '#FFD6B0' },
  'effortless-chic': { name: '꾸안꾸룩', accentColor: '#C4D4F5' },
  'casual-look': { name: '캐주얼룩', accentColor: '#E8B4D4' },
  'layered-look': { name: '레이어드룩', accentColor: '#A8D5E2' },
  'knit-coordi': { name: '니트코디', accentColor: '#D4A574' },
  'fall-coordi': { name: '가을코디', accentColor: '#C17B5B' }
};

type StickerTag = {
  id: string;
  name: string;
  slug: string;
  accentColor: string;
};

export default function UploadTabRoute() {
  const router = useRouter();
  const { data = [] } = useMoodTags();
  const stickerTags = useMemo((): StickerTag[] => {
    const bySlug = new Map(data.map((t) => [t.slug, t]));
    return UPLOAD_STICKER_SLUGS.map((slug) => {
      const api = bySlug.get(slug);
      if (api) {
        return {
          id: api.id,
          name: api.name,
          slug: api.slug,
          accentColor: api.accentColor ?? colors.lavender300
        };
      }
      const fb = FALLBACK_BY_SLUG[slug];
      return {
        id: fb.name,
        name: fb.name,
        slug,
        accentColor: fb.accentColor
      };
    });
  }, [data]);
  const { mutateAsync: createPost } = useCreatePost();
  const [customTagInput, setCustomTagInput] = useState('');
  const [contentType, setContentType] = useState<'ootd' | 'taste'>('ootd');

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<UploadValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      postType: 'regular',
      images: [],
      caption: '',
      visibility: 'public',
      moodTagIds: [],
      expiresInHours: '1'
    }
  });

  const postType = watch('postType');
  const visibility = watch('visibility');
  const images = watch('images');
  const moodTagIds = watch('moodTagIds');

  const pickImage = async () => {
    const maxSelections = postType === 'chalna' ? 1 : 4;
    if (images.length >= maxSelections) {
      Alert.alert('사진 한도 초과', `최대 ${maxSelections}장까지만 담을 수 있어요.`);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: postType === 'regular',
      selectionLimit: maxSelections - images.length,
      quality: 0.8
    });

    if (!result.canceled) {
      const newImages = result.assets.map(asset => ({
        imageUrl: asset.uri,
        width: asset.width,
        height: asset.height
      }));
      setValue('images', [...images, ...newImages].slice(0, maxSelections), { shouldValidate: true });
    }
  };

  const removeImage = (index: number) => {
    setValue('images', images.filter((_, i) => i !== index), { shouldValidate: true });
  };

  const toggleTag = (id: string) => {
    if (moodTagIds.includes(id)) {
      setValue('moodTagIds', moodTagIds.filter((t) => t !== id), { shouldValidate: true });
    } else {
      setValue('moodTagIds', [...moodTagIds, id], { shouldValidate: true });
    }
  };

  const addCustomTag = () => {
    const cleanTag = customTagInput.trim().replace(/^#/, '');
    if (cleanTag && !moodTagIds.includes(cleanTag)) {
      setValue('moodTagIds', [...moodTagIds, cleanTag], { shouldValidate: true });
    }
    setCustomTagInput('');
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createPost({
        postType: values.postType,
        images: values.images,
        caption: values.caption,
        visibility: values.visibility,
        moodTagIds: values.moodTagIds,
        expiresInHours: values.postType === 'chalna' ? Number(values.expiresInHours) as 1 | 2 | 3 | 6 : undefined
      });
      Alert.alert('현상 완료', '무드가 담긴 사진이 기록되었습니다.');
      router.replace('/(tabs)');
    } catch {
      Alert.alert('기록 실패', '앗, 다이어리에 남기지 못했어요. 다시 시도해 주세요.');
    }
  });

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.cream50 }}
    >
      <Screen 
        scroll={false} 
        header={
          <AppHeader 
            title="기록 남기기" 
          />
        }
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* 1. Type Selection: Tab-like visual */}
          <View style={styles.typeSelector}>
            {[
              { label: '일반 기록', value: 'regular' as const, desc: '오래오래 보관되는 조각' },
              { label: '찰나', value: 'chalna' as const, desc: '잠시 머물다 사라지는 조각' }
            ].map((option) => {
              const isActive = postType === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    setValue('postType', option.value, { shouldValidate: true });
                    if (option.value === 'chalna' && images.length > 1) {
                      setValue('images', [images[0]], { shouldValidate: true });
                    }
                  }}
                  style={[styles.typeCard, isActive && styles.typeCardActive]}
                >
                  <Text style={[styles.typeLabel, isActive && styles.typeLabelActive]}>
                    {option.label}
                  </Text>
                  <Text style={[styles.typeDesc, isActive && styles.typeDescActive]}>
                    {option.desc}
                  </Text>
                  {isActive && <View style={styles.activeIndicator} />}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.formPaper}>
            {/* Content Ratio Switch */}
            <View style={styles.fieldSection}>
              <Text style={styles.paperLabel}>어떤 기록인가요?</Text>
              <View style={styles.pillRow}>
                <Pressable
                  onPress={() => setContentType('ootd')}
                  style={[styles.pill, contentType === 'ootd' && styles.pillActive]}
                >
                  <Text style={[styles.pillText, contentType === 'ootd' && styles.pillTextActive]}>
                    나의 조각
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setContentType('taste')}
                  style={[styles.pill, contentType === 'taste' && styles.pillActive]}
                >
                  <Text style={[styles.pillText, contentType === 'taste' && styles.pillTextActive]}>
                    취향 조각
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Photo Attachment (Polaroid style) */}
            <View style={styles.fieldSection}>
              <View style={styles.labelRow}>
                <Text style={styles.paperLabel}>업로드할 사진</Text>
                <Text style={styles.paperCount}>({images.length}/{postType === 'chalna' ? 1 : 4})</Text>
              </View>
              
              <View style={styles.photoFilm}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoScroll}>
                  {images.map((img, index) => (
                    <View
                      key={index}
                      style={[
                        styles.polaroidFrame,
                        postType === 'chalna' && styles.polaroidChalnaFrame
                      ]}
                    >
                      <Image source={{ uri: img.imageUrl }} style={styles.polaroidImage} />
                      {postType === 'chalna' && (
                        <View style={styles.polaroidChalnaBadge}>
                          <Text style={styles.polaroidChalnaBadgeText}>찰나</Text>
                        </View>
                      )}
                      <Pressable style={styles.removePolaroidBtn} onPress={() => removeImage(index)}>
                        <PixelIcon name="close" size={12} color={colors.white} />
                      </Pressable>
                    </View>
                  ))}
                  {(images.length < (postType === 'chalna' ? 1 : 4)) && (
                    <Pressable style={styles.addPhotoBtn} onPress={pickImage}>
                      <PixelIcon name="upload" size={24} color={colors.lavender500} />
                      <Text style={styles.addPhotoText}>사진 고르기</Text>
                    </Pressable>
                  )}
                </ScrollView>
              </View>
              {errors.images?.message && <Text style={styles.errorText}>{errors.images.message}</Text>}
            </View>

            {/* Text Input (Notebook style) */}
            <Controller
              control={control}
              name="caption"
              render={({ field: { onBlur, onChange, value } }) => (
                <View style={[styles.fieldSection, styles.notebookSection]}>
                  <Text style={styles.paperLabel}>어떤 해시인가요?</Text>
                  <TextInput
                    multiline
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder={
                      postType === 'chalna'
                        ? '당신의 취향을 보여주세요'
                        : '사진에 담긴 오늘의 조각을 기록해주세요...'
                    }
                    placeholderTextColor={colors.warmGray400}
                    style={styles.notebookInput}
                    value={value}
                  />
                  {errors.caption?.message && <Text style={styles.errorText}>{errors.caption.message}</Text>}
                </View>
              )}
            />

            {/* Mood Tags (Sticker style) */}
            <View style={styles.fieldSection}>
              <Text style={styles.paperLabel}>해시 스티커</Text>
              
              <View style={styles.customTagInputRow}>
                <TextInput
                  style={styles.customTagInput}
                  placeholder="새로운 해시태그 직접 입력..."
                  placeholderTextColor={colors.warmGray400}
                  value={customTagInput}
                  onChangeText={setCustomTagInput}
                  onSubmitEditing={addCustomTag}
                  returnKeyType="done"
                />
                <Pressable style={styles.addTagBtn} onPress={addCustomTag}>
                  <Text style={styles.addTagBtnText}>추가</Text>
                </Pressable>
              </View>

              <View style={styles.stickerWrap}>
                {stickerTags.map((tag) => {
                  const selected = moodTagIds.includes(tag.id);
                  return (
                    <Pressable
                      key={tag.id}
                      onPress={() => toggleTag(tag.id)}
                      style={[
                        styles.sticker,
                        selected && { backgroundColor: tag.accentColor, borderColor: tag.accentColor }
                      ]}
                    >
                      <Text style={[styles.stickerText, selected && styles.stickerTextSelected]}>
                        #{tag.name}
                      </Text>
                    </Pressable>
                  );
                })}
                {moodTagIds
                  .filter((id) => !stickerTags.some((t) => t.id === id))
                  .map((customTag) => (
                  <Pressable
                    key={`custom-${customTag}`}
                    onPress={() => toggleTag(customTag)}
                    style={[styles.sticker, { backgroundColor: colors.lavender50, borderColor: colors.lavender400 }]}
                  >
                    <Text style={[styles.stickerText, styles.stickerTextSelected]}>
                      #{customTag}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {errors.moodTagIds?.message && <Text style={styles.errorText}>{errors.moodTagIds.message}</Text>}
            </View>

            {/* Visibility & Time Options */}
            <View style={styles.optionsRow}>
              <View style={styles.optionGroup}>
                <Text style={styles.paperLabelSmall}>공개 범위</Text>
                <View style={styles.pillRow}>
                  {[
                    { label: '전체', value: 'public' as const },
                    { label: '팔로워', value: 'followers_only' as const },
                    { label: '나만', value: 'private' as const }
                  ].map((option) => (
                    <Pressable
                      key={option.value}
                      onPress={() => setValue('visibility', option.value, { shouldValidate: true })}
                      style={[styles.pill, visibility === option.value && styles.pillActive]}
                    >
                      <Text style={[styles.pillText, visibility === option.value && styles.pillTextActive]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {postType === 'chalna' && (
                <Controller
                  control={control}
                  name="expiresInHours"
                  render={({ field: { value } }) => (
                    <View style={styles.optionGroup}>
                      <Text style={styles.paperLabelSmall}>찰나 시간</Text>
                      <View style={styles.pillRow}>
                        {(['1', '2', '3', '6'] as const).map((hour) => (
                          <Pressable
                            key={hour}
                            onPress={() => setValue('expiresInHours', hour, { shouldValidate: true })}
                            style={[styles.pill, value === hour && styles.pillActive]}
                          >
                            <Text style={[styles.pillText, value === hour && styles.pillTextActive]}>
                              {hour}H
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  )}
                />
              )}
            </View>

          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button disabled={isSubmitting} onPress={onSubmit} size="large">
            조각 남기기
          </Button>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg
  },
  typeSelector: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md
  },
  typeCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.warmGray200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
    position: 'relative',
    overflow: 'hidden'
  },
  typeCardActive: {
    borderColor: colors.lavender300,
    backgroundColor: colors.lavender50,
    transform: [{ translateY: -2 }],
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  typeLabel: {
    ...typography.headingM,
    color: colors.ink700,
    marginBottom: 4
  },
  typeLabelActive: {
    color: colors.lavender500,
    fontWeight: 'bold'
  },
  typeDesc: {
    ...typography.caption,
    color: colors.warmGray400
  },
  typeDescActive: {
    color: colors.ink700
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: colors.lavender500
  },
  formPaper: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing.xl,
    gap: spacing.xxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.warmGray100
  },
  fieldSection: {
    gap: spacing.sm
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs
  },
  paperLabel: {
    ...typography.headingS,
    color: colors.ink900,
    fontFamily: 'DungGeunMo'
  },
  paperLabelSmall: {
    ...typography.bodyM,
    color: colors.ink900,
    fontWeight: 'bold',
    marginBottom: spacing.xs
  },
  paperCount: {
    ...typography.caption,
    color: colors.lavender500,
    fontWeight: 'bold'
  },
  photoFilm: {
    marginHorizontal: -spacing.xl, // Bleed out of the paper slightly
  },
  photoScroll: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    paddingVertical: spacing.sm
  },
  polaroidFrame: {
    width: 140,
    height: 160,
    backgroundColor: colors.white,
    padding: 8,
    paddingBottom: 24, // thicker bottom like a polaroid
    borderRadius: radii.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative'
  },
  polaroidChalnaFrame: {
    borderWidth: 2,
    borderColor: colors.lavender400,
    shadowColor: colors.lavender500,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5
  },
  polaroidChalnaBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: colors.lavender500,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.xs
  },
  polaroidChalnaBadgeText: {
    ...typography.caption,
    fontFamily: 'DungGeunMo',
    color: colors.white,
    fontSize: 9
  },
  polaroidImage: {
    flex: 1,
    backgroundColor: colors.warmGray100,
    borderRadius: radii.xs
  },
  removePolaroidBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.ink900,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white
  },
  addPhotoBtn: {
    width: 140,
    height: 160,
    backgroundColor: colors.lavender50,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.lavender300,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm
  },
  addPhotoText: {
    ...typography.caption,
    color: colors.lavender500
  },
  notebookSection: {
    backgroundColor: colors.cream50,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.warmGray100
  },
  notebookInput: {
    ...typography.bodyL,
    color: colors.ink900,
    minHeight: 120,
    lineHeight: 28,
    textAlignVertical: 'top'
  },
  stickerWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md
  },
  sticker: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.warmGray200,
    borderRadius: radii.sm,
    borderStyle: 'dashed'
  },
  stickerText: {
    ...typography.bodyM,
    color: colors.warmGray500,
    fontWeight: 'bold'
  },
  stickerTextSelected: {
    color: colors.ink900,
    opacity: 0.9
  },
  customTagInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs
  },
  customTagInput: {
    flex: 1,
    height: 48,
    borderWidth: 2,
    borderColor: colors.lavender400,
    borderRadius: 0,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    ...typography.bodyL,
    fontFamily: 'DungGeunMo',
    color: colors.ink900
  },
  addTagBtn: {
    height: 48,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.lavender300,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 0,
    borderWidth: 2,
    borderColor: colors.lavender400
  },
  addTagBtnText: {
    ...typography.bodyM,
    fontFamily: 'DungGeunMo',
    color: colors.ink900
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.warmGray100
  },
  optionGroup: {
    flex: 1,
    minWidth: 140
  },
  pillRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    backgroundColor: colors.warmGray100,
    padding: 4,
    borderRadius: radii.pill
  },
  pill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: radii.pill
  },
  pillActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1
  },
  pillText: {
    ...typography.caption,
    color: colors.warmGray500,
    fontWeight: '600'
  },
  pillTextActive: {
    color: colors.ink900
  },
  errorText: {
    ...typography.caption,
    color: colors.pink500,
    marginTop: 4
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    backgroundColor: colors.cream50
  }
});