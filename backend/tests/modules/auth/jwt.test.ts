import jwt from 'jsonwebtoken';
import {
  durationToSeconds,
  signTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
} from '../../../src/modules/auth/jwt.js';

const user = { id: '11111111-1111-1111-1111-111111111111', email: 'a@b.com' };

describe('durationToSeconds', () => {
  it.each([
    ['30s', 30],
    ['15m', 900],
    ['2h', 7200],
    ['7d', 604800],
  ])('%s -> %i', (input, expected) => {
    expect(durationToSeconds(input)).toBe(expected);
  });

  it('throws on garbage', () => {
    expect(() => durationToSeconds('soon')).toThrow();
  });
});

describe('token pair', () => {
  it('signs an access + refresh token that verify back to the user', () => {
    const pair = signTokenPair(user);

    const access = verifyAccessToken(pair.access.token);
    expect(access.sub).toBe(user.id);
    expect(access.type).toBe('access');
    expect(access.jti).toBe(pair.access.jti);

    const refresh = verifyRefreshToken(pair.refresh.token);
    expect(refresh.sub).toBe(user.id);
    expect(refresh.type).toBe('refresh');
  });

  it('does not accept an access token as a refresh token', () => {
    const pair = signTokenPair(user);
    expect(() => verifyRefreshToken(pair.access.token)).toThrow('Token');
  });

  it('rejects a tampered / wrongly-signed token', () => {
    const forged = jwt.sign({ sub: user.id, email: user.email, type: 'access' }, 'not-the-secret');
    expect(() => verifyAccessToken(forged)).toThrow('inválido');
  });
});
