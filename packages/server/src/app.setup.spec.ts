import { allowedOrigins } from './app.setup';

describe('allowedOrigins', () => {
  it('allows any origin when CORS_ORIGINS is unset or blank', () => {
    expect(allowedOrigins(undefined)).toBe(true);
    expect(allowedOrigins(' , ')).toBe(true);
  });

  it('reads a comma-separated list', () => {
    expect(
      allowedOrigins('http://localhost:5173, https://wordle.example'),
    ).toEqual(['http://localhost:5173', 'https://wordle.example']);
  });
});
