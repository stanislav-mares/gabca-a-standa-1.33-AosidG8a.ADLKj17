// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import { readdir, readFile, stat, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';

const TEXT_OUTPUT = /\.(html|css|js|json|xml|txt)$/i;
const IMAGE_OUTPUT = /\.(jpe?g|png|webp|avif|svg|gif)$/i;

/**
 * Vedle variant z `<Image>` skončí v `dist/_astro/` i originály fotek —
 * import obrázku je pro Vite odkaz na soubor, takže ho vyemituje, i když
 * ho stránky nikde nepoužijí. U galerie to dělá přes 40 MB, které si žádný
 * prohlížeč nevyžádá a které se přesto pokaždé nahrají na GitHub Pages.
 *
 * Po buildu proto projdeme textové výstupy a obrázek, na který se v nich
 * neodkazuje, smažeme. Jméno v `dist` nese hash obsahu, takže shoda podle
 * názvu souboru je jednoznačná.
 *
 * Pozor: adresu poskládanou až za běhu z kousků řetězce takhle nenajdeme.
 * Kdyby někdy vznikla, musela by se odsud vyjmout výjimkou.
 *
 * @returns {import('astro').AstroIntegration}
 */
function pruneUnreferencedAssets() {
  return {
    name: 'prune-unreferenced-assets',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const outDir = fileURLToPath(dir);

        /** @type {string[]} */
        const files = [];
        /** @param {string} current */
        const walk = async (current) => {
          for (const entry of await readdir(current, { withFileTypes: true })) {
            const entryPath = path.join(current, entry.name);
            if (entry.isDirectory()) await walk(entryPath);
            else files.push(entryPath);
          }
        };
        await walk(outDir);

        const referenced = (
          await Promise.all(
            files
              .filter((file) => TEXT_OUTPUT.test(file))
              .map((file) => readFile(file, 'utf8')),
          )
        ).join('\n');

        let removed = 0;
        let freed = 0;
        for (const file of files.filter((file) => IMAGE_OUTPUT.test(file))) {
          if (referenced.includes(path.basename(file))) continue;
          freed += (await stat(file)).size;
          await unlink(file);
          removed++;
        }

        if (removed > 0) {
          logger.info(
            `zahozeno ${removed} neodkazovaných obrázků (${(freed / 1048576).toFixed(1)} MB)`,
          );
        }
      },
    },
  };
}

// Cormorant přes astro:fonts, ne přes @import v global.css jako starší rodiny:
// soubory se stáhnou při buildu a servírují se z vlastní domény, takže odpadá
// blokující požadavek na fonts.googleapis.com. `latin-ext` je povinný —
// bez něj by chyběla česká diakritika (ě, š, č, ř, ž, ů).
const cormorant = {
  provider: fontProviders.google(),
  weights: [400, 600],
  styles: /** @type {const} */ (['normal', 'italic']),
  subsets: ['latin', 'latin-ext'],
  fallbacks: ['Georgia', 'serif'],
};

// https://astro.build/config
export default defineConfig({
  site: 'https://stanislav-mares.github.io',
  base: '/gabca-a-standa-1.33-AosidG8a.ADLKj17/',
  // Web má 7 stránek — předtáhnout je všechny stojí pár kB a `loader`
  // v Layout.astro pak doběhne dřív, než fade loga a menu
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  integrations: [pruneUnreferencedAssets()],
  fonts: [
    { ...cormorant, name: 'Cormorant', cssVariable: '--astro-cormorant' },
    {
      ...cormorant,
      name: 'Cormorant Garamond',
      cssVariable: '--astro-cormorant-garamond',
    },
  ],
  vite: {
    plugins: [tailwindcss()]
  }
});
