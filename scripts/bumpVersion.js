import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const versionJsPath = path.join(rootDir, 'src', 'config', 'version.js');
const packageJsonPath = path.join(rootDir, 'package.json');

function bumpVersion() {
  try {
    let pkg = {};
    if (fs.existsSync(packageJsonPath)) {
      pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    }

    const currentVersion = pkg.version || '4.0';
    const parts = currentVersion.split('.').map(n => parseInt(n, 10) || 0);

    let major = parts[0] || 4;
    let minor = parts.length > 1 ? parts[1] : 0;

    // Increment minor; when minor reaches 9, roll over to next major and reset minor to 0
    minor += 1;
    if (minor > 9) {
      major += 1;
      minor = 0;
    }

    const displayVersion = `${major}.${minor}`;
    const versionTag = `v${displayVersion}`;

    // 1. Update package.json
    pkg.version = displayVersion;
    fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');

    // 2. Update src/config/version.js
    const dateStr = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date());
    const versionContent = `/**
 * Chordician Application Version Configuration
 *
 * Versioning Policy:
 * - Increments automatically with every release and push.
 */
export const APP_VERSION = '${displayVersion}';
export const APP_VERSION_TAG = '${versionTag}';
export const APP_NAME = 'Chordician';
export const APP_RELEASE_NAME = 'Lead Transposition, Regional Transliteration & Scale Engine';
export const APP_LAST_UPDATED = '${dateStr}';
`;

    fs.writeFileSync(versionJsPath, versionContent, 'utf8');
    console.log(`🚀 [Version Bump] Successfully bumped version from ${currentVersion} to ${displayVersion} (${versionTag})`);
  } catch (err) {
    console.error('Failed to bump version:', err);
  }
}

bumpVersion();
