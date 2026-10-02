import * as esbuild from 'esbuild';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';

const test = process.argv.includes('--test');
const watch = process.argv.includes('--watch');

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await cp('static', 'dist', { recursive: true });
if (test) {
  // The test build may script any page so Playwright can drive it; the shipped build never can.
  const manifest = JSON.parse(await readFile('static/manifest.json', 'utf8'));
  manifest.host_permissions = ['<all_urls>'];
  await writeFile('dist/manifest.json', JSON.stringify(manifest, null, 2));
}

const ctx = await esbuild.context({
  entryPoints: { background: 'src/background.ts', content: 'src/content/index.ts' },
  bundle: true,
  outdir: 'dist',
  format: 'iife',
  target: 'chrome120',
  minify: !test && !watch,
  sourcemap: test || watch ? 'inline' : false,
  loader: { '.css': 'text' },
  jsx: 'automatic',
  jsxImportSource: 'preact',
  define: { __TEST__: String(test) },
  logLevel: 'info',
});
if (watch) await ctx.watch();
else {
  await ctx.rebuild();
  await ctx.dispose();
}
