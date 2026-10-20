import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { build } from 'esbuild';
const root = process.cwd();
const version = JSON.parse(await fs.readFile('package.json', 'utf8')).version;
const cli = process.env.VERCEL_CLI;
if (!cli) throw new Error('Set VERCEL_CLI to the installed official CLI executable.');
const stage = await fs.mkdtemp(path.join(os.tmpdir(), 'nodebeam-production-'));
const output = path.join(stage, '.vercel/output');
await fs.mkdir(output, { recursive: true });
await fs.copyFile('.vercel/project.json', path.join(stage, '.vercel/project.json'));
await fs.cp('dist', path.join(output, 'static'), { recursive: true });
const fn = path.join(output, 'functions/api/shared-default.func');
await fs.mkdir(fn, { recursive: true });
await build({ entryPoints: ['server/shared-default.ts'], outfile: path.join(fn, 'index.cjs'), bundle: true, platform: 'node', format: 'cjs', target: 'node22', minify: true, alias: { '@': path.join(root, 'src') }, logOverride: { 'empty-import-meta': 'silent' } });
await fs.writeFile(path.join(fn, '.vc-config.json'), JSON.stringify({ runtime: 'nodejs22.x', handler: 'index.cjs', launcherType: 'Nodejs', maxDuration: 30, shouldAddHelpers: true }));
await fs.writeFile(path.join(output, 'config.json'), JSON.stringify({ version: 3, routes: [{ handle: 'filesystem' }, { src: '/(.*)', dest: '/index.html' }] }));
const snapshot = path.resolve('..', 'node-beam-versions', version);
try { await fs.access(snapshot); throw new Error(`Version snapshot ${version} already exists. Use a new version.`); } catch (err) { if (err.code !== 'ENOENT') throw err; }
const excluded = new Set(['node_modules', '.vercel', '.toolcraft', '.git', 'test-results', 'playwright-report', '.DS_Store']);
await fs.cp(root, snapshot, { recursive: true, filter: source => !excluded.has(path.basename(source)) && !path.basename(source).startsWith('.env') });
await fs.cp(output, path.join(snapshot, 'vercel-output'), { recursive: true });
const release = { version, productionUrl: 'https://nodeanimation.vercel.app/', state: 'ready-to-deploy', feature: 'Independent editable gradients for every palette; Fiora adopts saved Custom pink setup' };
await fs.writeFile(path.join(snapshot, 'release.json'), JSON.stringify(release, null, 2));
console.log(`Version ${version}; prebuilt static app + server function staged without Git or secrets.`);
await new Promise((resolve, reject) => {
  const child = spawn(cli, ['deploy', '--prebuilt', '--prod', '--yes'], { cwd: stage, stdio: 'inherit' });
  child.on('error', reject); child.on('exit', code => code === 0 ? resolve() : reject(new Error(`Deployment exited ${code}`)));
});
const localHtml = await fs.readFile('dist/index.html', 'utf8');
const entry = localHtml.match(/src="([^"]+\.js)"/)?.[1];
let verified = false;
for (let attempt = 0; attempt < 12; attempt++) {
  const live = await fetch(`https://nodeanimation.vercel.app/?release=${version}&check=${Date.now()}`).then(r => r.text());
  if (entry && live.includes(entry)) { verified = true; break; }
  await new Promise(resolve => setTimeout(resolve, 3000));
}
if (!verified) throw new Error('Production entry does not yet match this build.');
release.state = 'deployed'; release.verifiedEntry = entry;
await fs.writeFile(path.join(snapshot, 'release.json'), JSON.stringify(release, null, 2));
console.log(`Verified ${version}: ${entry} at https://nodeanimation.vercel.app/`);
