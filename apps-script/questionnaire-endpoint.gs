/**
 * Svatební dotazník – příjem odpovědí do Google Sheetu.
 *
 * Skript je „vázaný" na tabulku: vytvoř ho přes Rozšíření → Apps Script
 * přímo v cílovém Sheetu. Nasazuje se jako webová aplikace, viz README/chat.
 *
 * Očekávaný POST (Content-Type: text/plain, tělo JSON):
 *   { "answers": [ { "key": "...", "label": "...", "value": "..." }, ... ] }
 *
 * List „Odpovědi": řádek 1 = technické klíče (podle nich se párují sloupce),
 * řádek 2 = lidské popisky, data od řádku 3. Klíč, který ještě nemá sloupec,
 * se automaticky přidá na konec – změny otázek na webu tedy nic nerozbijí.
 *
 * Funkce `vytvorVyhodnoceni` se spouští ručně z editoru a (znovu)vygeneruje
 * list „Vyhodnocení" se souhrnnými vzorci.
 */

const SHEET_NAME = "Odpovědi";
const SUMMARY_SHEET_NAME = "Vyhodnocení";
const TIMESTAMP_KEY = "_odeslano";

function doGet() {
  return ContentService.createTextOutput("Endpoint dotazníku běží.");
}

function doPost(e) {
  // Zámek kvůli souběžným odesláním – přidávání sloupců nesmí běžet 2× naráz.
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const payload = JSON.parse(e.postData.contents);
    if (!Array.isArray(payload.answers) || payload.answers.length === 0) {
      throw new Error("Chybí pole answers.");
    }
    appendSubmission_(payload.answers);
    return jsonResponse_({ ok: true });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function appendSubmission_(answers) {
  const sheet = getOrCreateSheet_();

  let width = sheet.getLastColumn();
  const keys = sheet.getRange(1, 1, 1, width).getValues()[0];
  const colByKey = {};
  keys.forEach((key, i) => {
    if (key !== "") colByKey[key] = i;
  });

  answers.forEach((answer) => {
    if (colByKey[answer.key] !== undefined) return;
    colByKey[answer.key] = width;
    sheet.getRange(1, width + 1).setValue(answer.key);
    sheet.getRange(2, width + 1).setValue(answer.label || answer.key);
    width += 1;
  });

  const row = new Array(width).fill("");
  row[colByKey[TIMESTAMP_KEY]] = new Date();
  answers.forEach((answer) => {
    row[colByKey[answer.key]] = answer.value;
  });
  sheet.appendRow(row);
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

  const range = (key) => {
    const letter = letterByKey[key];
    if (!letter) {
      throw new Error(`V listu „${SHEET_NAME}" chybí sloupec: ${key}`);
    }
    return `'${SHEET_NAME}'!${letter}3:${letter}`;
  };

  // Oddělovač argumentů je středník – tabulka má české národní prostředí
  // a vzorce vložené přes setFormula se v ní parsují lokalizovaně.
  const names = range("ucast-e0");
  const countIf = (key, value) => `=COUNTIF(${range(key)};"${value}")`;
  const countChecked = (key) => countIf(key, "ano");
  /** Seznam jmen, kde má sloupec danou hodnotu. */
  const listIf = (key, value) =>
    `=IFERROR(TEXTJOIN(CHAR(10);TRUE;FILTER(${names};${range(key)}="${value}"));"—")`;
  /** Seznam „jméno: detail" pro zaškrtnutou možnost s doplňujícím textem. */
  const listCheckedWithDetail = (key, detailKey) =>
    `=IFERROR(TEXTJOIN(CHAR(10);TRUE;FILTER(${names}&IF(${range(detailKey)}="";"";": "&${range(detailKey)});${range(key)}="ano"));"—")`;
  /** Seznam „jméno: text" pro neprázdné textové odpovědi. */
  const listTexts = (key) =>
    `=IFERROR(TEXTJOIN(CHAR(10);TRUE;FILTER(${names}&": "&${range(key)};${range(key)}<>""));"—")`;
  /**
   * Počet osob: v textovém sloupci spočítá jména oddělená čárkou, středníkem,
   * novým řádkem nebo spojkou „ a ", sečteno přes řádky splňující podmínku
   * (bez podmínky přes všechny neprázdné). „Novákovi" bez oddělovače = 1.
   */
  const personCount = (textKey, condKey, condValue) => {
    const text = range(textKey);
    const norm = `SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(${text};" a ";",");CHAR(10);",");";";",")`;
    const perRow = `LEN(${norm})-LEN(SUBSTITUTE(${norm};",";""))+1`;
    const cond = condKey ? `(${range(condKey)}="${condValue}")*` : "";
    return `=SUMPRODUCT(${cond}(TRIM(${text})<>"")*(${perRow}))`;
  };

  const who = (condKey, condValue) =>
    personCount("ucast-e0", condKey, condValue);

  const rows = [
    { text: "VYHODNOCENÍ DOTAZNÍKU", bold: true },
    {
      text: "Aktualizuje se samo. Počty osob vychází ze jmen oddělených čárkou.",
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
    {
      text: "Chce přespat",
      formula: countIf("sleep-e0", "Ano"),
      persons: who("sleep-e0", "Ano"),
    },
    {
      text: "Nepřespí (jede domů)",
      formula: countIf("sleep-e0", "Ne"),
      persons: who("sleep-e0", "Ne"),
    },
    {
      text: "Přímo v místě",
      formula: countChecked("sleep-e0-ano-s0-misto"),
      persons: who("sleep-e0-ano-s0-misto", "ano"),
    },
    { text: "– kdo", formula: listIf("sleep-e0-ano-s0-misto", "ano") },
    {
      text: "V blízkém okolí",
      formula: countChecked("sleep-e0-ano-s0-okoli"),
      persons: who("sleep-e0-ano-s0-okoli", "ano"),
    },
    { text: "– kdo", formula: listIf("sleep-e0-ano-s0-okoli", "ano") },
    {
      text: "Vlastní stan / obytňák",
      formula: countChecked("sleep-e0-ano-s0-vlastni"),
      persons: who("sleep-e0-ano-s0-vlastni", "ano"),
    },
    { text: "– kdo", formula: listIf("sleep-e0-ano-s0-vlastni", "ano") },
    {},
    { text: "STRAVOVACÍ OMEZENÍ", bold: true },
  ];

  const restrictions = [
    ["vegan", "Vegan"],
    ["vegetarian", "Vegetarián"],
    ["bezlepkova", "Bezlepková dieta"],
    ["alergie", "Alergie"],
    ["jine", "Jiné"],
  ];
  restrictions.forEach(([value, label]) => {
    const key = `strava-e0-${value}`;
    rows.push({
      text: label,
      formula: countChecked(key),
      persons: personCount(`${key}-s0`, key, "ano"),
    });
    rows.push({
      text: "– koho se týká",
      formula: listCheckedWithDetail(key, `${key}-s0`),
    });
  });

  const drinkSections = [
    {
      title: "PITÍ – NEALKO",
      base: "piti-nealko-e0",
      options: [
        ["perliva-voda", "Perlivá voda"],
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
        ["sampus", "Šampus"],
        ["gin-tonic", "Gin-tonic"],
        ["aperol", "Aperol"],
        ["rum-cola", "Rum s colou"],
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
