import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const isDev = process.env.NODE_ENV !== "production";
const baseURL = isDev
  ? "http://localhost:5173/api/auth"
  : "https://wallflower.dev/api/auth";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  trustedOrigins: ["http://localhost:5173", "http://localhost:5173/api/auth"],

  baseURL: baseURL,

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },

  socialProviders: {
    google: {
      prompt: "select_account",
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID as string,
      clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
    },
  },

  rateLimit: {
    enabled: true,
    max: 100,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: "Too many requests, please try again later.",
  },
});
