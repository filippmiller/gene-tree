import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import fs from 'fs';
import path from 'path';

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Read build version
let buildVersion = 'dev';
try {
  const versionFile = path.join(process.cwd(), 'BUILD_VERSION');
  if (fs.existsSync(versionFile)) {
    buildVersion = fs.readFileSync(versionFile, 'utf8').trim();
    buildVersion = `dev-v${buildVersion}`;
  }
} catch (e) {
  console.log('Could not read BUILD_VERSION');
}

const nextConfig: NextConfig = {
  env: {
    BUILD_VERSION: buildVersion,
  },
};

export default withNextIntl(nextConfig);
