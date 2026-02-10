/**
 * Genera iconos favicon/PWA: fondo blanco + logo azul Gard Security.
 * Uso: node scripts/generate-gard-icons.mjs
 * Requiere: sharp (ya en el proyecto vía Next.js)
 */

import sharp from "sharp";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PUBLIC = join(ROOT, "public");
const ICONS_DIR = join(PUBLIC, "icons");

const SIZES = [48, 72, 96, 128, 144, 180, 192, 512];

const SOURCES = [
  join(PUBLIC, "Logo escudo gard azul.webp"),
  join(PUBLIC, "Logo Gard azul.webp"),
];

let sourcePath = SOURCES.find((p) => existsSync(p));
if (!sourcePath) {
  console.error("No se encontró logo azul en public/. Buscar Logo escudo gard azul.webp o Logo Gard azul.webp");
  process.exit(1);
}

async function run() {
  const logo = sharp(sourcePath);
  const meta = await logo.metadata();
  const logoSize = Math.min(meta.width || 512, meta.height || 512);

  for (const size of SIZES) {
    const padding = Math.round(size * 0.12);
    const fitSize = size - padding * 2;

    const whiteBg = sharp({
      create: {
        width: size,
        height: size,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .png();

    const resizedLogo = await logo
      .clone()
      .resize(fitSize, fitSize, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toBuffer();

    const outPath = join(ICONS_DIR, `icon-${size}x${size}.png`);
    await whiteBg
      .composite([
        {
          input: resizedLogo,
          top: padding,
          left: padding,
        },
      ])
      .toFile(outPath);
    console.log(`Generado: ${outPath}`);
  }
  console.log("Listo. Iconos Gard (fondo blanco + logo azul) en public/icons/");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
