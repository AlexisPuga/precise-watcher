module.exports = (filepath, json) => jest.doMock(filepath, () => (json), {
  virtual: true
})
