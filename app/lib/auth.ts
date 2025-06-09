import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const isDev = process.env.NODE_ENV !== "production";
const baseURL = isDev
  ? "http://localhost:5173/auth"
  : "https://wallflower.dev/auth";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  trustedOrigins: ["http://localhost:5173", "http://localhost:5173/auth"],

  baseURL: baseURL,

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },

  rateLimit: {
    enabled: true,
    max: 100,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: "Too many requests, please try again later.",
  },
});
