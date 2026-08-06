import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildPackage } from '../../scripts/package-dev/build.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))

await buildPackage(__dirname, { label: 'test-package' })
