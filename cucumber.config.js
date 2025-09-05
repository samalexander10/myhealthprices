module.exports = {
  default: {
    require: [
      'tests/step_definitions/**/*.js',
      'tests/support/**/*.js'
    ],
    format: [
      'progress-bar',
      'html:reports/cucumber-report.html',
      'json:reports/cucumber-report.json'
    ],
    formatOptions: {
      snippetInterface: 'async-await'
    },
    worldParameters: {
      baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://www.myhealthprices.com'
    }
  }
};
