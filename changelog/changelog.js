import { write, read } from '@wrote/wrote'
import { askSingle } from 'reloquent'
import { version } from '../package.json'

const PATH = 'CHANGELOG.md'

;(async () => {
  const next = await askSingle(`What is the next version after ${version}?`)
  const current = await read(PATH)
  const d = new Date()
  const m = d.toLocaleString('en-GB', { month: 'long' })
  const dd = `${d.getDate()} ${m} ${d.getFullYear()}`
  const t = `## ${dd}

### [${next}](https://github.com/contexttesting/zoroaster/compare/v${version}...v${next})

${current}
  `
  await write(PATH, t)
})()

// ## 17 March 2019

// ### [3.9.0](https://github.com/contexttesting/zoroaster/compare/v3.8.5...v3.9.0)