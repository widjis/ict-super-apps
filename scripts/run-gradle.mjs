import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const androidDir = path.resolve(repoRoot, 'android');
const gradleArgs = process.argv.slice(2);

if (gradleArgs.length === 0) {
  console.error('Usage: node scripts/run-gradle.mjs <gradle-args...>');
  process.exit(2);
}

const isWindows = process.platform === 'win32';
const wrapperName = isWindows ? 'gradlew.bat' : 'gradlew';
const wrapperPath = path.resolve(androidDir, wrapperName);

if (!existsSync(wrapperPath)) {
  console.error(`Gradle wrapper not found: ${wrapperPath}`);
  process.exit(2);
}

const child = isWindows
  ? spawn('cmd.exe', ['/d', '/s', '/c', wrapperName, ...gradleArgs], { cwd: androidDir, stdio: 'inherit' })
  : spawn(wrapperPath, gradleArgs, { cwd: androidDir, stdio: 'inherit' });

child.on('exit', (code) => {
  process.exit(typeof code === 'number' ? code : 1);
});
