/**
 * postinstall: fix-tailwind-compat.cjs
 *
 * Cleans up stale artifacts from previous compatibility shim attempts.
 * The .vite cache can hold onto bad resolved paths if something goes
 * wrong during module resolution. This script ensures a clean slate
 * after every npm install.
 */

const fs = require('fs');
const path = require('path');

const targets = [
  // v3 compat shim directory we mistakenly created earlier
  path.join(__dirname, '..', 'node_modules', 'tailwindcss', 'lib'),
  // Stale Vite cache — can hold onto corrupt resolution paths
  path.join(__dirname, '..', 'node_modules', '.vite'),
];

let cleaned = 0;
for (const dir of targets) {
  if (fs.existsSync(dir)) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`  ✓ cleaned: ${path.relative(path.join(__dirname, '..'), dir)}`);
      cleaned++;
    } catch (err) {
      console.warn(`  ⚠ could not clean ${path.basename(dir)}: ${err.message}`);
    }
  }
}

if (cleaned > 0) {
  console.log(`✓ Tailwind compat — ${cleaned} stale artifact(s) removed`);
} else {
  console.log('✓ Tailwind v4 resolves natively — no cleanup needed');
}
