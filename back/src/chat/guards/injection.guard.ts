import { BadRequestException, Injectable } from '@nestjs/common';

const INJECTION_PATTERNS = [
  /ignore\s+(previous|prior|all|above|earlier)/i,
  /disregard\s+(previous|prior|all|above)/i,
  /system\s+prompt/i,
  /you\s+are\s+(a|an|now|no longer)/i,
  /(^|\n)\s*(assistant|system|user)\s*:/i,
  /<\|/,
  /\|>/,
  /ignore\s+the\s+(above|previous)/i,
];

@Injectable()
export class InjectionGuard {
  check(content: string): boolean {
    return INJECTION_PATTERNS.some((pattern) => pattern.test(content));
  }

  assertSafe(content: string): void {
    if (this.check(content)) {
      throw new BadRequestException({
        code: 'injection',
        message: 'Сообщение похоже на попытку изменить инструкции ассистента.',
      });
    }
  }
}
