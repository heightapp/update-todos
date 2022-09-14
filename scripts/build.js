#! /usr/bin/env node

import {exec as execSync} from 'child_process';
import esbuild from 'esbuild';
import fs from 'fs';
import yargs from 'yargs/yargs';
import {hideBin} from 'yargs/helpers';
import util from 'util';
import path from 'path';

const exec = util.promisify(execSync);

const args = yargs(hideBin(process.argv))
  .option('esm', {
    describe: 'Generate esm bundle',
    type: 'boolean',
  })
  .option('cjs', {
    describe: 'Generate cjs bundel',
    type: 'boolean',
  })
  .option('types', {
    describe: 'Generate types',
    type: 'boolean',
  }).argv;

const entryPoints = ['src/index.ts'];

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
const external = Object.keys({
  ...(packageJson.dependencies || {}),
  ...(packageJson.devDependencies || {}),
  ...(packageJson.peerDependencies || {}),
  ...(packageJson.optionalDependencies || {}),
});

const cleanup = () => {
  fs.rmSync('./dist', {recursive: true, force: true});
};

const outDirFromConfig = (configPath) => {
  const config = JSON.parse(fs.readFileSync(configPath, {encoding: 'utf-8'}));
  const outDir = config.compilerOptions.outDir;
  return path.resolve('./config', outDir);
};

const build = async () => {
  // Remove the directory before building or moving files fails on Windows (does not override)
  cleanup();

  try {
    const config = {
      entryPoints,
      bundle: true,
      external,
      platform: 'node',
      treeShaking: true,
    };

    const promises = [];

    // Build ESM
    if (args.esm) {
      const tsconfig = 'configs/tsconfig.esm.json';
      const outdir = outDirFromConfig(tsconfig);
      promises.push(
        esbuild.build({
          ...config,
          outdir,
          outExtension: {'.js': '.mjs'},
          format: 'esm',
          tsconfig,
        }),
      );
    }

    // Build CJS
    if (args.cjs) {
      const tsconfig = 'configs/tsconfig.cjs.json';
      const outdir = outDirFromConfig(tsconfig);
      promises.push(
        esbuild.build({
          ...config,
          outdir,
          outExtension: {'.js': '.cjs'},
          format: 'cjs',
          tsconfig,
        }),
      );
    }

    // Build types
    if (args.types) {
      const tsconfig = './configs/tsconfig.types.json';
      promises.push(exec(`tsc --project ${tsconfig} && tsc-alias --project ${tsconfig}`));
    }

    await Promise.all(promises);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
};

build();
