import {csvCell,PBD_CORE,corePbdSummary,coreACount,examAPriority,examRankingVector} from './core.mjs?v=3.2.11';
export const CLASS_NAMES=['DELTA','GAMMA','LAMBDA','SIGMA'];
export function balancedRooms(n,count=4){return CLASS_NAMES.slice(0,count).map((name,i)=>({name,capacity:Math.floor(n/count)+(i<n%count?1:0)}));}
export function placementStudents(people,basis,selectedSubjects=null,{strictReview=false}={}){
 const pbd=basis.startsWith('PBD'),scope=Array.isArray(selectedSubjects)?[...new Set(selectedSubjects)]:null;
 return people.map(p=>{
  const allRecords=Object.values(pbd?p.pbd:p.marks);
  const coreBasis=pbd&&p.year>=1&&p.year<=3,appliedScope=coreBasis?PBD_CORE:scope,core=coreBasis?corePbdSummary(p.pbd):null;
  const records=allRecords.filter(r=>appliedScope===null||appliedScope.includes(r.subject));
  const valid=records.filter(r=>pbd?/^TP[1-6]$/.test(r.tp):r.status==='OK'&&Number.isFinite(r.mark));
  const counts=[6,5,4,3,2,1].map(n=>valid.filter(r=>r.tp==='TP'+n).length);
  const gradeCounts=['A','B','C','D','E','F'].map(g=>valid.filter(r=>r.grade===g).length);
  const total=valid.reduce((n,r)=>n+(r.mark||0),0),aCount=valid.filter(r=>r.grade==='A').length;
  const exam={marks:Object.fromEntries(valid.map(r=>[r.subject,r])),gradeCounts,total};
  const reasons=[];if(strictReview){if(![...allRecords,...(p.records||[])].some(r=>r.subject==='PI'))reasons.push('Tiada rekod mengambil PI');if(!allRecords.length)reasons.push('Tiada pentaksiran sumber');if(allRecords.some(r=>pbd?!/^TP[1-6]$/.test(r.tp):r.status!=='OK'||!Number.isFinite(r.mark)))reasons.push('T / TD / belum ditaksir');}if(records.length===0||valid.length!==records.length||appliedScope?.some(s=>!valid.some(r=>r.subject===s)))reasons.push('Keputusan subjek pilihan belum lengkap');
  return {reviewReasons:reasons,key:p.key,name:p.name,sourceYear:p.year,sourceClass:p.className,subjects:records.map(r=>r.subject).sort().join('|'),eligible:reasons.length===0&&records.length>0&&valid.length===records.length&&(appliedScope===null||appliedScope.every(s=>valid.some(r=>r.subject===s))),krkMode:!pbd&&Boolean(p.krkMode),krk:pbd?null:p.krk,coreACount:pbd?null:coreACount({marks:Object.fromEntries(valid.map(r=>[r.subject,r]))}),vector:coreBasis?core.vector:pbd?counts:[...(p.krkMode?[Number(Boolean(p.krk?.meets))]:[]),...examRankingVector(exam)],aPriority:pbd?null:examAPriority(exam),pbdRule:coreBasis?core.rule:null,pbdTotal:coreBasis?core.total:null,pbdJustification:coreBasis?core.reason:null,gradeCounts:pbd?null:gradeCounts,tpCounts:pbd?counts:null,total:pbd?null:total,average:pbd||!valid.length?null:total/valid.length,aCount:pbd?null:aCount,sourceRank:scope===null?p.rank||null:null};
 });
}

