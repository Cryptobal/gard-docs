/**
 * Rellena proposalLink en negocios existentes desde el CSV de Soho.
 * Útil si la migración se ejecutó sin ese campo o los datos no se guardaron.
 *
 * Uso: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/backfill-deal-proposal-links.ts
 * O:   TENANT_SLUG=gard npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/backfill-deal-proposal-links.ts
 */

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const DATA_DIR = path.join(process.cwd(), 'Datos CRM');

async function main() {
  const tenantSlug = process.env.TENANT_SLUG || 'gard';
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug, active: true },
  });
  if (!tenant) {
    console.error('❌ No se encontró tenant con slug "' + tenantSlug + '"');
    process.exit(1);
  }
  const tenantId = tenant.id;

  const filePath = path.join(DATA_DIR, 'Negocios_2026_02_09.csv');
  if (!fs.existsSync(filePath)) {
    console.error('❌ No existe', filePath);
    process.exit(1);
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const rows = parse(raw, { columns: true, relax_column_count: true, trim: true }) as Record<string, string>[];

  // (title, accountName) -> Link propuesta (primera ocurrencia por key, como en la migración)
  const seen = new Set<string>();
  const keyToProposalLink = new Map<string, string>();
  for (const r of rows) {
    const title = r['Nombre de Negocio']?.trim();
    const accountName = r['Nombre de Empresa']?.trim();
    const link = r['Link propuesta']?.trim();
    if (!title || !accountName) continue;
    const key = `${title}|${accountName}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (link) keyToProposalLink.set(key, link);
  }

  const deals = await prisma.crmDeal.findMany({
    where: { tenantId },
    include: { account: { select: { name: true } } },
  });

  let updated = 0;
  let skippedAlreadySet = 0;
  let skippedNoLinkInCsv = 0;

  for (const deal of deals) {
    const key = `${deal.title}|${deal.account.name}`;
    const link = keyToProposalLink.get(key);
    if (!link) {
      skippedNoLinkInCsv++;
      continue;
    }
    if (deal.proposalLink === link) {
      skippedAlreadySet++;
      continue;
    }
    await prisma.crmDeal.update({
      where: { id: deal.id },
      data: { proposalLink: link },
    });
    updated++;
    console.log('  ✓', deal.title, '→', link.slice(0, 50) + (link.length > 50 ? '…' : ''));
  }

  console.log('\n✅ Links de propuesta actualizados:', updated);
  console.log('   Ya tenían el mismo link:', skippedAlreadySet);
  console.log('   Sin link en CSV para ese negocio:', skippedNoLinkInCsv);
  console.log('\n🎉 Listo. Recarga el detalle del negocio en el CRM.');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
