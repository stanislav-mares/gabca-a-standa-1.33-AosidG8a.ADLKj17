import type { ImageMetadata } from "astro";
import galleryDates from "../data/gallery-dates.json";
import { getLightboxSource, type LightboxSource } from "./lightbox";

const modules = import.meta.glob<{ default: ImageMetadata }>(
    "../assets/galerie/*.{jpg,jpeg,png,JPG,JPEG,PNG}",
    { eager: true },
);

// Datum pořízení nečteme z EXIFu při buildu, ale z mapy, kterou generuje
// `npm run gallery:dates`. Fotky bez data v ní mají null.
const captureDates: Record<string, string | null> = galleryDates;

export function getGalleryPhotos(): ImageMetadata[] {
    return Object.entries(modules)
        .map(([filePath, module]) => ({
            name: filePath.slice(filePath.lastIndexOf("/") + 1),
            image: module.default,
        }))
        .sort((a, b) => {
            const dateA = captureDates[a.name];
            const dateB = captureDates[b.name];
            // Formát je pevný (YYYY-MM-DDTHH:MM:SS), takže stačí porovnat
            // řetězce — parsovat na Date není proč
            if (dateA && dateB) return dateA.localeCompare(dateB);
            if (dateA) return -1;
            if (dateB) return 1;
            // Nedatované jdou na konec a mezi sebou podle názvu
            return a.name.localeCompare(b.name);
        })
        .map(({ image }) => image);
}

export interface GalleryPhoto {
    image: ImageMetadata;
    lightbox: LightboxSource;
}

export async function getGalleryPhotosWithLightbox(): Promise<GalleryPhoto[]> {
    return Promise.all(
        getGalleryPhotos().map(async (image) => ({
            image,
            lightbox: await getLightboxSource(image),
        })),
    );
}

/** Počty sloupců mozaiky napříč breakpointy — viz `grid-cols-*` ve fotogalerii. */
const GALLERY_COLUMNS = [2, 4, 6];

/**
 * Kolik prvních dlaždic smí dostat `data-reveal`, aby řez padl na konec řádku.
 *
 * Reveal se počítá po dlaždicích, jenže landscape fotka zabírá dvě buňky
 * (`col-span-2`). Když počet buněk nevyjde na celé řádky, poslední řádek se
 * rozdělí: část se vynoří a zbytek vedle ní stojí od prvního snímku napevno.
 * Hledáme proto nejmenší `k >= minimum`, u kterého je obsazení dělitelné všemi
 * počty sloupců naráz — jedno číslo musí sednout na mobil i na 2xl.
 *
 * Natvrdo zapsaná hodnota by platila jen pro současnou sadu fotek; přidání
 * jediné landscape fotky mezi první dvacítku by šev vrátilo zpátky.
 */
export function getRowAlignedRevealCount(
    photos: GalleryPhoto[],
    minimum: number,
): number {
    let cells = 0;
    for (let k = 0; k < photos.length; k++) {
        cells += photos[k].image.width > photos[k].image.height ? 2 : 1;
        if (k + 1 >= minimum && GALLERY_COLUMNS.every((c) => cells % c === 0)) {
            return k + 1;
        }
    }
    return photos.length;
}
