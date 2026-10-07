import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // The Pages workflow passes the deployed origin and sub-path (vanisov.github.io + /lidar until the domain is
  // set up); locally the site builds for lidarcss.com at the root.
  site: process.env.SITE_URL || 'https://lidarcss.com',
  base: process.env.BASE_PATH || '/',
  integrations: [sitemap()],
  devToolbar: { enabled: false },
  // The site reads the store screenshots, CHANGELOG.md and PRIVACY.md from the repo root.
  vite: { plugins: [tailwindcss()], server: { fs: { allow: ['..'] } } },
});
