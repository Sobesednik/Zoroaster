'use strict'

const lib = require('./lib')
const Test = require('./test')
const EOL = require('os').EOL

const timeout = parseInt(process.env.ZOROASTER_TIMEOUT, 10) || 2000

class TestSuite {
    constructor (name, testsOrPath, parent) {
        if (typeof name !== 'string') {
            throw new Error('Test suite name must be given.')
        }
        this._name = name
        this._parent = parent

        if (typeof testsOrPath === 'string') {
            this._path = testsOrPath
        } else if (typeof testsOrPath === 'object') {
            this._rawTests = testsOrPath
            this._tests = createTests(this.rawTests, this)
        } else {
            throw new Error('You must provide either a path to a module, or tests in an object.')
        }
    }
    get path() {
        return this._path
    }
    get name() {
        return this._name
    }
    get parent() {
        return this._parent
    }
    get rawTests() {
        return this._rawTests
    }
    get tests() {
        return this._tests
    }

    // todo: require for test
    require() {
        if (this._path) {
            this._rawTests = requireModule(this._path)
            this._tests = createTests(this.rawTests, this)
        }
        this.tests.forEach((test) => {
            if (test instanceof TestSuite) {
                test.require()
            }
        })
    }

    /**
     * Run test suite.
     */
    run(notify) {
        if (typeof notify === 'function') notify({type:'test-suite-start', name: this.name })
        return lib
            .runInSequence(this.tests, notify)
            .then((res) => {
                if (typeof notify === 'function') notify({type:'test-suite-end', name: this.name })
                return res
            })
    }
    dump() {
        const str = this.name + EOL + this.tests
            .map(test => test.dump())
            .join('\n')
        return this.parent ? lib.indent(str, '    ') : str
    }
    hasErrors() {
        return this.tests
            .find(test =>
                test.hasErrors()
            )
    }
}

/**
 * Sort tests and test suites so that tests run before
 * test suites. We delibarately don't use V8's unstable
 * Array.sort().
 * @param {Array} tests - test cases and test suites to sort
 * @returns {Array} Sorted array with tests before test suites.
 */
function sort(tests) {
    const testSuites = []
    const testCases = []
    tests.forEach((test) => {
        if (test instanceof Test) {
            testCases.push(test)
        } else {
            testSuites.push(test)
        }
    })
    return Array.prototype.concat([], testCases, testSuites)
}

/**
 * Map object with test names as keys and test functions as values
 * to an array of tests.
 * @param {object} object
 * @return {array<Test>} An array with tests.
 */
function createTests(object, parent) {
    const tests = Object
        .keys(object)
        .map((key) => {
            switch (typeof object[key]) {
            case 'function':
                return new Test(key, object[key], timeout)
            case 'object':
                return new TestSuite(key, object[key], parent)
            case 'string':
                return new TestSuite(key, object[key], parent)
            }
        })
        .filter(test => test !== undefined)
    return sort(tests)
}

function requireModule(modulePath) {
    return require(modulePath)
}

module.exports = TestSuite
