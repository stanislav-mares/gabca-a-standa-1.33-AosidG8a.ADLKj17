# Changelog

## 2026-08-02

### Stránka ubytování: informace o objektech

- Pod nadpis přibyl **úvodní text** — odvoz na ubytování, snídaně, rozdělení kapacit podle dotazníku a rozvoz domů — v `max-w-3xl` s `.paragraph`. Reveal kaskáda stránky je nově 0.7 s text → 0.85 s nadpis → 0.95 s vyhledávání → 1.1 s mřížka domů.
- Nad vyhledávání jména hosta přišel **h2 „Kde spím?"** ve stylu sekčních nadpisů z `svatebni-den` (`text-subheading text-accent`); nadpis domu má oproti tomu podtržení a `text-ink`, což by na sekční předěl bylo příliš.
- `HouseColumn` dostal props **`address`, `mapUrl` a `info`**, data sedí v konfiguraci `houses` v `ubytovani.astro` (adresy, sdílecí odkazy z mapy.com, ceny za osobu). Každá položka se vykreslí, jen když je vyplněná, takže rozpracovaná konfigurace stránku nerozbije.
- Uvnitř domu je **nadpis nahoře bez horní výplně** a pod ním odrážkový seznam **Adresa / Mapa / Cena** s tučnými popisky, zarovnaný doleva a o stupeň menší (`text-body`). Odkaz vede na mapy.com pod textem „Ukázat na mapě".
- Horní část domu je **podbarvená `bg-ink/5`** a stejný odstín dostala i střecha (`fill-ink/5` na polyline — otevřená polyline se pro výplň uzavírá sama). `-mx-block px-block` protahuje podbarvení až k bočním linkám, takže na výplň střechy navazuje bez švu.
- Podbarvený blok odděluje od seznamu hostů `<hr class="-mx-block border-t border-current">`; barvu i tloušťku bere ze stejného `currentColor` jako rám domu, takže na něj navazuje.

### Header: postupný náběh obsahu po příchodu z Intra

- Podnadpis a položky menu dostaly `data-reveal` (mechanismus z `global.css`) s delayem počítaným **od kliknutí na „Vstoupit"**: podnadpis 1.3 s, položky 1.45 s s krokem 0.08 s. Sekvence tedy navazuje na dosednutí letícího loga v 1.2 s.
- Animace visí na třídě **`header-revealing`** — `#main-header:not(.header-revealing) [data-reveal] { animation: none }`. Bez třídy se animace vůbec nenasadí, takže po refreshi i po návratu z podstránky je panel rovnou usazený a pravidlo pro `prefers-reduced-motion` z `global.css` zůstává funkční. Nasazením třídy se `animation-name` mění z `none`, což je přesně moment startu — pauzování přes `animation-play-state` by odpočet delaye jen zmrazilo, ale nešlo by ho restartovat.
- Sundáním třídy se animace zahodí a dalším vstupem se nasadí znovu od nuly, takže **stagger funguje i při druhém průchodu intrem** bez ručního resetu přes reflow. Třídu nasazuje jen `enterMain()`, `backToIntro()` ji sundává.
- **Dvojí opacity gate v headeru**: `#header-logo-btn` se prolíná rovnou s vjezdem panelu (drží tím odchodový fade i pro podnadpis), nový obal `#header-logo` má vlastní fade se zpožděním 1.2 s, protože čeká na dosednutí letícího loga. Dokud bylo obojí na tlačítku, nemohl podnadpis naskočit dřív než logo. `skipIntro()` vypíná přechody na obou.
- Posun položek o 1 rem se počítá do scrollovací oblasti panelu menu, takže na dobu animace naskakoval **scrollbar** a jeho šířka cukla obsahem. Po dobu náběhu má proto `.menu-scroll` `overflow: hidden` a `endRevealWhenDone()` v `Intro.astro` sundá třídu, jakmile vše doběhne — konec zjišťuje z `getAnimations({ subtree: true })` a `Promise.allSettled(…finished)`. Při `prefers-reduced-motion` je pole prázdné, promise se splní hned a panel nezůstane bez scrollu; čítač `revealRun` brání tomu, aby doběhlá promise sundala třídu už dalšímu průchodu.

### Header: velikosti drží od Full HD nahoru konstantní proporci

- Logo (`maxHeight="min(50svh, clamp(263px, 13.7vw, 525px))"`), podnadpis (`max-w-[clamp(511px,26.6vw,1020px)] mx-auto`) i text menu (strop `clamp(2.25rem,1.875vw,4.5rem)` uvnitř stávajícího clampu) mají nově **fluidní strop místo pevného**. Od FHD nahoru tak každý drží stálý podíl na šířce okna (13.7 % / 26.6 % / 1.875 %) a kompozice vypadá stejně na FHD, 2K i 4K; nad 4K se růst zastaví.
- Na FHD to znamená zmenšení zhruba o čtvrtinu — referencí je proporce z 2K, kde byly prvky vůči oknu menší. Nahrazuje to strop `3.75rem` u menu z 2026-08-01.
- Podnadpis byl do té doby jediný, kdo rostl úplně bez omezení (`w-full` uvnitř panelu o 40 % šířky okna).

### Header: svislé centrování na všech šířkách

- Auto-marginy skupiny logo + menu přišly o prefix `sm:`. Pod 640 px se vypínaly a obsah skákal na `justify-start`; auto-margin se při přetečení stejně srazí na nulu, takže se na nízkých displejích nic neuřízne.

### Intro: logo a „Vstoupit" jako jedna skupina

- Tlačítko se přestěhovalo dovnitř kontejneru s logem (`flex-col items-center gap-block`), takže sedí pod logem na střed. Odpadlo absolutní pozicování včetně `top-[calc(82.5% + var(--intro-logo)/4)]`.
- Umístění skupiny: od **1300 px** poloviční šířka u levého okraje (= čtvrtina šířky stránky) s posunem `translate-y-[10svh]`, pod prahem na střed s `translate-y-[25svh]`, čímž střed skupiny padne na 75 % výšky, tedy doprostřed spodní poloviny. Posun je v `svh`, ne v `%` — kontejner je kvůli `items-center` na overlayi vysoký jen jako obsah, takže `%` by měřilo skupinu, ne stránku.
- `--intro-logo` se přesunulo z inline stylu do scoped `<style>`, protože inline styl neumí media query: pod 1300 px je logo menší (`min(33svh, 90vw)`), aby se skupina s tlačítkem do spodní poloviny vešla celá.

## 2026-08-01

### Dotazník: formulace pro celou rodinu a volba „Jiné"

- Otázky nově počítají s tím, že formulář vyplňuje jeden člověk za pár nebo rodinu („Dorazíš / dorazíte", „Máš / máte nějaké stravovací omezení?"). Úvodní text je kratší, popisky u jména, e-mailu a velikosti porcí konkrétnější.
- Účast i přespání mají třetí možnost **„Jiné" s volným textem**. Ano/ne nepokrývalo případy typu „obřad nestihnu, ale na párty budu" nebo „přijedu obytňákem".
- U přespání zmizel mezikrok s výběrem místo / blízké okolí / vlastní stan a zůstal rovnou jmenný checklist — varianty pokrývá to nové „Jiné". Popis odkazuje na `svatebni-den` i `ubytovani`.

### Vyhodnocení v Apps Scriptu sladěné s otázkami

- `vytvorVyhodnoceni` je natvrdo šitá na konkrétní klíče otázek, takže každá změna dotazníku znamená i zásah tady. Sekce **ÚČAST** a **PŘESPÁNÍ** nově vypisují volbu „Jiné" včetně textu odpovědi (`arrival-e0-jine-s0`, `sleep-e0-jine-s0`) — samotný počet by bez obsahu nic neřekl.
- Tři bloky pro místo / okolí / stan nahradil jeden nad `sleep-e0-ano-s0`. Počet osob se u „Chce přespat" bere ze **jmenného checklistu**, ne z celého odeslání: host vyplňuje za rodinu, ale přespat může chtít jen část z ní.
- Staré sloupce `sleep-e0-ano-s0-misto/okoli/vlastni` zůstávají v listu Odpovědi i s daty z testovacích odeslání; vzorce je ignorují, takže se nemusí mazat. Chybějící sloupec u nové možnosti znamená nulu, ne chybu — vyhodnocení jde spustit i dřív, než dorazí první taková odpověď.

### Písmo Cormorant přes `astro:fonts`

- Obě rodiny (**Cormorant** i **Cormorant Garamond**) se stahují při buildu a servírují z vlastní domény, ne přes `@import` na `fonts.googleapis.com` jako starší rodiny — odpadá tím blokující požadavek na cizí doménu a Astro přidá metrikami dopočítaný fallback, takže se při načtení nehne layout.
- Konfigurace je v `astro.config.mjs` sdílená pro obě rodiny: váhy 400 a 600, normální i kurzíva, subsety `latin` + **`latin-ext`** (bez něj chybí česká diakritika). Cormorant je variabilní font, takže z toho vzejde 8 `.woff2` souborů, ne 16.
- `<Font>` se importuje z **`astro:assets`**, ne z `astro:fonts` — druhá varianta shodí build na nevyřešeném importu.
- V `@theme` jsou tokeny `--font-cormorant` a `--font-cormorant-garamond` navázané na proměnné z Astra. Musí se jmenovat jinak než ty proměnné, jinak by `var()` odkazoval sám na sebe. Použití: `class="font-cormorant"`.

