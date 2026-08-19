const fs = require('fs');
const vm = require('vm');
const path = require('path');
const root = path.join(__dirname, '..');
global.window = global;
[
  'js/analysis/core/constants.js','js/analysis/core/formatter.js','js/analysis/core/validation.js',
  'js/analysis/core/collections.js','js/analysis/core/records.js','js/analysis/core/students.js',
  'js/analysis/core/distribution.js','js/analysis/core/mastery.js','js/analysis/core/statistics.js',
  'js/analysis/core/filters.js','js/analysis/core/metadata.js','js/analysis/core.js',
  'js/analysis/schoolAnalysis.js','js/analysis/stageAnalysis.js','js/analysis/yearAnalysis.js',
  'js/analysis/classAnalysis.js','js/analysis/subjectAnalysis.js','js/analysis/studentAnalysis.js','js/analysis/index.js'
].forEach(file => vm.runInThisContext(fs.readFileSync(path.join(root, file), 'utf8'), { filename: file }));
const items = [{year:1,className:'1 Amanah',session:'2026',subjects:['BM','Matematik'],students:[
  {name:'Ali',subjects:{BM:'TP2',Matematik:'TP3'}},
  {name:'Aina',subjects:{BM:'TP4',Matematik:'TP2'}}
]},{year:4,className:'4 Bestari',session:'2026',subjects:['BM','Matematik'],students:[
  {name:'Kumar',subjects:{BM:'TP5',Matematik:'TP2'}}
]}];
function assert(ok,msg){if(!ok)throw new Error(msg)}
const core=PBDAnalysisCore;
const records=core.buildRecords(items);
assert(records.length===6,'Jumlah rekod salah');
assert(core.countUniqueStudents(records)===3,'Murid unik salah');
assert(core.distributionFrom(records).TP2===3,'Agihan TP2 salah');
assert(core.masteryFrom(core.distributionFrom(records)).menguasai===3,'Kiraan menguasai salah');
assert(core.applyFilters(records,{year:1,subject:'Matematik'}).length===2,'Tapisan gabungan salah');
assert(core.buildFilterOptions(records).years.join(',')==='1,4','Pilihan tahun salah');
assert(core.formatPercentage(66.7)==='66.7%','Format peratus salah');
const school=PBDAnalysis.getSchool(items,{totalFiles:2,failedFiles:0,importedAt:'2026-07-22T00:00:00.000Z'});
assert(school.summary.totalStudents===3,'Keserasian School Analysis gagal');
assert(!('averageTP' in school.summary),'Purata TP tidak dibenarkan');
console.log('✓ Semua ujian Core Framework dan Analysis Engine lulus.');
