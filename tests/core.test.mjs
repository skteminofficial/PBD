import test from 'node:test';import assert from 'node:assert/strict';
import {viewData,mergeRows,validateRecords,grade,subjectCode,exportCsv} from '../js/core.mjs';
const r=(key,sub,mark,more={})=>({studentKey:key,name:key,session:'2026',year:5,className:'DELTA',assessment:'UASA',type:'MARKAH',subject:sub,mark,grade:mark===null?null:grade(mark),status:mark===null?'TD':'OK',...more});
const f={session:'2026',assessment:'COMBINED',year:'5',sort:'rank'};
test('A dahulu kemudian jumlah; seri 1,1,3; TD tidak diberi kedudukan',()=>{const rows=[r('A','BM',90),r('A','MT',80),r('B','BM',90),r('B','MT',80),r('C','BM',81),r('C','MT',81),r('D','BM',100),r('D','MT',null)];const p=viewData(rows,f);assert.deepEqual(p.map(p=>[p.key,p.rank]),[['A',1],['B',1],['C',3],['D',undefined]]);assert.equal(p.find(p=>p.key==='D').average,100);});
test('Kumpulan subjek berbeza tidak bersaing jumlah/ranking',()=>{const p=viewData([r('A','BM',95),r('B','BM',90),r('B','MT',90)],f);assert.equal(p[0].rank,1);assert.equal(p[1].rank,1);});
test('Tahun 4 gabung MPT4 untuk empat teras; UASA lain dikekalkan',()=>{const rows=[r('A','BM',null,{year:4}),r('A','BA',90,{year:4}),r('A','BM',80,{year:4,assessment:'MPT4'}),...['BI','MT','SN'].map(s=>r('A',s,70,{year:4,assessment:'MPT4'})),r('A','BM',null,{year:4,assessment:'PBD_END',type:'TP',tp:'TP5'})];const p=viewData(rows,{...f,year:'4'})[0];assert.equal(p.total,380);assert.equal(p.pbd.BM.tp,'TP5');assert.equal(p.marks.BM.mark,80);const m=viewData(rows,{...f,year:'4',assessment:'MPT4'})[0];assert.equal(m.total,290);assert.equal(m.count,4);assert.ok(!m.marks.BA);});
test('Upload satu kelas tidak membuang kelas/pentaksiran/sesi lain',()=>{const old=[r('A','BM',70),r('B','BM',90,{className:'SIGMA'}),r('A','BM',50,{session:'2025'})];const out=mergeRows(old,[r('A','BM',80)]);assert.equal(out.length,3);assert.equal(out.find(r=>r.studentKey==='B').mark,90);assert.equal(out.find(r=>r.studentKey==='A'&&r.session==='2026').mark,80);});
test('CSV escape formula dan koma; PBD baris berasingan',()=>{const p=viewData([r('=SUM(1,2)','BM',90),r('=SUM(1,2)','BM',null,{assessment:'PBD_END',type:'TP',tp:'TP6'})],f);const csv=exportCsv(p,['BM']);assert.ok(csv.includes("'=SUM(1,2)"));assert.ok(csv.includes('TP6'));assert.ok(csv.startsWith('\ufeff'));});
test('Subjek singkatan dipadankan, sifar markah sah, rekod berganda ditolak',()=>{assert.equal(subjectCode('BAHASA MELAYU'),'BM');assert.equal(subjectCode('PMZ'),'MZ');const a=r('A','BM',0);assert.equal(validateRecords([a]).length,0);assert.equal(validateRecords([a,a]).length,1);});
test('Terbaik subjek turut memasukkan murid yang belum lengkap subjek lain',()=>{const p=viewData([r('A','BM',90),r('A','MT',null),r('B','BM',80),r('B','MT',100)],{...f,subject:'BM',sort:'subject'});assert.equal(p[0].key,'A');assert.equal(p[0].subjectRank,1);assert.equal(p[0].rank,undefined);assert.equal(p[1].subjectRank,2);});
test('Pilihan serentak mengekalkan TP pertengahan dan akhir serta murid satu rekod sahaja',()=>{
 const rows=[r('A','BM',null,{assessment:'PBD_MID',type:'TP',tp:'TP3',status:'OK'}),r('A','BM',null,{assessment:'PBD_END',type:'TP',tp:'TP5',status:'OK'}),r('B','MT',null,{assessment:'PBD_MID',type:'TP',tp:'TP4',status:'OK'})];
 const people=viewData(rows,{...f,assessment:'MULTI',assessments:['PBD_MID','PBD_END']});
 assert.equal(people.length,2);const a=people.find(p=>p.key==='A');assert.equal(a.assessmentViews[0].pbd.BM.tp,'TP3');assert.equal(a.assessmentViews[1].pbd.BM.tp,'TP5');assert.equal(a.pbd.BM.tp,'TP5');assert.equal(a.rank,undefined);
 const csv=exportCsv(people,['BM','MT'],'MULTI');assert.ok(csv.includes('PBD_MID'));assert.ok(csv.includes('PBD_END'));assert.ok(csv.includes('TP3'));assert.ok(csv.includes('TP5'));
 assert.equal(viewData(rows,{...f,assessments:[]}).length,0);
 assert.equal(viewData(rows,{...f,assessments:['PBD_END'],subject:'MT'}).length,0);
});
test('Pilihan markah dan PBD tidak mencampurkan TP dengan markah',()=>{
 const rows=[r('A','BM',90),r('A','BM',null,{assessment:'PBD_MID',type:'TP',tp:'TP3',status:'OK'}),r('A','BM',null,{assessment:'PBD_END',type:'TP',tp:'TP5',status:'OK'})];
 const p=viewData(rows,{...f,assessments:['UASA','PBD_MID','PBD_END']})[0];assert.equal(p.total,90);assert.equal(p.rank,1);assert.equal(p.assessmentViews.length,3);
});
test('PBD susun TP6 dahulu, TP5 pemutus seri; taburan sama ikut nama tanpa ranking',()=>{
 const t=(key,subject,tp,assessment='PBD_END')=>r(key,subject,null,{year:1,assessment,type:'TP',tp,status:'OK'});
 const rows=[t('Zara','BM','TP6'),t('Zara','MT','TP5'),t('Aina','BM','TP6'),t('Aina','MT','TP5'),t('Budi','BM','TP6'),t('Budi','MT','TP4'),t('Cici','BM','TP6'),t('Cici','MT','TP6')];
 const f={session:'2026',year:'1',assessment:'PBD_END',assessments:['PBD_END'],sort:'pbd'};
 const ps=viewData(rows,f);assert.deepEqual(ps.map(p=>p.name),['Cici','Aina','Zara','Budi']);assert.ok(ps.every(p=>p.rank===undefined));assert.deepEqual(ps[0].pbdSummary.counts,[2,0,0,0,0,0]);
 assert.deepEqual(viewData(rows,{...f,tp:'TP5'}).map(p=>p.name),['Aina','Zara']);assert.equal(viewData(rows,{...f,tp:'TP5',subject:'BM'}).length,0);assert.equal(viewData(rows,{...f,tp:'TP5',subject:'MT'}).length,2);
});
test('Penapis PBD menggunakan pentaksiran akhir yang dipilih, tidak mengganti rekod tiada dengan pertengahan',()=>{
 const rows=[r('A','BM',null,{assessment:'PBD_MID',type:'TP',tp:'TP6',status:'OK'})];
 const ps=viewData(rows,{...f,assessments:['PBD_MID','PBD_END'],sort:'pbd'});assert.equal(ps[0].pbdSummary.assessed,0);
 assert.equal(viewData(rows,{...f,assessments:['PBD_MID','PBD_END'],sort:'pbd',tp:'TP6'}).length,0);
 assert.equal(viewData(rows,{...f,assessments:['PBD_MID'],sort:'pbd',tp:'TP6'}).length,1);
});
