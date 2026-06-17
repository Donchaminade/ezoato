import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { assertApiUrl } from "@/core/config/env";
import { getToken } from "@/core/storage/secureToken";
import type { Epreuve } from "@/shared/types";
import {
  deleteOfflineEpreuve,
  getOfflineEpreuve,
  saveOfflineEpreuve,
} from "./offlineStore";

const OFFLINE_DIR = `${FileSystem.documentDirectory}offline-epreuves/`;

async function ensureDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(OFFLINE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(OFFLINE_DIR, { intermediates: true });
  }
}

function pdfPath(epreuveId: string): string {
  return `${OFFLINE_DIR}epreuve-${epreuveId}.pdf`;
}

export async function downloadEpreuveForOffline(epreuve: Epreuve): Promise<string> {
  await ensureDir();
  const path = pdfPath(epreuve.id);
  const base = assertApiUrl();
  const token = await getToken();
  const result = await FileSystem.downloadAsync(
    `${base}/epreuves/${epreuve.id}/download`,
    path,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} },
  );
  if (result.status !== 200) {
    throw new Error("Échec du téléchargement PDF");
  }
  await saveOfflineEpreuve(epreuve, path);
  return path;
}

export async function openOfflinePdf(epreuveId: string): Promise<void> {
  const item = await getOfflineEpreuve(epreuveId);
  if (!item) throw new Error("Épreuve hors ligne introuvable");

  const info = await FileSystem.getInfoAsync(item.localPdfPath);
  if (!info.exists) {
    await deleteOfflineEpreuve(epreuveId);
    throw new Error("Fichier PDF supprimé — retéléchargez l'épreuve");
  }

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(item.localPdfPath, {
      mimeType: "application/pdf",
      dialogTitle: item.titre,
      UTI: "com.adobe.pdf",
    });
  } else {
    throw new Error("Ouverture PDF non disponible sur cet appareil");
  }
}

export async function removeOfflineDownload(epreuveId: string): Promise<void> {
  const item = await getOfflineEpreuve(epreuveId);
  if (item) {
    const info = await FileSystem.getInfoAsync(item.localPdfPath);
    if (info.exists) {
      await FileSystem.deleteAsync(item.localPdfPath, { idempotent: true });
    }
  }
  await deleteOfflineEpreuve(epreuveId);
}
