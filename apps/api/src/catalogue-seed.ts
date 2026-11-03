import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { importCatalogue } from './catalogue-import.js';

const defaultLogDirectory = fileURLToPath(
  new URL('../../../logs/', import.meta.url),
);
const message = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

type Diagnostic = { type: string; summary: string; detail: string };
function summarize(diagnostics: Diagnostic[]) {
  const groups = new Map<string, Diagnostic[]>();
  for (const diagnostic of diagnostics) {
    const group = groups.get(diagnostic.type) ?? [];
    group.push(diagnostic);
    groups.set(diagnostic.type, group);
  }
  return [...groups]
    .map(([type, group]) => {
      const examples = group.slice(0, 3).map(({ summary }) => `  ${summary}`);
      if (group.length > 3) examples.push(`  ... and ${group.length - 3} more`);
      return `${type} (${group.length}):\n${examples.join('\n')}`;
    })
    .join('\n');
}

export async function runSeed({
  databaseUrl,
  filePath,
  logDirectory = defaultLogDirectory,
  color = false,
}: {
  databaseUrl: string;
  filePath: string;
  logDirectory?: string;
  color?: boolean;
}) {
  const logPath = join(
    resolve(logDirectory),
    `import-${new Date().toISOString().replaceAll(':', '-')}-${randomUUID()}.log`,
  );
  try {
    await mkdir(resolve(logDirectory), { recursive: true });
    await writeFile(logPath, `Catalogue import\nInput: ${filePath}\n`, {
      flag: 'wx',
    });
  } catch (error) {
    return {
      exitCode: 1,
      stdout: '',
      stderr: `Import failed before applying changes: could not create log at ${logPath}: ${message(error)}\n`,
      logPath,
    };
  }

  let stdout = '';
  let stderr = '';
  let exitCode = 0;
  let log = `Catalogue import\nInput: ${filePath}\n`;
  let applied = false;
  try {
    if (!databaseUrl) throw new Error('DATABASE_URL is required');
    const csv = await readFile(filePath, 'utf8');
    const result = await importCatalogue({ databaseUrl, csv });
    applied = true;
    stdout = `Import completed: ${result.rowCount} rows, ${result.products.length} unique products, ${result.duplicateRows} duplicate rows.\nCreated: ${result.created}; updated: ${result.updated}; unchanged: ${result.unchanged}; absent: ${result.absent}.\n`;
    log += `${stdout}\nDiagnostics (${result.diagnostics.length}):\n${result.diagnostics.map(({ type, detail }) => `[${type}] ${detail}`).join('\n')}\n`;
    if (result.diagnostics.length) {
      const warnings = `WARNINGS (${result.diagnostics.length}):\n${summarize(result.diagnostics)}`;
      stderr = `${color ? `\x1b[33m${warnings}\x1b[0m` : warnings}\n`;
    }
  } catch (error) {
    exitCode = 1;
    stderr = `Import failed: ${message(error)}\n`;
    log += stderr;
  }
  try {
    await writeFile(logPath, log);
    stderr += `Full import log: ${logPath}\n`;
  } catch (error) {
    exitCode = 1;
    stderr += `Could not write full import log at ${logPath}: ${message(error)}. ${applied ? 'The database import has already completed.' : 'The import failed before completion.'}\n`;
  }
  return { exitCode, stdout, stderr, logPath };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const filePath = process.argv[2]
    ? resolve(process.argv[2])
    : fileURLToPath(new URL('../../../data/products.csv', import.meta.url));
  const result = await runSeed({
    databaseUrl: process.env['DATABASE_URL'] ?? '',
    filePath,
    logDirectory: process.env['IMPORT_LOG_DIR'],
    color: Boolean(process.stderr.isTTY && !('NO_COLOR' in process.env)),
  });
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  process.exitCode = result.exitCode;
}
