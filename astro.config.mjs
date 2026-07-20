// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://stanislav-mares.github.io',
  base: '/gabca-a-standa-1.33-AosidG8a.ADLKj17/',
  vite: {
    plugins: [tailwindcss()]
  }
});
