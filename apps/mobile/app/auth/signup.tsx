import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, StyleSheet, Text, TextInput, View, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { z } from 'zod';

import {
  Button,
  Screen,
  colors,
  radii,
  spacing,
  typography,
  TagChip
} from '@gamdojang/ui';

import { signup } from '../../src/lib/api';
import { useSessionStore } from '../../src/store/session-store';
import { useMoodTags } from '../../src/hooks/use-mood-tags';

const signupSchema = z.object({
  email: z.string().email('이메일 형식을 확인해 주세요.'),
  password: z.string().min(4, '비밀번호는 4자 이상이어야 해요.'),
  nickname: z.string().min(2, '닉네임은 2자 이상이어야 해요.').max(30),
  bio: z.string().max(160, '소개는 160자 이하로 써 주세요.').optional()
});

type SignupValues = z.infer<typeof signupSchema>;

export default function SignupRoute() {
  const router = useRouter();
  const { tags } = useLocalSearchParams<{ tags?: string }>();
  const signIn = useSessionStore((state) => state.signIn);
  const { data: availableTags = [] } = useMoodTags();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedTags, setSelectedTags] = useState<string[]>(tags ? JSON.parse(tags) : []);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      nickname: '',
      bio: '레전드 피곤'
    }
  });

  const toggleTag = (id: string) => {
    setSelectedTags(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const onSubmit = handleSubmit(async (data) => {
    if (step === 1) {
      setStep(2);
      return;
    }

    if (selectedTags.length === 0) {
      Alert.alert('앗!', 'YEO:UN 세계에서 쓸 취향 태그를 최소 1개 이상 골라주세요.');
      return;
    }

    try {
      const res = await signup({
        ...data,
        interest_mood_tag_ids: selectedTags
      });
      await signIn(res.access_token, res.refresh_token);
      Alert.alert('발급 완료', '나만의 해시카드가 준비됐어요. YEO:UN 세계로 들어갈까요?');
      router.replace('/(tabs)');
    } catch {
      Alert.alert('가입 실패', '다시 시도해 주세요.');
    }
  });

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <Screen scroll={true}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {step === 1 ? '첫 해시카드를 발급합니다' : '당신의 해시태그를 고르세요'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 1 
              ? '오직 당신만의 해시카드를 만들어드려요!' 
              : '시스템에 등록될 첫 취향 태그들을 선택해 주세요.'}
          </Text>
        </View>

        {step === 1 ? (
          <View style={styles.cardContainer}>
            <View style={styles.formCard}>
              <Controller
                control={control}
                name="email"
                render={({ field: { onBlur, onChange, value } }) => (
                  <Field
                    error={errors.email?.message}
                    label="이메일"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="user@example.com"
                    value={value}
                  />
                )}
              />
              <Controller
                control={control}
                name="password"
                render={({ field: { onBlur, onChange, value } }) => (
                  <Field
                    error={errors.password?.message}
                    label="비밀번호"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="4자 이상"
                    secureTextEntry
                    value={value}
                  />
                )}
              />
              <Controller
                control={control}
                name="nickname"
                render={({ field: { onBlur, onChange, value } }) => (
                  <Field
                    error={errors.nickname?.message}
                    label="닉네임"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="도트감성"
                    value={value}
                  />
                )}
              />
              <Controller
                control={control}
                name="bio"
                render={({ field: { onBlur, onChange, value } }) => (
                  <Field
                    error={errors.bio?.message}
                    label="한 줄 소개"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="레전드 피곤"
                    value={value ?? ''}
                  />
                )}
              />
            </View>
          </View>
        ) : (
          <View style={styles.stickerBoard}>
            <View style={styles.tagWrap}>
              {availableTags.map((tag) => {
                const selected = selectedTags.includes(tag.id);
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
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <Button disabled={isSubmitting} onPress={onSubmit}>
            {step === 1 ? '다음으로' : '가입하고 시작하기'}
          </Button>
          {step === 2 && (
            <Button variant="ghost" disabled={isSubmitting} onPress={() => setStep(1)}>
              이전으로
            </Button>
          )}
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

type FieldProps = {
  label: string;
  value: string;
  placeholder: string;
  error?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  onBlur: () => void;
};

function Field({
  error,
  label,
  multiline,
  onBlur,
  onChangeText,
  placeholder,
  secureTextEntry,
  value
}: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        multiline={multiline}
        onBlur={onBlur}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.warmGray400}
        secureTextEntry={secureTextEntry}
        style={[styles.input, multiline && styles.multiline]}
        value={value}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
    alignItems: 'center'
  },
  title: {
    ...typography.headingL,
    fontFamily: 'DungGeunMo',
    color: colors.ink900,
    textAlign: 'center'
  },
  subtitle: {
    ...typography.bodyM,
    color: colors.ink700,
    textAlign: 'center'
  },
  cardContainer: {
    paddingHorizontal: spacing.lg
  },
  formCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing.xl,
    gap: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.warmGray100
  },
  field: {
    gap: spacing.xs
  },
  label: {
    ...typography.caption,
    color: colors.warmGray500,
    fontWeight: 'bold'
  },
  input: {
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmGray200,
    color: colors.ink900,
    ...typography.bodyL,
    paddingVertical: spacing.sm
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top'
  },
  error: {
    ...typography.caption,
    color: colors.pink500,
    marginTop: 4
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
    gap: spacing.sm
  },
  stickerBoard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 300
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center'
  },
  sticker: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.warmGray200,
    borderRadius: radii.lg,
    borderStyle: 'dashed',
    
  },
  stickerText: {
    ...typography.bodyL,
    color: colors.warmGray400,
    fontWeight: 'bold'
  },
  stickerTextSelected: {
    color: colors.white
  }
});