import { watch } from '../../scripts/package-dev/watch.mjs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
watch(__dirname)
