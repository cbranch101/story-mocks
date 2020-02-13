const {jest: jestConfig} = require('kcd-scripts/config')
module.exports = Object.assign(jestConfig, {
  coveragePathIgnorePatterns: ['<rootDir>/src/getSetupDecorator.js'],
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 10,
      lines: 70,
      statements: 10,
    },
  },
})
