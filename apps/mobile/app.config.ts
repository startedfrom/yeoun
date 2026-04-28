import { config as loadDotenv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';

const rootEnvPath = resolve(process.cwd(), '../../.env');
const localEnvPath = resolve(process.cwd(), '.env');

if (existsSync(rootEnvPath)) {
  loadDotenv({ path: rootEnvPath });
} else if (existsSync(localEnvPath)) {
  loadDotenv({ path: localEnvPath });
}

const mobileEnvSchema = z.object({
  EXPO_PUBLIC_APP_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  EXPO_PUBLIC_APP_SCHEME: z.string().default('gamdojang'),
  EXPO_PUBLIC_API_BASE_URL: z.string().url().default('http://localhost:4000/api/v1')
});

const mobileEnv = mobileEnvSchema.parse(process.env);

export default () => ({
  expo: {
    name: '여운',
    slug: 'gamdojang',
    scheme: mobileEnv.EXPO_PUBLIC_APP_SCHEME,
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    plugins: ['expo-router'],
    experiments: {
      typedRoutes: true
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.anonymous.gamdojang'
    },
    android: {},
    assetBundlePatterns: ['**/*'],
    extra: {
      appEnv: mobileEnv.EXPO_PUBLIC_APP_ENV,
      apiBaseUrl: mobileEnv.EXPO_PUBLIC_API_BASE_URL,
      appScheme: mobileEnv.EXPO_PUBLIC_APP_SCHEME
    }
  }
});
