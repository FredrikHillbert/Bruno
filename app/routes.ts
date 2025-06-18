import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  layout("routes/layout.tsx", [
    index("routes/home.tsx"),
    route("/api/chat", "routes/api.chat.ts"),
    route("/chat/:id", "routes/chat.$id.tsx"),
  ]),
  route("/learn-more", "routes/learn-more.tsx"),
  route("/sign-up", "routes/sign-up.tsx"),
  route("/sign-in", "routes/sign-in.tsx"),
  route("/api/auth/*", "routes/api.auth.$.ts"),
  route("/api/auth/threads", "routes/api.auth.threads.ts"),
  route("/profile/:id", "routes/profile.$id.tsx"),
  route("/about", "routes/about.tsx"),
] satisfies RouteConfig;
