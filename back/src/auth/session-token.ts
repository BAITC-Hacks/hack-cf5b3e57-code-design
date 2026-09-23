import { createHmac, timingSafeEqual } from 'node:crypto';

const HEADER = { alg: 'HS256', typ: 'JWT' } as const;
const MINIMUM_SECRET_LENGTH = 32;

export interface SessionClaims {
  sub: string;
  iat: number;
  exp: number;
}

export class InvalidSessionTokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidSessionTokenError';
  }
}

function encodeJson(value: object): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

function assertSecret(secret: string): void {
  if (secret.length < MINIMUM_SECRET_LENGTH) {
    throw new Error(
      `SESSION_SECRET must contain at least ${MINIMUM_SECRET_LENGTH} characters`,
    );
  }
}

function sign(unsignedToken: string, secret: string): Buffer {
  return createHmac('sha256', secret).update(unsignedToken).digest();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function decodeJson(segment: string): unknown {
  try {
    return JSON.parse(
      Buffer.from(segment, 'base64url').toString('utf8'),
    ) as unknown;
  } catch {
    throw new InvalidSessionTokenError('Token contains invalid JSON');
  }
}

export function createSessionToken(
  userId: number,
  secret: string,
  ttlSeconds: number,
  nowSeconds = Math.floor(Date.now() / 1000),
): string {
  assertSecret(secret);
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    throw new Error('userId must be a positive safe integer');
  }
  if (!Number.isSafeInteger(ttlSeconds) || ttlSeconds <= 0) {
    throw new Error('ttlSeconds must be a positive safe integer');
  }

  const payload: SessionClaims = {
    sub: String(userId),
    iat: nowSeconds,
    exp: nowSeconds + ttlSeconds,
  };
  const unsignedToken = `${encodeJson(HEADER)}.${encodeJson(payload)}`;
  return `${unsignedToken}.${sign(unsignedToken, secret).toString('base64url')}`;
}

export function verifySessionToken(
  token: string,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): SessionClaims {
  assertSecret(secret);
  const segments = token.split('.');
  if (segments.length !== 3) {
    throw new InvalidSessionTokenError('Token must contain three segments');
  }

  const [headerSegment, payloadSegment, signatureSegment] = segments;
  const unsignedToken = `${headerSegment}.${payloadSegment}`;
  const expectedSignature = sign(unsignedToken, secret);
  const receivedSignature = Buffer.from(signatureSegment, 'base64url');
  if (
    receivedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(receivedSignature, expectedSignature)
  ) {
    throw new InvalidSessionTokenError('Token signature is invalid');
  }

  const header = decodeJson(headerSegment);
  if (
    !isRecord(header) ||
    header.alg !== HEADER.alg ||
    header.typ !== HEADER.typ
  ) {
    throw new InvalidSessionTokenError('Token header is invalid');
  }

  const payload = decodeJson(payloadSegment);
  if (
    !isRecord(payload) ||
    typeof payload.sub !== 'string' ||
    !/^\d+$/.test(payload.sub) ||
    typeof payload.iat !== 'number' ||
    !Number.isSafeInteger(payload.iat) ||
    typeof payload.exp !== 'number' ||
    !Number.isSafeInteger(payload.exp) ||
    payload.exp <= payload.iat
  ) {
    throw new InvalidSessionTokenError('Token payload is invalid');
  }
  if (payload.exp <= nowSeconds) {
    throw new InvalidSessionTokenError('Token has expired');
  }

  return { sub: payload.sub, iat: payload.iat, exp: payload.exp };
}
