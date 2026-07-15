# Changelog

## 2026-07-15

### Fotogalerie – mozaikový layout s hero fotkami
- Masonry přes CSS `columns-*` nahrazeno **CSS gridem s `grid-flow-dense`** (`grid-cols-2/3/4/5` podle breakpointu, fixní výška řádků `auto-rows-[9rem]`, na md+ `11rem`) – sloupcová masonry dávala všem fotkám stejnou váhu, grid umožňuje rytmus velká–malá.
- Každá **7. fotka je „hero"** (`col-span-2 row-span-2`), první fotkou galerie počínaje; `grid-flow-dense` doplní díry kolem hero menšími snímky. Vzor určuje `isHeroPhoto()` v `src/utils/gallery.ts` (laditelná konstanta `HERO_INTERVAL`).
- Fotky vyplňují buňky přes **`object-cover`** – v mřížce se ořezávají, celé se ukážou až v lightboxu. Hero dostává větší varianty obrázku (`widths` `[800, 1600]` místo `[400, 800]`) a vlastní `sizes`, protože se kreslí přes dva sloupce.

### Fotogalerie – lightbox s gesty (PhotoSwipe)
- Přidán **`photoswipe`** (v5) – vanilla JS bez frameworku, gesta kompletní (swipe mezi fotkami, pinch-zoom, double-tap, swipe dolů pro zavření; na desktopu šipky a Esc). Jádro se **lazy-loaduje až při prvním otevření** (`pswpModule: () => import("photoswipe")`).
- Nová `getGalleryPhotosWithLightbox()` v `gallery.ts`: pro každou fotku vygeneruje přes `getImage()` **webp variantu do 2000 px** a vrátí ji i s rozměry – PhotoSwipe potřebuje `data-pswp-width/height` znát dopředu.
- Každá fotka je v `<a href={velká varianta}>` – bez JS funguje jako fallback (otevře fotku v novém tabu).
- Init přes `astro:page-load` (s guardem na přítomnost `#galerie` – modulový skript přežívá View Transitions), `destroy()` na `astro:before-swap`.
- **`data-cropped="true"`** na odkazech: bez něj otevírací animace „poskočila" – PhotoSwipe předpokládal, že náhled ukazuje celou fotku, ale náhledy jsou ořezy (`object-cover`).

### Fotogalerie – šířka kontejneru
- Galerie roztažena na celou šířku mezi okraji: `<section>` má od md **`px-40`** (= šířka `BackButton`, symetricky na obou stranách), grid ztratil `max-w-6xl`. Na mobilu zůstává `px-6`/`sm:px-10`.
- Na `2xl` přidán **pátý sloupec** a dorovnány `sizes` (běžná fotka 20vw, hero 40vw), aby mozaika na širokých monitorech nepůsobila nafoukle.

### Průhledné podstránky nad fotkou pozadí
- Fixní fotka pozadí (`dkr-1795.jpg`) přesunuta z `index.astro` do **`Layout.astro`** (`<body>`, `-z-10`) — je teď pod všemi stránkami. Protože žije mimo `<main>`, neúčastní se slide přechodů; překrývá ji root cross-fade, který už v `global.css` byl.
- Všech 5 podstránek má na `<main>` místo `bg-gray-50` **`bg-surface/95`** — panel používá custom barvu z `@theme` a fotka pozadí skrz něj z 5 % prosvítá.

### Fotogalerie – hover efekt
- Fotky v mřížce mají klidovou **`opacity-85`** a na hover se prosvítí na 100 % (`transition-opacity duration-300`) — skrz průhlednost jemně prosvítá surface panel, najetí fotku „rozsvítí".

### Hlavní foto – výřez
- Posun POV přes `object-position` nefungoval: fotka na běžných poměrech okna **nemá horizontální přesah** (ořez jen svislý), takže nebylo co posouvat.
- Místo toho **`scale-130`** + **`origin-[0%_50%]`** — zvětšení vytvoří přesah a transform-origin určuje, která část záběru zůstane vidět. Hodnoty laděné od oka.

## 2026-07-14

