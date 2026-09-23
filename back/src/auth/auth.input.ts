import { BadRequestException } from '@nestjs/common';
import type { LoginRequest } from '../../../shared/contract';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseLoginInput(value: unknown): LoginRequest {
  if (!isRecord(value)) {
    throw new BadRequestException('Request body must be an object');
  }

  const { email, password } = value;
  if (typeof email !== 'string' || !email.trim() || email.length > 320) {
    throw new BadRequestException('email must be a non-empty string');
  }
  if (
    typeof password !== 'string' ||
    password.length === 0 ||
    password.length > 1024
  ) {
    throw new BadRequestException('password must be a non-empty string');
  }

  return { email: email.trim().toLowerCase(), password };
}
