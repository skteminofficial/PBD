export const ASSESSMENTS=[{id:'PBD_MID',name:'PBD Pertengahan Tahun',type:'TP'},{id:'UASA',name:'UASA',type:'MARKAH'},{id:'PBD_END',name:'PBD Akhir Tahun',type:'TP'},{id:'MPT4',name:'MPT4',type:'MARKAH'}];
export const SUBJECTS={BM:'BAHASA MELAYU',BI:'BAHASA INGGERIS',MT:'MATEMATIK',SN:'SAINS',PI:'PENDIDIKAN ISLAM',PM:'PENDIDIKAN MORAL',BA:'BAHASA ARAB',SEJ:'SEJARAH',RBT:'REKA BENTUK DAN TEKNOLOGI',PJPK:'PENDIDIKAN JASMANI DAN PENDIDIKAN KESIHATAN',MZ:'PENDIDIKAN MUZIK',PSV:'PENDIDIKAN SENI VISUAL'};
export const CORE=['BM','BI','MT','SN'];
export const clean=v=>String(v??'').trim().replace(/\s+/g,' ');
export function subjectCode(v){const s=clean(v).toUpperCase();const alias={'SAINS':'SN','MATEMATIK':'MT','MUZIK':'MZ','PMZ':'MZ','PENDIDIKAN JASMANI':'PJPK','PENDIDIKAN KESIHATAN':'PJPK','REKA BENTUK TEKNOLOGI':'RBT','PENDIDIKAN SENI':'PSV'};return SUBJECTS[s]?s:alias[s]||Object.keys(SUBJECTS).find(k=>SUBJECTS[k]===s)||s;}
export function yearNumber(v){const s=clean(v).toUpperCase();return Number(s.match(/[1-6]/)?.[0]||({'SATU':1,'DUA':2,'TIGA':3,'EMPAT':4,'LIMA':5,'ENAM':6}[s.replace(/^TAHUN\s*/, '')])||0);}
export const grade=m=>m>=82?'A':m>=66?'B':m>=50?'C':m>=35?'D':m>=20?'E':'F';
export async function hashId(id){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(id))))].map(x=>x.toString(16).padStart(2,'0')).join('');}
export const recordKey=r=>[r.session,r.assessment,r.studentKey,r.subject].join('|');
export function validateRecords(rows){const seen=nexport const ASSESSMENTS=[{id:'PBD_MID',name:'PBD Pertengahan Tahun',type:'TP'},{id:'UASA',name:'UASA',type:'MARKAH'},{id:'PBD_END',name:'PBD Akhir Tahun',type:'TP'},{id:'MPT4',name:'MPT4',type:'MARKAH'}];
export const SUBJECTS={BM:'BAHASA MELAYU',BI:'BAHASA INGGERIS',MT:'MATEMATIK',SN:'SAINS',PI:'PENDIDIKAN ISLAM',PM:'PENDIDIKAN MORAL',BA:'BAHASA ARAB',SEJ:'SEJARAH',RBT:'REKA BENTUK DAN TEKNOLOGI',PJPK:'PENDIDIKAN JASMANI DAN PENDIDIKAN KESIHATAN',MZ:'PENDIDIKAN MUZIK',PSV:'PENDIDIKAN SENI VISUAL'};
export const CORE=['BM','BI','MT','SN'];
export const clean=v=>String(v??'').trim().replace(/\s+/g,' ');
export function subjectCode(v){const s=clean(v).toUpperCase();const alias={'SAINS':'SN','MATEMATIK':'MT','MUZIK':'MZ','PMZ':'MZ','PENDIDIKAN JASMANI':'PJPK','PENDIDIKAN KESIHATAN':'PJPK','REKA BENTUK TEKNOLOGI':'RBT','PENDIDIKAN SENI':'PSV'};return SUBJECTS[s]?s:alias[s]||Object.keys(SUBJECTS).find(k=>SUBJECTS[k]===s)||s;}
export function yearNumber(v){const s=clean(v).toUpperCase();return Number(s.match(/[1-6]/)?.[0]||({'SATU':1,'DUA':2,'TIGA':3,'EMPAT':4,'LIMA':5,'ENAM':6}[s.replace(/^TAHUN\s*/, '')])||0);}
export const grade=m=>m>=82?'A':m>=66?'B':m>=50?'C':m>=35?'D':m>=20?'E':'F';
export async function hashId(id){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(id))))].map(x=>x.toString(16).padStart(2,'0')).join('');}
export const recordKey=r=>[r.session,r.assessment,r.studentKey,r.subject].join('|');
export function validateRecords(rows){const seen=new Map();const errors=[];for(const [i,r]of rows.entries()){if(!/^20\d{2}$/.test(String(r.session))||!r.assessment||!r.studentKey||!r.name||!r.className||!r.subject||!(r.year>=1&&r.year<=6)) errors.push(`Baris ${i+1}: identiti/sesi/kelas tidak lengkap.`);if(r.type==='TP'&&!/^TP[1-6]$/.test(r.tp||'')&&r.status!=='TD')errors.push(`Baris ${i+1}: TP tidak sah.`);if(r.type==='MARKAH'&&r.mark!==null&&(!Number.isFinite(r.mark)||r.mark<0||r.mark>100))errors.push(`Baris ${i+1}: markah di luar 0–100.`);const k=recordKey(r);if(seen.has(k)){const a=seen.get(k);errors.push(`Rekod berganda ${r.className} / ${r.subject}${a.mark!==r.mark||a.tp!==r.tp?' dengan keputusan berlainan':''}.`);}else seen.set(k,r);}return errors;}
export async function parseJson(input,assessment,session){if(!Array.isArray(input.classes))throw Error('Format JSON tidak dikenali: senarai classes diperlukan.');const rows=[];for(const c of input.classes){for(const s of c.students||[]){if(typeof s.id!=='string'||!s.id.trim())throw Error('ID murid perlu teks dan tidak boleh kosong.');const studentKey=await hashId(s.id.trim());for(const [subject,v]of Object.entries(s.subjects||{})){const isTp=assessment.type==='TP';const raw=isTp?null:v.uasaMark;const mark=raw===null||raw===undefined||raw===''?null:Number(raw);rows.push({session:String(session),assessment:assessment.id,type:assessment.type,year:yearNumber(c.yearLabel),className:clean(c.name).toUpperCase(),studentKey,name:clean(s.name),gender:clean(s.gender),subject:subjectCode(subject),mark,tp:isTp?clean(v.tp).toUpperCase():null,grade:!isTp&&mark!==null?(clean(v.uasaGrade)||grade(mark)):null,status:isTp?(/^TP[1-6]$/.test(v.tp)?'OK':'TD'):(mark===null?'TD':'OK'),effort:clean(v.effort),comment:clean(v.teacherComment),statement:clean(v.pbdStatement),source:assessment.name});}}}return rows;}
export function mergeRows(oldRows,newRows){const m=new Map(oldRows.map(r=>[recordKey(r),r]));for(const r of newRows)m.set(recordKey(r),r);return [...m.values()];}
export function subjectMatches(code,scope=''){return Array.isArray(scope)?scope.includes(code):!scope||code===scope;}
export function selectRows(rows,f){return rows.filter(r=>(!f.session||String(r.session)===String(f.session))&&(!f.year||r.year===Number(f.year))&&(!f.className||r.className===f.className)&&subjectMatches(r.subject,f.subjects??f.subject));}
export function compareGrades(a,b){return [0,1,2,3,4,5].reduce((cmp,i)=>cmp||(b.gradeCounts?.[i]||0)-(a.gradeCounts?.[i]||0),0)||b.total-a.total;}
function singleViewData(rows,f){const base=selectRows(rows,{...f,subject:'',subjects:null});const people=new Map();const mode=f.assessment||'COMBINED';for(const r of base){if(!people.has(r.studentKey))people.set(r.studentKey,{key:r.studentKey,name:r.name,year:r.year,className:r.className,gender:r.gender,marks:{},pbd:{},records:[]});people.get(r.studentKey).records.push(r);}let list=[];for(const p of people.values()){for(const r of p.records){if(mode==='COMBINED'){if(r.assessment==='UASA'&&!(p.year===4&&CORE.includes(r.subject)))p.marks[r.subject]=r;if(p.year===4&&r.assessment==='MPT4'&&CORE.includes(r.subject))p.marks[r.subject]=r;if(r.assessment==='PBD_END')p.pbd[r.subject]=r;}else{if(r.assessment===mode){if(r.type==='TP')p.pbd[r.subject]=r;else p.marks[r.subject]=r;}}}if(mode==='COMBINED'&&p.year===4){for(const sub of CORE)if(!p.marks[sub])p.marks[sub]={subject:sub,mark:null,status:'BELUM IMPORT MPT4',source:'MPT4'};}const scope=f.subjects??(f.subject?[f.subject]:null);if(Array.isArray(scope)){const hadMarks=Object.keys(p.marks).length>0;p.marks=Object.fromEntries(Object.entries(p.marks).filter(([s])=>scope.includes(s)));p.pbd=Object.fromEntries(Object.entries(p.pbd).filter(([s])=>scope.includes(s)));if(hadMarks&&Object.keys(p.marks).length)for(const sub of scope)if(!p.marks[sub])p.marks[sub]={subject:sub,mark:null,status:'TD'};}if(Array.isArray(f.subjects)?!f.subjects.some(s=>p.marks[s]||p.pbd[s]):f.subject&&!p.marks[f.subject]&&!p.pbd[f.subject])continue;const marks=Object.values(p.marks);if(!marks.length&&!Object.keys(p.pbd).length)continue;p.subjectSet=marks.map(r=>r.subject).sort().join('|');p.complete=marks.length>0&&marks.every(r=>r.mark!==null&&r.status==='OK');p.count=marks.filter(r=>r.mark!==null&&r.status==='OK').length;p.total=marks.reduce((a,r)=>a+(r.status==='OK'&&r.mark!==null?r.mark:0),0);p.average=p.count?p.total/p.count:null;p.aCount=marks.filter(r=>r.status==='OK'&&r.grade==='A').length;p.gradeCounts=['A','B','C','D','E','F'].map(g=>marks.filter(r=>r.grade===g&&r.status==='OK').length);list.push(p);}
 const comparator=f.sort==='name'?((a,b)=>a.name.localeCompare(b.name,'ms')):f.sort==='subject'?((a,b)=>(b.marks[f.subject]?.mark??-1)-(a.marks[f.subject]?.mark??-1)):f.sort==='total'?((a,b)=>b.total-a.total):((a,b)=>compareGrades(a,b));
 const cohorts=new Map();for(const p of list){const k=`${p.year}|${p.subjectSet}`;if(!cohorts.has(k))cohorts.set(k,[]);cohorts.get(k).push(p);}for(const group of cohorts.values()){const eligible=group.filter(p=>p.complete).sort((a,b)=>compareGrades(a,b));eligible.forEach((p,i)=>p.rank=i&&compareGrades(p,eligible[i-1])===0?eligible[i-1].rank:i+1);}
 if(f.subject){const groups=new Map();for(const p of list){if(!groups.has(p.year))groups.set(p.year,[]);groups.get(p.year).push(p);}for(const ps of groups.values()){const eligible=ps.filter(p=>p.marks[f.subject]?.status==='OK'&&p.marks[f.subject]?.mark!==null).sort((a,b)=>b.marks[f.subject].mark-a.marks[f.subject].mark);eligible.forEach((p,i)=>p.subjectRank=i&&p.marks[f.subject].mark===eligible[i-1].marks[f.subject].mark?eligible[i-1].subjectRank:i+1);}}list.sort((a,b)=>f.sort==='name'||f.sort==='subject'?comparator(a,b):(Number(b.complete)-Number(a.complete)||comparator(a,b)||a.name.localeCompare(b.name,'ms')));return list;}
