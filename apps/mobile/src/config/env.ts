import Constants from 'expo-constants';
import { z } from 'zod';

const mobileRuntimeEnvSchema = z.object({
  appEnv: z.enum(['development', 'test', 'production']),
  apiBaseUrl: z.string().url(),
  appScheme: z.string().min(1)
});

export const mobileEnv = mobileRuntimeEnvSchema.parse(Constants.expoConfig?.extra ?? {});
