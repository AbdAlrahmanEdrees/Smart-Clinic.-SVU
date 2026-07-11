import { defineConfig, env } from "prisma/config";
import * as dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // url: String(process.env.DATABASE_URL),
    url: env("DATABASE_URL"),
  },
});
