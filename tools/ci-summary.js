#!/usr/bin/env node
// tools/ci-summary.js
// Simple CI summary helper: checks for presence of commonly expected files
// and prints clear markers. Writes a ci-summary.txt file in the workspace root.

const fs = require('fs');
const path = require('path');

function markOk(msg) {
  console.log('CI-OK: ' + msg);
}
function markErr(msg) {
  console.error('CI-ERROR: ' + msg);
}

function writeSummary(lines) {
  const out = lines.join('\n') + '\n';
  fs.writeFileSync('ci-summary.txt', out, 'utf8');
}

function exists(p) {
  try {
    return fs.existsSync(p) && fs.statSync(p).size >= 0;
  } catch (e) {
    return false;
  }
}

const args = process.argv.slice(2);
const ctx = (
  args.find((a) => a.startsWith('--context=')) || '--context=generic'
).split('=')[1];

const checks = [];
if (ctx === 'build-web' || ctx === 'generic') {
  checks.push({
    desc: 'www/index.html exists',
    path: path.join('www', 'index.html'),
  });
  checks.push({
    desc: 'www/css/index.css exists',
    path: path.join('www', 'css', 'index.css'),
  });
  checks.push({
    desc: 'icons folder exists',
    path: path.join('res', 'icons', 'android'),
  });
}
if (ctx === 'android-build' || ctx === 'generic') {
  checks.push({
    desc: 'debug APK exists',
    path: path.join(
      'platforms',
      'android',
      'app',
      'build',
      'outputs',
      'apk',
      'debug',
      'app-debug.apk',
    ),
  });
  checks.push({
    desc: 'release unsigned APK exists',
    path: path.join(
      'platforms',
      'android',
      'app',
      'build',
      'outputs',
      'apk',
      'release',
      'app-release-unsigned.apk',
    ),
  });
}

const results = [];
let hasError = false;
for (const c of checks) {
  const ok = exists(c.path);
  if (ok) {
    results.push(`CI-OK: ${c.desc} -> ${c.path}`);
    markOk(`${c.desc}`);
  } else {
    results.push(`CI-ERROR: ${c.desc} -> ${c.path}`);
    markErr(`${c.desc} (missing): ${c.path}`);
    hasError = true;
  }
}

// Add some environment hints
results.push('--- ENV ---');
results.push(
  `GITHUB_WORKSPACE=${process.env.GITHUB_WORKSPACE || process.cwd()}`,
);
results.push(`NODE_VERSION=${process.version}`);
results.push(`CONTEXT=${ctx}`);

writeSummary(results);

// Exit 0 so this step (which runs with if: always()) doesn't change job conclusion
process.exit(hasError ? 0 : 0);
