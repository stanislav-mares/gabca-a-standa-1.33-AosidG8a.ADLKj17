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
