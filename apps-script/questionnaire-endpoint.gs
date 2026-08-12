/**
 * Svatební dotazník – příjem odpovědí do Google Sheetu.
 *
 * Skript je „vázaný" na tabulku: vytvoř ho přes Rozšíření → Apps Script
 * přímo v cílovém Sheetu. Nasazuje se jako webová aplikace, viz README/chat.
 *
 * Očekávaný POST (Content-Type: text/plain, tělo JSON):
 *   { "submissionId": "...",
 *     "answers": [ { "key": "...", "label": "...", "value": "..." }, ... ] }
 *
 * List „Odpovědi": řádek 1 = technické klíče (podle nich se párují sloupce),
 * řádek 2 = lidské popisky, data od řádku 3. Klíč, který ještě nemá sloupec,
 * se automaticky přidá na konec – změny otázek na webu tedy nic nerozbijí.
 *
 * `submissionId` dělá ze zápisu upsert: řádek se stejným ID se přepíše, místo
 * aby přibyl další. Prohlížeč totiž o úspěchu neví jistě – skript zapíše řádek
 * a teprve pak posílá odpověď, takže výpadek na zpáteční cestě (přesměrování
 * na googleusercontent.com, uspaný mobil) vypadá jako chyba u úspěšného
 * zápisu. Klient smí opakovat, aniž by tím vyrobil duplicitu.
 *
 * Funkce `vytvorVyhodnoceni` se spouští ručně z editoru a (znovu)vygeneruje
 * list „Vyhodnocení" se souhrnnými vzorci.
 */

const SHEET_NAME = "Odpovědi";
const SUMMARY_SHEET_NAME = "Vyhodnocení";
const TIMESTAMP_KEY = "_odeslano";
const ID_KEY = "_id";

function doGet() {
  return ContentService.createTextOutput("Endpoint dotazníku běží.");
}

function doPost(e) {
  // Zámek kvůli souběžným odesláním – hledání řádku podle ID i přidávání
  // sloupců nesmí běžet 2× naráz. `waitLock` je uvnitř `try` schválně: když
  // vyprší, má klient dostat JSON s chybou, ne HTML stránku s chybou 500.
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    const payload = JSON.parse(e.postData.contents);
    if (!Array.isArray(payload.answers) || payload.answers.length === 0) {
      throw new Error("Chybí pole answers.");
    }
    appendSubmission_(payload.answers, payload.submissionId);
    return jsonResponse_({ ok: true });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function appendSubmission_(answers, submissionId) {
  const sheet = getOrCreateSheet_();

  // ID jde do řádku jako obyčejná odpověď, takže si sloupec založí stejnou
  // cestou jako kterákoli otázka a nepotřebuje vlastní obsluhu.
  const entries = submissionId
    ? answers.concat([
        { key: ID_KEY, label: "ID odeslání", value: submissionId },
      ])
    : answers;

  let width = sheet.getLastColumn();
  const keys = sheet.getRange(1, 1, 1, width).getValues()[0];
  const colByKey = {};
  keys.forEach((key, i) => {
    if (key !== "") colByKey[key] = i;
  });

  entries.forEach((answer) => {
    if (colByKey[answer.key] !== undefined) return;
    colByKey[answer.key] = width;
    sheet.getRange(1, width + 1).setValue(answer.key);
    sheet.getRange(2, width + 1).setValue(answer.label || answer.key);
    width += 1;
  });

  const row = new Array(width).fill("");
  // Čas posledního zápisu – u přepsaného řádku tedy čas opakovaného odeslání.
  row[colByKey[TIMESTAMP_KEY]] = new Date();
  entries.forEach((answer) => {
    row[colByKey[answer.key]] = answer.value;
  });

  // Opakované odeslání přepíše celý původní řádek: host mohl mezi pokusy
  // odpověď ještě upravit a platí to, co poslal naposledy.
  const existingRow = submissionId
    ? findRowById_(sheet, colByKey[ID_KEY], submissionId)
    : 0;
  if (existingRow) {
    sheet.getRange(existingRow, 1, 1, width).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
}

/**
 * Číslo řádku s daným ID odeslání, nebo 0 když takový není. Sloupec s ID
 * vzniká až s prvním odesláním, které ho nese – u prázdné tabulky (a u dat
 * zapsaných starší verzí skriptu) se prostě nic nenajde.
 */
function findRowById_(sheet, col, submissionId) {
  const lastRow = sheet.getLastRow();
  if (col === undefined || lastRow < 3) return 0;

  const values = sheet.getRange(3, col + 1, lastRow - 2, 1).getValues();
  for (let i = 0; i < values.length; i += 1) {
    if (String(values[i][0]) === submissionId) return i + 3;
  }
  return 0;
}

function getOrCreateSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1).setValue(TIMESTAMP_KEY);
    sheet.getRange(2, 1).setValue("Odesláno");
    sheet.setFrozenRows(2);
    sheet.getRange("1:1").setFontColor("#999999").setFontSize(8);
    sheet.getRange("2:2").setFontWeight("bold");
  }
  return sheet;
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

