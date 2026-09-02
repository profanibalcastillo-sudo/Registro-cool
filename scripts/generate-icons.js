import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Crisp SVG design representing MEDUCA Digital Registry (Book + Grade A+ / Star + Digital Crest)
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#0369a1" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde047" />
      <stop offset="100%" stop-color="#eab308" />
    </linearGradient>
    <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34d399" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
  </defs>

  <!-- Background rounded rectangle with subtle rim -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)" />
  <rect x="8" y="8" width="496" height="496" rx="104" fill="none" stroke="#38bdf8" stroke-width="4" stroke-opacity="0.3" />

  <!-- Central Academic Emblem -->
  <!-- Open Book Base -->
  <path d="M256 360 C210 320 130 320 80 340 L80 180 C130 160 210 160 256 200 C302 160 382 160 432 180 L432 340 C382 320 302 320 256 360 Z" fill="#ffffff" fill-opacity="0.95" />
  
  <!-- Pages depth -->
  <path d="M256 360 L256 200" stroke="#0284c7" stroke-width="6" stroke-linecap="round" />
  <path d="M120 220 L220 235 M120 260 L220 275 M120 300 L200 312" stroke="#94a3b8" stroke-width="6" stroke-linecap="round" />
  <path d="M392 220 L292 235 M392 260 L292 275 M392 300 L312 312" stroke="#94a3b8" stroke-width="6" stroke-linecap="round" />

  <!-- Graduation Cap above book -->
  <polygon points="256,90 390,145 256,200 122,145" fill="url(#goldGrad)" stroke="#ca8a04" stroke-width="3" />
  <!-- Cap tassel -->
  <path d="M390 145 L390 220 C390 230 376 230 376 220 L376 150" stroke="#facc15" stroke-width="5" stroke-linecap="round" />
  <circle cx="376" cy="225" r="7" fill="#eab308" />

  <!-- 5.0 Star Ribbon (MEDUCA Excellence Emblem) -->
  <circle cx="256" cy="405" r="45" fill="url(#emeraldGrad)" stroke="#10b981" stroke-width="3" />
  <path d="M256 375 L265 395 L287 398 L270 413 L275 435 L256 423 L237 435 L242 413 L225 398 L247 395 Z" fill="#ffffff" />
</svg>`;

// Maskable icon with 15% inner padding
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#0369a1" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde047" />
      <stop offset="100%" stop-color="#eab308" />
    </linearGradient>
  </defs>
  <!-- Full bleed for maskable -->
  <rect width="512" height="512" fill="url(#bgGrad)" />

  <!-- Centered emblem scaled to safe 75% zone -->
  <g transform="translate(64, 64) scale(0.75)">
    <!-- Book -->
    <path d="M256 360 C210 320 130 320 80 340 L80 180 C130 160 210 160 256 200 C302 160 382 160 432 180 L432 340 C382 320 302 320 256 360 Z" fill="#ffffff" />
    <path d="M256 360 L256 200" stroke="#0284c7" stroke-width="6" stroke-linecap="round" />
    <!-- Cap -->
    <polygon points="256,90 390,145 256,200 122,145" fill="url(#goldGrad)" />
    <!-- Star badge -->
    <circle cx="256" cy="405" r="45" fill="#10b981" />
    <path d="M256 375 L265 395 L287 398 L270 413 L275 435 L256 423 L237 435 L242 413 L225 398 L247 395 Z" fill="#ffffff" />
  </g>
</svg>`;

async function generate() {
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgIcon);
  
  const svgBuffer = Buffer.from(svgIcon);
  const maskableBuffer = Buffer.from(maskableSvg);

  // 192x192
  await sharp(svgBuffer).resize(192, 192).png().toFile(path.join(publicDir, 'pwa-192x192.png'));
  
  // 512x512
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-512x512.png'));
  
  // 512x512 maskable
  await sharp(maskableBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  // 180x180 apple touch icon
  await sharp(svgBuffer).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // 48x48 favicon
  await sharp(svgBuffer).resize(48, 48).png().toFile(path.join(publicDir, 'favicon.ico'));

  console.log('Icons generated successfully in public/');
}

generate().catch(console.error);
