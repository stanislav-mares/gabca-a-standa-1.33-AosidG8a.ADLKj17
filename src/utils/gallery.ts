import type { ImageMetadata } from "astro";
import { getImage } from "astro:assets";
import galleryDates from "../data/gallery-dates.json";

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

// Každá HERO_INTERVAL-tá fotka se v mozaice roztáhne přes 2×2 buňky
const HERO_INTERVAL = 5;

export function isHeroPhoto(index: number): boolean {
    return index % HERO_INTERVAL === 0;
}

// PhotoSwipe potřebuje znát rozměry velké varianty dopředu (data-pswp-width/height)
const LIGHTBOX_MAX_WIDTH = 2000;

export interface GalleryPhoto {
    image: ImageMetadata;
    lightbox: { src: string; width: number; height: number };
}

export async function getGalleryPhotosWithLightbox(): Promise<GalleryPhoto[]> {
    return Promise.all(
        getGalleryPhotos().map(async (image) => {
            const width = Math.min(LIGHTBOX_MAX_WIDTH, image.width);
            const height = Math.round((image.height / image.width) * width);
            const { src } = await getImage({ src: image, width, height, format: "webp" });
            return { image, lightbox: { src, width, height } };
        }),
    );
}
