module.exports = {
  watchPlugins: ['jest-runner-eslint/watch-fix'],
  projects: [
    {
      // Jest...
    },
    {
      runner: 'jest-runner-eslint',
      displayName: 'ESLint',
      watchPlugins: ['jest-runner-eslint/watch-fix']
    }
  ]
}
