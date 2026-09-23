import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth(): { ok: true; mock: boolean } {
    const hasOpenAiKey = Boolean(process.env.OPENAI_API_KEY?.trim());
    return {
      ok: true,
      mock: process.env.MOCK === '1' || !hasOpenAiKey,
    };
  }
}
