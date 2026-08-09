/// <reference lib="webworker" />

/**
 * Vzor service workeru. Sám o sobě se nikam nebuildí — při `astro build` ho
 * přečte integrace `generateServiceWorker()` z astro.config.mjs, nahradí
 * placeholdery a výsledek zapíše do `dist/sw.js`.
 *
 * Proč vůbec: web je statika na GitHub Pages a ta posílá assety s krátkou
 * životností v cache. Offline (nebo na mizerném signálu) tak stránce klidně
 * vypadne stylopis s celým Tailwindem a zůstane neostylované HTML. Precache
 * skořápky tomu předchází.
 */

const BASE = "__BASE__";
const SHELL_CACHE = "shell-__VERSION__";
const IMAGE_CACHE = "images-v1";

// Strop pro fotky v cache. Galerie jich má ~250 variant a celé `dist`
// s obrázky váží 48 MB — bez stropu by cache na cizím telefonu rostla, dokud
// ji prohlížeč sám nezahodí.
const MAX_IMAGE_ENTRIES = 400;

const IMAGE_PATH = /\.(?:jpe?g|png|webp|avif|svg|gif)$/i;

/**
 * Skořápka webu: HTML, CSS, JS a fonty (dohromady pod 1 MB). Fotky tu
 * schválně nejsou — stahovat je všechny při instalaci by bylo přes 48 MB.
 * Do cache padají až podle toho, co si kdo reálně prohlédne.
 */
const SHELL = __PRECACHE__;

// HTML se v seznamu pozná podle lomítka na konci (`…/fotogalerie/`), assety
// končí příponou. Šetří to druhý seznam a nemůže se to rozejít.
const SHELL_URLS = new Set(SHELL);

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches
            .open(SHELL_CACHE)
            .then((cache) => cache.addAll(SHELL))
            .then(() => self.skipWaiting()),
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        (async () => {
            // Jméno cache nese hash obsahu skořápky, takže nový build =
            // nová cache. Ty starší tady zametáme.
            for (const name of await caches.keys()) {
                if (name.startsWith("shell-") && name !== SHELL_CACHE) {
                    await caches.delete(name);
                }
            }
            await self.clients.claim();
        })(),
    );
});

/**
 * Odkazy v menu vedou na `…/fotogalerie` bez lomítka a server na ně odpovídá
 * přesměrováním. V cache je ale klíč s lomítkem, tak ho tu dorovnáme.
 *
 * @param {URL} url
 * @returns {string | null} klíč do cache, nebo null když o soubor nejde
 */
function shellKey(url) {
    if (SHELL_URLS.has(url.pathname)) return url.pathname;
    const withSlash = `${url.pathname}/`;
    return SHELL_URLS.has(withSlash) ? withSlash : null;
}

/**
 * HTML bereme přednostně ze sítě: stránky nemají v názvu hash, takže by se
 * jinak dala upravená textace poznat až po dalším buildu. Cache je záloha
 * pro offline.
 *
 * @param {Request} request
 * @param {string} key
 */
async function htmlNetworkFirst(request, key) {
    const cache = await caches.open(SHELL_CACHE);
    try {
        const response = await fetch(request);
        if (response.ok) await cache.put(key, response.clone());
        return response;
    } catch (error) {
        const cached = await cache.match(key);
        if (cached) return cached;
        throw error;
    }
}

/**
 * Assety mají hash v názvu, takže obsah pod danou adresou se nikdy nezmění —
 * cache-first je u nich bezpečné.
 *
 * @param {Request} request
 * @param {string} cacheName
 * @param {string} [key]
 */
async function cacheFirst(request, cacheName, key) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(key ?? request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response.ok && response.type === "basic") {
        await cache.put(key ?? request, response.clone());
    }
    return response;
}

/** @param {Cache} cache */
async function trimImages(cache) {
    const keys = await cache.keys();
    // `keys()` vrací pořadí vložení, tedy zahazujeme nejstarší zápis, ne
    // nejdéle nepoužitý. Na galerii, kterou si člověk projde odshora dolů,
    // to vyjde nastejno a ušetří to evidenci časů.
    for (const key of keys.slice(0, keys.length - MAX_IMAGE_ENTRIES)) {
        await cache.delete(key);
    }
}

/** @param {Request} request */
async function imageCacheFirst(request) {
    const cache = await caches.open(IMAGE_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response.ok && response.type === "basic") {
        await cache.put(request, response.clone());
        await trimImages(cache);
    }
    return response;
}

self.addEventListener("fetch", (event) => {
    const { request } = event;
    if (request.method !== "GET") return;

    const url = new URL(request.url);
    // Cizí originy (mapy.com, fonts.googleapis.com) necháváme být — jejich
    // odpovědi jsou neprůhledné a stejně je offline nikde nevezmeme.
    if (url.origin !== self.location.origin) return;
    if (!url.pathname.startsWith(BASE)) return;

    const key = shellKey(url);
    if (key) {
        event.respondWith(
            key.endsWith("/")
                ? htmlNetworkFirst(request, key)
                : cacheFirst(request, SHELL_CACHE, key),
        );
        return;
    }

    if (IMAGE_PATH.test(url.pathname)) {
        event.respondWith(imageCacheFirst(request));
    }
});
