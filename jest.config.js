const {jest: jestConfig} = require('kcd-scripts/config')
module.exports = Object.assign(jestConfig, {
  testPathIgnorePatterns: ['<rootDir>/src/CounterList.js'],
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 10,
      lines: 70,
      statements: 10,
    },
  },
})
