export const ASSESSMENTS=[{id:'PBD_MID',name:'PBD Pertengahan Tahun',type:'TP'},{id:'UASA',name:'UASA',type:'MARKAH'},{id:'PBD_END',name:'PBD Akhir Tahun',type:'TP'},{id:'MPT4',name:'MPT4',type:'MARKAH'}];
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
export function selectRows(rows,f){return rows.filter(r=>(!f.session||String(r.session)===String(f.session))&&(!f.year||r.year===Number(f.year))&&(!f.className||r.className===f.className)&&(!f.subject||r.subject===f.subject));}
function singleViewData(rows,f){const base=selectRows(rows,{...f,subject:''});const people=new Map();const mode=f.assessment||'COMBINED';for(const r of base){if(!people.has(r.studentKey))people.set(r.studentKey,{key:r.studentKey,name:r.name,year:r.year,className:r.className,gender:r.gender,marks:{},pbd:{},records:[]});people.get(r.studentKey).records.push(r);}let list=[];for(const p of people.values()){for(const r of p.records){if(mode==='COMBINED'){if(r.assessment==='UASA'&&!(p.year===4&&CORE.includes(r.subject)))p.marks[r.subject]=r;if(p.year===4&&r.assessment==='MPT4'&&CORE.includes(r.subject))p.marks[r.subject]=r;if(r.assessment==='PBD_END')p.pbd[r.subject]=r;}else{if(r.assessment===mode){if(r.type==='TP')p.pbd[r.subject]=r;else p.marks[r.subject]=r;}}}if(mode==='COMBINED'&&p.year===4){for(const sub of CORE)if(!p.marks[sub])p.marks[sub]={subject:sub,mark:null,status:'BELUM IMPORT MPT4',source:'MPT4'};}if(f.subject&&!p.marks[f.subject]&&!p.pbd[f.subject])continue;const marks=Object.values(p.marks);if(!marks.length&&!Object.keys(p.pbd).length)continue;p.subjectSet=marks.map(r=>r.subject).sort().join('|');p.complete=marks.length>0&&marks.every(r=>r.mark!==null&&r.status==='OK');p.count=marks.filter(r=>r.mark!==null&&r.status==='OK').length;p.total=marks.reduce((a,r)=>a+(r.status==='OK'&&r.mark!==null?r.mark:0),0);p.average=p.count?p.total/p.count:null;p.aCount=marks.filter(r=>r.status==='OK'&&r.grade==='A').length;p.gradeCounts=['A','B','C','D','E','F'].map(g=>marks.filter(r=>r.grade===g&&r.status==='OK').length);list.push(p);}
 const comparator=f.sort==='name'?((a,b)=>a.name.localeCompare(b.name,'ms')):f.sort==='subject'?((a,b)=>(b.marks[f.subject]?.mark??-1)-(a.marks[f.subject]?.mark??-1)):f.sort==='total'?((a,b)=>b.total-a.total):((a,b)=>b.aCount-a.aCount||b.total-a.total);
 const cohorts=new Map();for(const p of list){const k=`${p.year}|${p.subjectSet}`;if(!cohorts.has(k))cohorts.set(k,[]);cohorts.get(k).push(p);}for(const group of cohorts.values()){const eligible=group.filter(p=>p.complete).sort((a,b)=>b.aCount-a.aCount||b.total-a.total);eligible.forEach((p,i)=>p.rank=i&&p.aCount===eligible[i-1].aCount&&p.total===eligible[i-1].total?eligible[i-1].rank:i+1);}
 if(f.subject){const groups=new Map();for(const p of list){if(!groups.has(p.year))groups.set(p.year,[]);groups.get(p.year).push(p);}for(const ps of groups.values()){const eligible=ps.filter(p=>p.marks[f.subject]?.status==='OK'&&p.marks[f.subject]?.mark!==null).sort((a,b)=>b.marks[f.subject].mark-a.marks[f.subject].mark);eligible.forEach((p,i)=>p.subjectRank=i&&p.marks[f.subject].mark===eligible[i-1].marks[f.subject].mark?eligible[i-1].subjectRank:i+1);}}list.sort((a,b)=>f.sort==='name'||f.sort==='subject'?comparator(a,b):(Number(b.complete)-Number(a.complete)||comparator(a,b)||a.name.localeCompare(b.name,'ms')));return list;}
