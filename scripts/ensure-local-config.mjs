import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
const envExample = new URL('../.env.example', import.meta.url);
const envTarget = new URL('../.env', import.meta.url);
if (existsSync(envExample) && !existsSync(envTarget)) {
  copyFileSync(envExample, envTarget);
}
const target = new URL(
  '../apps/web/src/primeng-license.local.ts',
  import.meta.url,
);
if (!existsSync(target)) {
  mkdirSync(new URL('../apps/web/src/', import.meta.url), { recursive: true });
  copyFileSync(
    new URL('../apps/web/primeng-license.example.ts', import.meta.url),
    target,
  );
}
