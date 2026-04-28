import { defineConfig } from '@prisma/config';
import { env } from './src/env.js';

export default defineConfig({
  earlyAccess: true,
  datasource: {
    url: env.DATABASE_URL
  },
  migrations: {
    seed: 'npx tsx prisma/seed.ts'
  }
});
