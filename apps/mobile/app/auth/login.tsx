import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, TextInput, View, Image } from 'react-native';
import { z } from 'zod';

import {
  Button,
  Screen,
  SectionTitle,
  colors,
  radii,
  spacing,
  typography
} from '@gamdojang/ui';

import { login } from '../../src/lib/api';
import { useSessionStore } from '../../src/store/session-store';

const loginSchema = z.object({
  email: z.string().email('이메일 형식을 확인해 주세요.'),
  password: z.string().min(4, '비밀번호는 4자 이상이어야 해요.')
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginRoute() {
  const router = useRouter();
  const signIn = useSessionStore((state) => state.signIn);
  const [authError, setAuthError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'cloud@test.com',
      password: '0000'
    }
  });

  const onSubmit = handleSubmit(async (data) => {
    setAuthError(null);
    try {
      const res = await login(data);
      await signIn(res.access_token, res.refresh_token);
      router.replace('/(tabs)');
    } catch {
      setAuthError('이메일과 비밀번호를 확인해 주세요.');
    }
  });

  return (
    <Screen>
      <View style={styles.headerContainer}>
        <Image 
          source={require('../../../../assets/jelly_mascot_transparent.png')} 
          style={styles.mascot} 
          resizeMode="contain" 
        />
        <SectionTitle>다시 와줘서 반가워요</SectionTitle>
        <Text style={styles.description}>이메일로 돌아오실 수 있어요.</Text>
      </View>

      <View style={styles.form}>
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
      </View>

      {authError ? <Text style={styles.authError}>{authError}</Text> : null}

      <Button disabled={isSubmitting} onPress={onSubmit}>
        로그인
      </Button>
      <Button onPress={() => router.push('/auth/signup')} variant="ghost">
        회원가입으로 가기
      </Button>
    </Screen>
  );
}

type FieldProps = {
  label: string;
  value: string;
  placeholder: string;
  error?: string;
  secureTextEntry?: boolean;
  onChangeText: (value: string) => void;
  onBlur: () => void;
};

function Field({
  error,
  label,
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
        onBlur={onBlur}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.warmGray400}
        secureTextEntry={secureTextEntry}
        style={styles.input}
        value={value}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.xs
  },
  mascot: {
    width: 100,
    height: 100,
    marginBottom: spacing.sm,
    transform: [{ rotate: '-5deg' }]
  },
  description: {
    ...typography.bodyL,
    color: colors.ink700,
    textAlign: 'center'
  },
  form: {
    gap: spacing.lg
  },
  field: {
    gap: spacing.sm
  },
  label: {
    ...typography.bodyM,
    color: colors.ink900,
    fontWeight: '600'
  },
  input: {
    minHeight: 52,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.warmGray200,
    paddingHorizontal: spacing.lg,
    color: colors.ink900
  },
  error: {
    ...typography.caption,
    color: colors.pink500
  },
  authError: {
    ...typography.bodyM,
    color: colors.pink500,
    textAlign: 'center',
    marginBottom: spacing.sm
  }
});
