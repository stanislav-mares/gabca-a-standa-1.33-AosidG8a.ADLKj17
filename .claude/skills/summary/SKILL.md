---
name: summary
description: Shrne, co se v aktuální session (od posledního /clear) reálně změnilo, a zapíše to do context/CHANGELOG.md. Použij, když uživatel chce zapsat changelog, shrnout session nebo uzavřít práci.
---

# Summary → changelog

Shrň práci **aktuální session** (vše od posledního `/clear`) a zapiš ji do `context/CHANGELOG.md`.

## 1. Vyber, co do shrnutí patří

Projdi konverzaci od začátku kontextu a sesbírej **jen změny, které skutečně skončily v kódu**.

Nezahrnuj:
- návrhy, které uživatel odmítl nebo nahradil jinými,
- slepé uličky a mezikroky, které pozdější změna přepsala (zapiš výsledný stav, ne cestu k němu),
- vlastní průzkum kódu, běhy buildu, čtení souborů,
- úpravy, které si uživatel udělal sám a jen se o nich mluvilo.

Když si nejsi jistý, jestli změna prošla, ověř si aktuální stav souboru — ne to, co bylo v konverzaci navrženo.

## 2. Drž styl existujícího changelogu

Přečti `context/CHANGELOG.md` a napodob jeho formu:

- **Reverzní chronologie** — nejnovější sekce nahoře, hned pod `# Changelog`.
- `## RRRR-MM-DD` jako datum sekce. **Pokud sekce pro dnešek už existuje, doplň do ní** a nezakládej druhou.
- Uvnitř tematické `###` podsekce (obvykle podle stránky, komponenty nebo oblasti — např. `### Stránka dotaznik`, `### Styly`).
- Odrážky, česky, věcně. Klíčové pojmy **tučně**, soubory / třídy / API `inline kódem`.
- Piš **proč**, ne jen co. „Popisky se renderují přes `set:html`, protože je Astro jinak escapovalo" je užitečný záznam; „změněn Questionnaire.astro" není.
- Jedna odrážka = jedna myšlenka. Drobnosti slouč, nevypisuj každý edit zvlášť.

## 3. Ukaž před zápisem

Shrnutí nejdřív vypiš uživateli a nech si ho odsouhlasit. Teprve pak ho zapiš do `context/CHANGELOG.md`.
