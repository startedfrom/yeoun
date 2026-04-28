import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { z } from 'zod';

import {
  AppHeader,
  Button,
  Screen,
  TagChip,
  colors,
  radii,
  spacing,
  typography
} from '@gamdojang/ui';

import { useMoodTags } from '../../../src/hooks/use-mood-tags';
import { usePost, useUpdatePost } from '../../../src/hooks/use-posts';

const editPostSchema = z.object({
  caption: z.string().min(1, '짧은 문구를 남겨 주세요.'),
  visibility: z.enum(['public', 'followers_only', 'private']),
  moodTagIds: z.array(z.string().min(1).max(80)).min(1, '무드 태그를 최소 1개 선택해 주세요.')
});

type EditPostValues = z.infer<typeof editPostSchema>;

export default function EditPostRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: post, isLoading } = usePost(id || '');
  const { mutateAsync: updatePost } = useUpdatePost();
  const { data: tagsData = [] } = useMoodTags();
  const [customTagInput, setCustomTagInput] = useState('');

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<EditPostValues>({
    resolver: zodResolver(editPostSchema),
    defaultValues: {
      caption: '',
      visibility: 'public',
      moodTagIds: []
    }
  });

  useEffect(() => {
    if (post) {
      reset({
        caption: post.caption,
        visibility: post.visibility as EditPostValues['visibility'],
        moodTagIds: post.moodTags?.map((mt: { moodTag: { id: string } }) => mt.moodTag.id) || []
      });
    }
  }, [post, reset]);

  const visibility = watch('visibility');
  const moodTagIds = watch('moodTagIds') || [];

  const toggleTag = (tagId: string) => {
    if (moodTagIds.includes(tagId)) {
      setValue('moodTagIds', moodTagIds.filter((t) => t !== tagId), { shouldValidate: true });
    } else {
      setValue('moodTagIds', [...moodTagIds, tagId], { shouldValidate: true });
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
      if (!id) return;
      await updatePost({ postId: id, data: values });
      Alert.alert('수정 완료', '게시물이 수정되었습니다.');
      router.back();
    } catch {
      Alert.alert('수정 실패', '다시 시도해 주세요.');
    }
  });

  if (isLoading || !post) {
    return (
      <Screen header={<AppHeader onBack={() => router.back()} title="게시물 수정" />}>
        <Text>로딩 중...</Text>
      </Screen>
    );
  }

  return (
    <Screen header={<AppHeader onBack={() => router.back()} title="게시물 수정" />}>
      <View style={styles.page}>
      <Controller
        control={control}
        name="caption"
        render={({ field: { onBlur, onChange, value } }) => (
          <View style={styles.field}>
            <Text style={styles.label}>설명</Text>
            <TextInput
              multiline
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="내용을 입력해 주세요"
              placeholderTextColor={colors.warmGray400}
              style={[styles.input, styles.multiline]}
              value={value}
            />
            {errors.caption?.message ? (
              <Text style={styles.error}>{errors.caption.message}</Text>
            ) : null}
          </View>
        )}
      />

      <View style={styles.field}>
        <Text style={styles.label}>무드 태그</Text>
        <View style={styles.customTagInputRow}>
          <TextInput
            style={styles.customTagInput}
            placeholder="새 해시태그 직접 입력…"
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
        <View style={styles.tagWrap}>
          {tagsData.map((tag) => {
            const selected = moodTagIds.includes(tag.id);
            return (
              <TagChip
                key={tag.id}
                accentColor={tag.accentColor}
                label={tag.name}
                selected={selected}
                onPress={() => toggleTag(tag.id)}
              />
            );
          })}
          {moodTagIds
            .filter((id) => !tagsData.find((t) => t.id === id))
            .map((customTag) => (
              <TagChip
                key={`custom-${customTag}`}
                accentColor={colors.lavender300}
                label={customTag}
                selected
                onPress={() => toggleTag(customTag)}
              />
            ))}
        </View>
        {errors.moodTagIds?.message ? (
          <Text style={styles.error}>{errors.moodTagIds.message}</Text>
        ) : null}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>공개 범위</Text>
        <View style={styles.segmentRow}>
          {[
            { label: '전체 공개', value: 'public' as const },
            { label: '팔로워', value: 'followers_only' as const },
            { label: '나만', value: 'private' as const }
          ].map((option) => (
            <Pressable
              key={option.value}
              onPress={() => setValue('visibility', option.value, { shouldValidate: true })}
              style={[
                styles.segment,
                visibility === option.value && styles.segmentActive
              ]}
            >
              <Text
                style={[
                  styles.segmentLabel,
                  visibility === option.value && styles.segmentLabelActive
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={{ marginTop: spacing.lg }}>
        <Button disabled={isSubmitting} onPress={onSubmit} shape="pixel">
          수정 내용 저장
        </Button>
      </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: spacing.lg
  },
  field: {
    gap: spacing.sm,
    marginTop: spacing.md
  },
  label: {
    ...typography.bodyM,
    color: colors.ink900,
    fontWeight: '600'
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
  input: {
    minHeight: 52,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.warmGray200,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.ink900
  },
  multiline: {
    minHeight: 112,
    textAlignVertical: 'top'
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  error: {
    ...typography.caption,
    color: colors.pink500
  },
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  segment: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.warmGray200
  },
  segmentActive: {
    backgroundColor: colors.lavender100,
    borderColor: colors.lavender300
  },
  segmentLabel: {
    ...typography.bodyM,
    color: colors.ink700
  },
  segmentLabelActive: {
    color: colors.lavender500,
    fontWeight: '700'
  }
});