### Fluidní škály přestávaly růst moc brzy

- `--spacing-cluster` mělo strop 2,5 rem, na který se trefilo už při šířce okna 1650 px — nad tím byl padding headeru pevný. Strop je nově **3,5 rem** (doběhne kolem 2410 px).
- Totéž u typografie: `--text-heading` 5,25 → **6,5 rem**, `--text-subheading` 3,5 → **4,25 rem** (dřív se zastavilo na 1533 px, tedy prakticky na `2xl`), velikost menu 3 → **3,75 rem** (dřív přesně na 1920×1080).
- Spodní meze zůstaly beze změny, takže na mobilu a běžném notebooku se nic nezměnilo — jinak se chová jen pásmo nad ~1500 px.

### Úvodní stránka se láme na `md` místo `xl`

- Panel s headerem se roztahoval přes celou stránku všude pod 1280 px; nově je to jen pod **768 px** (`index.astro`), a stejný bod dostalo i `Intro.astro` — polovina obrazovky pro letící logo a pozice tlačítka „Vstoupit". Kdyby se ty dva rozešly, kompozice intra by neseděla na panel, do kterého logo přilétá.

### Header: svislé centrování

- Od `sm` se celá skupina (logo, podnadpis, menu) centruje na výšku — blok s logem má `sm:mt-auto`, kontejner menu `sm:mb-auto`. Kontejner menu zároveň přišel o `flex-1`; ten dřív spolkl všechno volné místo, takže logo nemělo kam ustoupit.
- Auto-marginy místo `justify-center` záměrně: kontejner scrolluje a auto-margin se při přetečení srazí na nulu, kdežto centrování by odsunulo horní okraj mimo dosah scrollu.

### Header úvodní stránky