export const placementOrder=(plan)=>(a,b)=>(plan.order?.[a.key]??Infinity)-(plan.order?.[b.key]??Infinity)||a.name.localeCompare(b.name,'ms');
const cmp=(a,b)=>a.vector.reduce((n,v,i)=>n||b.vector[i]-v,0)||a.name.localeCompare(b.name,'ms')||a.key.localeCompare(b.key);
export function validatePlan(plan){
 if(!plan||plan.schema!=='sap-temin-placement@1'||!Array.isArray(plan.students)||plan.students.length>2000||!Array.isArray(plan.rooms)||plan.rooms.length<1||plan.rooms.length>4)throw Error('Draf penyusunan tidak sah.');
 if(!/^20\d{2}$/.test(String(plan.targetSession))||!Number.isInteger(Number(plan.targetYear))||Number(plan.targetYear)<1||Number(plan.targetYear)>6)throw Error('Sesi atau tahun baharu tidak sah.');
 if(!['COMBINED','UASA','MPT4','PBD_END','PBD_MID'].includes(plan.basis)||!['snake','round','elite','manual'].includes(plan.method)||!plan.assignments||Array.isArray(plan.assignments)||!plan.fixed||Array.isArray(plan.fixed)||!Array.isArray(plan.warnings)||plan.warnings.some(w=>typeof w!=='string'))throw Error('Struktur draf tidak lengkap.');
 const keys=new Set();for(const p of plan.students){if(typeof p.key!=='string'||!p.key||['__proto__','constructor','prototype'].includes(p.key)||keys.has(p.key)||typeof p.name!=='string'||!Array.isArray(p.vector)||!(plan.basis.startsWith('PBD')?[5,6]:[2,7,8,11,12]).includes(p.vector.length)||p.vector.some(x=>!Number.isFinite(x)))throw Error('Identiti atau keputusan murid dalam draf tidak sah.');keys.add(p.key);}
 const names=new Set();for(const room of plan.rooms){if(!CLASS_NAMES.includes(room.name)||names.has(room.name)||!Number.isInteger(room.capacity)||room.capacity<0||room.capacity>2000)throw Error('Nama kelas mesti unik dan kuota mesti nombor bulat.');names.add(room.name);}
 if(plan.rooms.reduce((s,r)=>s+r.capacity,0)<plan.students.length)throw Error('Jumlah kuota kelas kurang daripada bilangan murid.');
 const counts=Object.fromEntries(plan.rooms.map(r=>[r.name,0]));for(const [key,name]of Object.entries(plan.assignments||{})){if(!keys.has(key)||!names.has(name))throw Error('Penempatan dalam draf tidak sah.');counts[name]++;}
 for(const room of plan.rooms)if(counts[room.name]>room.capacity)throw Error('Kelas '+room.name+' melebihi kuota.');
 for(const [key,name]of Object.entries(plan.fixed||{}))if(!keys.has(key)||!names.has(name)||plan.assignments?.[key]!==name)throw Error('Penempatan terkunci tidak sepadan.');return plan;
}
export function generatePlacement(students,settings,fixed={}){
 const plan={schema:'sap-temin-placement@1',...settings,rooms:settings.rooms.map(r=>({...r})),students:students.map(p=>({...p,vector:[...p.vector]})),assignments:{},fixed:{},createdAt:new Date().toISOString(),warnings:[]};
 validatePlan(plan);if(!['snake','round','elite','manual'].includes(plan.method))throw Error('Kaedah agihan tidak sah.');if(plan.method==='elite'&&(plan.rooms.length<2||!plan.rooms.some(r=>r.name===plan.eliteClass)))throw Error('Pilih kelas cemerlang dan sekurang-kurangnya dua kelas.');
 if(plan.method==='elite'&&Object.keys(fixed).length){plan.warnings.push('Penempatan tetap draf lama diketepikan untuk menjamin kelas cemerlang mengikut turutan teratas tanpa langkau.');fixed={};}
 const map=new Map(plan.students.map(p=>[p.key,p])),used=Object.fromEntries(plan.rooms.map(r=>[r.name,0]));for(const [key,name]of Object.entries(fixed)){if(!map.has(key)||!(name in used))throw Error('Penempatan tetap tidak sah.');plan.assignments[key]=name;plan.fixed[key]=name;used[name]++;}
 validatePlan(plan);
 // Only pupils with the same assessed subject set are compared automatically.
 const cohorts=new Map();for(const p of students.filter(p=>p.eligible)){if(!cohorts.has(p.subjects))cohorts.set(p.subjects,[]);cohorts.get(p.subjects).push(p);}
 const cohort=settings.cohort??[...cohorts.entries()].sort((a,b)=>b[1].length-a[1].length||a[0].localeCompare(b[0]))[0]?.[0]??'';plan.cohort=cohort;
 let ordered=students.filter(p=>p.eligible&&p.subjects===cohort).sort(cmp);plan.order=Object.fromEntries(ordered.map((p,i)=>[p.key,i+1]));
 const review=students.filter(p=>!p.eligible||p.subjects!==cohort);if(review.length)plan.warnings.push(review.length+' murid tiada keputusan lengkap atau kumpulan subjek berbeza: semak dan tempatkan secara manual.');
 if(plan.method==='manual')return validatePlan(plan);
 ordered=ordered.filter(p=>!plan.fixed[p.key]);
 const put=(p,room)=>{plan.assignments[p.key]=room.name;used[room.name]++;};let rooms=plan.rooms;
 if(plan.method==='elite'){
  const elite=rooms.find(r=>r.name===plan.eliteClass),n=Math.max(0,elite.capacity-used[elite.name]);
  if(n&&ordered[n-1]&&ordered[n]&&ordered[n-1].vector.every((v,i)=>v===ordered[n].vector[i]))plan.warnings.push('Keputusan seri pada sempadan kuota kelas cemerlang. Semak pilihan murid sebelum dimuktamadkan.');
  ordered.splice(0,n).forEach(p=>put(p,elite));rooms=rooms.filter(r=>r.name!==elite.name);
 }
 const sequence=plan.method==='round'?rooms:rooms.concat([...rooms].reverse());let cursor=0;
 for(const p of ordered){let placed=false;for(let tries=0;tries<sequence.length;tries++){const room=sequence[cursor++%sequence.length];if(used[room.name]<room.capacity){put(p,room);placed=true;break;}}if(!placed)plan.warnings.push('Tiada ruang kosong untuk baki murid. Semak kuota.');}
 return validatePlan(plan);
}
export function movePlacement(plan,key,name){
 const next={...plan,assignments:{...plan.assignments},fixed:{...plan.fixed}};if(!plan.students.some(p=>p.key===key))throw Error('Murid tidak ditemui.');if(name){next.assignments[key]=name;next.fixed[key]=name;}else{delete next.assignments[key];delete next.fixed[key];}return validatePlan(next);
}
export function placementSummary(plan){return plan.rooms.map(room=>{const pupils=plan.students.filter(p=>plan.assignments[p.key]===room.name),marked=pupils.filter(p=>Number.isFinite(p.average));return {...room,count:pupils.length,average:marked.length?marked.reduce((n,p)=>n+p.average,0)/marked.length:null,tpCounts:[0,0,0,0,0,0].map((_,i)=>pupils.reduce((n,p)=>n+(p.tpCounts?.[i]||0),0)),locked:pupils.filter(p=>plan.fixed[p.key]).length};});}
export function placementCsv(plan){validatePlan(plan);const out=[['Sesi baharu','Tahun baharu','Kelas cadangan','Nama murid','Kelas asal','Turutan agihan','Bil. A','Jumlah','TP6','TP5','TP4','TP3','TP2','TP1','Status','Subjek pengiraan','A teras (BM BI MT SN)','A SEJ+RBT','A PI','A elektif','Tapisan KRK','Catatan KRK']];for(const room of [...plan.rooms,{name:''}])for(const p of plan.students.filter(p=>(plan.assignments[p.key]||'')===room.name).sort(placementOrder(plan)))out.push([plan.targetSession,plan.targetYear,room.name||'BELUM DITEMPATKAN',p.name,p.sourceYear+' '+p.sourceClass,plan.order?.[p.key]||'',p.aCount??'',p.total??'',...(p.tpCounts||['','','','','','']),plan.fixed[p.key]?'TETAP / MANUAL':room.name?'CADANGAN':'SEMAK MANUAL'+(p.reviewReasons?.length?' · '+p.reviewReasons.join(' / '):''),Array.isArray(plan.selectedSubjects)?plan.selectedSubjects.join(', '):'Semua subjek',p.coreACount??'',...(p.aPriority?.slice(1)||['','','']),p.krkMode?(p.krk?.meets?'Memenuhi tapisan':'Belum memenuhi'):'',p.krkMode?p.krk?.reason||'':'']);return '\ufeff'+out.map(r=>r.map(csvCell).join(',')).join('\r\n');}

