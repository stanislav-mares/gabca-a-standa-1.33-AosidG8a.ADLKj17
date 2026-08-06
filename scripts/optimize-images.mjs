// Zmenší a přeuloží fotky v src/assets, aby v repu neležely originály
// z foťáku. Astro si z nich při buildu stejně dělá varianty do 2000 px
// (lightbox) a 1600 px (mřížka galerie), takže 4000+ px zdroj nikdo nikdy
// nestáhne — jen nafukuje repo, deploy a dobu buildu.
//
// Spouští se ručně po přidání fotek:  npm run images:optimize
//
// Co skript dělá:
//   - delší hranu zmenší na MAX_EDGE (menší fotky nechává být),
//   - zapeče EXIF orientaci do pixelů (viz POZOR níž),
//   - přeuloží na JPEG q82 / PNG, zachová EXIF kvůli `npm run gallery:dates`,
//   - výsledek zapíše jen tehdy, když je menší než původní soubor.
//
// POZOR na orientaci: 30 fotek v galerii má EXIF orientaci ≠ 1 (fotka je
// uložená naležato a tag říká, o kolik ji otočit). `rotate()` bez argumentu
// tohle otočení zapeče do pixelů a tag srovná na 1. Bez něj by se zmenšení
// sice povedlo, ale `landscape` detekce ve fotogalerii by u těchto fotek
// četla obrácené rozměry.

import sharp from "sharp";
import { readFile, writeFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dirs = [path.join(root, "src/assets"), path.join(root, "src/assets/galerie")];

const MAX_EDGE = 2560;
const JPEG_QUALITY = 82;

// Hotové fotky se poznají podle EXIF tagu Software — druhý běh je tak
// nechá být a nesbírá generační ztrátu z opakované komprese. PNG značku
// nemá (sharp EXIF do PNG nezapisuje), ale u něj ztráta nehrozí: zapisuje
// se jen menší výsledek, takže se běhy postupně zastaví na svém minimu.
const MARKER = "svatebni-web/optimize-images";

const EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);
const dryRun = process.argv.includes("--dry-run");

function formatMB(bytes) {
    return `${(bytes / 1048576).toFixed(2)} MB`;
}

function isDone(metadata) {
    const withinLimit = Math.max(metadata.width, metadata.height) <= MAX_EDGE;
    return withinLimit && (metadata.exif?.toString("latin1").includes(MARKER) ?? false);
}

async function optimize(filePath) {
    const input = await readFile(filePath);
    const metadata = await sharp(input).metadata();
    const before = input.length;

    if (isDone(metadata)) return { skipped: true, before };

    const pipeline = sharp(input)
        .rotate()
        .resize({
            width: MAX_EDGE,
            height: MAX_EDGE,
            fit: "inside",
            withoutEnlargement: true,
        })
        .withExifMerge({ IFD0: { Software: MARKER } });

    const output = await (metadata.format === "png"
        ? pipeline.png({ compressionLevel: 9, effort: 10, palette: true }).toBuffer()
        : pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer());

    // Palette u PNG s jemným přechodem nebo už zkomprimovaný JPEG umí vyrobit
    // větší soubor, než byl vstup — v tom případě si necháme původní.
    if (output.length >= before) return { skipped: true, before };

    if (!dryRun) await writeFile(filePath, output);
    const after = await sharp(output).metadata();
    return { before, after: output.length, from: metadata, to: after };
}

let totalBefore = 0;
let totalAfter = 0;
let changed = 0;
let skipped = 0;

for (const dir of dirs) {
    const names = (await readdir(dir, { withFileTypes: true }))
        .filter((entry) => entry.isFile() && EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
        .map((entry) => entry.name)
        .sort((a, b) => a.localeCompare(b));

    for (const name of names) {
        const filePath = path.join(dir, name);
        const result = await optimize(filePath);

        totalBefore += result.before;
        if (result.skipped) {
            totalAfter += result.before;
            skipped++;
            continue;
        }

        totalAfter += result.after;
        changed++;
        const label = path.relative(root, filePath);
        console.log(
            `${label.padEnd(46)} ${result.from.width}x${result.from.height} → ` +
                `${result.to.width}x${result.to.height}   ` +
                `${formatMB(result.before)} → ${formatMB(result.after)}`,
        );
    }
}

console.log(
    `\n${dryRun ? "[dry-run] " : ""}přeuloženo ${changed}, ponecháno ${skipped}   ` +
        `${formatMB(totalBefore)} → ${formatMB(totalAfter)}` +
        ` (−${Math.round((1 - totalAfter / totalBefore) * 100)} %)`,
);
