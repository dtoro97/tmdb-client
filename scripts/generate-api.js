const fs = require('fs');
const path = require('path');
const https = require('https');

const SPEC_URL = 'https://developer.themoviedb.org/openapi/tmdb-api.json';
const OUTPUT_DIR = path.join(__dirname, '..', 'api-spec');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'tmdb-api.json');

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'node' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  console.log('Downloading TMDB OpenAPI spec...');
  const raw = await download(SPEC_URL);
  const spec = JSON.parse(raw);
  console.log(`Found ${Object.keys(spec.paths).length} paths`);

  // Add "Tmdb" tag to every operation so the generator creates TmdbRestControllerService
  for (const methods of Object.values(spec.paths)) {
    for (const operation of Object.values(methods)) {
      if (typeof operation === 'object' && operation !== null && 'operationId' in operation) {
        operation.tags = ['Tmdb'];
      }
    }
  }
  spec.tags = [{ name: 'Tmdb' }];

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(spec, null, 2));
  console.log(`Tagged spec written to ${OUTPUT_FILE}`);

  console.log('Running openapi-generator-cli...');
  const { execSync } = require('child_process');
  execSync(
    [
      'npx openapi-generator-cli generate',
      `-i ${OUTPUT_FILE}`,
      '-g typescript-angular',
      '-o src/app/api',
      '--additional-properties=providedIn=root,withInterfaces=true,serviceSuffix=RestControllerService',
    ].join(' '),
    { stdio: 'inherit', cwd: path.join(__dirname, '..') }
  );
  console.log('API generation complete!');
}

main().catch((err) => {
  console.error('Generation failed:', err);
  process.exit(1);
});
