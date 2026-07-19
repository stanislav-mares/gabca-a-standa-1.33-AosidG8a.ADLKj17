# Changelog

## 2026-07-19

### Svatební den – zhuštění a rozsvěcení celých sekcí
- **Vertikální rytmus timeline výrazně zhuštěn** (cca na třetinu): gap článku `gap-16` → `gap-6`, oddělovací linka `h-24` → `h-12`, padding podnadpisů `py-16 md:py-24` → `py-4 md:py-6`.
- Spolu s časem se nyní **rozsvěcí i podnadpis programu** — `<h3>` dostal třídu `story-title`, výchozí ztlumení `text-ink/25` a stejný barevný přechod; scroll skript přepíná `.story-year` i `.story-title` najednou.
- **Logika aktivní sekce přepsána**: místo „poslední sekce, jejíž horní hrana překročila polovinu obrazovky" svítí sekce, **jejíž střed je nejblíž polovině obrazovky**. Po zhuštění řádků totiž původní pravidlo dávalo sekcím nerovnoměrné úseky scrollu — druhá sekce se aktivovala hned prvním pixelem a vzápětí ji přebila třetí (probliknutí). Pojistka: při `scrollTop === 0` svítí vždy první sekce.

### Styly a odsazení napříč stránkami
- **Nadpisy h1 zvětšeny** — `--text-heading` v `global.css` `4.5rem` → `5.25rem` (jediné místo, platí pro všech 5 podstránek).
- **Obsah všech podstránek posunut o 2 rem níž** od nadpisu: `svatebni-den` a `nas-pribeh` `pt-12` → `pt-20`, `fotogalerie` `mt-16` → `mt-24`, `ubytovani` `mb-8` → `mb-16`, `dotaznik` `pt-16` → `pt-24`.

### Svatební den – harmonogram ve stylu Náš příběh
- Stránka přestavěna z prázdného nadpisu na **timeline harmonogramu dne** — záměrně **copy-paste kopie** struktury `nas-pribeh.astro` (bez sdíleného komponentu): pole položek ve frontmatteru, střídavé umístění velkého času vlevo/vpravo od obsahu na md+ gridu, `data-reveal` se stupňovaným zpožděním a stejný scroll skript (**aktivní čas se rozsvítí**, když se horní hrana sekce dotkne poloviny obrazovky).
- Místo odstavců jsou obsahem **krátké podnadpisy programu** (Snídaně, Příjezd hostů, Obřad, …, 8 placeholder položek) — `<h3>` ve `font-heading text-5xl md:text-7xl`, vycentrovaný, s výrazným paddingem `py-16 md:py-24`; časy zůstávají o stupeň větší (`text-7xl md:text-8xl`).
- Mezi sekcemi je **svislá dekorativní linka** (`w-px h-24 bg-ink/20`, `aria-hidden`) vykreslovaná v mapě mezi položkami; gap článku zvětšen na `gap-16`.
- V `id` sekcí je čas s pomlčkou místo dvojtečky (`10-30`), protože dvojtečka dělá problémy v URL kotvách a CSS selektorech.

## 2026-07-18

### Intro – zobrazení jen jednou za návštěvu
- Vstup na hlavní stranu zapíše příznak **`intro-seen` do `sessionStorage`**; při dalších návratech na hlavní stranu se intro přeskočí — `skipIntro()` nastaví rovnou usazený stav (header na místě, logo usazené, pozadí intra skryté). Přechody se při tom na okamžik vypnou a stav se commitne vynuceným reflow, takže nic neanimuje.
- Klik na logo v Headeru intro **vrátí kdykoli** — skip nastavuje identický stav, v jakém stránka končí po normálním vstupu. Mezerník/Enter se navěšují jen při skutečném zobrazení intra.
- `sessionStorage` = příznak žije po dobu prohlížečové session; po zavření prohlížeče se intro ukáže znovu.

### Intro – bez probliku po refreshi
- Skip běžel až na `astro:page-load` (po prvním paintu), takže refresh krátce ukázal intro. Řešení: **blokující inline skript v `<head>`** (`Layout.astro`) nastaví na `<html>` třídu `intro-seen` ještě před vykreslením a **CSS pojistky** okamžitě schovají overlay (`visibility: hidden`) a ukážou header s logem na finální pozici.
- Pojistky jsou vázané na `:not(.intro-leaving)` / `:not(.header-entered)`, takže po usazení stavu přestanou platit samy; `skipIntro()` navíc třídu z `<html>` sundá, aby po návratu do intra klikem na logo overlay neschovávaly.
- Inline skript v head se při View Transitions znovu nespouští — třída se proto nasazuje i v **`astro:before-swap`** (kryje jednosnímkový blik při klientské navigaci zpět na hlavní stranu).

