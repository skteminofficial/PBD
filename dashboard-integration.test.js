const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const sandbox = { window: {}, document: { querySelector: () => null, addEventListener: () => {} }, console };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/dashboard.js'), 'utf8'), sandbox);

const summary = {
  items: [{ year: 4, className: '4 Amanah', fileName: '4 Amanah.xlsx', studentCount: 2, subjects: ['BM'], session: '2026' }],
  school: {
    summary: { totalStudents: 2, totalClasses: 1, totalSubjects: 1, studentsByYear: { 4: 2 } },
    metadata: { totalFiles: 1, failedFiles: 0, years: [4], sessions: ['2026'], subjects: ['Bahasa Melayu'] }
  }
};

const view = sandbox.window.PBDDashboard.createViewModel(summary);
assert.deepStrictEqual(JSON.parse(JSON.stringify(view.metrics)), { files: 1, classes: 1, students: 2, subjects: 1 });
assert.strictEqual(view.sessionLabel, 'Sesi 2026');
assert.strictEqual(view.caption, 'Kesemua 1 fail berjaya diproses.');
assert.deepStrictEqual(JSON.parse(JSON.stringify(view.studentsByYear)), { 4: 2 });
assert.strictEqual(view.items.length, 1);

const subjectRows = [
  { studentName: 'Ali', year: 4, className: '4 Delta', subject: 'Bahasa Melayu', tp: 'TP2' },
  { studentName: 'Ali', year: 4, className: '4 Delta', subject: 'Matematik', tp: 'TP4' },
  { studentName: 'Siti', year: 4, className: '4 Delta', subject: 'Bahasa Melayu', tp: 'TP5' },
  { studentName: 'Mei', year: 5, className: '5 Gamma', subject: 'Bahasa Melayu', tp: 'TP3' }
];
const subjects = sandbox.window.PBDDashboard.subjectSummaries(subjectRows);
const bahasaMelayu = subjects.find(item => item.subject === 'Bahasa Melayu');
assert.strictEqual(subjects.length, 2);
assert.strictEqual(bahasaMelayu.students, 3);
assert.strictEqual(bahasaMelayu.classes, 2);
assert.strictEqual(bahasaMelayu.records, 3);
assert.strictEqual(bahasaMelayu.mastered, 2);
assert.strictEqual(bahasaMelayu.notMastered, 1);
assert.strictEqual(Math.round(bahasaMelayu.masteryRate * 10) / 10, 66.7);
assert.strictEqual(bahasaMelayu.distribution.TP2, 1);
assert.strictEqual(bahasaMelayu.distribution.TP3, 1);
assert.strictEqual(bahasaMelayu.distribution.TP5, 1);
console.log('Dashboard integration tests passed.');
