// Vytáhne z fotek v src/assets/galerie datum pořízení a zapíše je do
// src/data/gallery-dates.json, podle kterého fotogalerie řadí.
//
// Datum se čte jednou při spuštění skriptu, ne při buildu — mapa je v gitu
// vidět, jde ručně opravit a build nemusí sahat na 84 souborů.
//
// Spouští se ručně po přidání nebo odebrání fotek:  npm run gallery:dates
//
// EXIF parsujeme sami (JPEG APP1 → TIFF → IFD), aby si projekt kvůli skriptu,
// který běží párkrát za rok, nemusel držet závislost navíc.

import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const galleryDir = path.join(root, "src/assets/galerie");
const outFile = path.join(root, "src/data/gallery-dates.json");

const EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);

const TAG_DATETIME = 0x0132; // IFD0: datum souboru, horší než DateTimeOriginal
const TAG_EXIF_IFD = 0x8769; // IFD0: ukazatel na Exif sub-IFD
const TAG_DATETIME_ORIGINAL = 0x9003; // Exif IFD: okamžik zmáčknutí spouště
const TAG_DATETIME_DIGITIZED = 0x9004;

/** Najde v JPEGu segment APP1 a vrátí jeho obsah bez hlavičky "Exif\0\0". */
function findExifSegment(buf) {
    if (buf.readUInt16BE(0) !== 0xffd8) return null; // není JPEG

    let offset = 2;
    while (offset + 4 <= buf.length) {
        if (buf[offset] !== 0xff) return null; // rozsypaná struktura markerů
        const marker = buf.readUInt16BE(offset);
        if (marker === 0xffda) return null; // začátek obrazových dat, EXIF už nepřijde

        const length = buf.readUInt16BE(offset + 2);
        if (marker === 0xffe1 && buf.toString("latin1", offset + 4, offset + 10) === "Exif\0\0") {
            return buf.subarray(offset + 10, offset + 2 + length);
        }
        offset += 2 + length;
    }
    return null;
}

/** Přečte ASCII hodnotu jednoho IFD zápisu (typ 2). Delší než 4 bajty leží jinde. */
function readAsciiEntry(tiff, entryOffset, little) {
    const count = little ? tiff.readUInt32LE(entryOffset + 4) : tiff.readUInt32BE(entryOffset + 4);
    const valueField = entryOffset + 8;
    const start =
        count <= 4 ? valueField : little ? tiff.readUInt32LE(valueField) : tiff.readUInt32BE(valueField);
    if (start + count > tiff.length) return null;
    return tiff.toString("latin1", start, start + count).replace(/\0.*$/, "").trim();
}

/** Projde jedno IFD a vrátí hodnoty hledaných tagů (ASCII) plus ukazatele. */
function readIfd(tiff, ifdOffset, little, wanted) {
    const found = {};
    if (ifdOffset + 2 > tiff.length) return found;

    const entries = little ? tiff.readUInt16LE(ifdOffset) : tiff.readUInt16BE(ifdOffset);
    for (let i = 0; i < entries; i++) {
        const entry = ifdOffset + 2 + i * 12;
        if (entry + 12 > tiff.length) break;

        const tag = little ? tiff.readUInt16LE(entry) : tiff.readUInt16BE(entry);
        if (!wanted.includes(tag)) continue;

        found[tag] =
            tag === TAG_EXIF_IFD
                ? little
                    ? tiff.readUInt32LE(entry + 8)
                    : tiff.readUInt32BE(entry + 8)
                : readAsciiEntry(tiff, entry, little);
    }
    return found;
}

/** "2015:02:15 02:01:34" → "2015-02-15T02:01:34"; nesmysly zahodí. */
function normalizeExifDate(value) {
    const match = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(value ?? "");
    if (!match) return null;
    const [, y, mo, d, h, mi, s] = match;
    if (y === "0000" || mo === "00" || d === "00") return null;
    return `${y}-${mo}-${d}T${h}:${mi}:${s}`;
}

function readCaptureDate(buf) {
    const tiff = findExifSegment(buf);
    if (!tiff || tiff.length < 8) return null;

    const byteOrder = tiff.toString("latin1", 0, 2);
    if (byteOrder !== "II" && byteOrder !== "MM") return null;
    const little = byteOrder === "II";

    const ifd0Offset = little ? tiff.readUInt32LE(4) : tiff.readUInt32BE(4);
    const ifd0 = readIfd(tiff, ifd0Offset, little, [TAG_DATETIME, TAG_EXIF_IFD]);

    const exifIfd = ifd0[TAG_EXIF_IFD]
        ? readIfd(tiff, ifd0[TAG_EXIF_IFD], little, [TAG_DATETIME_ORIGINAL, TAG_DATETIME_DIGITIZED])
        : {};

    // Pořadí podle důvěryhodnosti: spoušť → digitalizace → datum souboru
    for (const candidate of [
        exifIfd[TAG_DATETIME_ORIGINAL],
        exifIfd[TAG_DATETIME_DIGITIZED],
        ifd0[TAG_DATETIME],
    ]) {
        const normalized = normalizeExifDate(candidate);
        if (normalized) return normalized;
    }
    return null;
}

/** Záchrana pro fotky bez EXIFu: IMG_20190321_110322.jpg a spol. */
function dateFromFilename(name) {
    const match = /(\d{4})(\d{2})(\d{2})[_-](\d{2})(\d{2})(\d{2})/.exec(name);
    if (!match) return null;
    const [, y, mo, d, h, mi, s] = match;
    if (Number(y) < 1990 || Number(mo) > 12 || Number(d) > 31 || Number(h) > 23) return null;
    return `${y}-${mo}-${d}T${h}:${mi}:${s}`;
}

const existing = existsSync(outFile) ? JSON.parse(await readFile(outFile, "utf8")) : {};

const files = (await readdir(galleryDir))
    .filter((name) => EXTENSIONS.has(path.extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b));

const dates = {};
const stats = { exif: 0, filename: 0, kept: 0, unknown: 0 };

for (const name of files) {
    // Ručně doplněná nebo opravená hodnota má přednost — skript ji nesmí přepsat
    if (existing[name]) {
        dates[name] = existing[name];
        stats.kept++;
        continue;
    }

    const fromExif = readCaptureDate(await readFile(path.join(galleryDir, name)));
    if (fromExif) {
        dates[name] = fromExif;
        stats.exif++;
        continue;
    }

    const fromName = dateFromFilename(name);
    dates[name] = fromName;
    if (fromName) stats.filename++;
    else stats.unknown++;
}

await mkdir(path.dirname(outFile), { recursive: true });
await writeFile(outFile, `${JSON.stringify(dates, null, 4)}\n`);

const removed = Object.keys(existing).filter((name) => !(name in dates));
console.log(`${outFile.replace(`${root}/`, "")}: ${files.length} fotek`);
console.log(`  z EXIFu:        ${stats.exif}`);
console.log(`  z názvu:        ${stats.filename}`);
console.log(`  ponecháno:      ${stats.kept}  (ruční hodnoty z minula)`);
console.log(`  bez data:       ${stats.unknown}`);
if (removed.length) console.log(`  odebráno:       ${removed.length}  (${removed.join(", ")})`);
if (stats.unknown) {
    console.log("\nBez data (doplň ručně v JSONu, jinak spadnou na konec galerie):");
    for (const [name, value] of Object.entries(dates)) if (!value) console.log(`  ${name}`);
}
