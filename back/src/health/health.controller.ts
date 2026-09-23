import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth(): { ok: true; mock: boolean } {
    return {
      ok: true,
      mock: process.env.MOCK === '1' || !process.env.OPENAI_API_KEY,
    };
  }
}
