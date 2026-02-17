export default {
  import: ['./steps/**/*.ts'],
  paths: ['./features/**/*.feature'],
  format: ['progress', 'html:reports/cucumber-report.html'],
  requireModule: [],
}
