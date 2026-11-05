import { randomUUID } from 'node:crypto';
import { parse } from 'csv-parse/sync';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const headers = [
  'sku',
  'name',
  'chemical_name',
  'function',
  'application_area',
  'region',
  'certifications',
  'status',
  'launch_year',
  'description',
] as const;
type Status = 'ACTIVE' | 'PHASE_OUT' | 'DISCONTINUED' | 'UNKNOWN';
type Product = {
  sku: string;
  name: string | null;
  chemicalName: string | null;
  function: string | null;
  applicationArea: string | null;
  region: string | null;
  certifications: string[];
  status: Status;
  launchYear: number | null;
  description: string | null;
};
const priority: Record<Status, number> = {
  ACTIVE: 0,
  PHASE_OUT: 1,
  DISCONTINUED: 2,
  UNKNOWN: 3,
};

export function parseCatalogueSnapshot(csv: string) {
  let records: { record: string[]; info: { lines: number } }[];
  try {
    records = parse(csv, {
      bom: true,
      info: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    }) as unknown as typeof records;
  } catch (error) {
    const err = error as Error & { lines?: number };
    throw new Error(`Invalid CSV at line ${err.lines ?? '?'}: ${err.message}`, {
      cause: error,
    });
  }
  if (records.length < 2)
    throw new Error('CSV must contain a header and at least one product row');
  const header = records[0].record.map((field) => field.trim());
  if (
    new Set(header).size !== header.length ||
    headers.some((key) => !header.includes(key)) ||
    header.length !== headers.length
  )
    throw new Error('CSV has duplicate, missing, or unexpected headers');
  const warnings: string[] = [];
  const diagnostics: { type: string; summary: string; detail: string }[] = [];
  function warn(type: string, summary: string, detail = summary) {
    warnings.push(detail);
    diagnostics.push({ type, summary, detail });
  }
  const selected = new Map<
    string,
    { product: Product; line: number; conflicted: boolean }
  >();
  let duplicateRows = 0;
  for (const { record, info } of records.slice(1)) {
    const line = info.lines;
    if (record.length !== header.length)
      throw new Error(
        `Invalid CSV at line ${line}: expected ${header.length} fields, got ${record.length}`,
      );
    const fields = Object.fromEntries(
      header.map((key, i) => [key, record[i].trim()]),
    );
    const sku = fields.sku.toUpperCase();
    if (!sku) throw new Error(`Missing SKU at line ${line}`);
    const nullable = (key: string) => fields[key] || null;
    if (!fields.name)
      warn('Missing name', `Line ${line}, ${sku}: missing name`);
    const normalizedStatus = fields.status
      .toLowerCase()
      .replace(/[\s_-]+/g, '');
    const status: Status =
      normalizedStatus === 'active'
        ? 'ACTIVE'
        : normalizedStatus === 'phaseout'
          ? 'PHASE_OUT'
          : normalizedStatus === 'discontinued'
            ? 'DISCONTINUED'
            : 'UNKNOWN';
    if (status === 'UNKNOWN')
      warn(
        'Unknown status',
        `Line ${line}, ${sku}: unrecognized status ${JSON.stringify(fields.status)}`,
      );
    const yearText = fields.launch_year;
    let launchYear: number | null = null;
    if (yearText && yearText.toLowerCase() !== 'n/a') {
      const parsedYear = Number(yearText);
      if (
        /^\d{4}$/.test(yearText) &&
        Number.isSafeInteger(parsedYear) &&
        parsedYear >= -2147483648 &&
        parsedYear <= 2147483647
      )
        launchYear = parsedYear;
      else
        warn(
          'Invalid launch year',
          `Line ${line}, ${sku}: invalid launch year ${JSON.stringify(yearText)}`,
        );
    }
    const product: Product = {
      sku,
      name: nullable('name'),
      chemicalName: nullable('chemical_name'),
      function: nullable('function'),
      applicationArea: nullable('application_area'),
      region: nullable('region'),
      certifications: [
        ...new Set(
          fields.certifications
            .split('|')
            .map((value) => value.trim())
            .filter(Boolean),
        ),
      ],
      status,
      launchYear,
      description: nullable('description'),
    };
    const previous = selected.get(sku);
    if (!previous) {
      selected.set(sku, { product, line, conflicted: false });
      continue;
    }
    duplicateRows++;
    if (
      !previous.conflicted &&
      JSON.stringify(previous.product) === JSON.stringify(product)
    ) {
      warn(
        'Identical duplicate',
        `Duplicate ${sku}: identical rows ${previous.line} and ${line}`,
      );
      continue;
    }
    const winner =
      priority[product.status] >= priority[previous.product.status]
        ? { product, line, conflicted: true }
        : { ...previous, conflicted: true };
    warn(
      'Conflicting duplicate',
      `CONFLICT ${sku}: row ${previous.line} (${previous.product.status}), row ${line} (${product.status}); selected row ${winner.line} (${winner.product.status})`,
      `CONFLICT ${sku}: row ${previous.line} ${JSON.stringify(previous.product)}; row ${line} ${JSON.stringify(product)}; selected row ${winner.line} (${winner.product.status})`,
    );
    selected.set(sku, winner);
  }
  if (!selected.size)
    throw new Error('CSV must contain at least one product row');
  return {
    products: [...selected.values()].map(({ product }) => product),
    warnings,
    diagnostics,
    rowCount: records.length - 1,
    duplicateRows,
  };
}

