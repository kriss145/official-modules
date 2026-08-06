import { basename, join } from 'node:path'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync, writeFileSync } from 'node:fs'
import { glob } from 'glob'
import { buildPackage } from '../../scripts/package-dev/build.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))

await buildPackage(__dirname, {
  label: 'pdf-generators',
  // Fonts/images are inlined as data URIs by the templates, so bundle them.
  loaders: { '.ttf': 'dataurl', '.otf': 'dataurl', '.woff': 'dataurl', '.woff2': 'dataurl' },
  assetGlobs: ['src/**/*.{ttf,otf,woff,woff2,png,jpg,svg}'],
  // Emit `<font>.generated.ts` base64 modules the shared templates import.
  afterBuild: async ({ packageDir }) => {
    const fontsDir = join(packageDir, 'src/modules/pdf_generators/templates/shared/fonts')
    const fontFiles = await glob('*.ttf', { cwd: fontsDir, absolute: true })
    for (const file of fontFiles) {
      const name = basename(file, '.ttf')
      const base64 = readFileSync(file).toString('base64')
      const output = `const src = "data:font/truetype;base64,${base64}"\nexport default src\n`
      writeFileSync(join(fontsDir, `${name}.generated.ts`), output)
    }
    console.log(`[build] pdf-generators: generated ${fontFiles.length} font files`)
  },
})
