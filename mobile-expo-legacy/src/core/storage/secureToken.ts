import * as SecureStore from "expo-secure-store";
import { config } from "@/core/config/env";

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(config.tokenKey);
  } catch {
    return null;
  }
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(config.tokenKey, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(config.tokenKey);
}
