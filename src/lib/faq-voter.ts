const STORAGE_KEY = "ezoa_faq_voter";

/** Identifiant anonyme persistant pour les votes FAQ (localStorage). */
export function getFaqVoterId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
