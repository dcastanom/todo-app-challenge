import { hashPassword, verifyPassword } from '../../../src/modules/auth/password.js';

describe('password hashing', () => {
  it('produces a bcrypt hash that verifies against the original', async () => {
    const hash = await hashPassword('Sup3rSecret!');
    expect(hash).toMatch(/^\$2[aby]\$/);
    expect(hash).not.toContain('Sup3rSecret!');
    await expect(verifyPassword('Sup3rSecret!', hash)).resolves.toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('correct-horse');
    await expect(verifyPassword('battery-staple', hash)).resolves.toBe(false);
  });

  it('produces a different hash each call (random salt)', async () => {
    const [a, b] = await Promise.all([hashPassword('same'), hashPassword('same')]);
    expect(a).not.toBe(b);
  });
});
