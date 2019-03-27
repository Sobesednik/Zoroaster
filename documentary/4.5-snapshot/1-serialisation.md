### Serialisation

Whenever the snapshot does not match the output of the test, or its type (strings are saved as `txt` files and objects as `json` files), an error will be thrown. To enable updating snapshots during the test run, the `-i` or `--interactive` option can be passed to _Zoroaster_ test runner. Currently, only JSON serialisation is supported, therefore there might be errors due to the `JSON.stringify` method omitting undefined properties and dates. Sometimes, it could be fixed by doing the JSON conversion first, however that could lead to some properties not tested:

```js
export default {
  async '!handles a JPG file'({ photo }) {
    const res = handleBinaryFile(photo)
    return JSON.parse(JSON.stringify(res))
  },
  // ...
}
```

You can therefore implement your own serialisation (but a better serialisation is in plan for _Zoroaster_):

```js
  // ...
  async '!parses dates'({ photo }) {
    const { data: {
      DateTime,
      DateTimeOriginal,
      DateTimeDigitized,
    } } = handleBinaryFile(photo, {
      parseDates: true,
    })
    return {
      DateTime: DateTime.toISOString(),
      DateTimeOriginal: DateTimeOriginal.toISOString(),
      DateTimeDigitized: DateTimeDigitized.toISOString(),
    }
  },
  // ...
```

%~ width="15"%