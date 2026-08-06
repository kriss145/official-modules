#!/usr/bin/env node
// Internal modules CLI. Proposal-stage stand-in for future `mercato module ...`
// commands: each command is shaped like a core module command so it ports 1:1.
//
//   mercato-modules module build [package...]
//   mercato-modules module watch [package...]
//   mercato-modules module dev <package>
import { moduleCommand } from './commands/module.mjs'

const COMMANDS = [moduleCommand]

const [name, ...rest] = process.argv.slice(2)

if (!name || name === 'help' || name === '--help' || name === '-h') {
  console.log('Usage: mercato-modules <command> [args]')
  console.log(`Commands: ${COMMANDS.map((c) => c.command).join(', ')}`)
  process.exit(0)
}

const command = COMMANDS.find((c) => c.command === name)
if (!command) {
  console.error(`Unknown command: "${name}". Available: ${COMMANDS.map((c) => c.command).join(', ')}`)
  process.exit(1)
}

const exitCode = await command.run(rest)
process.exit(typeof exitCode === 'number' ? exitCode : 0)
