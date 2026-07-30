/**
 * Typy pro konfigurovatelný dotazník.
 *
 * Otázka (`Question`) se skládá z libovolné kombinace prvků (`Element`).
 * Výběrové prvky (yes-no / single-choice / multi-choice) mohou mít u konkrétní
 * možnosti navázanou podotázku (`followUp`), která se rozbalí po jejím vybrání.
 * Podotázka obsahuje stejné prvky jako otázka, takže se dá zanořit i další
 * follow-up – v konfiguraci se držíme maximálně 2 úrovní zanoření.
 *
 * Všechny textové popisky (`heading`, `label`, `description`) se renderují jako
 * HTML, takže mohou obsahovat značky (`<a>`, `<strong>`, `<br>`, …). Konfigurace
 * je statická a psaná ručně – nikdy sem nevkládej vstup od uživatele.
 */

export type ElementType =
  | "short-text" // krátký text (input)
  | "email" // krátký text s nativní validací e-mailu
  | "name-list" // seznam jmen – řádky se přidávají tlačítkem
  | "person-checklist" // zaškrtávátka pro jména vyplněná v `name-list`
  | "textarea" // dlouhý text
  | "yes-no" // ano / ne
  | "single-choice" // výběr jedné z možností
  | "multi-choice"; // výběr více možností

/** Typy prvků, které nabízejí diskrétní možnosti (a tedy i follow-upy). */
export type ChoiceElementType = "yes-no" | "single-choice" | "multi-choice";

/** Možnost výběrového prvku, volitelně s navázanou podotázkou. */
export interface Option {
  /** Musí být unikátní v rámci prvku – tvoří `id`/`name` inputu. */
  value: string;
  /** Může obsahovat HTML. */
  label: string;
  /** Podotázka, která se zobrazí po vybrání této možnosti. */
  followUp?: SubQuestion;
  /**
   * Vybráním této možnosti dotazník končí – následující otázky se skryjí
   * a odesílací tlačítko se přejmenuje. Zbytek dotazníku pro takového hosta
   * nedává smysl (typicky „Bohužel nemohu").
   */
  endsForm?: boolean;
}

/**
 * Jeden prvek otázky.
 *
 * `name-list` vykresluje N řádků na jména. Do formuláře se neposílají
 * jednotlivé řádky, ale skryté pole se jmény spojenými čárkou – tabulka tak
 * dostane stejný tvar dat jako obyčejný textový input a Apps Script se kvůli
 * proměnnému počtu osob nemusí měnit.
 *
 * `person-checklist` se vykreslí prázdný a za běhu se naplní jmény z
 * `name-list`. Odesílá se stejně: skryté pole se jmény zaškrtnutých osob.
 */
export interface Element {
  type: ElementType;
  /** Může obsahovat HTML. */
  label: string;
  /** Volitelné dovysvětlení zobrazené pod labelem. Může obsahovat HTML. */
  description?: string;
  placeholder?: string;
  required?: boolean;
  /** Vyžadováno pro výběrové typy (yes-no / single-choice / multi-choice). */
  options?: Option[];
  /** Jen pro `person-checklist`: osoby se předvyplní zaškrtnuté. */
  defaultChecked?: boolean;
  /**
   * Jen pro výběrové prvky: osoba smí být zaškrtnutá jen v jednom z
   * `person-checklist` pod možnostmi tohoto prvku. Zaškrtnutí ji jinde odebere.
   * Dává smysl tam, kde se kategorie vylučují (velikost porce, typ ubytování),
   * ne u vlastností, které lze kombinovat (stravovací omezení).
   */
  exclusivePersons?: boolean;
}

/** Podotázka rozbalená po vybrání možnosti – stejná stavba jako otázka. */
export interface SubQuestion {
  /** Může obsahovat HTML. */
  heading?: string;
  elements: Element[];
}

/** Jedna otázka dotazníku. */
export interface Question {
  id: string;
  /** Může obsahovat HTML. */
  heading: string;
  elements: Element[];
}
