import * as SQLite from "expo-sqlite";
import type { Epreuve, OfflineEpreuve } from "@/shared/types";

const DB_NAME = "tea_offline.db";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS offline_epreuves (
          id TEXT PRIMARY KEY NOT NULL,
          titre TEXT NOT NULL,
          matiere TEXT NOT NULL,
          json_metadata TEXT NOT NULL,
          local_pdf_path TEXT NOT NULL,
          downloaded_at TEXT NOT NULL
        );
      `);
      return db;
    })();
  }
  return dbPromise;
}

export async function listOfflineEpreuves(): Promise<OfflineEpreuve[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: string;
    titre: string;
    matiere: string;
    json_metadata: string;
    local_pdf_path: string;
    downloaded_at: string;
  }>("SELECT * FROM offline_epreuves ORDER BY downloaded_at DESC");

  return rows.map((r) => ({
    id: r.id,
    titre: r.titre,
    matiere: r.matiere,
    metadata: r.json_metadata,
    localPdfPath: r.local_pdf_path,
    downloadedAt: r.downloaded_at,
  }));
}

export async function getOfflineEpreuve(id: string): Promise<OfflineEpreuve | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{
    id: string;
    titre: string;
    matiere: string;
    json_metadata: string;
    local_pdf_path: string;
    downloaded_at: string;
  }>("SELECT * FROM offline_epreuves WHERE id = ?", [id]);

  if (!row) return null;
  return {
    id: row.id,
    titre: row.titre,
    matiere: row.matiere,
    metadata: row.json_metadata,
    localPdfPath: row.local_pdf_path,
    downloadedAt: row.downloaded_at,
  };
}

export async function saveOfflineEpreuve(
  epreuve: Epreuve,
  localPdfPath: string,
): Promise<void> {
  const db = await getDb();
  const metadata = JSON.stringify(epreuve);
  await db.runAsync(
    `INSERT OR REPLACE INTO offline_epreuves
     (id, titre, matiere, json_metadata, local_pdf_path, downloaded_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [epreuve.id, epreuve.titre, epreuve.matiere, metadata, localPdfPath, new Date().toISOString()],
  );
}

export async function deleteOfflineEpreuve(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM offline_epreuves WHERE id = ?", [id]);
}

export async function isOfflineAvailable(id: string): Promise<boolean> {
  const item = await getOfflineEpreuve(id);
  return item != null;
}

export function parseOfflineMetadata(item: OfflineEpreuve): Epreuve | null {
  try {
    return JSON.parse(item.metadata) as Epreuve;
  } catch {
    return null;
  }
}