### Styly
- Z `global.css` odstraněn zbloudilý text `Te` mezi `@font-face` bloky — syntaktická chyba tiše zahazovala celý následující blok, takže se nenačítal font **Palisade**.

### Intro – text „Vstoupit" místo šipky
- `ForwardButton.astro` smazán. Nahrazuje ho text **„Vstoupit"** vycentrovaný na střed obrazovky (`absolute left-1/2 top-1/2`), písmo **Alex Brush** ve velikosti `text-hero`, barva `text-ink`, hover šedá s 300ms přechodem. Klik dál odchytává celý overlay, tlačítko je vizuální vodítko.
- Z intra se dá projít i **mezerníkem/Enterem** — `keydown` listener na dokumentu, `preventDefault` řeší scroll mezerníkem i dvojité spuštění přes fokusované tlačítko. Platí jen pro první zobrazení intra; po návratu z hlavní strany se pokračuje výhradně klikem (listener se znovu nenavěšuje).
- Text má **vlastní rychlejší fade** (0,4 s) než zbytek prolnutí; při návratu do intra se naopak objeví až ke konci (delay 0,8 s), aby nenaskočil do ještě běžícího crossfadu.

### Intro ↔ hlavní strana – obousměrný přechod
- Klik na **logo v Headeru vrací zpět do intra** — reverz vstupní animace (header odjede vlevo, logo odletí doprostřed, černobílá fotka se prolne zpět). Logo je proto obalené tlačítkem `#header-logo-btn`.
- Skript v `Intro.astro` refaktorován na symetrickou dvojici `enterMain()` / `backToIntro()`; overlay se po vstupu **už nemaže z DOM**, jen zůstává skrytý s `pointer-events: none` — jinak by nebylo kam se vracet.
- Výpočet přeletu sjednocen do `flightTransform(headerAtFinal)`: při vstupu kompenzuje vysunutý header přičtením šířky panelu, při návratu měří finální pozici. Před zpátečním letem se pozice **přeměřuje z aktuálního DOM** (FLIP — logo se bez animace přisadí na headerové), takže resize okna mezi tam a zpět nerozhodí cíl.
- Guard `animating` proti klikům uprostřed animace; resetuje se přes `transitionend` na pozadí intra. Chybějící overlay na podstránkách už neloguje error — je to očekávaný stav.

### Intro – logo „odlétá a usadí se" (opacity handoff)
- Neprolíná se celý overlay, ale jen **vrstvy pozadí** (`.intro-bg`: podklad `bg-surface`, černobílá fotka, gradient). Kořen overlaye musí zůstat průhledný — jeho `bg-surface` jinak po vstupu trvale překrýval celou stránku béžovou (vypadalo to jako header roztažený přes celou stranu).
- Letící logo při odchodu **nemizí, jen zprůhlední na 80 %** a v této podobě zůstává sedět na panelu. Headerové logo se pod ním objeví až po dosednutí (0,3 s fade s delay = délka letu) a jen ho „doostří" na 100 % — crossfade dvou identických log uprostřed letu problikával, tohle předání nemá co probliknout. Při odletu headerové logo naopak zhasne hned.
- Délka celé animace zrychlena z 1,5 s na **1,2 s** (jednotně: prolnutí, přelet, nájezd headeru, delay doostření).

### Písmo Alex Brush – menu, nadpisy, config
- Přidán Google Fonts import **Alex Brush** a `--font-alexbrush` do `@theme`.
- **Menu** přepnuto na Alex Brush; zrušeny `italic` a `font-extralight` (font má jediný řez, kurzíva by byla jen umělý sklon). Položky zvětšeny na `text-6xl xl:text-5xl 2xl:text-[3.75rem]`.
- **Nadpisy podstránek** (všech 5 h1) přepnuty z WindSongu na sémantické tokeny `font-heading text-heading`: v configu `--font-heading` nově `'Alex Brush'` a `--text-heading` 4,5 rem (dřív 1,875 rem, nikde nepoužito). Styl nadpisů se teď ladí na jednom místě; z h1 padl neúčinný `font-light`.

### Header
- Logo zvětšeno **320 → 440 px** (cíl přeletu se měří za běhu, animaci to nerozhodilo).
- Odstraněn neuzavřený pozůstatkový tag `<h1>` kolem loga.

## 2026-07-17

