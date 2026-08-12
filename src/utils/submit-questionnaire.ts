/**
 * Sběr a odeslání odpovědí dotazníku na Apps Script endpoint, který je zapíše
 * do Google Sheetu (viz apps-script/questionnaire-endpoint.gs).
 *
 * Sloupce v tabulce se párují podle `key` (= atribut `name` inputu), `label`
 * je lidský popisek sloupce. Mapa polí se staví v build čase z konfigurace
 * otázek a musí kopírovat pojmenování z QuestionElement.astro:
 * prvek otázky = `${q.id}-e${j}`, možnost multi-choice = `${name}-${opt.value}`,
 * prvek podotázky = `${name}-${opt.value}-s${k}`.
 */
import { getSubmissionId } from "./questionnaire-draft";
import type { Element, Question } from "./questionnaire";

/** Popis jednoho pole formuláře pro převod na sloupec tabulky. */
export interface FieldMeta {
  /** Lidský popisek sloupce. */
  label: string;
  kind: "text" | "radio" | "checkbox";
  /** Jen pro radio skupiny: hodnota inputu → lidský popisek možnosti. */
  optionLabels?: Record<string, string>;
}

export type FieldMetaMap = Record<string, FieldMeta>;

/** Jedna odpověď ve tvaru, který očekává Apps Script. */
export interface Answer {
  key: string;
  label: string;
  value: string;
}

const stripHtml = (html: string): string =>
  html
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

const joinLabel = (...parts: (string | undefined)[]): string =>
  parts
    .map((part) => (part ? stripHtml(part) : ""))
    .filter(Boolean)
    .join(" – ");

function addElement(
  meta: FieldMetaMap,
  element: Element,
  name: string,
  context: string,
): void {
  const label =
    joinLabel(
      context,
      element.label || element.description || element.placeholder,
    ) || name;
  const isMulti = element.type === "multi-choice";
  const isChoice =
    element.type === "yes-no" || element.type === "single-choice" || isMulti;

  if (!isChoice) {
    meta[name] = { label, kind: "text" };
    return;
  }

  const options = element.options ?? [];
  if (!isMulti) {
    meta[name] = {
      label,
      kind: "radio",
      optionLabels: Object.fromEntries(
        options.map((opt) => [opt.value, stripHtml(opt.label)]),
      ),
    };
  }

  for (const opt of options) {
    const optName = `${name}-${opt.value}`;
    const optLabel = joinLabel(label, opt.label);
    if (isMulti) {
      meta[optName] = { label: optLabel, kind: "checkbox" };
    }
    opt.followUp?.elements.forEach((sub, k) => {
      addElement(meta, sub, `${optName}-s${k}`, optLabel);
    });
  }
}

/** Postaví mapu všech polí formuláře (včetně podotázek) z konfigurace otázek. */
export function buildFieldMeta(questions: Question[]): FieldMetaMap {
  const meta: FieldMetaMap = {};
  for (const question of questions) {
    question.elements.forEach((element, j) => {
      addElement(meta, element, `${question.id}-e${j}`, question.heading);
    });
  }
  return meta;
}

/**
 * Posbírá vyplněné odpovědi. `FormData` sama vynechá disablovaná pole
 * (skryté podotázky) a nezaškrtnuté checkboxy/radia.
 */
export function collectAnswers(
  form: HTMLFormElement,
  meta: FieldMetaMap,
): Answer[] {
  const answers: Answer[] = [];
  for (const [key, raw] of new FormData(form).entries()) {
    if (typeof raw !== "string") continue;
    const value = raw.trim();
    const field = meta[key];
    if (!field) {
      if (value) answers.push({ key, label: key, value });
    } else if (field.kind === "checkbox") {
      answers.push({ key, label: field.label, value: "ano" });
    } else if (field.kind === "radio") {
      answers.push({
        key,
        label: field.label,
        value: field.optionLabels?.[value] ?? value,
      });
    } else if (value) {
      answers.push({ key, label: field.label, value });
    }
  }
  return answers;
}

/** Kolik pokusů se vyčerpá, než se ohlásí chyba. */
const ATTEMPTS = 3;
const RETRY_DELAY_MS = 1500;

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function postAnswers(endpoint: string, body: string): Promise<void> {
  const response = await fetch(endpoint, {
    method: "POST",
    // Řetězcové tělo = "simple request" (text/plain) bez CORS preflightu,
    // který by Apps Script neuměl obsloužit.
    body,
  });
  if (!response.ok) {
    throw new Error(`Endpoint vrátil HTTP ${response.status}`);
  }
  const result = (await response.json()) as { ok: boolean; error?: string };
  if (!result.ok) {
    throw new Error(result.error ?? "Zápis do tabulky se nepovedl.");
  }
}

/**
 * Odešle odpovědi na endpoint; chybu vyhodí teprve po vyčerpání pokusů.
 *
 * Opakovat je bezpečné: Apps Script zapíše řádek dřív, než odešle odpověď,
 * takže selhání na zpáteční cestě (přesměrování na googleusercontent.com,
 * uspaný mobil) nerozezná od skutečně neúspěšného zápisu nikdo – ani klient.
 * Podle `submissionId` proto server řádek přepíše, místo aby přidal duplicitu.
 * Tělo se skládá jen jednou, aby všechny pokusy nesly totéž ID.
 */
export async function submitQuestionnaire(
  form: HTMLFormElement,
  meta: FieldMetaMap,
  endpoint: string,
): Promise<void> {
  const body = JSON.stringify({
    submissionId: getSubmissionId(),
    answers: collectAnswers(form, meta),
  });

  for (let attempt = 1; ; attempt += 1) {
    try {
      await postAnswers(endpoint, body);
      return;
    } catch (err) {
      if (attempt === ATTEMPTS) throw err;
      console.warn(`Odeslání selhalo (pokus ${attempt}), zkouším znovu.`, err);
      await wait(RETRY_DELAY_MS);
    }
  }
}
