/**
 * Generates PWA PNG icons from favicon.svg using the system's ImageMagick (convert).
 *
 * Prerequisites:
 *   brew install imagemagick
 *
 * Run:
 *   node scripts/generate-icons.js
 *
 * Output:
 *   public/icons/icon-192.png       (Android home screen)
 *   public/icons/icon-512.png       (Android splash / Play Store)
 *   public/icons/apple-touch-icon.png  (iOS Add to Home Screen)
 */

const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const root    = path.join(__dirname, '..')
const svg     = path.join(root, 'public', 'favicon.svg')
const outDir  = path.join(root, 'public', 'icons')

if (!fs.existsSync(svg)) {
  console.error('ERROR: public/favicon.svg not found')
  process.exit(1)
}

fs.mkdirSync(outDir, { recursive: true })

const icons = [
  { name: 'icon-192.png',          size: 192 },
  { name: 'icon-512.png',          size: 512 },
  { name: 'apple-touch-icon.png',  size: 180 },
]

for (const { name, size } of icons) {
  const out = path.join(outDir, name)
  try {
    execSync(`convert -background "#0e1410" -resize ${size}x${size} "${svg}" "${out}"`)
    console.log(`✓ ${name} (${size}×${size})`)
  } catch {
    console.error(`✗ Failed to generate ${name} — is ImageMagick installed? (brew install imagemagick)`)
    process.exit(1)
  }
}

// After generating PNGs, update manifest.json to use them
const manifestPath = path.join(root, 'public', 'manifest.json')
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
manifest.icons = [
  { src: '/icons/icon-192.png',         sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
  { src: '/icons/icon-512.png',         sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
  { src: '/favicon.svg',                sizes: 'any',     type: 'image/svg+xml', purpose: 'any' },
]
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
console.log('✓ manifest.json updated with PNG icon references')
console.log('\nDone. Commit the new files in public/icons/ and deploy.')
