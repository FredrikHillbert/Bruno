import { createAuthClient } from "better-auth/react";

const isDev = process.env.NODE_ENV !== "production";
const baseURL = isDev ? "http://localhost:5173/auth" : "https://wallflower.dev/auth";

export const authClient = createAuthClient({
  baseURL: baseURL,
});
