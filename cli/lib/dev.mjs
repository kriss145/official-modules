// Shared yalc development loop used by a package's thin `yalc-dev.mjs` delegator.
//
// yalc has no built-in "watch", so we chain two steps:
//   1. the package's `watch.mjs` (esbuild) rebuilds `dist/` on every change.
//   2. an fs.watch on `dist/` debounces and runs `yalc push`, copying the fresh
//      build into every app that added this package (e.g. an external app).
//
// Run from a package via `yarn dev:yalc`. Ctrl-C stops both.
import spawn from 'cross-spawn'
import { spawnSync } from 'node:child_process'
import { watch as fsWatch } from 'node:fs'
import { basename, join } from 'node:path'

/**
 * Start the build → watch → yalc-push loop for a single package.
 * @param {string} packageDir - Absolute path to the package directory
 */
export function yalcDev(packageDir) {
  const label = basename(packageDir)
  const distDir = join(packageDir, 'dist')

  const runYalc = (args, { silent = false } = {}) =>
    spawnSync('npx', ['yalc', ...args], {
      cwd: packageDir,
      stdio: silent ? 'ignore' : 'inherit',
    }).status === 0

  // Ensure a fresh dist exists and is pushed before we start watching, so the
  // first `yarn dev` in the consumer already sees a complete build.
  console.log(`[yalc-dev] ${label}: initial build...`)
  const built = spawnSync('node', ['build.mjs'], { cwd: packageDir, stdio: 'inherit' })
  if (built.status !== 0) process.exit(built.status ?? 1)
  console.log(`[yalc-dev] ${label}: initial push...`)
  runYalc(['push', '--sig'])

  // esbuild watcher: rebuilds dist/ on source changes.
  const watcher = spawn('node', ['watch.mjs'], { cwd: packageDir, stdio: 'inherit' })

  // Debounced push whenever dist/ changes.
  let pushTimer = null
  let pushing = false
  let pushQueued = false
  const schedulePush = () => {
    if (pushTimer) clearTimeout(pushTimer)
    pushTimer = setTimeout(() => {
      if (pushing) {
        pushQueued = true
        return
      }
      pushing = true
      process.stdout.write(`[yalc-dev] ${label}: pushing... `)
      const ok = runYalc(['push', '--sig'], { silent: true })
      console.log(ok ? 'done' : 'FAILED')
      pushing = false
      if (pushQueued) {
        pushQueued = false
        schedulePush()
      }
    }, 250)
  }

  const distWatcher = fsWatch(distDir, { recursive: true }, () => schedulePush())

  const shutdown = () => {
    distWatcher.close()
    if (!watcher.killed) watcher.kill('SIGTERM')
    process.exit(0)
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
  watcher.on('exit', (code) => process.exit(code ?? 0))
}