### Dotazník – odesílání odpovědí do Google Sheetu (web)
- Nový `src/utils/submit-questionnaire.ts`: v build čase se z konfigurace otázek staví **mapa polí** (`buildFieldMeta`) – klíč = `name` atribut inputu, hodnota = lidský popisek sloupce + druh pole. Musí kopírovat pojmenovací schéma z `QuestionElement.astro` (`${q.id}-e${j}`, možnost `${name}-${opt.value}`, podotázka `…-s${k}`).
- Odpovědi se sbírají přes `FormData` – disablovaná (skrytá) follow-up pole a nezaškrtnuté možnosti vypadnou samy. Hodnoty radio skupin se překládají na popisky možností („V den svatby" místo `svatba`), checkbox se posílá jako „ano".
- Odesílá se `fetch` POSTem s řetězcovým tělem (JSON) – tedy `text/plain`, **simple request bez CORS preflightu**, který by Apps Script neuměl obsloužit.
- `Questionnaire.astro`: submit handler – tlačítko přepne na „Odesílám…", po úspěchu se formulář schová a ukáže poděkování, při chybě červená hláška a vyplněná data zůstávají. Mapa polí jde do klienta přes `<script type="application/json">` (`<` escapované, aby JSON nemohl rozbít `</script>`).
- URL endpointu v **`PUBLIC_QUESTIONNAIRE_ENDPOINT`** (`.env`; v gitu jen `.env.example`), typ deklarován v novém `src/env.d.ts`.

### Apps Script – zápis a vyhodnocení (Google Sheet)
- Nový `apps-script/questionnaire-endpoint.gs` – verzovaný zdroj; nasazuje se ručně přepastováním do editoru tabulky (změny `doPost` navíc vyžadují „Nasadit → Nová verze").
- `doPost` zapisuje odeslání jako řádek do listu **Odpovědi**: řádek 1 = technické klíče (podle nich se párují sloupce), řádek 2 = lidské popisky, data od řádku 3. Neznámý klíč si přidá sloupec sám, takže **změna otázek na webu zápis nerozbije**. Souběžná odeslání hlídá `LockService`.
- Sloupce jednorázově naseedované kompletním testovacím submitem, aby držely pořadí dotazníku; řádek s klíči se nesmí mazat.
- `vytvorVyhodnoceni()` (spouští se ručně z editoru) přegeneruje list **Vyhodnocení**: účast, příjezd, přespání, stravovací omezení a pití vč. jmenných seznamů (`FILTER` + `TEXTJOIN`). Vzorce jsou **šité na aktuální otázky** – při změně konfigurace je nutné funkci upravit a spustit znovu.
- Vzorce se generují **se středníky**: tabulka s českým locale parsuje vzorce vložené přes `setFormula` lokalizovaně a s čárkami padaly na „chyba analýzy vzorce".
- Vedle počtu odpovědí je i sloupec **„osob"** – heuristika (`SUMPRODUCT` + `SUBSTITUTE`/`LEN`) počítá jména oddělená čárkou, středníkem, novým řádkem nebo spojkou „ a "; u stravovacích omezení se osoby počítají z pole „koho se týká".

### Dotazník – texty
- Popisek u jména a placeholdery „Koho se týká?" nově žádají **jména oddělená čárkou**, aby počty osob ve Vyhodnocení seděly.

## 2026-07-13

### Dotazník – zanoření podotázek do 2. úrovně
- `SubQuestion` v `questionnaire.ts` nově obsahuje běžné `Element[]`, takže **follow-up může mít vlastní follow-up** (v konfiguraci se držíme max. 2 úrovní). Typy `SubElement` / `SubOption` zrušeny – byly strukturálně totožné s `Element` / `Option`, takže je rekurze nahradila bez ztráty typové kontroly.
- `QuestionElement.astro` ani `Questionnaire.astro` nebylo třeba měnit: komponenta se už volala rekurzivně přes `Self` a `syncFollowUps()` hledá `input[data-followup]` napříč celým formulářem, takže hlubší zanoření funguje samo.
- Skryté follow-upy se stále `disable`nují, takže nespadnou do validace ani do odeslání – u vnořené úrovně to platí tranzitivně (skrytá úroveň 1 vypne i úroveň 2 pod sebou).

### Dotazník – nové otázky
- Doplněny otázky **Kdy přijedeš** (v den svatby / v pátek – u obou informační poznámka přes `followUp.heading` bez vstupních polí), **Stravovací omezení** (multi-choice; každá možnost rozbalí pole na jména, „Jiné" má `textarea`), tři nápojové (**nealko / alko / alko+**, u všech možnost „Jiné" s krátkým textem) a závěrečná volná **poznámka** (`textarea`).
- Birell v nealko otázce využívá **druhou úroveň zanoření** – po zaškrtnutí nabídne `single-choice` ochucený / neochucený.
- Opraveny prázdné `value` u vnořených možností otázky na přespání: všem se generovalo shodné `id`/`name` (`sleep-e0-ano-s0-`) a checkboxy se chovaly nepředvídatelně. Nově `misto` / `okoli` / `vlastni`.
- Informační poznámka u odpovědi „Ne" přesunuta do `followUp.heading` – dřív to byl `multi-choice` s prázdným `label` a prázdným polem `options`, tedy prvek, který nevykreslil nic kromě vlastního popisku.

### Layout & rozestupy
- `dotaznik` má obsah v jednom sloupci **`max-w-3xl`** stejně jako `nas-pribeh` – dřív byl omezený jen formulář a úvodní odstavec se roztahoval přes celé okno.
- Rozestup mezi otázkami zmenšen z `12` na **`8`** (`space-y-8` na formuláři, `pb-8` pod každou otázkou).
- Všechny podstránky (`dotaznik`, `nas-pribeh`, `svatebni-den`, `fotogalerie`, `ubytovani`) mají na `<section>` **`px-6 sm:px-10`**, aby obsah na mobilu nelepil na okraje displeje.

### Dotazník – podpora HTML v textech
- Popisky konfigurace dotazníku se nově renderují přes **`set:html`**, takže mohou obsahovat značky (`<a>`, `<strong>`, `<br>`, …). Dřív je Astro escapovalo a vypisovalo doslova.
- Týká se pěti míst v `QuestionElement.astro` (`element.label` u textových i výběrových prvků, `element.description`, `opt.label`, `opt.followUp.heading`) a `q.heading` v `Questionnaire.astro`.
- V `questionnaire.ts` doplněna dokumentace k typům: které popisky přijímají HTML + upozornění, že konfigurace je statická a **nesmí do ní přijít vstup od uživatele** (jinak XSS).

### Nová stránka `ubytovani`
- Založena `src/pages/ubytovani.astro` podle stejného skeletonu jako ostatní podstránky (`Layout`, `slideTransition`, `transition:name="main-panel"`, `BackButton`), zatím jen s nadpisem.
- Přidána do `Menu.astro` **pod „Svatební den"** (pořadí: Náš příběh, Svatební den, Ubytování, Fotogalerie, Dotazník).
- Odkaz „zde" v popisku otázky na přespání v `dotaznik.astro` míří na `/ubytovani` (nahradil placeholder).

### Přechody mezi stránkami – oprava „diagonálního" slidu
- Po odscrollování podstránky animace nejdřív ujela svisle a teprve pak do strany. Příčina: `<main>` má `transition:name="main-panel"`, takže prohlížeč **interpoluje geometrii** starého a nového elementu – a protože se scrolloval dokument, lišila se jejich pozice vůči viewportu o velikost odscrollování.
- Řešení: na všech podstránkách má `<main>` nově **`overflow-y-auto`**, takže scroll kontejnerem je `<main>` samo, ne dokument. Jeho box je pak vždy přesně viewport a přechod nemá co morfovat – zbude čistý horizontální slide bez ohledu na pozici scrollu.
- `TimeLine.astro` na to musel zareagovat: přidán `getScrollParent()`, progress čára čte `scrollTop`/`scrollHeight` ze **scroll kontejneru** místo z okna (s fallbackem na `window`) a `scroll` posluchač visí na něm. Jinak by po změně zamrzla na nule.
- Kompromis: Astro obnovuje pozici scrollu jen pro okno, ne pro vnitřní kontejner – návrat zpět na stránku tedy vždy začne nahoře.

### Nástroje
- Založen projektový skill **`.claude/skills/summary/`** – shrne aktuální session a zapíše ji do tohoto changelogu ve zdejším stylu.

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
