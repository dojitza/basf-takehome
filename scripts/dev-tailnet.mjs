import { spawn, spawnSync } from 'node:child_process';

const tailnet = spawnSync('tailscale', ['ip', '-4'], { encoding: 'utf8' });
const address = tailnet.stdout?.trim().split('\n')[0];
if (tailnet.error || tailnet.status !== 0 || !address) {
  console.error(
    'Could not find a Tailscale IPv4 address. Start Tailscale and retry.',
  );
  process.exit(1);
}

const setup = spawnSync('node', ['scripts/ensure-local-config.mjs'], {
  stdio: 'inherit',
});
if (setup.status !== 0) process.exit(setup.status ?? 1);
const database = spawnSync('docker', ['compose', 'up', '-d', '--wait', 'db'], {
  stdio: 'inherit',
});
if (database.status !== 0) process.exit(database.status ?? 1);

console.log(`Starting development on the tailnet address ${address}:4200.`);
const child = spawn(
  'npx',
  [
    'concurrently',
    '-k',
    '-n',
    'api,web',
    'npm run dev -w @product-finder/api',
    `npm run dev -w @product-finder/web -- --host ${address} --allowed-hosts`,
  ],
  { stdio: 'inherit' },
);
child.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on('exit', (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => child.kill(signal));
