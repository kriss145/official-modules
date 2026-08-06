// Shared package build used by every workspace package's thin `build.mjs`
// delegator. Extracted verbatim from the previous per-package build scripts so
// behavior is unchanged; packages now pass only their specifics via options.
//
// Options:
//   extraIgnore  string[]  extra globs excluded from entry points (e.g. integration fixtures)
//   loaders      object    esbuild `loader` map (e.g. { '.ttf': 'dataurl' })
//   assetGlobs   string[]  globs (relative to package) copied verbatim into dist, mirroring src/
//   afterBuild   function  async hook ({ packageDir }) run after emit (e.g. font generation)
//   label        string    name shown in logs (defaults to the package directory name)
import * as esbuild from 'esbuild'
import { glob } from 'glob'
import { readFileSync, writeFileSync, existsSync, cpSync, mkdirSync } from 'node:fs'
import { dirname, join, relative, basename } from 'node:path'

const DEFAULT_IGNORE = ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx']

// esbuild plugin (verbatim from the per-package scripts): after a successful
// build, rewrite every emitted relative import to add the `.js`/`index.js`
// suffix required by native Node ESM resolution.
function createAddJsExtensionPlugin(packageDir) {
  return {
    name: 'add-js-extension',
    setup(build) {
      build.onEnd(async (result) => {
        if (result.errors.length > 0) return
        const outputFiles = await glob('dist/**/*.js', { cwd: packageDir, absolute: true })
        for (const file of outputFiles) {
          const fileDir = dirname(file)
          let content = readFileSync(file, 'utf-8')
          content = content.replace(
            /from\s+["'](\.[^"']+)["']/g,
            (match, path) => {
              if (path.endsWith('.js') || path.endsWith('.json')) return match
              const resolvedPath = join(fileDir, path)
              if (existsSync(resolvedPath) && existsSync(join(resolvedPath, 'index.js'))) {
                return `from "${path}/index.js"`
              }
              return `from "${path}.js"`
            }
          )
          content = content.replace(
            /import\s*\(\s*["'](\.[^"']+)["']\s*\)/g,
            (match, path) => {
              if (path.endsWith('.js') || path.endsWith('.json')) return match
              const resolvedPath = join(fileDir, path)
              if (existsSync(resolvedPath) && existsSync(join(resolvedPath, 'index.js'))) {
                return `import("${path}/index.js")`
              }
              return `import("${path}.js")`
            }
          )
          writeFileSync(file, content)
        }
      })
    },
  }
}

/**
 * Build a single workspace package's backend source into `dist/`.
 * @param {string} packageDir - Absolute path to the package directory
 * @param {object} [options]
 */
export async function buildPackage(packageDir, options = {}) {
  const {
    extraIgnore = [],
    loaders = {},
    assetGlobs = [],
    afterBuild = null,
    label = basename(packageDir),
  } = options

  const entryPoints = await glob('src/**/*.{ts,tsx}', {
    cwd: packageDir,
    ignore: [...DEFAULT_IGNORE, ...extraIgnore],
    absolute: true,
  })

  if (entryPoints.length === 0) {
    console.error(`[build] ${label}: no entry points found!`)
    process.exit(1)
  }

  console.log(`[build] ${label}: found ${entryPoints.length} entry points`)

  await esbuild.build({
    absWorkingDir: packageDir,
    entryPoints,
    outdir: join(packageDir, 'dist'),
    outbase: join(packageDir, 'src'),
    format: 'esm',
    platform: 'node',
    target: 'node18',
    sourcemap: true,
    jsx: 'automatic',
    loader: loaders,
    plugins: [createAddJsExtensionPlugin(packageDir)],
  })

  if (assetGlobs.length > 0) {
    let assetCount = 0
    for (const pattern of assetGlobs) {
      const assetFiles = await glob(pattern, { cwd: packageDir, absolute: true })
      for (const file of assetFiles) {
        const rel = relative(join(packageDir, 'src'), file)
        const dest = join(packageDir, 'dist', rel)
        mkdirSync(dirname(dest), { recursive: true })
        cpSync(file, dest)
        assetCount++
      }
    }
    console.log(`[build] ${label}: copied ${assetCount} asset files`)
  }

  if (typeof afterBuild === 'function') {
    await afterBuild({ packageDir, label })
  }

  console.log(`[build] ${label}: built successfully`)
}
