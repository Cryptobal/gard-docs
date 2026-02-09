/**
 * Ajusta la etapa (stage) de cada negocio según la Fase del CSV de Soho.
 * Los negocios que quedaron en Prospección se reasignan a Cotización enviada,
 * Primer/Segundo seguimiento, Negociación, etc. según corresponda.
 *
 * Uso: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/fix-deal-stages-from-csv.ts
 */

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const DATA_DIR = path.join(process.cwd(), 'Datos CRM');

const FASE_TO_STAGE: Record<string, string> = {
  'Cierre ganado': 'Ganado',
  'Cierre perdido': 'Perdido',
  'Cliente Inactivo': 'Perdido',
  'Cotización Enviada': 'Cotización enviada',
  'Negociando': 'Negociación',
  'Oportunidad': 'Prospección',
  'Seguimiento 1': 'Primer seguimiento',
  'Seguimiento 2': 'Segundo seguimiento',
};

async function main() {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: 'gard', active: true },
  });
  if (!tenant) {
    console.error('❌ No se encontró tenant "gard"');
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

  // (title, accountName) -> Fase (primera ocurrencia, como en la migración)
  const seen = new Set<string>();
  const keyToFase = new Map<string, string>();
  for (const r of rows) {
    const title = r['Nombre de Negocio']?.trim();
    const accountName = r['Nombre de Empresa']?.trim();
    if (!title || !accountName) continue;
    const key = `${title}|${accountName}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const fase = r['Fase']?.trim() || '';
    keyToFase.set(key, fase);
  }

  const stages = await prisma.crmPipelineStage.findMany({
    where: { tenantId },
    select: { id: true, name: true },
  });
  const stageNameToId = new Map(stages.map((s) => [s.name, s.id]));

  const deals = await prisma.crmDeal.findMany({
    where: { tenantId },
    include: { account: { select: { name: true } } },
  });

  let updated = 0;
  let notInCsv = 0;
  let alreadyOk = 0;
  let noStage = 0;

  for (const deal of deals) {
    const key = `${deal.title}|${deal.account.name}`;
    const fase = keyToFase.get(key);
    if (fase === undefined) {
      notInCsv++;
      continue;
    }
    const stageName = FASE_TO_STAGE[fase] || 'Prospección';
    const newStageId = stageNameToId.get(stageName);
    if (!newStageId) {
      noStage++;
      continue;
    }
    if (deal.stageId === newStageId) {
      alreadyOk++;
      continue;
    }
    await prisma.crmDeal.update({
      where: { id: deal.id },
      data: { stageId: newStageId },
    });
    updated++;
  }

  console.log('✅ Etapas actualizadas:', updated);
  console.log('   Ya correctas:', alreadyOk);
  console.log('   No encontrados en CSV:', notInCsv);
  console.log('   Sin etapa mapeada:', noStage);
  console.log('\n🎉 Listo. Recarga la vista de Negocios.');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
