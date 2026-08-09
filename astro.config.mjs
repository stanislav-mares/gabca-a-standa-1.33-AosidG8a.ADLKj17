// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import { createHash } from 'node:crypto';
import { readdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';

const TEXT_OUTPUT = /\.(html|css|js|json|xml|txt)$/i;
const IMAGE_OUTPUT = /\.(jpe?g|png|webp|avif|svg|gif)$/i;
const SHELL_OUTPUT = /\.(html|css|js|woff2?)$/i;

/**
 * Projde adresář do hloubky a vrátí cesty ke všem souborům.
 *
 * @param {string} root
 * @returns {Promise<string[]>}
 */
async function collectFiles(root) {
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
  await walk(root);
  return files;
}

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
        const files = await collectFiles(outDir);

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

/**
 * Zapíše do `dist/sw.js` service worker poskládaný z `src/service-worker.js`.
 *
 * GitHub Pages servíruje assety s krátkou životností v cache, takže offline
 * (a na špatném signálu) stránce vypadne stylopis s celým Tailwindem nebo
 * skript a zůstane rozsypané HTML. Precachovaná skořápka to drží pohromadě.
 *
 * Do precache jde jen HTML, CSS, JS a fonty — dohromady pod 1 MB. Fotky ne:
 * `dist` jich má 48 MB a stáhnout je všechny při první návštěvě by nedávalo
 * smysl. Ty si service worker ukládá průběžně, jak je kdo prohlíží.
 *
 * Musí běžet až za `pruneUnreferencedAssets()`, jinak by do seznamu zapsal
 * i soubory, které prune vzápětí smaže.
 *
 * @returns {import('astro').AstroIntegration}
 */
function generateServiceWorker() {
  /** @type {string} */
  let base;

  return {
    name: 'generate-service-worker',
    hooks: {
      'astro:config:done': ({ config }) => {
        base = config.base.endsWith('/') ? config.base : `${config.base}/`;
      },
      'astro:build:done': async ({ dir, logger }) => {
        const outDir = fileURLToPath(dir);
        const files = (await collectFiles(outDir)).filter((file) =>
          SHELL_OUTPUT.test(file),
        );

        const contents = await Promise.all(
          files.map((file) => readFile(file)),
        );

        // Stránky nemají hash v názvu, takže samotný seznam souborů by úpravu
        // textace nezachytil a cache by zůstala na staré verzi. Hashujeme
        // proto rovnou obsah.
        const hash = createHash('sha256');
        const shell = files.map((file, i) => {
          const rel = path.relative(outDir, file).split(path.sep).join('/');
          hash.update(rel).update(contents[i]);

          if (rel === 'index.html') return base;
          if (rel.endsWith('/index.html')) {
            return base + rel.slice(0, -'index.html'.length);
          }
          return base + rel;
        });

        const template = await readFile(
          fileURLToPath(new URL('./src/service-worker.js', import.meta.url)),
          'utf8',
        );
        const source = template
          .replace('__BASE__', base)
          .replace('__VERSION__', hash.digest('hex').slice(0, 12))
          .replace('__PRECACHE__', JSON.stringify(shell.sort(), null, 4));

        await writeFile(path.join(outDir, 'sw.js'), source, 'utf8');

        const bytes = contents.reduce((sum, buffer) => sum + buffer.length, 0);
        logger.info(
          `sw.js: precache ${shell.length} souborů (${(bytes / 1048576).toFixed(1)} MB)`,
        );
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
  integrations: [pruneUnreferencedAssets(), generateServiceWorker()],
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
