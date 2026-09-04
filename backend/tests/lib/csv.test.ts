import { csvField, toCsv } from '../../src/lib/csv.js';

describe('csvField', () => {
  it('leaves plain values untouched', () => {
    expect(csvField('hola')).toBe('hola');
    expect(csvField(42)).toBe('42');
  });

  it('renders null / undefined as empty', () => {
    expect(csvField(null)).toBe('');
    expect(csvField(undefined)).toBe('');
  });

  it('quotes and escapes commas, quotes and newlines', () => {
    expect(csvField('a,b')).toBe('"a,b"');
    expect(csvField('she said "hi"')).toBe('"she said ""hi"""');
    expect(csvField('line1\nline2')).toBe('"line1\nline2"');
  });
});

describe('toCsv', () => {
  const cols = [
    { header: 'id', value: (r: { id: number; n: string }) => r.id },
    { header: 'nombre', value: (r: { id: number; n: string }) => r.n },
  ];

  it('writes a header row and CRLF-terminated data rows', () => {
    const csv = toCsv(
      [
        { id: 1, n: 'uno' },
        { id: 2, n: 'dos, y medio' },
      ],
      cols,
    );
    expect(csv).toBe('id,nombre\r\n1,uno\r\n2,"dos, y medio"');
  });

  it('emits just the header for an empty list', () => {
    expect(toCsv([], cols)).toBe('id,nombre');
  });
});