// Dedicated print pages keep interactive panels and their scroll limits out of PDF output.
export function placementPrintHtml(plan){
 validatePlan(plan);
 const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const columns=[],stats=placementSummary(plan),limit=35;
 for(const room of [...plan.rooms,{name:'',capacity:0}]){
  const pupils=plan.students.filter(p=>(plan.assignments[p.key]||'')===room.name).sort(placementOrder(plan));
  if(!room.name&&!pupils.length)continue;
  const summary=stats.find(s=>s.name===room.name);
  for(let offset=0;offset<Math.max(1,pupils.length);offset+=limit){
   columns.push(`<article class="print-class"><h2>${escape(room.name||'SEMAKAN MANUAL')}${offset?' (sambungan)':''}</h2><p>${pupils.length} murid${room.name?' · Kuota '+room.capacity:''}${summary?.average!=null?' · Purata '+summary.average.toFixed(1)+'%':''}</p><table><thead><tr><th>Turutan</th><th>Nama murid</th><th>Kelas asal</th></tr></thead><tbody>${pupils.slice(offset,offset+limit).map((p,i)=>`<tr><td>${plan.order?.[p.key]||'—'}</td><td>${escape(p.name)}</td><td>${p.sourceYear} ${escape(p.sourceClass)}</td></tr>`).join('')||'<tr><td colspan="3">Tiada murid</td></tr>'}</tbody></table></article>`);
  }
 }
 const pages=[];for(let i=0;i<columns.length;i+=2)pages.push(`<section class="placement-print-page"><header><strong>SK TEMIN · PENYUSUNAN KELAS TAHUN ${plan.targetYear} · ${escape(plan.targetSession)}</strong><p>${plan.krk==='priority'?'KRK ≥C (7 subjek) · ':''}Subjek: ${escape(Array.isArray(plan.selectedSubjects)?plan.selectedSubjects.join(', '):'Semua subjek')} · Asas: ${escape(plan.basis)}</p></header><div class="print-class-pair">${columns.slice(i,i+2).join('')}</div><footer>Draf cadangan · Halaman ${pages.length+1} / ${Math.ceil(columns.length/2)}</footer></section>`);
 return pages.join('');
}
