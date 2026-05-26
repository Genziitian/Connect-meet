/* eslint-disable no-console */
// ============================================================
// Generate favicons + PWA icons from public/icons/master-icon.svg
// Output: public/icons/icon-192.png, icon-512.png, icon-512-maskable.png,
//         favicon.ico, apple-touch-icon.png
//
// Run: npm run icons
// ============================================================

import {
  IconTransformationType,
  generateFaviconFiles,
} from '@realfavicongenerator/generate-favicon';
import {
  getNodeImageAdapter,
  loadAndConvertToSvg,
} from '@realfavicongenerator/image-adapter-node';
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(process.cwd());
const SRC = path.join(ROOT, 'public', 'icons', 'master-icon.svg');
const OUT = path.join(ROOT, 'public', 'icons');
const PUB = path.join(ROOT, 'public');

console.log('Loading master icon:', SRC);
const imageAdapter = await getNodeImageAdapter();
const masterIcon = { icon: await loadAndConvertToSvg(SRC) };

const settings = {
  icon: {
    desktop: {
      regularIconTransformation: { type: IconTransformationType.None },
      darkIconType: 'none',
    },
    touch: {
      transformation: { type: IconTransformationType.None },
      appTitle: 'GenZ Connect',
    },
    webAppManifest: {
      transformation: { type: IconTransformationType.None },
      backgroundColor: '#FDEBD3',
      themeColor: '#00D09C',
      name: 'GenZ IITian Connect',
      shortName: 'GenZ Connect',
    },
  },
  path: '/icons/',
  skipMetadataInjection: true,
};

console.log('Generating files...');
const files = await generateFaviconFiles(masterIcon, settings, imageAdapter);

await fs.mkdir(OUT, { recursive: true });

// Different versions of the package return either a Map<string, Buffer>
// or a plain object — normalise both
const entries =
  files instanceof Map
    ? Array.from(files.entries())
    : Object.entries(files);

// Map common generator names → our PWA manifest naming
const rename = {
  'web-app-manifest-192x192.png': 'icon-192.png',
  'web-app-manifest-512x512.png': 'icon-512.png',
  'icon-192x192.png': 'icon-192.png',
  'icon-512x512.png': 'icon-512.png',
  'apple-touch-icon.png': 'apple-touch-icon.png',
  'favicon.ico': 'favicon.ico',
};

let wrote = 0;
for (const [name, contentRaw] of entries) {
  const fileName = String(name).split('/').pop();
  if (!fileName) continue;
  const targetName = rename[fileName] || fileName;
  // favicon.ico goes in public/ root for browser auto-discovery
  const targetDir = targetName === 'favicon.ico' ? PUB : OUT;
  const target = path.join(targetDir, targetName);
  const buf = Buffer.isBuffer(contentRaw)
    ? contentRaw
    : contentRaw && typeof contentRaw === 'object' && 'buffer' in contentRaw
    ? Buffer.from(contentRaw.buffer)
    : contentRaw;
  await fs.writeFile(target, buf);
  console.log('  ✓', path.relative(ROOT, target));
  wrote++;
}

// Generator typically produces a 512 — duplicate it as maskable if missing
const masPath = path.join(OUT, 'icon-512-maskable.png');
const reg512 = path.join(OUT, 'icon-512.png');
try {
  await fs.access(masPath);
} catch {
  try {
    await fs.copyFile(reg512, masPath);
    console.log('  ✓', path.relative(ROOT, masPath), '(copied from icon-512.png)');
    wrote++;
  } catch {
    console.warn('  ⚠️  Could not create icon-512-maskable.png. Generate manually at https://maskable.app/editor');
  }
}

console.log(`\n✅ Done. ${wrote} files written to ${path.relative(ROOT, OUT)}/`);
