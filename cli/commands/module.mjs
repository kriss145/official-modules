// `module` command namespace for the modules CLI.
//
// Mirrors the shape of a core `mercato` module command (`{ command, run(argv) }`)
// and the built-in `mercato module <sub>` dispatch (add/enable/eject), so these
// subcommands drop into the core CLI verbatim as `mercato module build|watch|dev`.
import { spawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolvePackages, loadModuleConfig, repoRoot } from '../lib/packages.mjs'
import { buildPackage } from '../lib/build.mjs'
import { yalcDev } from '../lib/dev.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const selectorsOf = (argv) => argv.filter((arg) => !arg.startsWith('-'))

function usage() {
  console.log('Usage: mercato-modules module <build|watch|dev> [package...]')
  console.log('  module build [package...]   Build one/all packages into dist/')
  console.log('  module watch [package...]   Rebuild dist/ on change (all packages if none given)')
  console.log('  module dev <package>        yalc dev loop: build -> watch -> push')
}

/** Build selected packages (all if none), applying each package's module.config.mjs. */
async function buildCmd(argv) {
  for (const pkg of resolvePackages(selectorsOf(argv))) {
    const config = await loadModuleConfig(pkg.dir)
    await buildPackage(pkg.dir, config.build ?? {})
  }
  return 0
}

/** Watch selected packages. Delegates to the consolidated multi-package watcher. */
async function watchCmd(argv) {
  const watcher = join(__dirname, '..', 'lib', 'watch-packages.mjs')
  const child = spawn('node', [watcher, ...argv], { cwd: repoRoot, stdio: 'inherit' })
  return await new Promise((resolve) => child.on('exit', (code) => resolve(code ?? 0)))
}

/** yalc dev loop for a single package. */
async function devCmd(argv) {
  const selectors = selectorsOf(argv)
  if (selectors.length !== 1) {
    console.error('[module dev] expects exactly one package')
    usage()
    return 1
  }
  const [pkg] = resolvePackages(selectors)
  const config = await loadModuleConfig(pkg.dir)
  await yalcDev(pkg.dir, config.build ?? {})
  return 0
}

export const moduleCommand = {
  command: 'module',
  async run(argv) {
    const [sub, ...rest] = argv
    switch (sub) {
      case 'build':
        return buildCmd(rest)
      case 'watch':
        return watchCmd(rest)
      case 'dev':
        return devCmd(rest)
      case undefined:
      case 'help':
      case '--help':
      case '-h':
        usage()
        return 0
      default:
        console.error(`[module] unknown subcommand "${sub}"`)
        usage()
        return 1
    }
  },
}