export function csvCell(v){let s=String(v??'');if(/^[=+@\-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
export function exportCsv(people,subjects,mode='COMBINED',rankField='rank'){const headers=['Kedudukan','Nama','Tahun','Kelas','Pentaksiran',...subjects,'Bil A','Jumlah','Bil ditaksir','Purata'];const out=[headers];for(const original of people){for(const p of original.assessmentViews||[original]){const rowMode=p.id||mode;if(Object.keys(p.marks).length)out.push([p[rankField]||'',p.name,p.year,p.className,rowMode,...subjects.map(s=>p.marks[s]?.status==='OK'?`${p.marks[s].mark} ${p.marks[s].grade}`:p.marks[s]?.status||''),p.aCount,p.total,p.count,p.average?.toFixed(2)||'']);if(Object.keys(p.pbd).length)out.push(['',p.name,p.year,p.className,rowMode==='COMBINED'?'PBD Akhir':rowMode,...subjects.map(s=>p.pbd[s]?.tp||''),'','','','']);}}return '\ufeff'+out.map(r=>r.map(csvCell).join(',')).join('\r\n');}

function assessmentViewData(rows,f){
 if(!Array.isArray(f.assessments))return singleViewData(rows,f);
 const ids=[...new Set(f.assessments)];if(!ids.length)return [];
 const views=ids.map(id=>({id,list:singleViewData(rows,{...f,assessment:id})}));
 const primary=ids.includes('COMBINED')?'COMBINED':ids.includes('UASA')?'UASA':ids.includes('MPT4')?'MPT4':ids.includes('PBD_END')?'PBD_END':ids[0];
 const union=new Map();
 for(const {id,list} of views)for(const p of list){if(!union.has(p.key))union.set(p.key,{...p,assessmentViews:[]});union.get(p.key).assessmentViews.push({id,...p});}
 for(const p of union.values()){const selected=p.assessmentViews.find(v=>v.id===primary)||p.assessmentViews[0];const parts=p.assessmentViews;Object.assign(p,selected,{assessmentViews:parts});const latest=parts.find(v=>v.id==='PBD_END')||parts.find(v=>v.id==='COMBINED')||parts.find(v=>v.id==='PBD_MID');if(latest)p.pbd=latest.pbd;}
 return [...union.values()].sort((a,b)=>f.sort==='name'?a.name.localeCompare(b.name,'ms'):f.sort==='subject'?(b.marks[f.subject]?.mark??-1)-(a.marks[f.subject]?.mark??-1):Number(b.complete)-Number(a.complete)||(f.sort==='total'?b.total-a.total:b.aCount-a.aCount||b.total-a.total)||a.name.localeCompare(b.name,'ms'));
}

export function pbdSummary(p,subject=''){
 const records=Object.values(p.pbd).filter(r=>!subject||r.subject===subject);
 const counts=[6,5,4,3,2,1].map(n=>records.filter(r=>r.tp==='TP'+n).length);
 return {counts,assessed:counts.reduce((a,b)=>a+b,0),subjects:records.map(r=>r.subject).sort().join('|')};
}
export function viewData(rows,f){
 let list=assessmentViewData(rows,f);
 const ids=f.assessments||[f.assessment||'COMBINED'];
 const basis=ids.includes('PBD_END')||ids.includes('COMBINED')?'PBD_END':ids.includes('PBD_MID')?'PBD_MID':null;
 for(const p of list){
  p.pbdBasis=basis;
  const selected=(p.assessmentViews||[]).find(v=>v.id===basis||basis==='PBD_END'&&v.id==='COMBINED');
  const data=p.assessmentViews?(selected?.pbd||{}):p.pbd;
  p.pbdSummary=pbdSummary({pbd:data},f.subject);
  p.pbdFilterRecords=Object.values(data).filter(r=>!f.subject||r.subject===f.subject);
 }
 if(f.tp)list=list.filter(p=>p.pbdFilterRecords.some(r=>r.tp===f.tp));
 if(f.sort==='pbd')list.sort((a,b)=>a.year-b.year||a.pbdSummary.subjects.localeCompare(b.pbdSummary.subjects)||a.pbdSummary.counts.reduce((cmp,n,i)=>cmp||b.pbdSummary.counts[i]-n,0)||a.name.localeCompare(b.name,'ms'));
 return list;
}
