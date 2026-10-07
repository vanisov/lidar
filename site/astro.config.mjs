import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://lidarcss.com',
  integrations: [sitemap()],
  devToolbar: { enabled: false },
  // The site reads the store screenshots, CHANGELOG.md and PRIVACY.md from the repo root.
  vite: { plugins: [tailwindcss()], server: { fs: { allow: ['..'] } } },
});