export function csvCell(v){let s=String(v??'');if(/^[=+@\-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
export function exportCsv(people,subjects,mode='COMBINED',rankField='rank'){if(people.length&&people.every(p=>p.corePbd))return corePbdCsv(people);const headers=['Kedudukan','Nama','Tahun','Kelas','Pentaksiran',...subjects,'Bil A','Jumlah','Bil ditaksir','Purata'];const out=[headers];for(const original of people){for(const p of original.assessmentViews||[original]){const rowMode=p.id||mode;if(Object.keys(p.marks).length)out.push([p[rankField]||'',p.name,p.year,p.className,rowMode,...subjects.map(s=>p.marks[s]?.status==='OK'?`${p.marks[s].mark} ${p.marks[s].grade}`:p.marks[s]?.status||''),p.aCount,p.total,p.count,p.average?.toFixed(2)||'']);if(Object.keys(p.pbd).length)out.push(['',p.name,p.year,p.className,rowMode==='COMBINED'?'PBD Akhir':rowMode,...subjects.map(s=>p.pbd[s]?.tp||''),'','','','']);}}return '\ufeff'+out.map(r=>r.map(csvCell).join(',')).join('\r\n');}

function assessmentViewData(rows,f){
 if(!Array.isArray(f.assessments))return singleViewData(rows,f);
 const ids=[...new Set(f.assessments)];if(!ids.length)return [];
 const views=ids.map(id=>({id,list:singleViewData(rows,{...f,assessment:id})}));
 const primary=ids.includes('COMBINED')?'COMBINED':ids.includes('UASA')?'UASA':ids.includes('MPT4')?'MPT4':ids.includes('PBD_END')?'PBD_END':ids[0];
 const union=new Map();
 for(const {id,list} of views)for(const p of list){if(!union.has(p.key))union.set(p.key,{...p,assessmentViews:[]});union.get(p.key).assessmentViews.push({id,...p});}
 for(const p of union.values()){const selected=p.assessmentViews.find(v=>v.id===primary)||p.assessmentViews[0];const parts=p.assessmentViews;Object.assign(p,selected,{assessmentViews:parts});const latest=parts.find(v=>v.id==='PBD_END')||parts.find(v=>v.id==='COMBINED')||parts.find(v=>v.id==='PBD_MID');if(latest)p.pbd=latest.pbd;}
 return [...union.values()].sort((a,b)=>f.sort==='name'?a.name.localeCompare(b.name,'ms'):f.sort==='subject'?(b.marks[f.subject]?.mark??-1)-(a.marks[f.subject]?.mark??-1):Number(b.complete)-Number(a.complete)||(f.sort==='total'?b.total-a.total:compareGrades(a,b))||a.name.localeCompare(b.name,'ms'));
}

export function pbdSummary(p,subject=''){
 const records=Object.values(p.pbd).filter(r=>subjectMatches(r.subject,subject));
 const counts=[6,5,4,3,2,1].map(n=>records.filter(r=>r.tp==='TP'+n).length);
 return {counts,assessed:counts.reduce((a,b)=>a+b,0),subjects:records.map(r=>r.subject).sort().join('|')};
}
export const PBD_CORE=['BM','BI','MT','SN','PI'];
export function corePbdMode(rows,f){
 const year=Number(f.year),ids=f.assessments||[f.assessment||'COMBINED'];
 return year>=1&&year<=3&&ids.length>0&&ids.every(id=>['PBD_MID','PBD_END','COMBINED'].includes(id))&&!rows.some(r=>String(r.session)===String(f.session)&&r.year===year&&['UASA','MPT4'].includes(r.assessment)&&r.status==='OK'&&Number.isFinite(r.mark));
}
export function corePbdSummary(data){
 const values=PBD_CORE.map(s=>/^TP[1-6]$/.test(data[s]?.tp||'')&&(!data[s].status||data[s].status==='OK')?Number(data[s].tp.slice(2)):null);
 const missing=PBD_CORE.filter((s,i)=>values[i]===null),complete=missing.length===0,total=values.reduce((n,v)=>n+(v||0),0),minimum=complete?Math.min(...values):null;
 const counts=[6,5,4,3,2,1].map(n=>values.filter(v=>v===n).length);
 const category=!complete?'Semakan Manual':minimum>=5?'Cemerlang':minimum>=3?'Sederhana':'Lemah';
 const reason=!complete?'Semakan Manual: '+missing.join(', ')+' tiada TP sah / belum ditaksir.':(minimum>=4?'Kumpulan utama: semua 5 subjek sekurang-kurangnya TP4. ':'Ada TP3 atau ke bawah: selepas kumpulan semua subjek TP4 ke atas. ')+`TP6: ${counts[0]}, TP5: ${counts[1]}, TP4: ${counts[2]}; jumlah TP: ${total}.`;
 return {values,missing,complete,total,minimum,counts,category,reason,rule:'tp4-gate@1',vector:[complete&&minimum>=4?1:0,counts[0],counts[1],counts[2],total]};
}
export const compareCorePbd=(a,b)=>Number(b.corePbd.complete)-Number(a.corePbd.complete)||a.corePbd.vector.reduce((cmp,n,i)=>cmp||b.corePbd.vector[i]-n,0);
function rankCorePbd(list){
 const groups=new Map();for(const p of list){delete p.corePbdRank;if(!groups.has(p.year))groups.set(p.year,[]);groups.get(p.year).push(p);}
 for(const group of groups.values()){const eligible=group.filter(p=>p.corePbd.complete).sort(compareCorePbd);eligible.forEach((p,i)=>p.corePbdRank=i&&compareCorePbd(p,eligible[i-1])===0?eligible[i-1].corePbdRank:i+1);}
}
export function corePbdCsv(people){
 const out=[['Kedudukan','Nama murid','Tahun','Kelas','Pentaksiran',...PBD_CORE,'Jumlah TP','Justifikasi kedudukan']];
 for(const p of people)out.push([p.corePbdRank||'',p.name,p.year,p.className,p.pbdBasis,...p.corePbd.values.map(n=>n?'TP'+n:'T / TD'),p.corePbd.complete?p.corePbd.total:'',p.corePbd.reason]);
 return '\ufeff'+out.map(row=>row.map(csvCell).join(',')).join('\r\n');
}
export function viewData(rows,f){
 const coreMode=corePbdMode(rows,f);
 let list=assessmentViewData(rows,coreMode?{...f,subjects:null,subject:''}:f);
 if(coreMode){const seen=new Set(list.map(p=>p.key));const source=selectRows(rows,{...f,subjects:null,subject:''});for(const r of source)if(!seen.has(r.studentKey)){seen.add(r.studentKey);list.push({key:r.studentKey,name:r.name,year:r.year,className:r.className,marks:{},pbd:{},records:source.filter(x=>x.studentKey===r.studentKey),assessmentViews:[]});}}
 const ids=f.assessments||[f.assessment||'COMBINED'];
 const basis=ids.includes('PBD_END')||ids.includes('COMBINED')?'PBD_END':ids.includes('PBD_MID')?'PBD_MID':null;
 for(const p of list){
  p.pbdBasis=basis;
  const selected=(p.assessmentViews||[]).find(v=>v.id===basis||basis==='PBD_END'&&v.id==='COMBINED');
  const data=p.assessmentViews?(selected?.pbd||{}):p.pbd;
  if(coreMode)p.corePbd=corePbdSummary(data);
  p.pbdSummary=pbdSummary({pbd:data},f.subjects??f.subject);
  p.pbdFilterRecords=Object.values(data).filter(r=>subjectMatches(r.subject,f.subjects??f.subject));
 }
 if(coreMode){rankCorePbd(list);list.sort((a,b)=>f.sort==='name'?a.name.localeCompare(b.name,'ms'):a.year-b.year||compareCorePbd(a,b)||a.name.localeCompare(b.name,'ms'));}
 if(f.tp)list=list.filter(p=>p.pbdFilterRecords.some(r=>r.tp===f.tp));
 if(f.sort==='pbd'&&!coreMode)list.sort((a,b)=>a.year-b.year||a.pbdSummary.subjects.localeCompare(b.pbdSummary.subjects)||a.pbdSummary.counts.reduce((cmp,n,i)=>cmp||b.pbdSummary.counts[i]-n,0)||a.name.localeCompare(b.name,'ms'));
 return list;
}

// Chart counts and drill-down share exactly the same student filters.
export function chartPbdRecords(p,subject=''){
 return (p.pbdFilterRecords||Object.values(p.pbd)).filter(r=>subjectMatches(r.subject,subject)&&/^TP[1-6]$/.test(r.tp));
}
export function tpMembers(people,tp,subject=''){
 return people.filter(p=>chartPbdRecords(p,subject).some(r=>r.tp===tp));
}
export function outcomeMembers(people,subject,kind,threshold=35){
 return people.filter(p=>{const r=p.marks[subject];if(!r)return false;const valid=r.status==='OK'&&Number.isFinite(r.mark);return kind==='unknown'?!valid:valid&&(kind==='low'?r.mark<threshold:r.mark>=threshold);});
}

export function dashboardStats(people,subject='',threshold=35){
 const marks=people.flatMap(p=>Object.values(p.marks).filter(r=>subjectMatches(r.subject,subject)&&r.status==='OK'&&Number.isFinite(r.mark)));
 const tp=people.flatMap(p=>chartPbdRecords(p,subject));
 const pbdAssessed=people.filter(p=>chartPbdRecords(p,subject).length);
 const pbdLow=people.filter(p=>chartPbdRecords(p,subject).some(r=>/^TP[12]$/.test(r.tp)));
 const markLow=people.filter(p=>Object.values(p.marks).some(r=>subjectMatches(r.subject,subject)&&r.status==='OK'&&Number.isFinite(r.mark)&&r.mark<threshold));
 const markUnknown=people.filter(p=>{const rows=Object.values(p.marks).filter(r=>subjectMatches(r.subject,subject));return !rows.length||rows.some(r=>r.status!=='OK'||!Number.isFinite(r.mark));});
 return {marks,tp,pbdAssessed,pbdLow,markLow,markUnknown,avg:marks.length?marks.reduce((n,r)=>n+r.mark,0)/marks.length:null,mastery:tp.length?100*tp.filter(r=>Number(r.tp.slice(2))>=3).length/tp.length:null};
}
export function subjectSummary(people,subjects){
 return subjects.map(subject=>{const marks=people.map(p=>p.marks[subject]).filter(r=>r?.status==='OK'&&Number.isFinite(r.mark));const tp=people.flatMap(p=>chartPbdRecords(p,subject));return {subject,marks:marks.length,average:marks.length?marks.reduce((n,r)=>n+r.mark,0)/marks.length:null,grades:['A','B','C','D','E','F'].map(g=>marks.filter(r=>r.grade===g).length),tp: [1,2,3,4,5,6].map(n=>tp.filter(r=>r.tp==='TP'+n).length)};});
}
export function summaryCsv(people,subjects,kind='pbd'){
 const rows=subjectSummary(people,subjects);const out=[kind==='marks'?['Subjek','Bil. ditaksir','Purata','A','B','C','D','E','F']:['Subjek','Bil. ditaksir','TP1','TP2','TP3','TP4','TP5','TP6']];for(const r of rows)out.push(kind==='marks'?[r.subject,r.marks,r.average?.toFixed(2)??'',...r.grades]:[r.subject,r.tp.reduce((a,b)=>a+b,0),...r.tp]);return '\ufeff'+out.map(r=>r.map(csvCell).join(',')).join('\r\n');
}
ew Map();const errors=[];for(const [i,r]of rows.entries()){if(!/^20\d{2}$/.test(String(r.session))||!r.assessment||!r.studentKey||!r.name||!r.className||!r.subject||!(r.year>=1&&r.year<=6)) errors.push(`Baris ${i+1}: identiti/sesi/kelas tidak lengkap.`);if(r.type==='TP'&&!/^TP[1-6]$/.test(r.tp||'')&&r.status!=='TD')errors.push(`Baris ${i+1}: TP tidak sah.`);if(r.type==='MARKAH'&&r.mark!==null&&(!Number.isFinite(r.mark)||r.mark<0||r.mark>100))errors.push(`Baris ${i+1}: markah di luar 0–100.`);const k=recordKey(r);if(seen.has(k)){const a=seen.get(k);errors.push(`Rekod berganda ${r.className} / ${r.subject}${a.mark!==r.mark||a.tp!==r.tp?' dengan keputusan berlainan':''}.`);}else seen.set(k,r);}return errors;}
export async function parseJson(input,assessment,session){if(!Array.isArray(input.classes))throw Error('Format JSON tidak dikenali: senarai classes diperlukan.');const rows=[];for(const c of input.classes){for(const s of c.students||[]){if(typeof s.id!=='string'||!s.id.trim())throw Error('ID murid perlu teks dan tidak boleh kosong.');const studentKey=await hashId(s.id.trim());for(const [subject,v]of Object.entries(s.subjects||{})){const isTp=assessment.type==='TP';const raw=isTp?null:v.uasaMark;const mark=raw===null||raw===undefined||raw===''?null:Number(raw);rows.push({session:String(session),assessment:assessment.id,type:assessment.type,year:yearNumber(c.yearLabel),className:clean(c.name).toUpperCase(),studentKey,name:clean(s.name),gender:clean(s.gender),subject:subjectCode(subject),mark,tp:isTp?clean(v.tp).toUpperCase():null,grade:!isTp&&mark!==null?(clean(v.uasaGrade)||grade(mark)):null,status:isTp?(/^TP[1-6]$/.test(v.tp)?'OK':'TD'):(mark===null?'TD':'OK'),effort:clean(v.effort),comment:clean(v.teacherComment),statement:clean(v.pbdStatement),source:assessment.name});}}}return rows;}
export function mergeRows(oldRows,newRows){const m=new Map(oldRows.map(r=>[recordKey(r),r]));for(const r of newRows)m.set(recordKey(r),r);return [...m.values()];}
export function subjectMatches(code,scope=''){return Array.isArray(scope)?scope.includes(code):!scope||code===scope;}
export function selectRows(rows,f){return rows.filter(r=>(!f.session||String(r.session)===String(f.session))&&(!f.year||r.year===Number(f.year))&&(!f.className||r.className===f.className)&&subjectMatches(r.subject,f.subjects??f.subject));}
export function compareGrades(a,b){return [0,1,2,3,4,5].reduce((cmp,i)=>cmp||(b.gradeCounts?.[i]||0)-(a.gradeCounts?.[i]||0),0)||b.total-a.total;}
function singleViewData(rows,f){const base=selectRows(rows,{...f,subject:'',subjects:null});const people=new Map();const mode=f.assessment||'COMBINED';for(const r of base){if(!people.has(r.studentKey))people.set(r.studentKey,{key:r.studentKey,name:r.name,year:r.year,className:r.className,gender:r.gender,marks:{},pbd:{},records:[]});people.get(r.studentKey).records.push(r);}let list=[];for(const p of people.values()){for(const r of p.records){if(mode==='COMBINED'){if(r.assessment==='UASA'&&!(p.year===4&&CORE.includes(r.subject)))p.marks[r.subject]=r;if(p.year===4&&r.assessment==='MPT4'&&CORE.includes(r.subject))p.marks[r.subject]=r;if(r.assessment==='PBD_END')p.pbd[r.subject]=r;}else{if(r.assessment===mode){if(r.type==='TP')p.pbd[r.subject]=r;else p.marks[r.subject]=r;}}}if(mode==='COMBINED'&&p.year===4){for(const sub of CORE)if(!p.marks[sub])p.marks[sub]={subject:sub,mark:null,status:'BELUM IMPORT MPT4',source:'MPT4'};}const scope=f.subjects??(f.subject?[f.subject]:null);if(Array.isArray(scope)){const hadMarks=Object.keys(p.marks).length>0;p.marks=Object.fromEntries(Object.entries(p.marks).filter(([s])=>scope.includes(s)));p.pbd=Object.fromEntries(Object.entries(p.pbd).filter(([s])=>scope.includes(s)));if(hadMarks&&Object.keys(p.marks).length)for(const sub of scope)if(!p.marks[sub])p.marks[sub]={subject:sub,mark:null,status:'TD'};}if(Array.isArray(f.subjects)?!f.subjects.some(s=>p.marks[s]||p.pbd[s]):f.subject&&!p.marks[f.subject]&&!p.pbd[f.subject])continue;const marks=Object.values(p.marks);if(!marks.length&&!Object.keys(p.pbd).length)continue;p.subjectSet=marks.map(r=>r.subject).sort().join('|');p.complete=marks.length>0&&marks.every(r=>r.mark!==null&&r.status==='OK');p.count=marks.filter(r=>r.mark!==null&&r.status==='OK').length;p.total=marks.reduce((a,r)=>a+(r.status==='OK'&&r.mark!==null?r.mark:0),0);p.average=p.count?p.total/p.count:null;p.aCount=marks.filter(r=>r.status==='OK'&&r.grade==='A').length;p.gradeCounts=['A','B','C','D','E','F'].map(g=>marks.filter(r=>r.grade===g&&r.status==='OK').length);list.push(p);}
 const comparator=f.sort==='name'?((a,b)=>a.name.localeCompare(b.name,'ms')):f.sort==='subject'?((a,b)=>(b.marks[f.subject]?.mark??-1)-(a.marks[f.subject]?.mark??-1)):f.sort==='total'?((a,b)=>b.total-a.total):((a,b)=>compareGrades(a,b));
 const cohorts=new Map();for(const p of list){const k=`${p.year}|${p.subjectSet}`;if(!cohorts.has(k))cohorts.set(k,[]);cohorts.get(k).push(p);}for(const group of cohorts.values()){const eligible=group.filter(p=>p.complete).sort((a,b)=>compareGrades(a,b));eligible.forEach((p,i)=>p.rank=i&&compareGrades(p,eligible[i-1])===0?eligible[i-1].rank:i+1);}
 if(f.subject){const groups=new Map();for(const p of list){if(!groups.has(p.year))groups.set(p.year,[]);groups.get(p.year).push(p);}for(const ps of groups.values()){const eligible=ps.filter(p=>p.marks[f.subject]?.status==='OK'&&p.marks[f.subject]?.mark!==null).sort((a,b)=>b.marks[f.subject].mark-a.marks[f.subject].mark);eligible.forEach((p,i)=>p.subjectRank=i&&p.marks[f.subject].mark===eligible[i-1].marks[f.subject].mark?eligible[i-1].subjectRank:i+1);}}list.sort((a,b)=>f.sort==='name'||f.sort==='subject'?comparator(a,b):(Number(b.complete)-Number(a.complete)||comparator(a,b)||a.name.localeCompare(b.name,'ms')));return list;}
export function csvCell(v){let s=String(v??'');if(/^[=+@\-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
export function exportCsv(people,subjects,mode='COMBINED',rankField='rank'){if(people.length&&people.every(p=>p.corePbd))return corePbdCsv(people);const headers=['Kedudukan','Nama','Tahun','Kelas','Pentaksiran',...subjects,'Bil A','Jumlah','Bil ditaksir','Purata'];const out=[headers];for(const original of people){for(const p of original.assessmentViews||[original]){const rowMode=p.id||mode;if(Object.keys(p.marks).length)out.push([p[rankField]||'',p.name,p.year,p.className,rowMode,...subjects.map(s=>p.marks[s]?.status==='OK'?`${p.marks[s].mark} ${p.marks[s].grade}`:p.marks[s]?.status||''),p.aCount,p.total,p.count,p.average?.toFixed(2)||'']);if(Object.keys(p.pbd).length)out.push(['',p.name,p.year,p.className,rowMode==='COMBINED'?'PBD Akhir':rowMode,...subjects.map(s=>p.pbd[s]?.tp||''),'','','','']);}}return '\ufeff'+out.map(r=>r.map(csvCell).join(',')).join('\r\n');}

function assessmentViewData(rows,f){
 if(!Array.isArray(f.assessments))return singleViewData(rows,f);
 const ids=[...new Set(f.assessments)];if(!ids.length)return [];
 const views=ids.map(id=>({id,list:singleViewData(rows,{...f,assessment:id})}));
 const primary=ids.includes('COMBINED')?'COMBINED':ids.includes('UASA')?'UASA':ids.includes('MPT4')?'MPT4':ids.includes('PBD_END')?'PBD_END':ids[0];
 const union=new Map();
 for(const {id,list} of views)for(const p of list){if(!union.has(p.key))union.set(p.key,{...p,assessmentViews:[]});union.get(p.key).assessmentViews.push({id,...p});}
 for(const p of union.values()){const selected=p.assessmentViews.find(v=>v.id===primary)||p.assessmentViews[0];const parts=p.assessmentViews;Object.assign(p,selected,{assessmentViews:parts});const latest=parts.find(v=>v.id==='PBD_END')||parts.find(v=>v.id==='COMBINED')||parts.find(v=>v.id==='PBD_MID');if(latest)p.pbd=latest.pbd;}
 return [...union.values()].sort((a,b)=>f.sort==='name'?a.name.localeCompare(b.name,'ms'):f.sort==='subject'?(b.marks[f.subject]?.mark??-1)-(a.marks[f.subject]?.mark??-1):Number(b.complete)-Number(a.complete)||(f.sort==='total'?b.total-a.total:compareGrades(a,b))||a.name.localeCompare(b.name,'ms'));
}

export function pbdSummary(p,subject=''){
 const records=Object.values(p.pbd).filter(r=>subjectMatches(r.subject,subject));
 const counts=[6,5,4,3,2,1].map(n=>records.filter(r=>r.tp==='TP'+n).length);
 return {counts,assessed:counts.reduce((a,b)=>a+b,0),subjects:records.map(r=>r.subject).sort().join('|')};
}
export const PBD_CORE=['BM','BI','MT','SN','PI'];
export function corePbdMode(rows,f){
 const year=Number(f.year),ids=f.assessments||[f.assessment||'COMBINED'];
 return year>=1&&year<=3&&ids.length>0&&ids.every(id=>['PBD_MID','PBD_END','COMBINED'].includes(id))&&!rows.some(r=>String(r.session)===String(f.session)&&r.year===year&&['UASA','MPT4'].includes(r.assessment)&&r.status==='OK'&&Number.isFinite(r.mark));
}
export function corePbdSummary(data){
 const values=PBD_CORE.map(s=>/^TP[1-6]$/.test(data[s]?.tp||'')&&(!data[s].status||data[s].status==='OK')?Number(data[s].tp.slice(2)):null);
 const missing=PBD_CORE.filter((s,i)=>values[i]===null),complete=missing.length===0,total=values.reduce((n,v)=>n+(v||0),0),minimum=complete?Math.min(...values):null;
 const counts=[6,5,4,3,2,1].map(n=>values.filter(v=>v===n).length);
 const category=!complete?'Semakan Manual':minimum>=5?'Cemerlang':minimum>=3?'Sederhana':'Lemah';
 const reason=!complete?'Semakan Manual: '+missing.join(', ')+' tiada TP sah / belum ditaksir.':`TP terendah: TP${minimum} · ${category}. `+(minimum>=4?'Semua 5 subjek sekurang-kurangnya TP4. ':'Ada subjek TP3 atau ke bawah. ')+`TP6: ${counts[0]}, TP5: ${counts[1]}, TP4: ${counts[2]}; jumlah TP: ${total}.`;
 return {values,missing,complete,total,minimum,counts,category,reason,vector:[minimum||0,counts[0],counts[1],counts[2],total]};
}
export const compareCorePbd=(a,b)=>Number(b.corePbd.complete)-Number(a.corePbd.complete)||a.corePbd.vector.reduce((cmp,n,i)=>cmp||b.corePbd.vector[i]-n,0);
function rankCorePbd(list){
 const groups=new Map();for(const p of list){delete p.corePbdRank;if(!groups.has(p.year))groups.set(p.year,[]);groups.get(p.year).push(p);}
 for(const group of groups.values()){const eligible=group.filter(p=>p.corePbd.complete).sort(compareCorePbd);eligible.forEach((p,i)=>p.corePbdRank=i&&compareCorePbd(p,eligible[i-1])===0?eligible[i-1].corePbdRank:i+1);}
}
export function corePbdCsv(people){
 const out=[['Kedudukan','Nama murid','Tahun','Kelas','Pentaksiran',...PBD_CORE,'Jumlah TP','Justifikasi kedudukan']];
 for(const p of people)out.push([p.corePbdRank||'',p.name,p.year,p.className,p.pbdBasis,...p.corePbd.values.map(n=>n?'TP'+n:'T / TD'),p.corePbd.complete?p.corePbd.total:'',p.corePbd.reason]);
 return '\ufeff'+out.map(row=>row.map(csvCell).join(',')).join('\r\n');
}
export function viewData(rows,f){
 const coreMode=corePbdMode(rows,f);
 let list=assessmentViewData(rows,coreMode?{...f,subjects:null,subject:''}:f);
 if(coreMode){const seen=new Set(list.map(p=>p.key));const source=selectRows(rows,{...f,subjects:null,subject:''});for(const r of source)if(!seen.has(r.studentKey)){seen.add(r.studentKey);list.push({key:r.studentKey,name:r.name,year:r.year,className:r.className,marks:{},pbd:{},records:source.filter(x=>x.studentKey===r.studentKey),assessmentViews:[]});}}
 const ids=f.assessments||[f.assessment||'COMBINED'];
 const basis=ids.includes('PBD_END')||ids.includes('COMBINED')?'PBD_END':ids.includes('PBD_MID')?'PBD_MID':null;
 for(const p of list){
  p.pbdBasis=basis;
  const selected=(p.assessmentViews||[]).find(v=>v.id===basis||basis==='PBD_END'&&v.id==='COMBINED');
  const data=p.assessmentViews?(selected?.pbd||{}):p.pbd;
  if(coreMode)p.corePbd=corePbdSummary(data);
  p.pbdSummary=pbdSummary({pbd:data},f.subjects??f.subject);
  p.pbdFilterRecords=Object.values(data).filter(r=>subjectMatches(r.subject,f.subjects??f.subject));
 }
 if(coreMode){rankCorePbd(list);list.sort((a,b)=>f.sort==='name'?a.name.localeCompare(b.name,'ms'):a.year-b.year||compareCorePbd(a,b)||a.name.localeCompare(b.name,'ms'));}
 if(f.tp)list=list.filter(p=>p.pbdFilterRecords.some(r=>r.tp===f.tp));
 if(f.sort==='pbd'&&!coreMode)list.sort((a,b)=>a.year-b.year||a.pbdSummary.subjects.localeCompare(b.pbdSummary.subjects)||a.pbdSummary.counts.reduce((cmp,n,i)=>cmp||b.pbdSummary.counts[i]-n,0)||a.name.localeCompare(b.name,'ms'));
 return list;
}

// Chart counts and drill-down share exactly the same student filters.
export function chartPbdRecords(p,subject=''){
 return (p.pbdFilterRecords||Object.values(p.pbd)).filter(r=>subjectMatches(r.subject,subject)&&/^TP[1-6]$/.test(r.tp));
}
export function tpMembers(people,tp,subject=''){
 return people.filter(p=>chartPbdRecords(p,subject).some(r=>r.tp===tp));
}
export function outcomeMembers(people,subject,kind,threshold=35){
 return people.filter(p=>{const r=p.marks[subject];if(!r)return false;const valid=r.status==='OK'&&Number.isFinite(r.mark);return kind==='unknown'?!valid:valid&&(kind==='low'?r.mark<threshold:r.mark>=threshold);});
}

export function dashboardStats(people,subject='',threshold=35){
 const marks=people.flatMap(p=>Object.values(p.marks).filter(r=>subjectMatches(r.subject,subject)&&r.status==='OK'&&Number.isFinite(r.mark)));
 const tp=people.flatMap(p=>chartPbdRecords(p,subject));
 const pbdAssessed=people.filter(p=>chartPbdRecords(p,subject).length);
 const pbdLow=people.filter(p=>chartPbdRecords(p,subject).some(r=>/^TP[12]$/.test(r.tp)));
 const markLow=people.filter(p=>Object.values(p.marks).some(r=>subjectMatches(r.subject,subject)&&r.status==='OK'&&Number.isFinite(r.mark)&&r.mark<threshold));
 const markUnknown=people.filter(p=>{const rows=Object.values(p.marks).filter(r=>subjectMatches(r.subject,subject));return !rows.length||rows.some(r=>r.status!=='OK'||!Number.isFinite(r.mark));});
 return {marks,tp,pbdAssessed,pbdLow,markLow,markUnknown,avg:marks.length?marks.reduce((n,r)=>n+r.mark,0)/marks.length:null,mastery:tp.length?100*tp.filter(r=>Number(r.tp.slice(2))>=3).length/tp.length:null};
}
export function subjectSummary(people,subjects){
 return subjects.map(subject=>{const marks=people.map(p=>p.marks[subject]).filter(r=>r?.status==='OK'&&Number.isFinite(r.mark));const tp=people.flatMap(p=>chartPbdRecords(p,subject));return {subject,marks:marks.length,average:marks.length?marks.reduce((n,r)=>n+r.mark,0)/marks.length:null,grades:['A','B','C','D','E','F'].map(g=>marks.filter(r=>r.grade===g).length),tp: [1,2,3,4,5,6].map(n=>tp.filter(r=>r.tp==='TP'+n).length)};});
}
export function summaryCsv(people,subjects,kind='pbd'){
 const rows=subjectSummary(people,subjects);const out=[kind==='marks'?['Subjek','Bil. ditaksir','Purata','A','B','C','D','E','F']:['Subjek','Bil. ditaksir','TP1','TP2','TP3','TP4','TP5','TP6']];for(const r of rows)out.push(kind==='marks'?[r.subject,r.marks,r.average?.toFixed(2)??'',...r.grades]:[r.subject,r.tp.reduce((a,b)=>a+b,0),...r.tp]);return '\ufeff'+out.map(r=>r.map(csvCell).join(',')).join('\r\n');
}
