import { watchFile, unwatchFile } from 'fs'
import Catchment from 'catchment'
import { EOL } from 'os'
import { resolve } from 'path'
import { c } from 'erte'
import {
  createErrorTransformStream,
  createProgressTransformStream,
  createTestSuiteStackStream,
} from './stream'
import { buildRootTestSuite, clearRequireCache } from './bin'
import { runInSequence } from './run-test'

function watchFiles(files, callback) {
  files.forEach((file) => {
    // console.log(`Watching ${file} for changes...`)
    watchFile(file, (...args) => {
      callback(file, ...args)
    })
  })
}
function unwatchFiles(files) {
  files.forEach((file) => {
    // console.log(`Unwatching ${file}`)
    unwatchFile(file)
  })
}

/**
 * The main method to run tests and test suites.
 * @param {Object} params
 * @param {!Array<string>} params.paths Paths to test suites.
 * @param {boolean} [params.watch] Whether to watch files for changes.
 * @param {Object} serviceParams The params used privately by this method for recursion.
 * @param {!Array<string>} [serviceParams._currentlyWatching]
 * @param {Function} [serviceParams.exitListener]
 */
export default async function run({
  paths,
  watch,
  timeout,
  snapshot,
  snapshotRoot,
  interactive,
}, {
  _currentlyWatching = [],
  exitListener,
} = {}) {
  unwatchFiles(_currentlyWatching)
  if (exitListener) process.removeListener('beforeExit', exitListener)

  const rootTestSuite = await buildRootTestSuite(paths, timeout)

  const stack = createTestSuiteStackStream()

  const rs = createErrorTransformStream()
  const ts = createProgressTransformStream()
  stack.pipe(ts).pipe(process.stdout)
  stack.pipe(rs)

  const { promise: errorsPromise } = new Catchment({ rs })

  const count = {
    total: 0,
    error: 0,
  }

  const notify = (data) => {
    if (typeof data != 'object') return
    stack.write(data)
    if (data.type == 'test-end') {
      count.total++
      if (data.error) {
        count.error++
      }
    }
  }
  const options = {
    snapshot, snapshotRoot, interactive,
  }
  await runInSequence(notify, [], rootTestSuite.tests, rootTestSuite.hasFocused, options)

  stack.end()
  const errorsCatchment = await errorsPromise
  process.stdout.write(EOL)
  process.stdout.write(errorsCatchment)

  process.stdout.write(`🦅  Executed ${count.total} test${count.total == 1 ? '' : 's'}`)
  if (count.error) {
    process.stdout.write(
      `: ${count.error} error${count.error > 1 ? 's' : ''}`
    )
  }
  process.stdout.write(`.${EOL}`)

  const newExitListener = () => {
    process.exit(count.error)
  }
  process.once('beforeExit', newExitListener)

  if (watch) {
    const newCurrentlyWatching = Object.keys(require.cache).filter((c) => {
      return !c.startsWith(`${process.cwd()}/node_modules/`)
    })
    watchFiles(newCurrentlyWatching, async (file, stats) => {
      const pp = paths.filter((p) => {
        const P = resolve(p)
        if (P == file && !stats.mtime.getTime()) {
          console.warn('Test suite file %s was deleted.', c(p, 'yellow'))
          return false
        }
        return true
      })
      clearRequireCache()
      // we can also re-run only changed test suites
      await run({
        paths: pp,
        watch,
        timeout,
        snapshot,
        snapshotRoot,
        interactive,
      }, {
        _currentlyWatching: newCurrentlyWatching,
        exitListener: newExitListener,
      })
    })
  }
}

const memory = () => {
  const used = process.memoryUsage().heapUsed / 1024 / 1024
  console.log(`Memory usage: ${Math.floor(used*1000)/1000} MB`)
}
// memory()
// setInterval(memory, 1000)