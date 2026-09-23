import {
  createSessionToken,
  InvalidSessionTokenError,
  verifySessionToken,
} from './session-token';

describe('session tokens', () => {
  const secret = 'a-secret-that-is-definitely-longer-than-32-characters';

  it('round-trips signed claims', () => {
    const token = createSessionToken(42, secret, 3600, 1000);

    expect(verifySessionToken(token, secret, 1001)).toEqual({
      sub: '42',
      iat: 1000,
      exp: 4600,
    });
  });

  it('rejects a tampered payload', () => {
    const token = createSessionToken(42, secret, 3600, 1000);
    const [, , signature] = token.split('.');
    const tamperedPayload = Buffer.from(
      JSON.stringify({ sub: '7', iat: 1000, exp: 4600 }),
    ).toString('base64url');
    const tamperedToken = `${token.split('.')[0]}.${tamperedPayload}.${signature}`;

    expect(() => verifySessionToken(tamperedToken, secret, 1001)).toThrow(
      InvalidSessionTokenError,
    );
  });

  it('rejects an expired token', () => {
    const token = createSessionToken(42, secret, 10, 1000);

    expect(() => verifySessionToken(token, secret, 1010)).toThrow(
      'Token has expired',
    );
  });
});
