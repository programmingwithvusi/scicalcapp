// Simple icon generator: loads SVG and writes PNGs at requested sizes.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const svgPath = path.join(__dirname, '..', 'www', 'img', 'icon.svg');
const outDir = path.join(__dirname, '..', 'res', 'icons', 'android');
const sizes = [36, 48, 72, 96, 144, 192];

if (!fs.existsSync(svgPath)) {
  console.error('SVG source not found:', svgPath);
  process.exit(2);
}

(async function () {
  try {
    const svg = fs.readFileSync(svgPath);
    for (const s of sizes) {
      const out = path.join(outDir, `icon-${s}.png`);
      await sharp(svg).resize(s, s).png().toFile(out);
      console.log('Wrote', out);
    }
    console.log('All icons generated');
  } catch (e) {
    console.error('Icon generation failed:', e);
    process.exit(1);
  }
})();