### Intro – logo a šipka vedle sebe
- Layout přestavěn: logo a šipka jsou spolu ve **flex kontejneru přes levou polovinu obrazovky** (`xl:w-1/2`, na menších `w-full`), vycentrované s `gap-8`. Předchozí ladění polohy paddingem (`pl-*`) tím padlo.
- `ForwardButton.astro` zjednodušen na samotný znak `>` se stylováním — už není absolutně roztažený přes pravou třetinu obrazovky. Klikací plocha se nezmenšila: **klik odchytává celý overlay**, tlačítko je jen vizuální vodítko.
- Animovaný wrapper `.intro-logo` nově obaluje **jen logo**, takže při odchodu letí do headeru pouze logo a šipka zůstává na místě (zmizí s overlayem).

### Intro → Header – příjezd panelu zleva
- Header startuje vysunutý o svou šířku vlevo (`translateX(-100%)`) a klik na intro mu přidá `.header-entered` — **přijíždí souběžně s crossfadem** (shodných `1.5s ease-in-out`). Horizontální scrollbar nevzniká, `<main>` má `overflow-hidden`.
- Cíl letícího loga se měří v okamžiku, kdy je panel ještě mimo obrazovku, proto se k naměřené pozici **přičítá šířka panelu** — logo přistane na finální pozici headerového loga, ne mimo obrazovku.
- Přidán guard proti dvojkliku během animace (`intro-leaving`): druhý klik by přeměřil pozice uprostřed přejezdu a rozhodil cíl transformace.

## 2026-07-15

### Náš příběh – roky reagující na scroll
- Roky zvětšeny a ztučněny (`text-7xl md:text-8xl font-bold`); na md+ jsou vertikálně **vycentrované vedle svého odstavce** (`md:self-center` v gridu).
- Nový skript ve stránce: **aktivní rok se rozsvítí, jakmile se horní hrana jeho sekce dotkne poloviny obrazovky** — aktivní má `text-ink`, ostatní zašedlé `text-ink/25`, přepnutí plynulé přes `transition-colors`. Na startu vždy svítí první rok; řeší se prostým scroll handlerem (rAF throttle) na scrollujícím `<main>`, s re-inicializací přes `astro:page-load` a úklidem listeneru kvůli View Transitions.
- `<article>` dostal **`pb-[50vh]`** (stejný trik jako dotazník), aby i poslední sekce mohla vyjet nad aktivační linii a šel „hitnout" každý rok.

### Layout podstránek – odsazení a nadpisy
- Horní padding `<main>` na všech 5 podstránkách zvětšen **`pt-15` → `pt-32`**, obsah pod nadpisem má navíc jednotné odsazení 4 rem (`pt-16` u článku v nas-pribeh a wrapperu dotazníku, `mt-16` u mřížky galerie).
- Nadpisy `<h1>` sjednoceny na **`font-windsong text-7xl font-light tracking-wider`** (dřív `text-title` ~3 rem v Poppins). Proměnná `--text-title` v theme záměrně nezměněna — sdílí ji Countdown, BackButton a CeremonyDate.

### Menu
- Položky hlavního menu nově **kurzívou** (`italic`, pravé kurzívní řezy Poppins).

### Přechody stránek – postupné vynořování obsahu
- Nové keyframes `reveal-fade-up` + pravidlo `[data-reveal]` v `global.css`: 1 s `ease-out`, fill `both`, zpoždění přes CSS proměnnou `--reveal-delay` (výchozí 0,2 s). Funguje díky tomu, že **snapshot nové stránky je při View Transition živý** – animace prvků startují vložením do DOM (= swap) a běží souběžně se slidem, takže se obsah poskládá během příjezdu panelu a doběhne krátce po něm. Vědomě běží i při úplně prvním načtení webu (bez JS guardu); `prefers-reduced-motion` animace vypíná.
- Rozmístění po stránkách: `nas-pribeh` – nadpis (0,2 s), časová osa (0,3 s) a bloky textu odstupňované `0,3 + i × 0,12 s`; `dotaznik` – nadpis → úvodní odstavec (0,35 s) → formulář jako celek (0,5 s; jednotlivé otázky se nestupňují, většina je pod foldem); `svatebni-den` – zatím jen nadpis.
- `fotogalerie`: dlaždice mozaiky odstupňované po 0,06 s se **stropem 0,8 s** – prvních ~8 fotek se skládá postupně, zbytek (pod foldem) už nečeká déle.
- **Odchozí stránka fade nemá**: stará stránka je při přechodu statický screenshot, opacity na něm bledne i s pozadím panelu, což vypadalo špatně (vyzkoušeno a vráceno). Content-only fade-out by vyžadoval JS zdržení navigace přes `astro:before-preparation` – zatím nerealizováno.

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
