import type { ImageMetadata } from "astro";
import { getImage } from "astro:assets";

// PhotoSwipe potřebuje znát rozměry velké varianty dopředu (data-pswp-width/height)
const LIGHTBOX_MAX_WIDTH = 2000;

export interface LightboxSource {
    src: string;
    width: number;
    height: number;
}

export async function getLightboxSource(
    image: ImageMetadata,
): Promise<LightboxSource> {
    const width = Math.min(LIGHTBOX_MAX_WIDTH, image.width);
    const height = Math.round((image.height / image.width) * width);
    const { src } = await getImage({ src: image, width, height, format: "webp" });
    return { src, width, height };
}