- Pod logo přibyl **podnadpis** (`podnadpis.svg` — „Gabča & Standa / 26. září 2026") přes celou šířku panelu. Sedí **uvnitř `#header-logo-btn`**, protože to tlačítko nese celou choreografii opacity z intra (fade-in po dosednutí letícího loga, vypnutí přechodů v `skipIntro()`); jako samostatný sourozenec by svítil v panelu už během letu a při refreshi problikl. V DOM musí zůstat **za logem** — `Intro.astro` bere první `<img>` v headeru jako cíl přeletu. `loading="eager"`, protože header startuje odsunutý mimo viewport a lazy by obrázek dotáhl až po vjezdu.
- Rám headeru: `justify-evenly` → **`justify-start` + `p-cluster`**, podnadpis má `py-cluster`, takže jeho mezery sedí na okraje panelu.
- Logo se zmenšuje přes **`maxWidth="50%"`, ne přes `vw`**. Panel má na `xl`/`2xl` 40 % šířky okna, takže jakákoli `vw` mez pod ~35vw se tam neuplatní a velikost stejně určí `max-w-full` — snižování `72vw` → `45vw` nedělalo na širokém okně vůbec nic. Procenta se počítají vůči tlačítku, tedy vůči panelu bez paddingu.
- Kontejner menu je **`flex-1 min-h-0`** se scrollem; nav se centruje **`m-auto`**, ne `justify/items-center` na obalu — v scrollovacím kontejneru by centrování přes `align-items` odsunulo přetékající obsah mimo dosah scrollu, kdežto auto-margin se srazí na nulu.

### Menu

- **Čárky po stranách položek odstraněny** (`ruleBase` i oba `<span>`). Z hoveru zbylo přebarvení `text-muted → text-ink` a jemné zvětšení písma.
- Fluidní velikost přepočítána na **`clamp(1.6rem, 0.5rem+1.15vw+1.65vh, 3rem)`**. Menší základ a hlavně jiný strop: původní se trefoval zhruba na 1536×900, takže nad `2xl` už písmo nerostlo. Nový nechá růst dál, zastaví se kolem 1920×1080.
- Svislé mezery položek na **polovinu `tight`** (`py-[calc(var(--spacing-tight)/2)]`) — odvozeno z tokenu, ne pevné číslo.
- `px-gutter` z `<nav>` pryč, odsazení drží `p-cluster` headeru; dvojitý rám jen ubíral šířku.

### Spacing škála

- Nový token **`--spacing-cluster: clamp(1.25rem, 0.85rem + 1.6vw, 2.5rem)`**. Mezi `block` (1–1,5 rem) a `gutter` (1,5–3,5 rem) nebyl žádný stupeň, takže „o něco menší než gutter" nešlo napsat bez pevného čísla.

### Zpětné tlačítko má poloprůhledné pozadí

- Kontejner `<aside>` dostal **`bg-surface/85`** — stejná barva jako panel podstránek (`--color-surface`), jen s 85% krytím, takže obsah pod ním lehce prosvítá. Tailwind generuje i fallback `#ffffffd9` pro prohlížeče bez `color-mix`.
- Pozor na dosah: kontejner není jen mobilní lišta, **od `lg` je to celovýškový pruh vlevo** (`lg:w-40 lg:h-full`, 10 rem × celá výška). Dokud byl bez pozadí, byla to neviditelná klikací plocha. `ubytovani` a `fotogalerie` mají mřížky přes celou šířku a ty pod pruh zasahují, takže levý sloupec domů i první sloupec fotek jsou nově zčásti překryté.
- Opraven chybějící **`</button>`**. Tlačítko se nikdy nezavíralo a implicitně ho uzavíral až `</aside>`, takže `<svg>` byl jeho posledním potomkem jen náhodou.

### Fluidní spacing škála

- Do `@theme` přibylo šest tokenů `--spacing-*` (`gutter`, `top`, `heading`, `section`, `block`, `tight`). Typografie fluidní už byla (`--text-heading`, `--text-subheading`), ale **mezery zůstávaly pevné** — mezi 375 px a 2560 px se nehnuly, takže se obsah na velkém monitoru ztrácel v prázdnu a rytmus stránky závisel na tom, který breakpoint zrovna platil.
- Tailwind 4 vyrábí z namespace `--spacing-*` celé rodiny utilit, takže z tokenů rovnou plyne `px-gutter`, `pt-top`, `gap-section`, `mb-heading` i `scroll-mt-top` — nic se nikde nedeklaruje zvlášť.
- **Spodní meze sedí na dosavadní mobilní hodnoty** (`gutter` 1.5rem = `px-6`, `section` 2.5rem = `gap-10`, `block` 1rem = `gap-4`), takže se na telefonu nic nezmenšilo; škála roste jen nahoru.
- `--spacing-top` má minimum 5rem záměrně: pod ním leží mobilní lišta `BackButton` (`h-16`, 4 rem) a obsah by pod ni zajel.
- Tokeny pro sloupcovou mezeru a doběh se **nezakládaly**. Sloupcová mezera širokých mřížek jede na `section` a doběh zůstal literál `pb-[50vh]` — ten je viewport-relativní, takže fluidní je sám o sobě.

### Jednotný odstavec

- Nová třída **`.paragraph`** v `@layer components` (`text-paragraph` + `leading-relaxed`). Odstavce byly rozjeté do čtyř variant: `uvodni-informace` mělo `text-paragraph leading-relaxed`, `nas-pribeh` totéž plus `text-justify`, `dotaznik` **jinou velikost** `text-lg` a `svatebni-den` nemělo velikost vůbec.
- `text-justify` padlo z celého webu. Bez dělení slov dělá justifikace v češtině nepravidelné mezislovní mezery a „řeky", nejvíc v úzkém sloupci na mobilu.
- Margin zůstává nulový z preflightu a svislé rozestupy drží výhradně `gap-block` na rodiči. Kdyby odstavec nesl vlastní margin, ve flex sloupci by se s gapem sčítal a každý blok by odsazoval jinak.

### Rámec podstránek

- Všech šest stránek jede na stejný vzorec `pt-top` → `px-gutter` → `pt-heading` → `gap-section` → `gap-block`. Dřív se rozcházelo skoro všechno: mezera pod nadpisem `pt-20` proti `mb-20` na `ubytovani`, rozestup sekcí `gap-12` / `gap-10` / `gap-6` / `2xl:gap-14`.
- Sjednotil se i doběh pod obsahem: `ubytovani` mělo `pb-24`, `fotogalerie` `pb-16`, zbytek `pb-[50vh]`. Nově `pb-[50vh]` všude.
- Široké mřížky na `nas-pribeh` a `svatebni-den`: `2xl:gap-x-24` → `2xl:gap-x-section` (6 rem → fluidních 2,5–4,5 rem), `scroll-mt-24` → `scroll-mt-top`.
- Přepsaná je i **zakomentovaná timeline** ve `svatebni-den`. Po odkomentování by jinak přinesla pevné mezery zpátky.
- Beze změny zůstalo `md:px-40` a `2xl:w-3/4` na fotogalerii — řídí šířku mozaiky, ne okraj stránky.

### Komponenty

- `HouseColumn` dostal **`px-block`, ne `px-gutter`**. Fluidní gutter je na 768 px široký 35 px proti dosavadním 24 px, takže by na text zbylo 253,7 px — a „Továrníkova vila" měří 6,01 em × 43,2 px = **259,6 px**, tedy by se zalomila. `px-block` dá 287 px. Komentář v komponentě je přepsaný na tuhle podmínku; pořád platí i strop škály `text-subheading`.
- `GrainIcon` má výchozí rozestup `mt-heading mb-section`, `PageHeading` čárky `gap-tight sm:gap-block`.
- `Menu`: `px-6` → `px-gutter`, `py-2 md:py-3` → `py-tight` (8–12 px, tedy přesně dosavadní rozsah bez breakpointu). Čárky `w-10` zůstaly **pevné** — krátí se přes `scaleX` a fluidní šířka by přeskládala řádek.
- Dotazník přešel na tokeny, ale **tlačítka si nechala `px-8 py-3`**. `px-section` by jim na širokém monitoru nafouklo boční padding na 72 px; fluidní má být rozvržení, ne vnitřek ovládacího prvku.
- Jmenné checklisty se generují v JS, takže `label.className` v `Questionnaire.astro` musí zrcadlit statické volby v `QuestionElement.astro` — obojí je teď `gap-tight` a je u toho poznámka.

### Tailwind skenuje i changelog

- V CSS se pořád generuje `w-[calc(50%-2rem)]`, i když ta třída v kódu už není. Tailwind 4 hledá názvy tříd v celém projektu včetně `context/CHANGELOG.md`, takže **si je bere z prózy tohohle souboru** (zmínka na řádku o responzivitě Ubytování). Pár bajtů mrtvého CSS; existuje to nezávisle na téhle změně.

## 2026-07-31

### Typografie h2 — jedna škála pro celý web

- `--text-subheading` přepsán z `clamp(2rem, 4vmin, 2.875rem)` na **`clamp(2.5rem, 1.9rem + 1.67vw, 3.5rem)`** (40 → 56 px). Kotva je nově **šířková, ne `vmin`** — cíl „na 2xl přesně tolik" jde přes `vmin` garantovat jen při známé výšce okna.
- Sklon je dopočítaný tak, aby křivka **končila přesně na 1536 px**. Při pouhém stažení stropu by se trefil už kolem 1346 px a mezi xl a 2xl by zbyl rozdíl 1 px.
- Spodní mez 2.5rem platí od ~577 px níž. Výš jít nejde: „Továrníkova vila" má 6,01 em, takže na 375px telefonu se při 44 px zalomí.
- Názvy domů v `HouseColumn` opustily vlastní breakpointy (`text-[3.125rem] md:text-[2.5rem] 2xl:text-6xl`) a jedou po téhle škále. Na md tím vyrostly 40 → 43 px, na mobilu klesly 50 → 40 px, což zároveň odstranilo zalomení nejdelšího názvu na úzkých telefonech.
- Nadpisy domů dostaly **podtržení** `underline decoration-[0.05em] underline-offset-8`. Tloušťka v `em`, ne v px, aby držela poměr k písmu přes celý fluidní rozsah; offset odsouvá linku pod dolní dotahy Parisienne.

### Nadpisy podstránek se na mobilu nezalamují

- `PageHeading`: `<h1>` dostal `whitespace-nowrap` a čárky ztratily `shrink-0` (nově `min-w-0`) — **role se prohodily**. Dřív byl jediným zmenšitelným prvkem nadpis, takže flex řešil nedostatek místa zalomením textu; teď ustupují čárky a krátí se zevnitř ven, s vnějším koncem na kraji řádku.
- Mezera `gap-5` → `gap-3 sm:gap-5`, protože gapy se ve flexu nezmenšují a na 320px displeji je to 16 px rezervy. Obal dostal `w-full`, aby šířka řádku byla padding box rodiče — sekce používají `items-center`, takže obal byl jinak `fit-content` a závisel na nastavení rodiče.
- Nadpis může při extrémní délce přetéct vodorovně. Je to vědomá volba proti `overflow-hidden`, které by ořízlo text z obou stran.

### Menu — „Kde, kdy, jak?" a fluidnější velikost

- Položka „Úvodní informace" přejmenována na **„Kde, kdy, jak?"** v menu i jako `<h1>` stránky; slug `uvodni-informace` zůstal. Stránka na ty tři otázky přesně odpovídá a název byl s 16 znaky nejdelší v menu, takže sám diktoval šířku panelu (`w-max`).
- Velikost položek z `clamp(1.7rem, 5.46vmin, 3.05rem)` na **`clamp(1.9rem, 0.6rem + 1.4vw + 2vh, 3rem)`**. `vmin` i `min(vw, vh)` nechávají vždycky rozhodovat jen jednu veličinu, takže při tažení za okraj okna vzniká pásmo, kde se nemění nic — **aditivní tvar drží obě živé**.
- Spodní mez 1.7 → 1.9rem, na telefonu tedy 27 → 30 px (viditelně ~29 px, položky jedou v klidu na `scale-[0.952]`).
- Zbytek dead zone: strop 3rem se na 950px vysokém okně trefí kolem 1386 px šířky a nad tím velikost zase stojí.

### Ubytování — velikost názvů domů

- Tři domy vedle sebe až od **2xl** (dřív od `lg`). V třísloupcovém layoutu se kolem 1500 px zalamoval nejdelší název. S prahem se posunulo i pravidlo pro osamocený třetí dům (`md:max-2xl:*`) a řádek s vyhledáváním.
- Velikost `h2` už neřídí `vw`, ale breakpointy: **50 px do xl, 40 px od md, 60 px od 2xl**. Propad na md je záměrný — tam se přepíná na dva sloupce a ty jsou nejužší místo celého webu. Vnitřní padding sloupce se od md zužuje `px-8` → `px-6`, aby na nadpis zbylo víc místa.
- Meze jsou spočítané z **reálných metrik Parisienne** (parser `hmtx`/`cmap` nad TTF z Google Fonts), ne odhadem: „Továrníkova vila" měří **6,01 em**, tj. 0,376 em na znak. Původní odhad 0,45 em/znak byl o pětinu mimo a vedl k chybnému závěru, že se 60 px na 2xl nevejde — vejde (strop je 63 px).
- Zbylé pásmo, kde se nejdelší název zalomí na dva řádky: **pod ~413 px** šířky okna. Bez zalomení kdekoli by musel být nadpis 41 px.

### Úvodní informace — doprava, parkování, přeskládání

- Nová sekce **Doprava**. Pořadí nadepsaných sekcí: Svatební den → Dresscode → Svatební dary → Doprava → Parkování → Ubytování → Dotazník.
- Trasy A a B nejsou tlačítka, ale **iframy z mapy.com** (sdílecí odkazy `mapy.com/s/…` z „Vložit na web"). Plné URL aplikace mapy.com se do iframu vložit dají (mapy.com neposílá `X-Frame-Options` ani `frame-ancestors`), ale načtou celé rozhraní včetně cookie lišty — proto sdílecí varianta.
- Adresa místa konání je odkaz na **POI na mapy.cz** (`source=firm&id=13923489`); id je vytažené z cíle obou tras.
- **Plánek parkování** jako `<Image>` se zvětšením. `interface Section` má nové pole `image` (zdroj, `alt` a rozměry velké varianty pro lightbox).
- Opravena sekce, která měla dvakrát klíč `paragraphs` — druhý ten první přepsal, takže se text o obřadu ve 12:00 vůbec nevykresloval.

### Lightbox mimo galerii

- Logika velké varianty (`LIGHTBOX_MAX_WIDTH = 2000`, přepočet výšky, `getImage`) vytažena z `gallery.ts` do nového **`src/utils/lightbox.ts`** jako `getLightboxSource()`. Galerie ji odtud importuje, konstanta nežije na dvou místech.
- PhotoSwipe na Úvodních informacích se váže na **`[data-lightbox]`**, ne na pevné `id` — přibude-li na stránce další obrázek, funguje dál. Init/destroy přes `astro:page-load` / `astro:before-swap` jako v galerii.

### Typografie h2

- Nový token **`--text-subheading`** `clamp(2rem, 4vmin, 2.875rem)` (32 → 46 px) místo `text-3xl md:text-4xl`. `vmin` ze stejného důvodu jako u `--text-heading` — velikost drží po otočení telefonu.
- Časové osy na `nas-pribeh` a `svatebni-den` (`text-4xl md:text-6xl 2xl:text-8xl`) zůstaly beze změny. Nejsou to nadpisy sekcí, ale letopočty a časy.

### Nadpisy podstránek — čárky místo podtržení

- Podtržení (`underline decoration-2 decoration-accent underline-offset-8`) sundáno ze všech šesti `<h1>` a nahrazeno **vodorovnými čárkami po obou stranách**, stejným receptem jako v hlavním menu (`h-px`, `bg-muted/30`) — jen bez hover chování, nadpis na kurzor nereaguje.
- Vyčleněno do nové komponenty **`PageHeading.astro`**, takže rozměry (`w-12 sm:w-16`, `gap-5`) jdou ladit na jednom místě. Čárky jsou delší než v menu, protože nadpis je proti položce menu zhruba 1,7× větší.
- **`data-reveal` sedí na obalu, ne na `<h1>`** — na nadpisu by se čárky ukázaly hned a naskakoval by jen text.
- Prop `class` pokrývá jedinou odchylku: na `ubytovani` má nadpis navíc `mb-20`.

### Dotazník

- Text tlačítek „Další" / „Odeslat" **bílý** místo `text-hover` (#f7d596). Hover stav (`bg-hover` + `text-ink`) beze změny.

### Stránka „Úvodní informace" — reálný obsah

- Lorem ipsum nahrazen skutečným obsahem. Místo pole odstavců drží stránku pole **`sections`** (`interface Section`) — každá sekce má volitelný nadpis, odstavce a příznaky `map` / `routes` / `palette`, které do ní vloží mapu, odkazy na trasy nebo vzorky barev. Rozvržení tak zůstává v jedné šabloně a obsah je čistě data.
- Odstavce se renderují přes **`set:html`**, aby v textu fungovaly `<strong>` a odkazy — v interpolaci `{}` je Astro jinak escapuje. Obsah je statický a psaný ručně, nikdy sem nesmí vstoupit uživatelský vstup.
- Vnitřní odkazy (Ubytování, Dotazník) se skládají z **`import.meta.env.BASE_URL`**, ne z absolutní cesty — web běží na GitHub Pages pod `base: '/gabca-a-standa-…/'`, kde by `/ubytovani` skončilo mimo web.
- **Mapa místa konání** jako `<iframe>` na `maps.google.com/maps?q=…&output=embed` — tahle varianta nepotřebuje API klíč a přijme adresu místo souřadnic. `loading="lazy"`.
- **Doporučené trasy** jako dva odkazy do Map Google (`/maps/dir/?api=1`). Průjezdní bod je zatím prázdný (`via: ""`), takže obě trasy vedou rovnou na místo a od sebe se neliší; po doplnění obce se z nich stanou dvě různé trasy bez zásahu do kódu.
- **Vzorky svatebních barev** jako kolečka z pole `palette` — pět barev z `.colors` v `global.css` (bez `--color-6`, což je surface) v pořadí 1, 2, 4, 5 a hnědá 3 na konci. Seznam je `aria-hidden`: bez názvů barev nemá pro čtečku význam.
- Odstavce už nejsou `text-justify`, mezera mezi sekcemi `gap-10` → `gap-12`.
- Zpoždění reveal animace **zastropováno na 1,4 s** (`Math.min(0.7 + i * 0.1, 1.4)`). Sekcí je deset, s původním krokem 0,12 s bez stropu by poslední naskočila skoro dvě sekundy po nadpisu.

## 2026-07-30

### Logo v Headeru

- **`Header.astro`**: `maxHeight` `min(36svh, 360px)` → **`min(50svh, 500px)`**. Šířka loga vychází z `min(840px, 94vw, maxHeight × 1.106)` a na desktopu je **řídící právě `maxHeight`** — zbylé dva limity se neuplatní, protože panel (`xl:basis-[40%]`) je širší než výsledek. Logo tak vyrostlo z ~398px na ~553px šířky. Na mobilu je naopak řídící `maxWidth` — ten byl později týž den stažen na 72vw, viz sekci o menu.
- Cíl přeletu z Intra se měří za běhu (`getBoundingClientRect()` v `Intro.astro`), takže změna velikosti nevyžádala žádnou úpravu animace.
- **`Logo.astro`**: podklad `logo5.png` → **`logo-edit.png`** (nečtvercový ořez).
- **Pozor na rozlišení podkladu**: `logo-edit.png` má 772px na šířku, při ~553 CSS px se na 2× DPR displejích už upscaluje. Trvale to vyřeší až výměna zdroje za SVG.

### Neprůhledné panely

- `bg-surface/95` → **`bg-surface`** v `Header.astro` a na `<main>` všech šesti podstránek (`uvodni-informace`, `svatebni-den`, `ubytovani`, `nas-pribeh`, `fotogalerie`, `dotaznik`). Přes 95% krytí prosvítala fotka pozadí.
- **`global.css`**: `--color-surface` `#fafafa` → **`#ffffff`** — panely jsou nově čistě bílé, ne lomeně.

### Fotogalerie

- **Řazení podle data pořízení** místo podle názvu souboru. Datum se nečte při buildu, ale z mapy `src/data/gallery-dates.json`, kterou generuje `npm run gallery:dates` — build tak nesahá na 84 souborů, hodnoty jsou vidět v gitu a jdou ručně opravit. **Generátor nikdy nepřepíše existující nenulovou hodnotu**, aby ruční doplnění přežilo další běh.
- EXIF si `scripts/gallery-dates.mjs` parsuje sám (JPEG APP1 → TIFF → IFD), kvůli skriptu spouštěnému párkrát za rok nemá smysl držet závislost navíc. Výstup ověřen proti PIL na všech 84 souborech, 0 neshod.
- Ze 84 fotek má 78 datum v `DateTimeOriginal`, 3 jen v názvu souboru, 3 nikde — ty doplněny ručně. **`mtime` jako záloha nepřipadá v úvahu**, u všech ukazuje na okamžik nakopírování do repa.
- **Mozaika podle orientace** místo pevné výšky řádku: portrét stojí v jednom sloupci (`aspect-[3/4]`), landscape leží přes dva (`aspect-[3/2]`). Poměr drží `aspect-*`, ne výška řádku, takže tvar buňky nezávisí na šířce okna. Sbírku tvoří z 89 % formáty 3:4 a 4:3, které sednou skoro přesně — 56 z 84 fotek se neořízne vůbec, medián ořezu je nulový.
- Opraven mobil: třída `grid-cols` bez čísla není platná, galerie tam spadla na jeden sloupec s fotkami rozřezanými na 9rem pruhy.
- `isHeroPhoto()` vypadl — každá pátá fotka přes 2×2 buňky nemá v mozaice s tvary podle orientace co dělat.

### Menu — číslovaný index s bočními čárkami

- Vycentrované položky mezi dvěma krátkými čárkami. Čárky se krátí přes **`scaleX` s originem na vnějším konci, ne přes `width`** — měnící se šířka přeskládá flex řádek a vnější konec ujede dovnitř místo ven.
- **Plynulost stojí na kompozitní vrstvě**: na čárce běží jen `transform` (+ `will-change`), barva se prolíná přes `::before` a `opacity`. Když na téže 1px lince běžel zároveň `background-color`, repaint zahodil cache vrstvy a hrana skákala po celých pixelech.
- Popisek má v CSS rovnou zvětšenou velikost a v klidu se zmenšuje (`scale-[0.952]` → `scale-100`). Rastr je pak ostrý ve stavu, na který se uživatel dívá; opačné pořadí zvětšuje hotovou bitmapu a psací písmo měkne.
- **`scale` místo `letter-spacing`** — Parisienne má spojené tahy, prostrkání by písmena od sebe odtrhlo.
- Na mobilu menší: dolní mez clampu `1.7rem` (fluidní člen `5.46vmin` ji přeroste, až má kratší strana okna přes 440 px, takže od tabletu výš se nic nemění) a `py-2 md:py-3`. Logu zároveň staženo `maxWidth` na **72vw**.

### Dekorativní ikona

- Nová komponenta **`GrainIcon.astro`** — `grain.svg` jako malá ikona uprostřed dole v Headeru a na konci každé podstránky. Ryze dekorativní: `aria-hidden` na obalu a prázdný `alt`, pro čtečky prvek neexistuje.
- **`<Image>`, ne inline SVG.** Astro 6 typuje `.svg` import jako `SvgComponent & ImageMetadata`, takže by šlo obojí — ale soubor má 29 kB a je na sedmi stránkách, takže inline by znamenal sedm kopií v HTML místo jednoho cachovaného požadavku.
- Velikost po breakpointech `w-9 md:w-11 lg:w-12 2xl:w-14` (36 → 56 px). Atributy `width`/`height` odpovídají největší vykreslené velikosti a drží poměr 720:1024 — u vektoru se nahoru nemá co rozmazat, velikost řídí třídy.
- V Headeru je ikona třetí položkou flexu s `shrink-0` a rozestup jí dává `justify-evenly` — přerozdělí se tím i mezery kolem loga a menu.
- Na `nas-pribeh` a `dotaznik` sedí **uvnitř** bloku s `pb-[50vh]`, ne za ním. Ten padding drží prostor pro scroll-driven zvýrazňování a ikona za ním by se od obsahu odtrhla o půl výšky okna.

### Dotazník – jména po osobách, e-mail, rozepsaný formulář

- **`name-list`** (nový typ prvku): jména se zadávají po jednom na řádek, další přidává kulaté „+". **Viditelné inputy nemají atribut `name`**, takže je `FormData` ignoruje; do formuláře je skládá skryté pole jako text oddělený čárkou. Tvar dat je tedy stejný jako u dřívějšího jediného textového pole — tabulka i heuristika počítání osob ve `vytvorVyhodnoceni()` fungují dál beze změny. Povinné je vždy jen první jméno, i když se první řádek smaže.
- **`person-checklist`** (nový typ prvku): vykreslí se prázdný a plní se za běhu jmény ze seznamu výš přes `CustomEvent("names-change")`. Odesílá se stejným trikem — skryté pole se jmény zaškrtnutých osob. Nasazen u stravovacích omezení, ubytování a nové sekce Velikost porcí.
- **Překreslení checklistu zachovává výběr**: stavy se před přestavbou vyzobou do mapy `jméno → zaškrtnuto`, jinak by doplnění dalšího jména shodilo, co už host naklikal. Přejmenování osoby se chová jako smazání a přidání.
- **`exclusivePersons`** na výběrovém prvku: osoba smí být zaškrtnutá jen v jedné možnosti. Zapnuto u ubytování a velikosti porcí, **vypnuto u stravovacích omezení** — vegan a bezlepkář může být tentýž člověk.
- **`endsForm`** na možnosti: „Bohužel nemohu" skryje a **`disable`ne** všechny následující kroky a přejmenuje tlačítko na „Dokončit". Samotné skrytí nestačí — nevyplněná povinná pole za koncem formuláře by tiše zablokovala odeslání. Pořadí je podstatné: `syncFormEnd()` kroky odblokuje a teprve pak `syncFollowUps()` zase zavře podotázky.
- **Rozepsaný dotazník v `localStorage`** (`questionnaire-draft.ts`), ne v session — vyplňuje se na několikrát. Ukládá se plochá mapa podle `name`; u přepínačů je klíčem `název:hodnota`, protože skupina sdílí `name`. Dynamické části se rekonstruují z týchž skrytých polí, která se odesílají, takže se neukládá nic navíc. Draft se maže po úspěšném odeslání a při nedostupném úložišti (privátní režim, kvóta) se funkce tiše vypne.
- Nový typ **`email`** s nativní validací, nepovinný, pod jménem. Do nealko přibyla **Voda s citrónem**.
- Barva písma tlačítek dotazníku `text-muted` → **`text-hover`**.

### Apps Script – Vyhodnocení po osobách

- „– kdo se týká" u stravovacích omezení a ubytování se nově čte **přímo ze sloupce jmenného checklistu** (`listPersons`), ne z celého odeslání. Dřív vypisoval všechny lidi z odeslání, protože jinou informaci neměl.
- U **alergie** a **jiné** je na `-s0` doplňující text a checklist až na `-s1`; přibyl proto řádek „– co konkrétně".
- Nové sekce: **Velikost porcí** (dospělé/dětské vč. jmen) a řádek **e-maily**.
- Ověřeno skriptem, že všech 43 klíčů, na které se Vyhodnocení odkazuje, formulář skutečně generuje — `range()` u neznámého klíče vyhodí výjimku.
- **Chybějící sloupec už Vyhodnocení neshodí.** Sloupec vzniká teprve tím, že v nějakém odeslání dorazí jeho klíč — u zaškrtávátka tedy až tím, že si možnost někdo vybere. Dosud kvůli jedné nezvolené možnosti (`sleep-e0-ano-s0-okoli`) padlo generování celého listu. `range()` proto nevyhazuje výjimku, ale přes `has()` degraduje na `=0` u počtů a `="—"` u seznamů. Ověřeno simulací nad podvrženou tabulkou: kompletní sada 55 klíčů, neúplná i skoro prázdná projdou všechny.

## 2026-07-29

### Logo — nečtvercový podklad

- **`Logo.astro`**: prop `height` z `Props` **odstraněn**, výška se dopočítává z rozměrů importovaného loga (`Math.round(width * mainLogo.height / mainLogo.width)`). Volání s `width={520} height={520}` nad podkladem 1340×857 nechalo sharp resizovat s výchozím `fit: cover`, takže se logo při buildu **ořízlo** na čtverec. Volající místa (`Header.astro`, `Intro.astro`) prop přestala předávat.
- **`maxHeight` se převádí na limit šířky** — `calc(${maxHeight} * ${ratio})` v témž `min()` jako `width` a `maxWidth`. Dřív se do `min()` vkládal beze změny, tedy fungoval jako limit šířky s nesprávnou hodnotou (u čtvercového loga to vycházelo, u širokého ne).
- **Proč ne `max-height` na `<img>`**: při definitní šířce se `aspect-ratio` neuplatní a `max-height` jen zploští **box** — logo se v něm vycentruje a naměřený box neodpovídá vykreslenému logu. `flightTransform()` v `Intro.astro` počítá `scale = to.width / from.width` právě z boxu, takže letící logo dosedlo o ~11 % větší než headerové a po přeletu byla vidět **dvě loga přes sebe**. Přepočet na šířku drží box vždy těsný.
- Do inline stylu přidán `aspect-ratio` z rozměrů zdroje — zamyká poměr a slouží jako pojistka proti CLS.

### Velikosti loga a menu

- **Header logo**: `width` 380 → **840**, `maxHeight` `min(36svh, 324px)` → **`min(36svh, 360px)`**, `maxWidth` 72vw → **94vw**. Řídící hodnota je `maxHeight` (360px výšky = ~563px šířky); strop dává panel `2xl:basis-[35%]`, kde je ~110px rezervy.
- **Intro logo**: `--intro-logo` `min(600px, 88vw, 54svh)` → **`min(1000px, 96vw, 105svh)`**. `svh` limituje šířku, takže 105svh šířky odpovídá ~67svh výšky.
- **Prop `width` zvýšen na obou místech spolu s velikostí** (Header 840, Intro 1000) — neurčuje jen CSS limit, ale i **rozlišení rastru**, který Astro vygeneruje. Kdyby zůstal pod skutečnou vykreslenou šířkou, logo by se upscalovalo do rozmazání.
- **`Menu.astro`**: `2xl:text-[3rem]` → **`2xl:text-[2.6rem]`**.

### Přechod mezi stránkami — zrychlení

- **`Layout.astro`**: fade a `load()` běží souběžně (`await Promise.all([faded, load()])`) místo sekvenčně. Fade se slidem sekvenční být **musí** — view transition si stránku fotí na svém začátku — ale síť se snímkem nesouvisí, takže navigace stojí `max(fade, síť)` místo jejich součtu.
- **`astro.config.mjs`**: zapnut `prefetch` (`prefetchAll: true`, `defaultStrategy: 'viewport'`). Odkazy v menu jsou hned ve viewportu, takže se všech 7 stránek předtáhne po načtení úvodu a `load()` pak resolvuje z cache.
- **Fade loga a menu jde v kaskádě, ne jako blok** — cílem jsou jednotlivé `.menu-nav li` (+ `#header-logo-btn`), `FADE = 90ms` s krokem `STEP = 18ms`, celkem 198 ms pro 7 prvků. **Prodloužit fade nejde zadarmo**: o jeho délku se protáhne celá navigace 1:1, protože ho `e.loader` odčeká celý. Kaskáda dá pozvolný dojem uvnitř stejného rozpočtu.
- Easing fade `ease-in-out` → **`ease-in`**. Fade nesmí dobrzdit do stopky těsně před rozjezdem panelu — dvě zpomalení za sebou jsou na švu znát.

### Přechod mezi stránkami — plynulost

- **`transitions.ts`**: `EASING` `ease-in-out` → **`cubic-bezier(0.45, 0.05, 0.55, 0.95)`**. Záměrně plochá symetrická křivka, rychlost je po většinu dráhy skoro konstantní. **Silně decelerující křivky na 1.2s nefungují** — ujedou většinu dráhy hned a zbývající čas se čte jako zaseknutí.
- **`global.css`**: `::view-transition-old/new(root)` → **`animation: none`**. Dosavadní pravidlo volalo `bg-fade-out` / `bg-fade-in`, jenže **ty `@keyframes` v projektu vůbec nejsou** — pravidlo tedy jen přebíjelo výchozí UA crossfade a nic nedosazovalo. Root je všechno mimo `main`, tedy hlavně fotka pozadí, a ta je na všech stránkách stejná — není co prolínat a skládání dvou snímků přes celý viewport bere výkon slidu.
- Smazána mrtvá pravidla pro **`menu-content`** — žádná stránka to jméno nepoužívá (všech 7 má `main-panel`) a jejich keyframes `fade-out-quick` / `fade-in-slow` taky neexistovaly.
- **`[data-reveal]` dorovnán na 1.2s slide** (dluh z commitu 118583d): trvání `1s` → `0.7s`, výchozí delay `0.2s` → `0.7s`, `--reveal-delay` na stránkách posunuty o +0.4 s. Obsah se teď vynořuje, až panel dosedá — dvě nesladěné pohybové vrstvy přes sebe působily neklidně.

## 2026-07-27

### Fade loga a menu při odchodu z úvodní stránky
- **`Layout.astro`**: v `astro:before-preparation` se obalí `e.loader` — logo (`#header-logo-btn`) a menu (`.menu-nav`) se ztlumí na 30 % (500 ms) a teprve pak se pustí načtení a slide panelu.
- Proč odklad: view transition si odcházející stránku **vyfotí v momentě, kdy začne**, takže animace spuštěná těsně předtím by se na snímku zafixovala rozpracovaná. Astro na `loader` čeká ještě před `startViewTransition`, takže se do něj dá zpoždění vložit.
- **Web Animations API, ne CSS třídy.** Přes třídu na headeru to fungovalo jen napoprvé a pak mizelo už jen logo: `.menu-nav` vykresluje `Menu.astro`, takže ho scoped `<style>` Headeru přes `data-astro-cid` míjel, a `:global()` to nespravilo. Animace na elementu na stylopisech nezávisí; `fill: forwards` drží prvky ztlumené i pro snímek.
- Guard na prázdné pole cílů znamená, že navigace mezi podstránkami se nezdrží.
- **Zvažovaná alternativa:** dát logu a menu `transition:name` a animovat je souběžně se slidem přes `::view-transition-old/new(...)`. Zavrženo — pojmenované prvky opustí panelový snímek, takže se jim musí duplikovat `translateX` i délka slidu ve čtyřech sadách keyframes (old/new × forward/back) a držet je v synchronizaci s `transitions.ts`.

### Přechod mezi stránkami zpomalen
- **`transitions.ts`**: slide panelu `0.8s` → **`1.2s`** ve všech čtyřech směrech. Délka a easing vytaženy do konstant `DURATION` / `EASING`, takže se ladí na jednom řádku místo na čtyřech.
- Nesladěné zůstává `[data-reveal]` (1s, zpoždění 0,2–0,8s), laděné původně proti 0,8s slidu — obsah se teď vynoří dřív, než panel dojede.

### Logo — velikosti a pozice v intru
- **`Logo.astro`**: dva nové volitelné propy. `maxWidth` (default `60vw` = dosavadní chování) uvolňuje strop šířky, na který se na mobilu naráželo — zvyšování `width`/`maxHeight` tam nemělo efekt, protože `60vw` bylo v komponentě natvrdo. `size` přebije celý dopočet hotovým CSS rozměrem.
- **Header logo**: `440/38svh` → `380px`, `maxWidth 72vw`, `maxHeight min(36svh, 324px)`. Vnořené `min()` je záměr: samotné zvýšení na `36svh` by narostlo i na desktopu, tenhle zápis nechá vyrůst mobil (234 → 281 px) a desktop drží na 324 px.
- **Intro logo**: velikost přesunuta do proměnné `--intro-logo` na `#intro-overlay` (`min(600px, 88vw, 54svh)`) a předána přes `size="var(--intro-logo)"` — jeden zdroj pravdy.
- **Pozice na mobilu**: kontejner loga `translate-y-[15svh] xl:translate-y-0` posune střed loga z 50 % na 65 % výšky. Transform sedí na kontejneru, ne na `.intro-logo` — tomu sahá do `style.transform` skript přeletu a translate by přepsal.
- **Tlačítko „Vstoupit"**: `top-[calc(82.5%_+_var(--intro-logo)/4)]` = přesně v půlce mezi spodkem loga a spodkem stránky. Odvození: střed loga `65%`, spodek `65% + L/2`, půlka do `100%` je `82.5% + L/4`. Díky proměnné se pozice přepočítá sama při každé změně velikosti.
- **Hover na „Vstoupit"** převeden z `opacity` na barvu (`text-text/35 hover:text-text`). Pravidlo `.intro-enter` má na `opacity` 0,8s prodlevu kvůli návratu do intra a ta se propisovala i do hoveru; `color` má v témž pravidle rychlý přechod bez prodlevy.

### Svatební den a Náš příběh — timeline
- **h2 (`.story-year`)** na obou stránkách sjednoceno: `text-4xl md:text-6xl 2xl:text-8xl`, barva `text-text` bez rozlišení zařízení.
- **Ztlumení neaktivních položek přešlo z barvy na průhlednost** — `setActive()` přepíná `opacity-100` / `opacity-25` místo `text-ink` / `text-ink/25`. Barva tak zůstává čistě v třídách a nemusí se duplikovat v JS.
- **Svatební den**: h3 zmenšeno na `text-4xl 2xl:text-6xl`; h3 (`story-title`) i popisek (`story-desc`) zbaveny `text-ink/*` a připojeny k rozsvěcení — ztlumuje se celý blok, ne jen čas.
- Ztlumení **nejde dát na `[data-story-section]`**, i když by to byl jeden řádek: ten element nese `data-reveal`, jehož animace končí na `opacity: 1` s `both` a třídu by přebila; vnitřní obal má na `2xl` `display: contents`, kde se opacity vůbec neuplatní. Proto tři konkrétní prvky.
- **Nový token `--color-text`** (`#000000`) v `@theme` a `text-text` na `<body>` v `Layout.astro` — barva odstavců přestala záviset na výchozí barvě prohlížeče (vynucený tmavý režim ji nepřebarví).
- Tečka mezi položkami: `bg-ink/25` → `bg-text/25`.

### Accent v UI prvcích
- **h1 na všech 6 podstránkách**: `underline decoration-2 decoration-accent underline-offset-8`. Zvoleno `text-decoration` místo `border-b`, protože linka kopíruje šířku textu — u psaného Parisienne za cenu toho, že prochází skrz dolní dotahy.
- **Tlačítka dotazníku** (`Questionnaire.astro`): `bg-gray-900 text-white` → `bg-accent text-muted`, hover `bg-hover` + `text-ink`. Doplněn `cursor-pointer`.
- **Inputy, textarea** (`QuestionElement.astro`) a **vyhledávání hostů** (`ubytovani.astro`): klidový border `black`, aktivní stav `accent` (`focus:border-accent`, u textových polí i `focus:ring-accent`).
- **Checkboxy a radia**: `accent-gray-900` → `accent-accent`. Nativní prvek nemá obarvitelný rámeček, `accent-color` ovlivní jen výplň zaškrtnutého stavu.

### Hover stavy na --color-hover
- **`dotaznik.astro`**: oba inline odkazy „zde" dostaly `hover:bg-hover`.
- `--color-hover` je světlý odstín, proto se všude používá jako **pozadí**, ne jako barva textu — jako text na světlém panelu prvek prakticky zmizí.
- Popisky voleb u checkboxů zůstaly **bez hover stavu** (zpětná vazba jen kurzorem).

### Scrollbar během přechodu stránek
- **`Layout.astro`**: skript drží po dobu view transition třídu `vt-running` na `<html>` — nasazuje ji v `astro:before-preparation` (před snímkem odcházející stránky) a **znovu** v `astro:after-swap`, sundává na `viewTransition.finished` (konec animace, ne konec swapu).
- Proč dvakrát: Astro ve `swapRootAttributes()` smaže **všechny** atributy `<html>` a nasadí ty z načteného dokumentu — cokoli nasazeného před swapem se zahodí přesně v momentě, kdy začne najíždět nová stránka. `after-swap` běží ještě uvnitř update callbacku view transition, tedy před snímkem nové stránky.
- **`global.css`**: `html.vt-running main { overflow-y: hidden }` a `main.overflow-y-auto { scrollbar-gutter: stable }` — gutter drží místo po scrollbaru natrvalo, aby obsah na konci animace necuknul (na mobilu je scrollbar překryvný, tam je gutter nulový).
- Obě pravidla jsou **mimo `@layer`** záměrně: Tailwind řadí vrstvu `base` před `utilities`, takže by je utilita `.overflow-y-auto` přebila bez ohledu na specificitu.

### Průhlednost panelu menu
- **`Header.astro`**: `bg-surface opacity-95` → **`bg-surface/95`**. `opacity` zprůhledňuje celý element včetně obsahu, takže logo i položky menu byly vybledlé na 95 %; `/95` se týká jen pozadí. Panel tak odpovídá podstránkám, které `bg-surface/95` používají.

### Problikávání intra při návratu na úvod
- **`Intro.astro`**: nasazení třídy `intro-seen` přesunuto z `astro:before-swap` na **`astro:after-swap`** — stejná příčina jako u scrollbaru (swap maže atributy `<html>`). Bez toho se při klientské navigaci zpět na úvod ukázal celý intro overlay po dobu 0.8s slidu, než ho `skipIntro()` usadil.

### Mobil — scrollovatelné menu na úvodní stránce
- **`Header.astro`**: wrapper menu dostal `min-h-0 overflow-y-auto overscroll-contain items-start`, logo `shrink-0`. Menu, které se na nízkých displejích do panelu nevešlo, se dá odscrollovat místo aby ho `overflow-hidden` na `<main>` oříznul. `min-h-0` je nutné, aby flex item vůbec směl být nižší než jeho obsah; `overscroll-contain` drží gesto uvnitř menu (`<body>` má `overscroll-none`).
- **`Menu.astro`**: z `<ul>` odebráno `justify-center` — ve scrollovacím kontejneru by centrování při přetečení odsunulo horní položky mimo dosah. Vertikální vycentrování dál obstarává `justify-center` na `#main-header`, takže se vzhled nemění, dokud se menu vejde.

### Logo — limit podle výšky viewportu (landscape)
- **`Logo.astro`**: nový volitelný prop **`maxHeight?: string`**, zapojený do inline šířky jako `min({width}px, 60vw, {maxHeight})` — logo je čtvercové, takže limit šířky limituje i výšku. Bez propu se chování nemění.
- Nasazeno: `Header.astro` **`38svh`**, `Intro.astro` **`60svh`**. V landscapu na telefonu se logo škálovalo jen podle šířky, takže si drželo 440 px a sežralo celou výšku panelu — na menu zbylo 0 px a nešlo ani vidět, ani scrollovat. **`svh`** místo `dvh` proto, aby se logo nepřeškálovalo při skrývání adresní lišty.

### Typografie — velikosti stabilní při otočení telefonu
- **`Menu.astro`**: `text-[clamp(1.75rem,6vw,3rem)]` → **`text-[clamp(2rem,6vmin,3rem)]`**. `vmin` je kratší rozměr viewportu, ten se otočením telefonu nemění → portrait i landscape 32 px (dřív 28 vs 48 px). `2xl:text-[3rem]` ponecháno: s `vmin` už není nadbytečné, drží desktop na 48 px i na širokém, ale nízkém okně.
- **`--text-heading`**: `clamp(2.25rem, 7vw, 5.25rem)` → **`clamp(2.75rem, 7vmin, 5.25rem)`** — h1 na telefonu 44 px v obou orientacích (dřív 36 portrait / 59 landscape), desktop ~76 px. Propisuje se do všech šesti podstránek naráz.

## 2026-07-26

### Responzivita — fluidní nadpisy, menu a logo
- **`--text-heading`**: `5.25rem` → `clamp(2.25rem, 7vw, 5.25rem)`; **`--text-hero`**: `6rem` → `clamp(3rem, 10vw, 6rem)` — h1 i tlačítko „Vstoupit" se plynule zmenšují na malých telefonech (dřív pevné velikosti přetékaly).
- **`Menu.astro`**: velikost položek z pevného `text-6xl` na fluidní `text-[clamp(1.75rem,6vw,3rem)] 2xl:text-[3rem]`; svislé rozestupy mezi položkami na mobilu `*:p-4` → `*:p-2 md:*:p-4`.
- **`HouseColumn.astro`**: názvy domů `text-6xl` → `text-[clamp(2rem,7vw,3.75rem)]`.
- **`Logo.astro`**: pevná šířka `width: {w}px` → `width: min({w}px, 60vw)` — intro i header logo se na mobilu/tabletu plynule zmenšuje, na desktopu drží původní px max.
- **`Layout.astro`**: viewport meta doplněn o `initial-scale=1` (bez něj mobily nespolehlivě škálovaly).

### Landing — header a intro
- **`Header.astro`**: zrušeny `h-1/3` pásy a `justify-evenly` → `justify-center`; logo a menu jsou naskládané a vycentrované jako skupina, takže odstup menu od loga je konzistentní napříč šířkami (dřív ho `justify-evenly` roztahovalo podle výšky okna).
- **`index.astro`**: šířka panelu headeru `xl:basis-[30%]` → `xl:basis-[40%]` (2xl `35%` beze změny).
- **`Intro.astro`**: tlačítko „Vstoupit" na mobilu do dolní poloviny pod logem (`top-3/4`), na desktopu zpět do středu (`xl:top-1/2`), přidán `z-10`; intro logo ztlumené na `opacity-35`.

### Oprava zdvojeného loga po refreshi v menu
- Refresh, když už jsi za intrem (`skipIntro`), zdvojoval logo: intro logo se „přilepovalo" na header přes `flightTransform`, jenže výpočet běžel hned na `astro:page-load`, kdy layout ještě nebyl hotový → intro logo dosedlo vedle header loga.
- **`Intro.astro`**: `skipIntro` už logo nelepí — jen ho **schová** (`opacity: 0`) a viditelné nechá čistě header logo; `backToIntro` mu při návratu na úvod viditelnost zase vrátí. Odpadá tím celá třída chyb „změřeno moc brzo po načtení".

### Mobil — nescrollovatelný dokument (dvh)
- `h-screen` (`100vh` počítá i plochu za lištami prohlížeče) → **`h-dvh`** na `index` a všech 6 podstránkách; `BackButton` `lg:min-h-screen` → `lg:min-h-dvh`.
- **`global.css`**: `html, body { height: 100dvh; overflow: hidden; overscroll-behavior: none; }` — dokument nikdy nescrolluje, veškeré scrollování je uvnitř `<main>` (podstránky `overflow-y-auto`). Řeší to, že po scrollu na podstránce (schovaná adresní lišta) a návratu na index šel index odscrollovat. `overscroll-none` doplněno i na `<body>`.

### Drobnosti
- **`--color-surface`** doladěna z `#f0f1f5` na `#f9f6f1` (teplejší odstín; v souboru ponechány zakomentované další kandidáty).
- **`package.json`**: `dev` skript → `astro dev --host` (kvůli testování na mobilu v lokální síti).

## 2026-07-25

### Sjednocení mezer nad/pod nadpisy podstránek
- **`nas-pribeh.astro`**: horní odsazení `<main>` sjednoceno na `pt-20`, aby mezera **nad** h1 byla stejná jako `pt-20` mezera **pod** ním (dřív `pt-16` nahoře vs `pt-20` dole).
- Zaveden jednotný standard kontejnerů dle vzoru `nas-pribeh` na **všech podstránkách**: `<main>` má `pt-20` (mezera nad h1) a mezera pod h1 je vždy **5rem**, umístěná na obsahovém kontejneru přes `pt-20`, ne na h1.
- **`svatebni-den.astro`**, **`uvodni-informace.astro`**: `<main>` `pt-16` → `pt-20` (obsahový `article pt-20` už seděl).
- **`fotogalerie.astro`**: `<main>` `pt-32` → `pt-20`; h1 zbaven `mb-8`, mezera přesunuta na galerijní `div` (`mt-24` → `pt-20`).
- **`dotaznik.astro`**: `<main>` `pt-32` → `pt-20`; h1 zbaven `mb-8`, obsahový `div` `pt-24` → `pt-20`.
- **`ubytovani.astro`**: `<main>` `pt-32` → `pt-20`; nemá jeden obsahový kontejner (za h1 rovnou input + grid), proto mezera zůstala na h1: `mb-16` → `mb-20` (stejných 5rem).
- Horizontální paddingy (`px-6 sm:px-10`) a obsahová specifika (`md:px-40`, `pb-16`, `pb-24`) ponechány beze změny.

### Stránka Ubytování — šířka vyhledávacího inputu
- Input zabalen do wrapperu, který se na `lg` stane gridem se **stejnou stopou sloupců** jako grid domů (`grid-cols-3`, `gap-16`, `max-w-[104rem]`), a input sedí v `col-start-2` → přesně na šířce prostředního sloupce. Pod `lg` zůstává `max-w-xs` a vycentrovaný (`mx-auto`).

### Stránka Svatební den — timeline: zarovnání a oddělovací tečky
- Pod `2xl` je čas (`h2`) a nadpis (`h3`) v jednom flex řádku s **`justify-between`** — čas vlevo (start), nadpis vpravo (end); popisek pod tím `text-center`.
- **Dekorativní tečka přesunuta** z prostoru mezi časem a nadpisem na **oddělovač mezi položkami** (za každou kromě poslední), `self-center`, `2xl:hidden`.
- **Vertikální rytmus:** `<article>` ztratil základní `gap` (jen `2xl:gap-14`), každá položka má `pt-16 pb-16` (`first:pt-0`, `2xl:py-0`). Tečka tak sedí vertikálně uprostřed mezery — nad ní `pb` předchozí položky, pod ní `pt` následující. Desktop grid layout beze změny.

### Stránka Náš příběh — velikost h2
- `h2` (rok) sjednoceno se Svatebním dnem: `text-7xl` → `text-6xl` (základ), `2xl:text-8xl` shodné.

### BackButton — relativní ztmavení
- Tlačítko dostalo **trvalý** poloprůhledný `ink` překryv (`bg-ink/[0.03]`, hover `bg-ink/[0.07]`) místo jen na hoveru. Protože je tlačítko průhledné nad `bg-surface`, ztmavení je **relativní** — zůstane o něco tmavší při jakékoli barvě pozadí.

### Svatební den — dekorativní tečky i na 2xl
- Z oddělovací tečky mezi položkami odebráno `2xl:hidden` → zobrazuje se i na desktopu. `self-center` a `2xl:gap-14` na `<article>` ji drží vodorovně i svisle uprostřed mezery mezi položkami.

### Nadpisový font — Parisienne
- `--font-heading` přepnut z `Alex Brush` na **`Parisienne`** (doplněn Google Fonts import). Zkoušely se i Great Vibes a Allura; **Great Vibes ponechán zakomentovaný** (import i proměnná) jako rychlý přepínač.
- **`Menu.astro`**: `font-alexbrush` → `font-heading`, aby menu následovalo nadpisový font (dřív mělo natvrdo Alex Brush).

## 2026-07-20

### Nasazení na GitHub Pages přes GitHub Actions
- GitHub Pages dosud běžel na výchozím **Jekyll buildu** ("Deploy from a branch"), který se snažil parsovat `---` v `Layout.astro` jako YAML front matter a build padal.
- Přidán **`.github/workflows/deploy.yml`** — při push na `main` (i ručně přes `workflow_dispatch`) nainstaluje závislosti, spustí `npm run build` a nasadí `dist/` na GitHub Pages přes `actions/upload-pages-artifact` + `actions/deploy-pages`. Jekyll se tím obchází úplně.
- Přidán **`public/.nojekyll`** jako pojistka, kdyby se zdroj GitHub Pages někdy omylem přepnul zpět na branch-based deploy.

### Astro base path pro subdoménu GitHub Pages
- Repo se jmenuje `gabca-a-standa-svatba` a bez vlastní domény poběží na `stanislav-mares.github.io/gabca-a-standa-svatba/` — do `astro.config.mjs` doplněno **`site`** a **`base: '/gabca-a-standa-svatba/'`** (s koncovým lomítkem, jinak `import.meta.env.BASE_URL` chybí oddělovač a cesty se slepí, např. `/gabca-a-standa-svatbadotaznik`).
- Všechny pevné absolutní odkazy přepsané na `${import.meta.env.BASE_URL}...`, aby fungovaly i pod podcestou: navigace v **`Menu.astro`**, favicony v **`Layout.astro`**, a dva vnořené odkazy v textech otázek **`dotaznik.astro`** (`/svatebni-den`, `/ubytovani`).
- Ověřeno lokálním `npm run build` — všechny odkazy a assety v `dist/` mají správně předsazenou `/gabca-a-standa-svatba/`.

### Spolupráce — CLAUDE.md
- Doplněno pravidlo: po úvodním schválení vícekrokového plánu se už u dalších kroků neptat "mám pokračovat?" — jen předložit plán daného kroku a po schválení hned implementovat a pokračovat dalším krokem v témže odpověď-cyklu, bez mezitímní žádosti o potvrzení.

### Nová stránka „Úvodní informace" a přeuspořádané menu
- Přidána **`src/pages/uvodni-informace.astro`** — stejný vzor jako `nas-pribeh.astro` (`Layout`, `BackButton`, `slideTransition`), ale zjednodušená na prostý text: nadpis + odstavce bez let a bez scroll-highlight scriptu (placeholder text k doplnění).
- Pořadí odkazů v **`Menu.astro`** změněno na: Úvodní informace → Svatební den → Ubytování → Náš příběh → Fotogalerie → Dotazník.

### Timeline podstránek — mobilní layout a CSS proměnná pro odstavce
- **`nas-pribeh.astro`** a **`svatebni-den.astro`**: dvousloupcový timeline layout (rok/čas vlevo nebo vpravo, text uprostřed) se dřív zlomil už na `md`, na tabletu tak působil roztrhaně — breakpoint posunut na **`2xl`**, do té doby je vše jeden svislý sloupec (`max-w-3xl mx-auto`).
- **`svatebni-den.astro`**: každá položka programu dostala **`description`** (krátký popisek pod časem/nadpisem, např. „Řekneme si své ANO před rodinou a přáteli."). Na mobilu teď čas a nadpis stojí vedle sebe na jednom řádku (`flex items-baseline`) místo pod sebou, popisek je pod nimi zarovnaný doleva; oddělovací čárky mezi položkami padly ve prospěch většího `gap-14`.
- **`global.css`**: nová sémantická proměnná **`--text-paragraph: 1.125rem`** (dřív natvrdo `text-lg`) pro tělový text podstránek — používají ji teď odstavce v `nas-pribeh.astro` a popisky v `svatebni-den.astro`.
- **`Logo.astro`**: zdroj loga přepnut z `logo-test.png` na `logo-new.webp` (soubor zatím není v gitu, viz níže).

### Oprava zdvojeného loga po resize okna
- **`Intro.astro`**: intro logo se na header logo lepí přes jednorázově vypočtený pixelový `transform` (`flightTransform`). Po resize okna se ale header (a jeho logo) posunul, zatímco intro logo drželo starou pozici — vypadalo to jako dvě loga.
- Přidán **`resize` listener**, který — pokud je overlay v usazeném stavu (`intro-leaving`) — okamžitě přepočítá a znovu aplikuje `flightTransform(true)` bez tranzice, takže logo zůstává nalepené na headeru i po změně velikosti okna.
- Listener i `keydown` handler se teď při každém `astro:page-load` nejdřív odregistrují (nový `cleanup` mechanismus) a pak znovu zaregistrují, aby se při opakované navigaci nehromadily.

## 2026-07-19

### Tlačítko zpět – responsivní pás a SVG šipka
- **`<aside>` obal přesunut z podstránek dovnitř `BackButton.astro`** — všech 5 stránek renderuje jen `<BackButton />`, pozicování se ladí na jednom místě.
- **Responsivní layout**: od `lg` (PC) původní svislý pruh `w-40` přes celou výšku se šipkou uprostřed; pod `lg` (mobil + tablet) vodorovný pás `h-16` fixně u horního okraje přes celou šířku, šipka vlevo. Výška pásu odpovídá nejmenšímu hornímu odsazení stránek (`pt-16`), aby nepřekrýval obsah.
- **Hover**: `hover:bg-gray-100` → `hover:bg-ink/5` — světle šedý podklad na béžovém `bg-surface` působil spíš jako zesvětlení, poloprůhledná `ink` pás jemně ztmaví.
- **Šipka je inline SVG chevron** místo textového znaku `<` — znak se centroval podle fontových metrik (řádkový box 3rem písma přetékal pás a špatně seděl i s `leading-none`), SVG bez baseline vycentruje `items-center` přesně. Velikost `h-10`, tenký tah `stroke-width="1.4"` v duchu původního `font-extralight`, barva přes `currentColor`; tlačítko bez textu dostalo `aria-label="Zpět"`.

### Ubytování – tři domy s live filtrem hostů
- Stránka přestavěna z prázdného nadpisu na **tři sloupce ve tvaru siluety domu** (Farní dvůr, Chata Liebich, Továrníkova vila) — nová komponenta `HouseColumn.astro`. Střecha je **inline SVG polyline** s `preserveAspectRatio="none"` + `vector-effect="non-scaling-stroke"`: roztáhne se na šířku sloupce, ale tah zůstane stejně tlustý jako `border-x`/`border-b` těla domu. Celý obrys se barví z jednoho místa přes `currentColor` (`text-ink/40` na wrapperu).
- **Seznam hostů je konfigurovatelný** v poli `houses` ve frontmatteru `ubytovani.astro` (zatím placeholder jména); tělo domu má `min-h-96`, aby dům s málo hosty nevypadal zploštěle.
- Nad domy **bezrámečkový input** jen s dolní linkou (placeholder „Jméno hosta", `autocomplete="off"`), který **filtruje živě při psaní**: skript si při initu jednou znormalizuje jména z DOMu a pak jen přepíná `hidden`. Hledá substring **bez ohledu na diakritiku a velikost písmen** (`normalize("NFD")` + odstranění `\p{Diacritic}` — „stastna" najde „Šťastnou"). Inicializace visí na `astro:page-load` kvůli View Transitions.
- **Prázdný dům** (žádný host nevyhovuje filtru): na mobilu zmizí (`max-md:hidden`), na desktopu zůstane stát zašedlý (`md:opacity-30`) s plynulým přechodem, aby layout neposkakoval.
- Responzivita: mobil 1 sloupec, **tablet (md–lg) 2 sloupce** — třetí dům by trčel vlevo dole, proto je na druhém řádku vycentrovaný se šířkou přesně jednoho sloupce (`col-span-2` + `w-[calc(50%-2rem)]` přes `[&>:last-child]` variantu). Od `lg` 3 sloupce, grid roztažen do `max-w-[104rem]`.

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
