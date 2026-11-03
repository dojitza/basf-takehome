import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseCatalogueSnapshot } from './catalogue-import.js';

const header =
  'sku,name,chemical_name,function,application_area,region,certifications,status,launch_year,description';
const row = (overrides: Record<string, string> = {}) => {
  const fields = {
    sku: 'P-1',
    name: 'Example',
    chemical_name: 'Substance',
    function: 'Polymer',
    application_area: 'Coatings',
    region: 'Global',
    certifications: 'Vegan',
    status: 'Active',
    launch_year: '2020',
    description: 'Description',
    ...overrides,
  };
  return Object.values(fields).join(',');
};
const snapshot = (...rows: string[]) => [header, ...rows].join('\n');

describe('PIM catalogue snapshot', () => {
  it('maps columns by header, normalizes whitespace and preserves text', () => {
    const result = parseCatalogueSnapshot(
      [
        'description,launch_year,status,certifications,region,application_area,function,chemical_name,name,sku',
        ' Description  with spaces , 2020 ,active, Vegan | Kosher , EMEA , Coatings , Polymer , Substance , Example , sku-a ',
      ].join('\n'),
    );
    expect(result.products).toEqual([
      expect.objectContaining({
        sku: 'SKU-A',
        name: 'Example',
        chemicalName: 'Substance',
        function: 'Polymer',
        applicationArea: 'Coatings',
        region: 'EMEA',
        certifications: ['Vegan', 'Kosher'],
        status: 'ACTIVE',
        launchYear: 2020,
        description: 'Description  with spaces',
      }),
    ]);
  });

  it('accepts BOM, CRLF, blank lines and a trailing newline', () => {
    const result = parseCatalogueSnapshot(
      `\ufeff${header}\r\n\r\n${row()}\r\n`,
    );
    expect(result.products).toHaveLength(1);
    expect(result.products[0]).toEqual(expect.objectContaining({ sku: 'P-1' }));
  });

  it('reads quoted commas, escaped quotes, embedded newlines and Unicode', () => {
    const result = parseCatalogueSnapshot(
      snapshot(
        row({ name: '"Crème, ""special"""', description: '"First\nSecond"' }),
      ),
    );
    expect(result.products[0]).toEqual(
      expect.objectContaining({
        name: 'Crème, "special"',
        description: 'First\nSecond',
      }),
    );
  });

  it('keeps missing optional text as null, warning about a missing name', () => {
    const result = parseCatalogueSnapshot(
      snapshot(row({ name: ' ', chemical_name: '', description: '' })),
    );
    expect(result.products[0]).toEqual(
      expect.objectContaining({
        name: null,
        chemicalName: null,
        description: null,
      }),
    );
    expect(result.warnings.join('\n')).toMatch(/P-1/i);
  });

  it('splits, trims and deduplicates certifications; an empty field yields an empty list', () => {
    const result = parseCatalogueSnapshot(
      snapshot(
        row({ certifications: 'Vegan| Kosher |Vegan|| ' }),
        row({ sku: 'P-2', certifications: '' }),
      ),
    );
    expect(result.products[0].certifications).toEqual(['Vegan', 'Kosher']);
    expect(result.products[1].certifications).toEqual([]);
  });

  it.each([
    ['Active', 'ACTIVE'],
    [' active ', 'ACTIVE'],
    ['ACTIVE', 'ACTIVE'],
    ['Phase-out', 'PHASE_OUT'],
    ['Phase out', 'PHASE_OUT'],
    ['Discontinued', 'DISCONTINUED'],
  ])('normalizes status %s to %s', (input, expected) => {
    const result = parseCatalogueSnapshot(snapshot(row({ status: input })));
    expect(result.products[0].status).toBe(expected);
  });

  it.each(['', 'retired'])(
    'warns and maps unrecognized status %j to UNKNOWN',
    (status) => {
      const result = parseCatalogueSnapshot(snapshot(row({ status })));
      expect(result.products[0].status).toBe('UNKNOWN');
      expect(result.warnings.join('\n')).toMatch(/P-1/i);
      if (status) expect(result.warnings.join('\n')).toContain(status);
    },
  );

  it.each(['', 'n/a'])('treats launch year %j as unknown', (launch_year) => {
    expect(
      parseCatalogueSnapshot(snapshot(row({ launch_year }))).products[0]
        .launchYear,
    ).toBeNull();
  });

  it.each(['not-a-year', '2020.5', '2020x', '2e3', '999999999999999999999'])(
    'warns and treats malformed year %s as unknown',
    (launch_year) => {
      const result = parseCatalogueSnapshot(snapshot(row({ launch_year })));
      expect(result.products[0].launchYear).toBeNull();
      expect(result.warnings.join('\n')).toContain(launch_year);
      expect(result.warnings.join('\n')).toMatch(/P-1/i);
    },
  );

  it.each([
    ['', 'empty'],
    [' \n \n', 'whitespace only'],
    [header, 'header only'],
    ['sku,name\nP-1,Example', 'missing headers'],
    [`${header},sku\n${row()},P-1`, 'duplicate header'],
    [`${header}\n${row({ sku: ' ' })}`, 'missing SKU'],
    [`${header}\n${row()}\n,,,,,,,,,`, 'empty record with missing SKU'],
    [`${header}\nP-1,Example`, 'short row'],
    [`${header}\n${row()},extra`, 'long row'],
    [`${header}\nP-1,"unfinished`, 'bad quoting'],
  ])('rejects %s (%s)', (csv) => {
    expect(() => parseCatalogueSnapshot(csv)).toThrow();
  });

  it('reports the location of a malformed record', () => {
    expect(() =>
      parseCatalogueSnapshot(snapshot(row(), 'P-2,"unfinished')),
    ).toThrow(/(line|row|record).*3/i);
  });

  it('collapses identical duplicates after normalization without a conflicting-data warning', () => {
    const result = parseCatalogueSnapshot(
      snapshot(row(), row({ sku: ' p-1 ', status: ' ACTIVE ' })),
    );
    expect(result.products).toHaveLength(1);
    expect(result.warnings.join('\n')).toMatch(/P-1/i);
    expect(result.warnings.join('\n')).not.toMatch(/conflict/i);
  });

  const statuses = [
    ['UNKNOWN', 'unrecognized'],
    ['DISCONTINUED', 'Discontinued'],
    ['PHASE_OUT', 'Phase-out'],
    ['ACTIVE', 'Active'],
  ] as const;
  const pairs = statuses.flatMap(([winningStatus, winningInput], index) =>
    statuses.slice(index + 1).flatMap(([, losingInput]) => [
      [winningStatus, winningInput, losingInput],
      [winningStatus, losingInput, winningInput],
    ]),
  );
  it.each(pairs)(
    'selects %s over %s/%s in either order',
    (winner, first, second) => {
      const result = parseCatalogueSnapshot(
        snapshot(
          row({ name: first, status: first }),
          row({ sku: 'p-1', name: second, status: second }),
        ),
      );
      expect(result.products).toHaveLength(1);
      const winningInput = statuses.find(([status]) => status === winner)?.[1];
      expect(result.products[0]).toEqual(
        expect.objectContaining({ status: winner, name: winningInput }),
      );
      expect(result.warnings.join('\n')).toMatch(/P-1/i);
    },
  );

  it('selects the entire pessimistic row and reports the conflicting values and source rows', () => {
    const result = parseCatalogueSnapshot(
      snapshot(
        row({ name: 'Active name', status: 'Active', launch_year: '2020' }),
        row({
          sku: 'p-1',
          name: 'Discontinued name',
          status: 'Discontinued',
          launch_year: '2007',
        }),
      ),
    );
    expect(result.products[0]).toEqual(
      expect.objectContaining({
        name: 'Discontinued name',
        status: 'DISCONTINUED',
        launchYear: 2007,
      }),
    );
    expect(result.warnings.join('\n')).toMatch(/P-1/i);
    expect(result.warnings.join('\n')).toMatch(/active/i);
    expect(result.warnings.join('\n')).toMatch(/discontinued/i);
    expect(result.warnings.join('\n')).toMatch(/2/);
    expect(result.warnings.join('\n')).toMatch(/3/);
  });

  it('selects the later row on an equal normalized status and reports other differences', () => {
    const result = parseCatalogueSnapshot(
      snapshot(
        row({ name: 'First', status: 'ACTIVE' }),
        row({ sku: 'p-1', name: 'Later', status: 'active' }),
      ),
    );
    expect(result.products[0]).toEqual(
      expect.objectContaining({ name: 'Later', status: 'ACTIVE' }),
    );
    expect(result.warnings.join('\n')).toMatch(/P-1/i);
    expect(result.warnings.join('\n')).toMatch(/name/i);
  });

  it('selects the last of the most pessimistic rows in a group of three or more', () => {
    const result = parseCatalogueSnapshot(
      snapshot(
        row({ name: 'Old', status: 'Discontinued' }),
        row({ name: 'Optimistic', status: 'Active' }),
        row({ name: 'Replacement', status: 'discontinued' }),
        row({ name: 'Later optimistic', status: 'Phase out' }),
      ),
    );
    expect(result.products).toHaveLength(1);
    expect(result.products[0]).toEqual(
      expect.objectContaining({ name: 'Replacement', status: 'DISCONTINUED' }),
    );
  });

  it('normalizes the supplied export with its known anomalies', () => {
    const csv = readFileSync(
      fileURLToPath(new URL('../../../data/products.csv', import.meta.url)),
      'utf8',
    );
    const result = parseCatalogueSnapshot(csv);
    expect(result.products).toHaveLength(200);
    expect(
      result.products.find(
        (product: { sku: string }) => product.sku === 'P-10151',
      ),
    ).toEqual(expect.objectContaining({ status: 'DISCONTINUED' }));
    expect(
      result.products.filter(
        (product: { sku: string }) => product.sku === 'P-10013',
      ),
    ).toHaveLength(1);
    expect(
      result.products.some(
        (product: { name: string | null }) => product.name === null,
      ),
    ).toBe(true);
    expect(
      result.products.some(
        (product: { launchYear: number | null }) => product.launchYear === null,
      ),
    ).toBe(true);
    expect(result.warnings.join('\n')).toMatch(/P-10151/i);
  });
});
