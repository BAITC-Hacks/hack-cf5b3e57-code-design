import { hashPassword, verifyPassword } from './password';

describe('password hashing', () => {
  it('accepts the original password and rejects another one', async () => {
    const hash = await hashPassword('correct horse battery staple');

    await expect(
      verifyPassword('correct horse battery staple', hash),
    ).resolves.toBe(true);
    await expect(verifyPassword('incorrect password', hash)).resolves.toBe(
      false,
    );
  });

  it('uses a fresh salt for every hash', async () => {
    const first = await hashPassword('same password');
    const second = await hashPassword('same password');

    expect(first).not.toBe(second);
  });

  it('rejects malformed hashes', async () => {
    await expect(verifyPassword('password', 'not-a-hash')).resolves.toBe(false);
  });
});
