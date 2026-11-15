import { mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let sharp;
try {
  sharp = require('sharp');
} catch {
  sharp = require(resolve(root, 'apps/api/node_modules/sharp'));
}
const svgBuffer = readFileSync(resolve(root, 'apps/admin/public/icon.svg'));
const bg = { r: 38, g: 60, b: 50, alpha: 1 }; // #263c32

async function makeSplash(outputPath, width, height) {
  const iconSize = Math.round(Math.min(width, height) * 0.22);
  const iconPng = await sharp(svgBuffer).resize(iconSize, iconSize).png().toBuffer();
  mkdirSync(dirname(outputPath), { recursive: true });
  await sharp({
    create: { width, height, channels: 4, background: bg },
  })
    .composite([{ input: iconPng, gravity: 'center' }])
    .png()
    .toFile(outputPath);
}

async function makeIcon(outputPath, size, paddingRatio = 0) {
  const inner = Math.max(1, Math.round(size * (1 - paddingRatio * 2)));
  const iconPng = await sharp(svgBuffer).resize(inner, inner).png().toBuffer();
  mkdirSync(dirname(outputPath), { recursive: true });
  if (paddingRatio === 0) {
    await sharp({
      create: { width: size, height: size, channels: 4, background: bg },
    })
      .composite([{ input: iconPng, gravity: 'center' }])
      .png()
      .toFile(outputPath);
  } else {
    await sharp({
      create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .composite([{ input: iconPng, gravity: 'center' }])
      .png()
      .toFile(outputPath);
  }
}

async function main() {
  // iOS AppIcon (1024x1024 opaque) & Launch Splash (2732x2732)
  await makeIcon(resolve(root, 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png'), 1024, 0);
  for (const name of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) {
    await makeSplash(resolve(root, `ios/App/App/Assets.xcassets/Splash.imageset/${name}`), 2732, 2732);
  }

  // Android launcher icons + splash screens
  const androidDensities = [
    ['mdpi', 48, 108, 320, 480],
    ['hdpi', 72, 162, 480, 800],
    ['xhdpi', 96, 216, 720, 1280],
    ['xxhdpi', 144, 324, 960, 1600],
    ['xxxhdpi', 192, 432, 1280, 1920],
  ];

  for (const [density, launcherSize, foregroundSize, splashShort, splashLong] of androidDensities) {
    const mipmapDir = resolve(root, `android/app/src/main/res/mipmap-${density}`);
    await makeIcon(resolve(mipmapDir, 'ic_launcher.png'), launcherSize, 0);
    await makeIcon(resolve(mipmapDir, 'ic_launcher_round.png'), launcherSize, 0);
    await makeIcon(resolve(mipmapDir, 'ic_launcher_foreground.png'), foregroundSize, 0.2);

    await makeSplash(
      resolve(root, `android/app/src/main/res/drawable-port-${density}/splash.png`),
      splashShort,
      splashLong,
    );
    await makeSplash(
      resolve(root, `android/app/src/main/res/drawable-land-${density}/splash.png`),
      splashLong,
      splashShort,
    );
  }

  await makeSplash(resolve(root, 'android/app/src/main/res/drawable/splash.png'), 1080, 1920);
  console.log('Generated custom Astro Static Studio icons and #263c32 splash screens for Android & iOS.');
}

await main();
