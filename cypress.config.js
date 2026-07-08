const { defineConfig } = require('cypress')
const { allureCypress } = require('allure-cypress/reporter')

// Attempt counter for demo flaky tests: lives in the Node process,
// so it survives test retries within a single run.
const attempts = {}

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      allureCypress(on, config, {
        resultsDir: "allure-results"
      });
      on('task', {
        nextAttempt(key) {
          attempts[key] = (attempts[key] || 0) + 1;
          return attempts[key];
        },
      });
      return config;
    },
    baseUrl: 'http://localhost:8080',
    retries: { runMode: 2, openMode: 0 },   // retry failed tests up to 2 times in CI
  },
})
