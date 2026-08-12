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
const SUBMISSION_KEY = "svatba-dotaznik-odeslani-v1";

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

/**
 * `crypto.randomUUID` existuje jen v zabezpečeném kontextu (https, localhost).
 * Přes https i `npm run dev` je k dispozici, ale dev server otevřený z mobilu
 * po LAN adrese už běží bez něj – tam by odeslání spadlo rovnou na výjimce.
 */
const randomId = (): string =>
  typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

let submissionId: string | null = null;

/**
 * ID jednoho odeslání. Server podle něj pozná opakovaný pokus a řádek přepíše,
 * místo aby přidal duplicitu – proto musí přežít i obnovení stránky.
 *
 * Vzniká líně až při prvním odeslání: kdo dotazník jen rozepíše a nechá být,
 * žádné ID nedostane. Bez dostupného úložiště zůstane jen v paměti stránky,
 * takže opakované pokusy pokryje, obnovení stránky už ne.
 */
export function getSubmissionId(): string {
  if (submissionId) return submissionId;
  const id =
    withStorage((storage) => storage.getItem(SUBMISSION_KEY)) || randomId();
  withStorage((storage) => storage.setItem(SUBMISSION_KEY, id));
  submissionId = id;
  return id;
}

/** Maže i ID odeslání – další dotazník na témž zařízení začne načisto. */
export function clearDraft(): void {
  submissionId = null;
  withStorage((storage) => {
    storage.removeItem(STORAGE_KEY);
    storage.removeItem(SUBMISSION_KEY);
  });
}
