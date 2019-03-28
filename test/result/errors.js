// catches global error
import { Readable } from 'stream'
export default {
  'global error'() {
    const rs = new Readable({
      read() {
        throw new Error('Global Error')
      },
    })
    rs.pipe(process.stdout)
  },
}

/* stdout */
 test/temp/test.js
  ✗  global error
  | Error: Global Error
  |     at Readable.read [as _read] (/test/temp/test.js:6:15)

test/temp/test.js > global error
  Error: Global Error
      at Readable.read [as _read] (/test/temp/test.js:6:15)

🦅  Executed 1 test: 1 error.
/**/

// catches persistent context errors
export default {
  persistentContext: class {
    _init() {
      throw new Error('Init error')
    }
  },
  'persistent context error'() {
  },
}

/* stdout */
 test/temp/test.js
  ✗  persistent context error
  | Error: Persistent context failed to evaluate: Init error
  |     at persistentContext._init (/test/temp/test.js:4:13)

test/temp/test.js > persistent context error
  Error: Persistent context failed to evaluate: Init error
      at persistentContext._init (/test/temp/test.js:4:13)

🦅  Executed 1 test: 1 error.
/**/

// notifies of an error in persistent context destroy
export const destroy = {
  persistentContext: class {
    _destroy() {
      throw new Error('Destroy error')
    }
  },
  'destroy error'() {
  },
}

export const ok = { continue() {} }

/* stdout */
 test/temp/test.js
   destroy
    ✓  destroy error
Error: Destroy error
    at persistentContext._destroy (/test/temp/test.js:4:13)
   ok
    ✓  continue

🦅  Executed 2 tests.
/**/
