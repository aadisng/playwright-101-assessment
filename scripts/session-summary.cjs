const fs = require('node:fs');
const reportPath = 'test-results/results.json';
if (!fs.existsSync(reportPath)) {
  console.error('Run npm run test:cloud first. No results.json found.');
  process.exit(1);
}
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const sessions = [];
function visit(suite) {
  for (const spec of suite.specs || []) {
    for (const test of spec.tests || []) {
      for (const result of test.results || []) {
        for (const attachment of result.attachments || []) {
          if (attachment.name !== 'testmu-session') continue;
          const text = attachment.body ? Buffer.from(attachment.body, 'base64').toString('utf8') : fs.readFileSync(attachment.path, 'utf8');
          sessions.push({ scenario: spec.title, project: test.projectName, status: result.status, session: JSON.parse(text) });
        }
      }
    }
  }
  for (const child of suite.suites || []) visit(child);
}
for (const suite of report.suites || []) visit(suite);
if (!sessions.length) {
  console.error('No cloud sessions found. Local runs do not satisfy the cloud execution requirement.');
  process.exit(1);
}
fs.writeFileSync('test-results/cloud-sessions.json', JSON.stringify(sessions, null, 2) + '\n');
console.log(JSON.stringify(sessions, null, 2));
