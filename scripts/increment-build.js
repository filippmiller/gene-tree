const fs = require('fs');
const path = require('path');

const versionFile = path.join(__dirname, '..', 'BUILD_VERSION');

// Read current version or start at 1
let currentVersion = 1;
if (fs.existsSync(versionFile)) {
  const content = fs.readFileSync(versionFile, 'utf8').trim();
  currentVersion = parseInt(content) || 1;
}

// Increment
const newVersion = currentVersion + 1;

// Save new version
fs.writeFileSync(versionFile, newVersion.toString());

// Output for use in build
console.log(`dev-v${newVersion}`);
