/**
 * Genera iconos favicon/PWA: solo escudo blanco (sin letras), fondo transparente.
 * Usa public/logo escudo blanco.png para que favicon y Add to Home Screen en iPhone sean el escudo blanco.
 * Uso: node scripts/generate-gard-icons.mjs
 */

import sharp from "sharp";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PUBLIC = join(ROOT, "public");
const ICONS_DIR = join(PUBLIC, "icons");

const SIZES = [48, 72, 96, 128, 144, 180, 192, 512];

const SOURCE = join(PUBLIC, "logo escudo blanco.png");

if (!existsSync(SOURCE)) {
  console.error("No se encontró public/logo escudo blanco.png");
  process.exit(1);
}

async function run() {
  const logo = sharp(SOURCE);

  for (const size of SIZES) {
    const padding = Math.round(size * 0.1);
    const fitSize = size - padding * 2;

    const resized = await logo
      .clone()
      .resize(fitSize, fitSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    const outPath = join(ICONS_DIR, `icon-${size}x${size}.png`);
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .png()
      .composite([{ input: resized, top: padding, left: padding }])
      .toFile(outPath);
    console.log(`Generado: ${outPath}`);
  }
  console.log("Listo. Iconos = escudo blanco (sin letras) en public/icons/");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
