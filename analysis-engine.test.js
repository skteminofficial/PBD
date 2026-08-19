const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.join(__dirname, '..');
global.window = global;
[
  'js/analysis/core/constants.js',
  'js/analysis/core/formatter.js',
  'js/analysis/core/validation.js',
  'js/analysis/core/collections.js',
  'js/analysis/core/records.js',
  'js/analysis/core/students.js',
  'js/analysis/core/distribution.js',
  'js/analysis/core/mastery.js',
  'js/analysis/core/statistics.js',
  'js/analysis/core/filters.js',
  'js/analysis/core/metadata.js',
  'js/analysis/core.js',
  'js/analysis/schoolAnalysis.js',
  'js/analysis/stageAnalysis.js',
  'js/analysis/yearAnalysis.js',
  'js/analysis/classAnalysis.js',
  'js/analysis/subjectAnalysis.js',
  'js/analysis/studentAnalysis.js',
  'js/analysis/index.js'
].forEach(file => vm.runInThisContext(fs.readFileSync(path.join(root, file), 'utf8'), { filename: file }));

const items = [
  {
    year: 1, className: '1 Amanah', session: '2026', studentCount: 2,
    subjects: ['Bahasa Melayu', 'Matematik'],
    students: [
      { name: 'Ali', subjects: { 'Bahasa Melayu': 'TP2', Matematik: 'TP3' } },
      { name: 'Aina', subjects: { 'Bahasa Melayu': 'TP4', Matematik: 'TP2' } }
    ]
  },
  {
    year: 4, className: '4 Bestari', session: '2026', studentCount: 1,
    subjects: ['Bahasa Melayu', 'Matematik'],
    students: [
      { name: 'Kumar', subjects: { 'Bahasa Melayu': 'TP5', Matematik: 'TP2' } }
    ]
  }
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const school = PBDAnalysis.getSchool(items, { totalFiles: 2, failedFiles: 0, importedAt: '2026-07-22T00:00:00.000Z' });
assert(school.summary.totalStudents === 3, 'Jumlah murid unik salah');
assert(school.summary.totalClasses === 2, 'Jumlah kelas salah');
assert(school.summary.stage1Students === 2, 'Murid Tahap 1 salah');
assert(school.summary.stage2Students === 1, 'Murid Tahap 2 salah');
assert(school.tpDistribution.TP2 === 3, 'Kiraan TP2 salah');
assert(school.uniqueStudentsByTP.TP2 === 3, 'Murid unik TP2 salah');
assert(!('averageTP' in school.summary), 'Purata TP tidak dibenarkan');

const stage1 = PBDAnalysis.getStage(items, 1);
assert(stage1.summary.totalStudents === 2, 'Analisis Tahap 1 salah');
assert(stage1.tpDistribution.TP2 === 2, 'TP2 Tahap 1 salah');

const math = PBDAnalysis.getSubject(items, 'Matematik');
assert(math.tpDistribution.TP2 === 2, 'TP2 Matematik salah');
assert(math.detailsByTP.TP2.length === 2, 'Senarai murid TP2 Matematik salah');

const ali = PBDAnalysis.getStudent(items, 'Ali');
assert(ali.summary.totalSubjects === 2, 'Profil murid salah');
assert(ali.subjects.find(x => x.subject === 'Bahasa Melayu').tp === 'TP2', 'TP murid salah');

console.log('✓ Semua ujian Analysis Engine lulus.');