type Counts = {
  created: number;
  updated: number;
  unchanged: number;
  absent: number;
};
export async function importCatalogue({
  databaseUrl,
  csv,
  now = new Date(),
}: {
  databaseUrl: string;
  csv: string;
  now?: Date;
}) {
  const snapshot = parseCatalogueSnapshot(csv);
  const url = new URL(databaseUrl);
  const schema = url.searchParams.get('schema') ?? 'public';
  url.searchParams.delete('schema');
  const prisma = new PrismaClient({
    adapter: new PrismaPg(
      { connectionString: url.toString(), connectionTimeoutMillis: 2000 },
      { schema },
    ),
  });
  try {
    const counts = await prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT set_config('search_path', quote_ident(${schema}) || ', pg_temp', true)`;
        await tx.$executeRawUnsafe(
          'LOCK TABLE "Product" IN SHARE ROW EXCLUSIVE MODE',
        );
        await tx.$executeRawUnsafe(
          'CREATE TEMP TABLE import_snapshot (LIKE "Product" INCLUDING DEFAULTS) ON COMMIT DROP',
        );
        const payload = JSON.stringify(
          snapshot.products.map((product) => ({
            ...product,
            id: randomUUID(),
          })),
        );
        await tx.$executeRaw`INSERT INTO import_snapshot ("id", "sku", "name", "chemicalName", "function", "applicationArea", "region", "certifications", "status", "launchYear", "description", "presentInLatestImport", "createdAt", "updatedAt", "lastImportedAt")
        SELECT p.id, p.sku, p.name, p."chemicalName", p.function, p."applicationArea", p.region,
          ARRAY(SELECT jsonb_array_elements_text(p.certifications)), p.status::"ProductStatus", p."launchYear", p.description, true, ${now}, ${now}, ${now}
        FROM jsonb_to_recordset(${payload}::jsonb) AS p(id text, sku text, name text, "chemicalName" text, function text, "applicationArea" text, region text, certifications jsonb, status text, "launchYear" integer, description text)`;
        const rowChanged = (left: string, right: string) =>
          Prisma.raw(
            `ROW(${left}.name, ${left}."chemicalName", ${left}.function, ${left}."applicationArea", ${left}.region, ${left}.certifications, ${left}.status, ${left}."launchYear", ${left}.description, ${left}."presentInLatestImport") IS DISTINCT FROM ROW(${right}.name, ${right}."chemicalName", ${right}.function, ${right}."applicationArea", ${right}.region, ${right}.certifications, ${right}.status, ${right}."launchYear", ${right}.description, true)`,
          );
        const [result] = await tx.$queryRaw<Counts[]>`SELECT
        count(*) FILTER (WHERE old.id IS NULL)::int AS created,
        count(*) FILTER (WHERE old.id IS NOT NULL AND (${rowChanged('old', 's')}))::int AS updated,
        count(*) FILTER (WHERE old.id IS NOT NULL AND NOT (${rowChanged('old', 's')}))::int AS unchanged,
        (SELECT count(*)::int FROM "Product" p WHERE p."presentInLatestImport" AND NOT EXISTS (SELECT 1 FROM import_snapshot i WHERE i.sku = p.sku)) AS absent
        FROM import_snapshot s LEFT JOIN "Product" old ON old.sku = s.sku`;
        await tx.$executeRaw`UPDATE "Product" p SET "presentInLatestImport" = false, "updatedAt" = ${now} WHERE p."presentInLatestImport" AND NOT EXISTS (SELECT 1 FROM import_snapshot i WHERE i.sku = p.sku)`;
        await tx.$executeRaw`INSERT INTO "Product" SELECT * FROM import_snapshot
        ON CONFLICT (sku) DO UPDATE SET
        name = EXCLUDED.name, "chemicalName" = EXCLUDED."chemicalName", function = EXCLUDED.function, "applicationArea" = EXCLUDED."applicationArea", region = EXCLUDED.region, certifications = EXCLUDED.certifications, status = EXCLUDED.status, "launchYear" = EXCLUDED."launchYear", description = EXCLUDED.description,
        "updatedAt" = CASE WHEN ${rowChanged('"Product"', 'EXCLUDED')} THEN EXCLUDED."updatedAt" ELSE "Product"."updatedAt" END,
        "presentInLatestImport" = true, "lastImportedAt" = EXCLUDED."lastImportedAt"`;
        return result;
      },
      { timeout: 120000 },
    );
    return { ...snapshot, ...counts };
  } finally {
    await prisma.$disconnect();
  }
}
