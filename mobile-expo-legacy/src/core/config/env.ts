const raw = process.env.EXPO_PUBLIC_API_URL?.trim() ?? "";

export const config = {
  apiUrl: raw.replace(/\/$/, ""),
  tokenKey: "ezoa_token",
  queryCacheKey: "tea_query_cache",
} as const;

export function assertApiUrl(): string {
  if (!config.apiUrl) {
    throw new Error(
      "EXPO_PUBLIC_API_URL non défini — copiez .env.example vers .env",
    );
  }
  return config.apiUrl;
}
