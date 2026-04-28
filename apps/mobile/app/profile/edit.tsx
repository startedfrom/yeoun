import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { z } from 'zod';

import {
  AppHeader,
  Button,
  Screen,
  colors,
  radii,
  spacing,
  typography,
  PixelIcon
} from '@gamdojang/ui';

import { useMyProfile, useUpdateMyProfile } from '../../src/hooks/use-my-profile';

const profileEditSchema = z.object({
  nickname: z.string().min(2, '닉네임은 2자 이상이어야 해요.').max(30),
  bio: z.string().max(160, '소개는 160자 이하로 써 주세요.').nullable().optional(),
  accountVisibility: z.enum(['public', 'private']),
  messagePermission: z.enum(['everyone', 'followers_only', 'following_only', 'nobody']),
  commentPermission: z.string()
});

type ProfileEditValues = z.infer<typeof profileEditSchema>;

export default function ProfileEditRoute() {
  const router = useRouter();
  const { returnTo: returnToParam } = useLocalSearchParams<{ returnTo?: string | string[] }>();
  const returnTo = Array.isArray(returnToParam) ? returnToParam[0] : returnToParam;
  const fromMoodCardTab = returnTo === 'mood-card';
  const { data: profile, isLoading } = useMyProfile();
  const { mutateAsync: updateProfile } = useUpdateMyProfile();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<ProfileEditValues>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      nickname: '',
      bio: '',
      accountVisibility: 'public',
      messagePermission: 'following_only',
      commentPermission: 'everyone'
    }
  });

  const accountVisibility = watch('accountVisibility');
  const messagePermission = watch('messagePermission');

  useEffect(() => {
    if (profile) {
      reset({
        nickname: profile.nickname,
        bio: profile.bio || '',
        accountVisibility: profile.accountVisibility || 'public',
        messagePermission: profile.messagePermission || 'following_only',
        commentPermission: profile.commentPermission || 'everyone'
      });
    }
  }, [profile, reset]);

  const navigateAfterSave = useCallback(() => {
    if (fromMoodCardTab) {
      router.replace('/mood-card');
    } else {
      router.back();
    }
  }, [fromMoodCardTab, router]);

  if (isLoading) {
    return (
      <Screen header={<AppHeader onBack={() => router.back()} title="프로필 편집" />}>
        <ActivityIndicator size="large" color={colors.lavender500} style={{ marginTop: 100 }} />
      </Screen>
    );
  }

  const onSubmit = handleSubmit(async (data) => {
    try {
      await updateProfile(data);
      navigateAfterSave();
    } catch {
      Alert.alert('저장 실패', '명함을 저장하는 중에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.');
    }
  });

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.cream50 }}
    >
      <Screen 
        scroll={false}
        header={<AppHeader onBack={() => router.back()} title="명함 꾸미기" subtitle="나를 표현하는 가장 부드러운 방식" />}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.cardContainer}>
            {/* Top Tape decoration */}
            <View style={styles.tape} />
            
            <View style={styles.formCard}>
              <View style={styles.photoSection}>
                <Image source={{ uri: profile?.profileImageUrl }} style={styles.avatar} />
                <Pressable style={styles.changePhotoBtn}>
                  <PixelIcon name="upload" size={16} color={colors.ink900} />
                  <Text style={styles.changePhotoText}>사진 바꾸기</Text>
                </Pressable>
              </View>

              <Controller
                control={control}
                name="nickname"
                render={({ field: { onBlur, onChange, value } }) => (
                  <View style={styles.field}>
                    <Text style={styles.label}>이름표</Text>
                    <TextInput
                      onBlur={onBlur}
                      onChangeText={onChange}
                      placeholder="닉네임"
                      placeholderTextColor={colors.warmGray400}
                      style={styles.input}
                      value={value}
                    />
                    {errors.nickname?.message ? <Text style={styles.error}>{errors.nickname.message}</Text> : null}
                  </View>
                )}
              />
              
              <Controller
                control={control}
                name="bio"
                render={({ field: { onBlur, onChange, value } }) => (
                  <View style={styles.field}>
                    <Text style={styles.label}>짧은 소개</Text>
                    <TextInput
                      multiline
                      onBlur={onBlur}
                      onChangeText={onChange}
                      placeholder="나의 감도와 무드를 소개해주세요."
                      placeholderTextColor={colors.warmGray400}
                      style={[styles.input, styles.multiline]}
                      value={value ?? ''}
                    />
                    {errors.bio?.message ? <Text style={styles.error}>{errors.bio.message}</Text> : null}
                  </View>
                )}
              />
            </View>
          </View>

          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>해시카드 프라이버시</Text>

            <View style={styles.optionGroup}>
              <Text style={styles.optionLabel}>누구에게 조각을 보여줄까요?</Text>
              <View style={styles.pillRow}>
                {[
                  { label: '모두에게', value: 'public' as const },
                  { label: '비공개', value: 'private' as const }
                ].map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => setValue('accountVisibility', option.value, { shouldValidate: true })}
                    style={[styles.pill, accountVisibility === option.value && styles.pillActive]}
                  >
                    <Text style={[styles.pillText, accountVisibility === option.value && styles.pillTextActive]}>
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.optionGroup}>
              <Text style={styles.optionLabel}>누구의 편지를 받을까요?</Text>
              <View style={styles.pillRowVertical}>
                {[
                  { label: '모두에게 허용', value: 'everyone' as const },
                  { label: '나를 팔로우하는 사람만', value: 'followers_only' as const },
                  { label: '내가 팔로우하는 사람만', value: 'following_only' as const },
                  { label: '편지함 닫아두기', value: 'nobody' as const }
                ].map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => setValue('messagePermission', option.value, { shouldValidate: true })}
                    style={[styles.pillList, messagePermission === option.value && styles.pillListActive]}
                  >
                    <Text style={[styles.pillListText, messagePermission === option.value && styles.pillListTextActive]}>
                      {option.label}
                    </Text>
                    {messagePermission === option.value && (
                      <View style={styles.checkIcon}>
                        <PixelIcon name="home" size={12} color={colors.lavender500} />
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

          </View>
        </ScrollView>

        <View style={styles.submitContainer}>
          <Button disabled={isSubmitting} onPress={onSubmit} size="large">
            이대로 간직하기
          </Button>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 100,
    gap: spacing.xl
  },
  cardContainer: {
    alignItems: 'center',
    position: 'relative'
  },
  tape: {
    position: 'absolute',
    top: -12,
    zIndex: 10,
    width: 80,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)'
  },
  formCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.xl,
    gap: spacing.xl,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.warmGray100,
    
  },
  photoSection: {
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmGray100,
    borderStyle: 'dashed'
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.warmGray100,
    borderWidth: 2,
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: colors.cream50,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.warmGray200
  },
  changePhotoText: {
    ...typography.caption,
    color: colors.ink900,
    fontWeight: 'bold'
  },
  field: {
    gap: spacing.sm
  },
  label: {
    ...typography.bodyM,
    color: colors.ink900,
    fontFamily: 'DungGeunMo'
  },
  input: {
    minHeight: 48,
    borderRadius: radii.md,
    backgroundColor: colors.cream50,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: spacing.md,
    color: colors.ink900,
    ...typography.bodyM
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: spacing.md
  },
  error: {
    ...typography.caption,
    color: colors.pink500,
    marginTop: 4
  },
  settingsSection: {
    gap: spacing.lg,
    paddingHorizontal: spacing.sm
  },
  sectionTitle: {
    ...typography.headingM,
    color: colors.ink900,
    marginBottom: spacing.xs
  },
  optionGroup: {
    gap: spacing.md,
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.warmGray200,
    borderStyle: 'dashed'
  },
  optionLabel: {
    ...typography.bodyM,
    color: colors.warmGray500,
    fontWeight: 'bold'
  },
  pillRow: {
    flexDirection: 'row',
    backgroundColor: colors.cream50,
    padding: 4,
    borderRadius: radii.pill
  },
  pill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: radii.pill
  },
  pillActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
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
  pillRowVertical: {
    gap: spacing.xs
  },
  pillList: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
    backgroundColor: colors.cream50
  },
  pillListActive: {
    backgroundColor: colors.lavender50,
    borderWidth: 1,
    borderColor: colors.lavender200
  },
  pillListText: {
    ...typography.bodyM,
    color: colors.ink700
  },
  pillListTextActive: {
    color: colors.lavender500,
    fontWeight: 'bold'
  },
  checkIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  submitContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    backgroundColor: colors.cream50,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.03)'
  }
});