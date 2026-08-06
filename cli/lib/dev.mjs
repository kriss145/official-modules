// yalc development loop for a single package: build -> push -> watch -> push.
//
// yalc has no built-in "watch", so we chain:
//   1. an initial full build (with the package's build options), then push.
//   2. the esbuild watcher rebuilds dist/ on every source change.
//   3. an fs.watch on dist/ debounces and runs `yalc push`, copying the fresh
//      build into every app that added this package.
//
// Called by `mercato-modules module dev <package>`. Ctrl-C stops everything.
import { spawnSync } from 'node:child_process'
import { watch as fsWatch } from 'node:fs'
import { basename, join } from 'node:path'
import { buildPackage } from './build.mjs'
import { watch } from './watch.mjs'

/**
 * Start the build → watch → yalc-push loop for a single package.
 * @param {string} packageDir - Absolute path to the package directory
 * @param {object} [buildOptions] - Build options (from the package's module.config.mjs)
 */
export async function yalcDev(packageDir, buildOptions = {}) {
  const label = basename(packageDir)
  const distDir = join(packageDir, 'dist')

  const runYalc = (args, { silent = false } = {}) =>
    spawnSync('npx', ['yalc', ...args], {
      cwd: packageDir,
      stdio: silent ? 'ignore' : 'inherit',
    }).status === 0

  // Initial full build (applies loaders / assets / afterBuild) + push, so the
  // consumer sees a complete build before we switch to incremental watching.
  console.log(`[module dev] ${label}: initial build...`)
  await buildPackage(packageDir, buildOptions)
  console.log(`[module dev] ${label}: initial push...`)
  runYalc(['push', '--sig'])

  // Incremental esbuild watcher: rebuilds dist/ on source changes. Runs in this
  // process (not awaited) — it registers its own watchers and returns.
  watch(packageDir)

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
      process.stdout.write(`[module dev] ${label}: pushing... `)
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
    process.exit(0)
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  console.log(`[module dev] ${label}: watching for changes (Ctrl-C to stop)`)

  // Keep the process alive: the watchers run until the user hits Ctrl-C. Without
  // this the async function would resolve and the CLI's process.exit() would
  // tear down the watchers immediately.
  await new Promise(() => {})
}
