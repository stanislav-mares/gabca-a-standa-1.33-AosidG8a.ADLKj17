import type { ImageMetadata } from "astro";
import { getImage } from "astro:assets";

const modules = import.meta.glob<{ default: ImageMetadata }>(
    "../assets/galerie/*.{jpg,jpeg,png,JPG,JPEG,PNG}",
    { eager: true },
);

export function getGalleryPhotos(): ImageMetadata[] {
    return Object.entries(modules)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, module]) => module.default);
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
