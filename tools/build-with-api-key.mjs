import { spawnSync } from 'node:child_process';
import { copyFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';

import * as esbuild from 'esbuild';

const CLOUDFLARE_WORKER_FLAG = '--cloudflare-worker';
const GITHUB_PAGES_SPA_FLAG = '--github-pages-spa';
const API_KEY_PLACEHOLDER = '${API_KEY}';
const apiKey = process.env.API_KEY ?? process.env.TMDB_API_KEY;
const rawArgs = process.argv.slice(2);
const passthroughArgs = rawArgs.filter(
    (arg) => arg !== CLOUDFLARE_WORKER_FLAG && arg !== GITHUB_PAGES_SPA_FLAG,
);
const shouldBundleCloudflareWorker =
    rawArgs.includes(CLOUDFLARE_WORKER_FLAG);
const shouldCreateGithubPagesFallback =
    rawArgs.includes(GITHUB_PAGES_SPA_FLAG);
const shouldEmbedBrowserApiKey = !shouldBundleCloudflareWorker;

if (!apiKey && shouldEmbedBrowserApiKey && (process.env.CI || process.env.CF_PAGES)) {
    console.error(
        'API_KEY is required for builds that call TMDb directly from the browser.',
    );
    process.exit(1);
}

if (!apiKey && shouldEmbedBrowserApiKey) {
    console.warn(
        'API_KEY was not set. Building with the production placeholder value.',
    );
}

const ngCliPath = 'node_modules/@angular/cli/bin/ng.js';
const ngArgs = [
    ngCliPath,
    'build',
    ...passthroughArgs,
    '--define',
    `__TMDB_API_KEY__=${JSON.stringify(apiKey ?? API_KEY_PLACEHOLDER)}`,
];

const ngResult = spawnSync(process.execPath, ngArgs, {
    stdio: 'inherit',
});

if (ngResult.error) {
    console.error(ngResult.error.message);
    process.exit(1);
}

if (ngResult.status !== 0) {
    process.exit(ngResult.status ?? 1);
}

if (shouldBundleCloudflareWorker) {
    await esbuild.build({
        bundle: true,
        entryPoints: ['dist/cloudflare/server/server.mjs'],
        format: 'esm',
        logLevel: 'info',
        outfile: 'dist/cloudflare/_worker.js',
        platform: 'browser',
        target: 'es2022',
    });
}

if (shouldCreateGithubPagesFallback) {
    const outputPath = readOptionValue(
        passthroughArgs,
        '--output-path',
        'dist/github-pages',
    );

    await copyFile(
        join(outputPath, 'index.html'),
        join(outputPath, '404.html'),
    );
}

function readOptionValue(args, optionName, fallbackValue) {
    const inlinePrefix = `${optionName}=`;
    const inlineArg = args.find((arg) => arg.startsWith(inlinePrefix));

    if (inlineArg) {
        return inlineArg.slice(inlinePrefix.length);
    }

    const optionIndex = args.indexOf(optionName);

    if (optionIndex === -1) {
        return fallbackValue;
    }

    const value = args[optionIndex + 1];

    return value && !value.startsWith('--') ? value : fallbackValue;
}
