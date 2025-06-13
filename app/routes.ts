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
  route("/api/auth/*", "routes/api.auth.$.ts"),
] satisfies RouteConfig;
