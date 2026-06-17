import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ChevronRight, Folder, FolderOpen, FileText, Image as ImageIcon,
  ArrowLeft, HardDrive, Loader2,
} from "lucide-react";
import { DataTableToolbar } from "@/components/dashboard/DataTableToolbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import type { ArchiveBrowseResult } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ARCHIVES_PORTRAIT_PREVIEW_FRAME } from "@/components/admin/AuthenticatedMedia";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function FileIcon({ type }: { type: string }) {
  if (type === "pdf") return <FileText className="size-5 text-red-500" />;
  if (type === "image") return <ImageIcon className="size-5 text-blue-500" />;
  return <FileText className="size-5 text-muted-foreground" />;
}

export function AdminArchivesBrowser() {
  const [root, setRoot] = useState<"epreuves" | "soumissions">("epreuves");
  const [path, setPath] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<"pdf" | "image" | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-archives", root, path],
    queryFn: () => api.browseArchives(root, path),
  });

  function openFolder(folderPath: string) {
    setPath(folderPath);
    setPreviewUrl(null);
    setPreviewType(null);
  }

  function goBack() {
    if (!path) return;
    const parts = path.split("/");
    parts.pop();
    setPath(parts.join("/"));
    setPreviewUrl(null);
    setPreviewType(null);
  }

  async function openFile(file: ArchiveBrowseResult["files"][0]) {
    const blob = await api.fetchArchiveFile(root, file.relPath);
    const url = URL.createObjectURL(blob);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(url);
    setPreviewType(file.type === "pdf" ? "pdf" : file.type === "image" ? "image" : null);
  }

  function switchRoot(next: "epreuves" | "soumissions") {
    setRoot(next);
    setPath("");
    setPreviewUrl(null);
    setPreviewType(null);
  }

  return (
    <div className="space-y-4">
      <DataTableToolbar
        title="Archives fichiers"
        description="Parcours par année, type (devoir, compos, exam) puis dossier épreuve. Images sources + PDF."
        count={data ? data.folders.length + data.files.length : 0}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          variant={root === "epreuves" ? "default" : "outline"}
          size="sm"
          className="rounded-lg"
          onClick={() => switchRoot("epreuves")}
        >
          <HardDrive className="size-4" /> Épreuves publiées
        </Button>
        <Button
          variant={root === "soumissions" ? "default" : "outline"}
          size="sm"
          className="rounded-lg"
          onClick={() => switchRoot("soumissions")}
        >
          <FolderOpen className="size-4" /> Soumissions en cours
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(240px,min(30rem,38%))_minmax(0,1fr)]">
        <div className="min-w-0 rounded-2xl border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            {path ? (
              <Button variant="ghost" size="icon" className="size-8" onClick={goBack}>
                <ArrowLeft className="size-4" />
              </Button>
            ) : null}
            <nav className="flex flex-wrap items-center gap-1 text-sm">
              {(data?.breadcrumbs ?? []).map((crumb, i) => (
                <span key={crumb.path || "root"} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="size-3.5 text-muted-foreground" />}
                  <button
                    type="button"
                    className={cn(
                      "rounded px-1.5 py-0.5 hover:bg-muted",
                      i === (data?.breadcrumbs.length ?? 1) - 1 ? "font-medium" : "text-muted-foreground",
                    )}
                    onClick={() => openFolder(crumb.path)}
                  >
                    {crumb.label}
                  </button>
                </span>
              ))}
            </nav>
          </div>

          <div className="max-h-[28rem] overflow-y-auto p-2">
            {isLoading ? (
              <div className="grid place-items-center py-16 text-muted-foreground">
                <Loader2 className="size-6 animate-spin" />
              </div>
            ) : !data?.folders.length && !data?.files.length ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                Ce dossier est vide. Les épreuves apparaîtront ici après soumission ou publication.
              </p>
            ) : (
              <ul className="space-y-1">
                {data.folders.map((folder) => (
                  <li key={folder.path}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-muted/60"
                      onClick={() => openFolder(folder.path)}
                    >
                      <Folder className="size-5 shrink-0 text-tg-yellow" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{folder.label}</p>
                        <p className="truncate text-xs text-muted-foreground">{folder.name}</p>
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </button>
                  </li>
                ))}
                {data.files.map((file) => (
                  <li key={file.path}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-muted/60"
                      onClick={() => openFile(file)}
                    >
                      <FileIcon type={file.type} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                      </div>
                      <Badge variant="outline" className="shrink-0 capitalize">{file.type}</Badge>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="min-w-0 rounded-2xl border border-border bg-card p-4">
          <h3 className="font-display text-lg font-bold">Aperçu</h3>
          <p className="text-sm text-muted-foreground">
            {path ? `Chemin : ${root}/${path}` : "Sélectionne un fichier PDF ou une image"}
          </p>
          <div className={cn(ARCHIVES_PORTRAIT_PREVIEW_FRAME, "mt-4 rounded-xl border border-border")}>
            {!previewUrl ? (
              <div className="absolute inset-0 grid place-items-center p-4 text-center text-sm text-muted-foreground">
                Clique sur un fichier à gauche
              </div>
            ) : previewType === "pdf" ? (
              <iframe src={previewUrl} title="Aperçu PDF" className="absolute inset-0 h-full w-full border-0" />
            ) : previewType === "image" ? (
              <img src={previewUrl} alt="Aperçu" className="h-full w-full object-contain" />
            ) : (
              <div className="absolute inset-0 grid place-items-center p-4 text-center text-sm text-muted-foreground">
                Aperçu non disponible pour ce type
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
