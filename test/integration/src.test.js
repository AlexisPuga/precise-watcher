describe('/src', () => {
  const preciseWatcher = require('../../src')

  beforeEach(() => {
    jest.resetModules()
  })

  it('Should read config from "precise-watcher" property located in ' +
    'users\' package.json, by default', async () => {
    // Should return early (returning false).
    jest.doMock('../../package.json', () => ({
      'precise-watcher': true
    }), { virtual: true })

    expect(preciseWatcher()).toBe(true)
  })
})
