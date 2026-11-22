export const isDemoMode =
  process.env.EXPO_PUBLIC_DEMO_MODE !== "false";

export const apiOrigin =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "https://www.deplo.in";
