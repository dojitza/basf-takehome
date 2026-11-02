import { readConfig } from './config.js';
describe('environment configuration', () => {
  it('accepts a PostgreSQL URL and defaults the port', () => {
    expect(
      readConfig({ DATABASE_URL: 'postgresql://localhost/catalogue' }).port,
    ).toBe(3000);
  });
  it.each([
    undefined,
    'invalid',
    'https://localhost/catalogue',
    'postgresql://localhost',
  ])('rejects invalid database configuration', (DATABASE_URL) => {
    expect(() => readConfig({ DATABASE_URL })).toThrow();
  });
  it.each(['0', '65536', 'abc', '3.5', ''])('rejects invalid ports', (PORT) => {
    expect(() =>
      readConfig({ DATABASE_URL: 'postgresql://localhost/catalogue', PORT }),
    ).toThrow('PORT');
  });
});
