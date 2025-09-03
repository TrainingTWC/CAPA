// Copy dist/index.html to dist/404.html for SPA fallback on GitHub Pages
import { copyFile } from 'node:fs/promises';
import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { resolve } from 'node:path';

async function run() {
  const src = resolve('dist/index.html');
  const dest = resolve('dist/404.html');
  try {
    await access(src, constants.F_OK);
    await copyFile(src, dest);
    console.log('[spa-404] created dist/404.html');
  } catch (e) {
    console.warn('[spa-404] skipped:', e?.message || e);
  }
}
run();