/**
 * Jednorázově (znovu)vytvoří list „Vyhodnocení" se souhrnnými vzorci.
 * Spouští se ručně z editoru: vybrat funkci v liště a Spustit. Vzorce
 * odkazují na sloupce podle klíčů v řádku 1 listu Odpovědi – kdyby se
 * sloupce někdy přeuspořádaly, stačí funkci spustit znovu.
 *
 * Čísla jsou počty ODPOVĚDÍ, ne osob (jedna odpověď může být za více lidí).
 */
function vytvorVyhodnoceni() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const data = ss.getSheetByName(SHEET_NAME);
  if (!data) throw new Error(`List „${SHEET_NAME}" neexistuje.`);

  const keys = data.getRange(1, 1, 1, data.getLastColumn()).getValues()[0];
  const letterByKey = {};
  keys.forEach((key, i) => {
    if (key !== "") letterByKey[key] = columnLetter_(i + 1);
  });

  /**
   * Sloupec vznikne teprve tím, že v nějakém odeslání dorazí jeho klíč –
   * u zaškrtávátka tedy až tím, že si ho někdo vybere. Možnost, kterou zatím
   * nikdo nezvolil, proto sloupec nemá a Vyhodnocení se kvůli ní nesmí
   * shodit: chybějící sloupec znamená nulu, ne výjimku.
   */
  const has = (key) => Boolean(letterByKey[key]);
  const range = (key) =>
    `'${SHEET_NAME}'!${letterByKey[key]}3:${letterByKey[key]}`;

  const ZERO = "=0";
  const DASH = `="—"`;

  // Oddělovač argumentů je středník – tabulka má české národní prostředí
  // a vzorce vložené přes setFormula se v ní parsují lokalizovaně.
  const hasNames = has("ucast-e0");
  const names = hasNames ? range("ucast-e0") : "";
  const countIf = (key, value) =>
    has(key) ? `=COUNTIF(${range(key)};"${value}")` : ZERO;
  const countChecked = (key) => countIf(key, "ano");
  /** Seznam jmen, kde má sloupec danou hodnotu. */
  const listIf = (key, value) =>
    hasNames && has(key)
      ? `=IFERROR(TEXTJOIN(CHAR(10);TRUE;FILTER(${names};${range(key)}="${value}"));"—")`
      : DASH;
  /** Seznam „jméno: detail" pro zaškrtnutou možnost s doplňujícím textem. */
  const listCheckedWithDetail = (key, detailKey) => {
    if (!hasNames || !has(key)) return DASH;
    if (!has(detailKey)) return listIf(key, "ano");
    return `=IFERROR(TEXTJOIN(CHAR(10);TRUE;FILTER(${names}&IF(${range(detailKey)}="";"";": "&${range(detailKey)});${range(key)}="ano"));"—")`;
  };
  /** Seznam „jméno: text" pro neprázdné textové odpovědi. */
  const listTexts = (key) =>
    hasNames && has(key)
      ? `=IFERROR(TEXTJOIN(CHAR(10);TRUE;FILTER(${names}&": "&${range(key)};${range(key)}<>""));"—")`
      : DASH;
  /**
   * Seznam jmen ze sloupce jmenného checklistu. Formulář do něj zapisuje
   * přímo dotčené osoby oddělené čárkou, takže se na rozdíl od `listIf`
   * nevypisují všichni z odeslání, ale jen ti zaškrtnutí.
   */
  const listPersons = (key) =>
    has(key)
      ? `=IFERROR(TEXTJOIN(", ";TRUE;FILTER(${range(key)};${range(key)}<>""));"—")`
      : DASH;
  /**
   * Počet osob: co input ve formuláři, to jedna osoba. Formulář má na každou
   * osobu vlastní řádek a skládá je do buňky oddělené čárkou (`readNames(…)
   * .join(", ")` v Questionnaire.astro), takže stačí spočítat čárky + 1.
   * Sečteno přes řádky splňující podmínku, bez podmínky přes všechny neprázdné.
   *
   * Čárka je jediný oddělovač schválně. Dřív se tu dělilo i na „ a ",
   * středníku a novém řádku – pozůstatek jediného volného textového pole,
   * který rozbíjel víceslovná jména: „Marie a Jan Novákovi" v jednom inputu
   * vyšlo jako dvě osoby. Stejný předpoklad (čárka = oddělovač) má i formulář,
   * když si hodnotu rozebírá zpátky do řádků a jmenných checklistů.
   */
  const personCount = (textKey, condKey, condValue) => {
    if (!has(textKey) || (condKey && !has(condKey))) return ZERO;
    const text = `TRIM(${range(textKey)})`;
    const perRow = `LEN(${text})-LEN(SUBSTITUTE(${text};",";""))+1`;
    const cond = condKey ? `(${range(condKey)}="${condValue}")*` : "";
    return `=SUMPRODUCT(${cond}(${text}<>"")*(${perRow}))`;
  };

  const who = (condKey, condValue) =>
    personCount("ucast-e0", condKey, condValue);

  const rows = [
    { text: "VYHODNOCENÍ DOTAZNÍKU", bold: true },
    {
      text: "Aktualizuje se samo. Počty osob: co řádek ve formuláři, to jedna osoba (jména jsou v buňce oddělená čárkou).",
    },
    { text: "", formula: `="odpovědí"`, persons: `="osob"` },
    {
      text: "Celkem",
      formula: `=COUNTA(${range(TIMESTAMP_KEY)})`,
      persons: personCount("ucast-e0"),
    },
    {},
    { text: "ÚČAST", bold: true },
    {
      text: "Dorazí",
      formula: countIf("arrival-e0", "Ano"),
      persons: who("arrival-e0", "Ano"),
    },
    {
      text: "Nedorazí",
      formula: countIf("arrival-e0", "Bohužel nemohu"),
      persons: who("arrival-e0", "Bohužel nemohu"),
    },
    { text: "– kdo nedorazí", formula: listIf("arrival-e0", "Bohužel nemohu") },
    // Volba „Jiné" pokrývá případy, na které ano/ne nestačí (dorazím jen na
    // část dne, rozhodnu se později) – bez výpisu textu je počet k ničemu
    {
      text: "Jiné",
      formula: countIf("arrival-e0", "Jiné"),
      persons: who("arrival-e0", "Jiné"),
    },
    { text: "– co uvedli", formula: listTexts("arrival-e0-jine-s0") },
    { text: "– e-maily", formula: listTexts("ucast-e1") },
    {},
    { text: "PŘÍJEZD", bold: true },
    {
      text: "V den svatby",
      formula: countIf("prijezd-e0", "V den svatby"),
      persons: who("prijezd-e0", "V den svatby"),
    },
    {
      text: "V pátek",
      formula: countIf("prijezd-e0", "V pátek"),
      persons: who("prijezd-e0", "V pátek"),
    },
    { text: "– kdo v pátek", formula: listIf("prijezd-e0", "V pátek") },
    {},
    { text: "PŘESPÁNÍ", bold: true },
    // Počet osob bere ze jmenného checklistu, ne z celého odeslání: host
    // vyplňuje za celou rodinu, ale přespat může chtít jen část z ní
    {
      text: "Chce přespat",
      formula: countIf("sleep-e0", "Ano"),
      persons: personCount("sleep-e0-ano-s0"),
    },
    { text: "– kdo", formula: listPersons("sleep-e0-ano-s0") },
    {
      text: "Nepřespí (jede domů)",
      formula: countIf("sleep-e0", "Ne"),
      persons: who("sleep-e0", "Ne"),
    },
    // Dřív se tu rozpadalo místo / okolí / vlastní stan na tři podotázky;
    // dotazník to nahradil volným textem u „Jiné"
    {
      text: "Jiné",
      formula: countIf("sleep-e0", "Jiné"),
      persons: who("sleep-e0", "Jiné"),
    },
    { text: "– co uvedli", formula: listTexts("sleep-e0-jine-s0") },
    {},
    { text: "STRAVOVACÍ OMEZENÍ", bold: true },
  ];

  // U alergie a „jiné" je na `-s0` doplňující text a jmenný checklist až
  // na `-s1`; u zbytku je checklist rovnou na `-s0`
  const restrictions = [
    ["vegan", "Vegan", "s0", null],
    ["vegetarian", "Vegetarián", "s0", null],
    ["bezlepkova", "Bezlepková dieta", "s0", null],
    ["alergie", "Alergie", "s1", "s0"],
    ["jine", "Jiné", "s1", "s0"],
  ];
  restrictions.forEach(([value, label, personSuffix, detailSuffix]) => {
    const key = `strava-e0-${value}`;
    const personKey = `${key}-${personSuffix}`;
    rows.push({
      text: label,
      formula: countChecked(key),
      persons: personCount(personKey),
    });
    rows.push({ text: "– koho se týká", formula: listPersons(personKey) });
    if (detailSuffix) {
      rows.push({
        text: "– co konkrétně",
        formula: listTexts(`${key}-${detailSuffix}`),
      });
    }
  });

  rows.push({});
  rows.push({ text: "VELIKOST PORCÍ", bold: true });
  [
    ["dospele", "Dospělé"],
    ["detske", "Dětské"],
  ].forEach(([value, label]) => {
    const key = `porce-e0-${value}`;
    rows.push({
      text: label,
      formula: countChecked(key),
      persons: personCount(`${key}-s0`),
    });
    rows.push({ text: "– kdo", formula: listPersons(`${key}-s0`) });
  });

  const drinkSections = [
    {
      title: "PITÍ – NEALKO",
      base: "piti-nealko-e0",
      options: [
        ["perliva-voda", "Perlivá voda"],
        ["voda-citron", "Voda s citrónem"],
        ["dzus", "Džus"],
        ["kofola", "Kofola"],
        ["coca-cola", "Coca-Cola"],
        ["tonic", "Tonic"],
        ["birell", "Birell"],
        ["limonada", "Domácí limonáda"],
      ],
    },
    {
      title: "PITÍ – ALKO",
      base: "piti-alko-e0",
      options: [
        ["pivo", "Pivo"],
        ["vino", "Víno"],
        ["sampus", "Šampaňské"],
        ["gin-tonic", "Gin-tonic"],
        ["aperol", "Aperol"],
        ["rum-cola", "Rum s colou"],
        ["frisco", "Frisco"],
      ],
    },
    {
      title: "PITÍ – ALKO+",
      base: "piti-alko-plus-e0",
      options: [
        ["slivovice", "Slivovice"],
        ["mandlovice", "Mandlovice"],
        ["rum", "Rum"],
        ["whiskey", "Whiskey"],
        ["becherovka", "Becherovka"],
        ["jagermeister", "Jägermeister"],
      ],
    },
  ];
  drinkSections.forEach((section) => {
    rows.push({});
    rows.push({ text: section.title, bold: true });
    section.options.forEach(([value, label]) => {
      rows.push({ text: label, formula: countChecked(`${section.base}-${value}`) });
    });
    if (section.base === "piti-nealko-e0") {
      rows.push({
        text: "– Birell ochucený",
        formula: countIf("piti-nealko-e0-birell-s0", "Ochucený"),
      });
      rows.push({
        text: "– Birell neochucený",
        formula: countIf("piti-nealko-e0-birell-s0", "Neochucený"),
      });
    }
    rows.push({ text: "Jiné", formula: countChecked(`${section.base}-jine`) });
    rows.push({
      text: "– co jiného",
      formula: listCheckedWithDetail(
        `${section.base}-jine`,
        `${section.base}-jine-s0`,
      ),
    });
  });

  rows.push({});
  rows.push({ text: "POZNÁMKY", bold: true });
  rows.push({ text: "Vzkazy hostů", formula: listTexts("poznamka-e0") });

  let sheet = ss.getSheetByName(SUMMARY_SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SUMMARY_SHEET_NAME, 0);
  sheet.clear();

  rows.forEach((row, i) => {
    if (row.text) {
      sheet
        .getRange(i + 1, 1)
        .setValue(row.text)
        .setFontWeight(row.bold ? "bold" : "normal");
    }
    if (row.formula) sheet.getRange(i + 1, 2).setFormula(row.formula);
    if (row.persons) sheet.getRange(i + 1, 3).setFormula(row.persons);
  });

  sheet.setColumnWidth(1, 260);
  sheet.setColumnWidth(2, 480);
  sheet.setColumnWidth(3, 90);
  sheet
    .getRange(1, 2, rows.length, 1)
    .setWrap(true)
    .setVerticalAlignment("top");
}

function columnLetter_(col) {
  let letter = "";
  while (col > 0) {
    letter = String.fromCharCode(65 + ((col - 1) % 26)) + letter;
    col = Math.floor((col - 1) / 26);
  }
  return letter;
}
