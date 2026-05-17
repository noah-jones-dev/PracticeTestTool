#!/usr/bin/env node
import { execSync, spawnSync } from 'node:child_process';
import { existsSync, readdirSync, cpSync, rmSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { platform, env, cwd, exit } from 'node:process';

const step = (msg) => console.log(`\n==> ${msg}`);
const done = (msg) => console.log(`    ${msg}`);
const die = (msg) => { console.error(`\nerror: ${msg}`); exit(1); };

const run = (cmd) => {
  console.log(`    $ ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
};

const isWin = platform === 'win32';
const isMac = platform === 'darwin';
if (!isWin && !isMac) die(`Unsupported platform: ${platform}`);

step('Pulling latest changes');
run('git pull');

step('Installing dependencies');
run('npm install');

if (isWin) {
  step('Checking that Practice Test is not running');
  const tasks = execSync('tasklist /FI "IMAGENAME eq Practice Test.exe"', { encoding: 'utf8' });
  if (tasks.includes('Practice Test.exe')) {
    die('Practice Test is running. Quit it from the taskbar and re-run this command.');
  }

  step('Building Windows binaries');
  run('npm run build:win');

  step('Embedding app icon with rcedit');
  const cacheRoot = join(env.LOCALAPPDATA, 'electron-builder', 'Cache', 'winCodeSign');
  let rcedit;
  if (existsSync(cacheRoot)) {
    for (const dir of readdirSync(cacheRoot)) {
      const candidate = join(cacheRoot, dir, 'rcedit-x64.exe');
      if (existsSync(candidate)) { rcedit = candidate; break; }
    }
  }
  if (!rcedit) die(`rcedit-x64.exe not found under ${cacheRoot}.`);

  const ico = join(cwd(), 'build', 'icon.ico');
  for (const exe of [
    join('dist', 'win-unpacked', 'Practice Test.exe'),
    join('dist', 'Practice Test 1.0.0.exe'),
    join('dist', 'Practice Test Setup 1.0.0.exe'),
  ]) {
    done(`rcedit ${exe}`);
    const r = spawnSync(rcedit, [exe, '--set-icon', ico], { stdio: 'inherit' });
    if (r.status !== 0) die(`rcedit failed for ${exe}`);
  }

  step('Updating installed app');
  const installDir = join(env.LOCALAPPDATA, 'Programs', 'Practice Test');
  if (!existsSync(installDir)) {
    done(`No existing install at ${installDir}.`);
    done(`Run "dist\\Practice Test Setup 1.0.0.exe" to install for the first time.`);
  } else {
    cpSync(join('dist', 'win-unpacked'), installDir, { recursive: true, force: true });
    done(`Copied new build over ${installDir}.`);
  }
} else {
  step('Quitting Practice Test if running');
  spawnSync('pkill', ['-x', 'Practice Test']);

  step('Building macOS DMG');
  run('npm run build:mac');

  const dmg = join('dist', 'Practice Test-1.0.0.dmg');
  if (!existsSync(dmg)) die(`DMG not found at ${dmg}`);

  step('Replacing /Applications/Practice Test.app');
  const mountPath = mkdtempSync(join(tmpdir(), 'ptt-dmg-'));
  execSync(`hdiutil attach "${dmg}" -nobrowse -quiet -mountpoint "${mountPath}"`, { stdio: 'inherit' });
  try {
    const appSrc = join(mountPath, 'Practice Test.app');
    const appDst = '/Applications/Practice Test.app';
    if (!existsSync(appSrc)) die(`Practice Test.app not found inside DMG at ${appSrc}.`);
    rmSync(appDst, { recursive: true, force: true });
    cpSync(appSrc, appDst, { recursive: true, dereference: false });
    done(`Updated ${appDst}.`);
  } finally {
    spawnSync('hdiutil', ['detach', mountPath, '-quiet']);
    rmSync(mountPath, { recursive: true, force: true });
  }
}

step('Done — launch Practice Test to confirm.');
