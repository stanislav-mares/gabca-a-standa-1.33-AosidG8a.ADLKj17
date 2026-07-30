/**
 * Rozepsaný dotazník v prohlížeči hosta.
 *
 * `localStorage`, ne `sessionStorage`: dotazník se vyplňuje na několikrát
 * („zeptám se ženy, co bude pít") a session by se zavřením panelu ztratila.
 * Draft se maže po úspěšném odeslání.
 *
 * Ukládá se plochá mapa `název pole → hodnota`; u zaškrtávátek a přepínačů
 * je klíčem `název:hodnota`, protože přepínače v jedné skupině sdílejí `name`.
 */

const STORAGE_KEY = "svatba-dotaznik-draft-v1";

export type Draft = Record<string, string | boolean>;

/**
 * Úložiště může být nedostupné (privátní režim, zaplněná kvóta, zakázané
 * cookies). Draft je pohodlí navíc, takže se při chybě jen tiše vypne —
 * vyplňování formuláře to nesmí shodit.
 */
function withStorage<T>(action: (storage: Storage) => T): T | null {
  try {
    return action(window.localStorage);
  } catch {
    return null;
  }
}

export function loadDraft(): Draft | null {
  return withStorage((storage) => {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as Draft;
  });
}

export function saveDraft(draft: Draft): void {
  withStorage((storage) => storage.setItem(STORAGE_KEY, JSON.stringify(draft)));
}

export function clearDraft(): void {
  withStorage((storage) => storage.removeItem(STORAGE_KEY));
}
