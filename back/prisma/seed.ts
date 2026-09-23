import { Prisma, PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const prisma = new PrismaClient();

interface ContractorCsvRow {
  id: string;
  anon_name: string;
  categories: string;
  city: string;
  city_imputed: string;
  synthetic: string;
  price_from_kzt: string;
  price_imputed: string;
  event_formats: string;
  languages: string;
  max_hours: string;
  busy_dates: string;
  description: string;
}

function parseBoolean(value: string, field: string, id: string): boolean {
  if (value === 'True') return true;
  if (value === 'False') return false;

  throw new Error(`Invalid ${field} value for contractor ${id}: ${value}`);
}

function parseInteger(value: string, field: string, id: string): number {
  if (!/^-?\d+$/.test(value)) {
    throw new Error(`Invalid ${field} value for contractor ${id}: ${value}`);
  }

  return Number.parseInt(value, 10);
}

function parseList(value: string): string[] {
  if (value === '') return [];

  return value.split('|').map((item) => item.trim());
}

function toContractor(
  row: ContractorCsvRow,
): Prisma.ContractorUncheckedCreateInput {
  return {
    id: row.id,
    anonName: row.anon_name,
    categories: parseList(row.categories),
    city: row.city,
    cityImputed: parseBoolean(row.city_imputed, 'city_imputed', row.id),
    synthetic: parseBoolean(row.synthetic, 'synthetic', row.id),
    priceFromKzt: parseInteger(row.price_from_kzt, 'price_from_kzt', row.id),
    priceImputed: parseBoolean(row.price_imputed, 'price_imputed', row.id),
    eventFormats: parseList(row.event_formats),
    languages: parseList(row.languages),
    maxHours:
      row.max_hours === ''
        ? null
        : parseInteger(row.max_hours, 'max_hours', row.id),
    busyDates: parseList(row.busy_dates),
    description: row.description,
  };
}

async function main(): Promise<void> {
  const csvPath = resolve(__dirname, 'seed-data', 'contractors.csv');
  const csv = readFileSync(csvPath, 'utf8');
  const rows = parse(csv, {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as ContractorCsvRow[];

  if (rows.length !== 66) {
    throw new Error(`Expected 66 contractors in CSV, found ${rows.length}`);
  }

  const ids = new Set(rows.map((row) => row.id));
  if (ids.size !== rows.length) {
    throw new Error('CSV contains duplicate contractor ids');
  }

  const contractors = rows.map(toContractor);

  await prisma.$transaction(
    contractors.map((contractor) => {
      const { id, ...data } = contractor;

      return prisma.contractor.upsert({
        where: { id },
        create: contractor,
        update: data,
      });
    }),
  );

  console.log(`Seeded ${contractors.length} contractors.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
