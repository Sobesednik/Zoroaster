// does not timeout
-a test/fixtures/timeouts.js

/* stdout */
 test/fixtures/timeouts.js
  ✓  finishes before the timeout

🦅  Executed 1 test.
/**/

// has persistent context
-a test/fixture/persistent-context.js

/* stdout */
 test/fixture/persistent-context.js
The Persistent Context Is pc
  ✓  test
  ✓  test2
The Persistent Context Destroyed

🦅  Executed 2 tests.
/**/