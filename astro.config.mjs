// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

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
  vite: {
    plugins: [tailwindcss()]
  }
});
