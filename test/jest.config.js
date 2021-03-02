module.exports = {
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
};
