import 'dotenv/config'
import { defineConfig } from 'prisma/config'

// DATABASE_URL is read from the environment by prisma/schema.prisma.
// Locally it comes from .env (loaded above); in Docker it is set by compose.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
})
