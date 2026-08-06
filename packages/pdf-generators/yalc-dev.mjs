// Local development loop for consuming this package via yalc.
//
// yalc has no built-in "watch" in the installed version, so we chain two steps:
//   1. `watch.mjs` (esbuild) rebuilds `dist/` on every source change.
//   2. an fs.watch on `dist/` debounces and runs `yalc push`, copying the fresh
//      build into every app that added this package (e.g. the demo-app).
//
// Run from the package dir: `yarn dev:yalc`. Ctrl-C stops both.
import spawn from 'cross-spawn'
import { spawnSync } from 'node:child_process'
import { watch as fsWatch } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = join(__dirname, 'dist')

function runYalc(args, { silent = false } = {}) {
  const res = spawnSync('npx', ['yalc', ...args], {
    cwd: __dirname,
    stdio: silent ? 'ignore' : 'inherit',
  })
  return res.status === 0
}

// Ensure a fresh dist exists and is pushed before we start watching, so the
// first `yarn dev` in the consumer already sees a complete build.
console.log('[yalc-dev] initial build...')
const built = spawnSync('node', ['build.mjs'], { cwd: __dirname, stdio: 'inherit' })
if (built.status !== 0) process.exit(built.status ?? 1)
console.log('[yalc-dev] initial push...')
runYalc(['push', '--sig'])

// esbuild watcher: rebuilds dist/ on source changes.
const watcher = spawn('node', ['watch.mjs'], { cwd: __dirname, stdio: 'inherit' })

// Debounced push whenever dist/ changes.
let pushTimer = null
let pushing = false
let pushQueued = false
const schedulePush = () => {
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(async () => {
    if (pushing) {
      pushQueued = true
      return
    }
    pushing = true
    process.stdout.write('[yalc-dev] pushing... ')
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
