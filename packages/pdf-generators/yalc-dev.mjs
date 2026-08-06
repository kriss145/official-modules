import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { yalcDev } from '../../scripts/package-dev/yalc-dev.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))

yalcDev(__dirname)
