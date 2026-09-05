export const env = {
  appName: "منصة إدارة وتحكيم الأبحاث العلمية",
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "/api",
  isDev: import.meta.env.DEV,
} as const;
