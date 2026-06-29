# Changelog

## 2026-06-29

### Sjednocení podstránek
- `svatebni-den`, `fotogalerie` a `dotaznik` převedeny na **stejný kontejner jako `nas-pribeh`** (`min-h-screen w-full pt-15`, `<section>` s `<h1>`), proměnná `heading`.
- `BackButton` na všech podstránkách přesunut **napravo** (`fixed top-0 right-0`).
- Obsahový kontejner sjednocen na **`max-w-3xl`** (`nas-pribeh` i `dotaznik`).

### Stránka `dotaznik` – krokový průvodce
- Formulář roztažen na šířku kontejneru, tlačítko odeslání **vycentrováno**.
- Pole `input` i `textarea` označena jako **povinná** (`required`).
- Přepracováno na **krok-za-krokem**: vidět je jen aktuální krok + „Pokračovat"; na posledním kroku se objeví „Odeslat dotazník".
- **Akumulační reveal**: další krok se nepřekrývá, ale **přidá pod** aktuální, prolnutím + jemným příjezdem shora (`opacity` + `-translate-y-8`, `duration-1000`).
- Po „Pokračovat" se nový krok **doscrolluje přesně na střed** obrazovky (`scrollIntoView({ block: "center" })`); spodní rezerva `pb-[50vh]`, aby šel vystředit i poslední krok.
- **Per-krok validace** přes nativní `reportValidity()` – „Pokračovat" zvaliduje aktuální krok, než odhalí další.
- Ke každému kroku přidána skupina **radio buttonů Ano / Ne** (`required`).
- Logika v `<script>` inicializovaná na `astro:page-load` (kompatibilní s View Transitions).

## 2026-06-28

### Projekt & pravidla
- Vytvořen `CLAUDE.md` (popis stacku, architektury, příkazů).
- Doplněna sekce **Communication & Collaboration** – mj. pravidlo, abych se neptal po každém kroku na spuštění dev serveru.

### Styly
- **DaisyUI dočasně vypnuto** (`@plugin "daisyui"` zakomentováno v `src/styles/global.css`) – odstranilo šedé pozadí stránek (theme base color).

### Stránka `nas-pribeh`
- Hlavní text **vycentrován na střed stránky** – 3sloupcový flex layout (`flex-1` / `max-w-4xl` text / `flex-1`).
- Opraveno posunuté centrování: `w-screen mx-40` → `w-full` na `<main>`.
- Každý odstavec dostal `id={rok}` (vazba na časovou osu).
- Přidány příběhy pro roky **2014–2018** (placeholder text).

### Komponenta `TimeLine`
- Přepracována na **data-driven** přes prop `years` (zdroj pravdy = `textContent` v `nas-pribeh`), s `interface Props`.
- **Sticky kolej** (`sticky top-0 h-screen`), kuličky větší a výraznější (`w-7 h-7`, `bg-gray-800`, `ring-4`), větší text roku.
- **Scroll-driven chování** (IntersectionObserver):
  - Kuličky kromě první jsou skryté; objeví se, jakmile jejich odstavec (`#rok`) dorazí do ~60 % viewportu.
  - Při scrollu nahoru kuličky zase mizí; první zůstává vždy viditelná.
- **Progress čára** nyní vyjadřuje pozici scrollu v celém dokumentu (reaguje okamžitě na jakýkoli scroll, throttle přes `requestAnimationFrame`).
- Odstraněna šedá vodicí čára na pozadí.
