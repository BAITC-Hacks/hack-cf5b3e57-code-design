import 'dotenv/config';

import { Prisma, PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

const DEFAULT_MODEL = 'gpt-4o-mini';
const REQUEST_DELAY_MS = 350;
const SYSTEM_PROMPT = `Ты помогаешь свести описание event-подрядчика к структурированным фактам. Верни JSON: {"specialization": "короткая специализация 3-6 слов", "signals": ["3-5 проверяемых признаков: масштаб (напр. \"работает с ивентами до 3000 человек\"), стиль, топы/рейтинги/премии, международный опыт, язык ведения, годы опыта — только то что явно есть в описании. По-русски, без общих фраз. Каждый сигнал ≤ 60 знаков."]}. НЕ выдумывай факты которых нет в описании.`;

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseEnrichment(content: string): {
  specialization: string;
  signals: string[];
} {
  const parsed = JSON.parse(content) as Record<string, unknown>;
  const specialization =
    typeof parsed.specialization === 'string'
      ? parsed.specialization.trim()
      : '';
  const signals = Array.isArray(parsed.signals)
    ? parsed.signals
        .filter((signal): signal is string => typeof signal === 'string')
        .map((signal) => signal.trim())
        .filter(Boolean)
    : [];

  if (!specialization || signals.length === 0) {
    throw new Error('response has empty specialization or signals');
  }

  return { specialization, signals };
}

async function main(): Promise<void> {
  const startedAt = Date.now();
  const contractors = await prisma.contractor.findMany();

  for (const [index, contractor] of contractors.entries()) {
    console.log(
      `Enriching ${contractor.id} (${index + 1}/${contractors.length})...`,
    );

    try {
      const response = await openai.chat.completions.create({
        model: process.env.MODEL_MAIN || DEFAULT_MODEL,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Категория: ${contractor.categories.join(', ')}\nГород: ${contractor.city}\nЦена от: ${contractor.priceFromKzt} ₸\nОписание:\n${contractor.description}`,
          },
        ],
      });
      const content = response.choices[0]?.message.content?.trim();
      if (!content) throw new Error('empty completion');

      const { specialization, signals } = parseEnrichment(content);
      const raw = JSON.parse(
        JSON.stringify(response),
      ) as Prisma.InputJsonValue;

      await prisma.enrichment.upsert({
        where: { contractorId: contractor.id },
        create: {
          contractorId: contractor.id,
          specialization,
          signals,
          raw,
        },
        update: { specialization, signals, raw },
      });
    } catch (error) {
      console.warn(
        `Failed to enrich ${contractor.id}: ${(error as Error).message}`,
      );
    }

    if (index < contractors.length - 1) {
      await delay(REQUEST_DELAY_MS);
    }
  }

  const elapsedSeconds = Math.round((Date.now() - startedAt) / 1000);
  console.log(`Enriched ${contractors.length} contractors in ${elapsedSeconds}s`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
