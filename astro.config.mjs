// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

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
