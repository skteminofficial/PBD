(function () {
  let currentSummary = null;
  let allRecords = [];
  let filteredRecords = [];
  let currentTPStudents = [];
  let selectedAnalysisYear = null;
  const filters = { subject: '', year: '', classes: new Set(), student: '' };
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const tpNo = tp => Number(String(tp || '').replace(/\D/g,'')) || 0;
  const isMastered = record => tpNo(record.tp) >= 3;
  function shortClassLabel(year, className) {
    const y = String(year || '').trim();
    let label = String(className || '').toUpperCase().replace(/SEKOLAH\s+KEBANGSAAN\s+TEMIN|SK\s*TEMIN/g, ' ').replace(/\b(TAHUN|DARJAH|KELAS)\b/g, ' ').replace(/[^A-Z0-9]+/g, ' ').trim();
    if (y) label = label.replace(new RegExp(`(^|\\s)${y}(?=\\s|$)`, 'g'), ' ').replace(/\s+/g, ' ').trim();
    return `${y}${label ? ' ' + label : ''}`.trim() || '—';
  }

  function unique(values) { return [...new Set(values.filter(v => v !== null && v !== undefined && v !== ''))].sort((a,b)=>String(a).localeCompare(String(b),'ms',{numeric:true})); }
  function createViewModel(summary) {
    const school = summary.school, schoolSummary = school.summary, metadata = school.metadata;
    return {
      metrics: { files: metadata.totalFiles, classes: schoolSummary.totalClasses, students: schoolSummary.totalStudents, subjects: schoolSummary.totalSubjects },
      studentsByYear: schoolSummary.studentsByYear || {},
      sessionLabel: `Sesi ${metadata.sessions.join(', ') || '—'}`,
      caption: metadata.failedFiles ? `${summary.items.length} fail berjaya, ${metadata.failedFiles} gagal dibaca.` : `Kesemua ${summary.items.length} fail berjaya diproses.`,
      detectedInfo: [['Tahun', metadata.years.map(y=>`Tahun ${y}`).join(', ')||'—'],['Sesi',metadata.sessions.join(', ')||'—'],['Subjek',metadata.subjects.join(', ')||'—'],['Fail gagal',String(metadata.failedFiles)]],
      items: summary.items
    };
  }
  function renderMetricsFromRecords(records) {
    const studentKeys = new Set(records.map(r=>`${r.studentName}|${r.year}|${r.className}`));
    $('#metric-files').textContent = currentSummary?.school?.metadata?.totalFiles || 0;
    $('#metric-classes').textContent = unique(records.map(r=>r.className)).length;
    $('#metric-students').textContent = studentKeys.size.toLocaleString('ms-MY');
    $('#metric-subjects').textContent = unique(records.map(r=>r.subject)).length;
  }
  function renderDetectedInfo(info) { if (!$('#detected-info')) return; $('#detected-info').innerHTML = info.map(([l,v])=>`<div><dt>${l}</dt><dd>${esc(v)}</dd></div>`).join(''); }
  function renderTable(items, query='') {
    const q=query.trim().toLowerCase();
    const allowedClasses = new Set(filteredRecords.map(r=>`${r.year}|${r.className}`));
    const rows=items.filter(item=>allowedClasses.has(`${item.year}|${item.className}`)).filter(item=>!q||`${item.year} ${item.className} ${item.fileName}`.toLowerCase().includes(q));
    if (!$('#class-table-body')) return;
    $('#class-table-body').innerHTML=rows.map((item,i)=>`<tr><td>${i+1}</td><td>${item.year??'—'}</td><td><strong>${esc(item.className)}</strong></td><td>${item.session??'—'}</td><td>${item.studentCount}</td><td>${item.subjects.length}</td><td title="${esc(item.fileName)}">${esc(item.fileName.length>42?item.fileName.slice(0,39)+'…':item.fileName)}</td></tr>`).join('')||'<tr><td colspan="7">Tiada kelas sepadan.</td></tr>';
  }
  function distribution(records){ const d={TP1:0,TP2:0,TP3:0,TP4:0,TP5:0,TP6:0}; records.forEach(r=>{const k=`TP${tpNo(r.tp)}`;if(k in d)d[k]++;}); return d; }
  function subjectSummaries(records) {
    const grouped = new Map();
    records.forEach(record => {
      const subject = String(record.subject || 'Tanpa Subjek').trim() || 'Tanpa Subjek';
      if (!grouped.has(subject)) grouped.set(subject, []);
      grouped.get(subject).push(record);
    });
    return [...grouped.entries()].map(([subject, items]) => {
      const students = new Set(items.map(r => `${String(r.studentName || '').trim().toUpperCase()}|${r.year || ''}|${String(r.className || '').trim().toUpperCase()}`));
      const classes = new Set(items.map(r => `${r.year || ''}|${String(r.className || '').trim().toUpperCase()}`));
      const mastered = items.filter(isMastered).length;
      const notMastered = items.length - mastered;
      return { subject, records: items.length, students: students.size, classes: classes.size, mastered, notMastered, masteryRate: items.length ? mastered / items.length * 100 : 0, distribution: distribution(items) };
    }).sort((a,b) => a.subject.localeCompare(b.subject, 'ms'));
  }
  function renderSubjectOverview(records) {
    const summaries = subjectSummaries(records);
    const grid = $('#subject-overview-grid');
    if (!grid) return;
    $('#subject-overview-count').textContent = `${summaries.length} subjek`;
    grid.innerHTML = summaries.map(item => {
      const tpChips = Object.entries(item.distribution).map(([tp,total]) => `<span class="subject-tp-chip ${tp.toLowerCase()}"><b>${tp}</b><em>${total}</em></span>`).join('');
      return `<button type="button" class="subject-overview-card${filters.subject===item.subject?' active':''}" data-subject-overview="${esc(item.subject)}">
        <span class="subject-card-heading"><strong>${esc(item.subject)}</strong><i>›</i></span>
        <span class="subject-card-kpis"><span><small>Murid</small><b>${item.students}</b></span><span><small>Kelas</small><b>${item.classes}</b></span><span><small>Rekod</small><b>${item.records}</b></span></span>
        <span class="subject-mastery-line"><span><small>Menguasai</small><strong>${item.mastered} · ${item.masteryRate.toFixed(1)}%</strong></span><span class="attention"><small>Belum Menguasai</small><strong>${item.notMastered}</strong></span></span>
        <span class="subject-tp-row">${tpChips}</span>
      </button>`;
    }).join('') || '<div class="empty-state">Tiada data subjek untuk penapis semasa.</div>';
  }
  function studentsByYear(records){ const map={}; const sets={}; records.forEach(r=>{const y=r.year||'Lain'; sets[y]??=new Set(); sets[y].add(`${r.studentName}|${r.className}`)}); Object.keys(sets).forEach(y=>map[y]=sets[y].size); return map; }
  function populateFilters(records){
    $('#filter-subject').innerHTML='<option value="">Semua subjek</option>'+unique(records.map(r=>r.subject)).map(v=>`<option>${esc(v)}</option>`).join('');
    $('#filter-year').innerHTML='<option value="">Semua tahun</option>'+unique(records.map(r=>r.year)).map(v=>`<option value="${v}">Tahun ${v}</option>`).join('');
    $('#filter-classes').innerHTML=unique(records.map(r=>r.className)).map(v=>`<label><input type="checkbox" value="${esc(v)}">${esc(v)}</label>`).join('');
  }
  function updateFocusMode(){
    const isFocused = Boolean(filters.subject && filters.classes.size);
    $('#app-screen').classList.toggle('focus-analysis', isFocused);
  }
  function applyFilters(){
    filteredRecords=allRecords.filter(r=>(!filters.subject||r.subject===filters.subject)&&(!filters.year||Number(r.year)===Number(filters.year))&&(!filters.classes.size||filters.classes.has(r.className)));
    renderMetricsFromRecords(filteredRecords);
    if ($('#class-table-body')) renderTable(currentSummary.items,$('#class-search')?.value || '');
    window.PBDCharts.renderYearChart(studentsByYear(filteredRecords));
    window.PBDCharts.renderTPChart(distribution(filteredRecords),tp=>{window.PBDDashboard.activeTP=tp;showTPDetails(tp)});
    renderSubjectOverview(filteredRecords);
    renderAnalyses(filteredRecords);
    updateFocusMode();
    renderStudentSuggestions($('#student-search')?.value || '');
  }
  function groupRecordsByStudent(records){
    const groups=new Map(); records.forEach(r=>{const key=`${r.studentName.trim().toUpperCase()}|${r.year||''}|${r.className.trim().toUpperCase()}`; if(!groups.has(key))groups.set(key,{studentName:r.studentName,year:r.year,className:r.className,subjects:[]}); const s=groups.get(key); s.subjects.push({subject:r.subject,tp:r.tp});}); return [...groups.values()].sort((a,b)=>a.studentName.localeCompare(b.studentName,'ms'));
  }
  function aggregateRows(records,keyFn,labelFn){ const m=new Map(); records.forEach(r=>{const k=keyFn(r); if(!m.has(k))m.set(k,{key:k,label:labelFn(r),total:0,m:0,tm:0}); const x=m.get(k); x.total++; isMastered(r)?x.m++:x.tm++;}); return [...m.values()].sort((a,b)=>a.label.localeCompare(b.label,'ms',{numeric:true})); }
  function renderAggregateBody(selector, rows, options = {}) {
    const { clickableYear = false } = options;
    $(selector).innerHTML = rows.map(x => {
      const firstCell = clickableYear
        ? `<button type="button" class="year-analysis-link${String(selectedAnalysisYear)===String(x.key)?' active':''}" data-analysis-year="${esc(x.key)}">${esc(x.label)}</button>`
        : `<strong>${esc(x.label)}</strong>`;
      return `<tr><td>${firstCell}</td><td class="num-cell">${x.total}</td><td class="num-cell">${x.m}</td><td class="num-cell">${x.tm}</td><td class="num-cell percent-cell"><strong>${x.total?((x.m/x.total)*100).toFixed(1):'0.0'}%</strong></td></tr>`;
    }).join('') || '<tr><td colspan="5">Tiada data.</td></tr>';
  }
  function studentCards(students,mastered){ return students.map(s=>{const subjects=s.subjects.filter(x=>(tpNo(x.tp)>=3)===mastered); return `<article class="student-summary-card"><button class="tp-student-name" data-student="${esc(s.studentName)}" data-year="${s.year||''}" data-class="${esc(s.className)}"><span>${esc(s.studentName)}</span><span>›</span></button><small>Tahun ${s.year||'—'} · ${esc(s.className||'—')}</small><div class="subject-chips">${subjects.map(x=>`<span>${esc(x.subject)} · ${x.tp}</span>`).join('')}</div></article>`}).join(''); }
  function renderAnalyses(records){
    const yearRows = aggregateRows(records, r=>r.year, r=>`Tahun ${r.year||'—'}`);
    if (selectedAnalysisYear && !yearRows.some(x=>String(x.key)===String(selectedAnalysisYear))) selectedAnalysisYear = null;
    renderAggregateBody('#year-analysis-body', yearRows, { clickableYear: true });

    const classPanel = $('#class-analysis-panel');
    if (selectedAnalysisYear) {
      const yearRecords = records.filter(r=>String(r.year)===String(selectedAnalysisYear));
      const classRows = aggregateRows(yearRecords, r=>`${r.year}|${shortClassLabel(r.year,r.className)}`, r=>shortClassLabel(r.year,r.className));
      $('#class-analysis-title').textContent = `Prestasi Kelas Tahun ${selectedAnalysisYear}`;
      renderAggregateBody('#class-analysis-body', classRows);
      classPanel.classList.remove('hidden');
    } else {
      classPanel.classList.add('hidden');
      $('#class-analysis-body').innerHTML = '';
    }
    const students=groupRecordsByStudent(records);
    const mastered=students.filter(s=>s.subjects.some(x=>tpNo(x.tp)>=3));
    const notMastered=students.filter(s=>s.subjects.some(x=>tpNo(x.tp)<=2));
    $('#mastered-count').textContent=mastered.length; $('#not-mastered-count').textContent=notMastered.length;
  }

  function showMasteryList(mastered){
    const students=groupRecordsByStudent(filteredRecords).filter(s=>s.subjects.some(x=>mastered?tpNo(x.tp)>=3:tpNo(x.tp)<=2));
    const title=mastered?'Murid Menguasai':'Murid Belum Menguasai';
    const subtitle=mastered?'TP3–TP6 berdasarkan penapis aktif.':'TP1–TP2 · Fokus intervensi untuk mencapai sekurang-kurangnya TP3.';
    $('#modal-eyebrow').textContent=mastered?'SENARAI MURID':'FOKUS INTERVENSI';
    $('#modal-title').textContent=title;
    $('#modal-subtitle').textContent=`${students.length} murid · ${subtitle}`;
    $('#modal-body').innerHTML=`<div class="tp-modal-tools"><label class="modal-search-wrap"><span>🔍</span><input id="mastery-list-search" class="modal-search" type="search" placeholder="Cari nama, kelas atau tahun..."></label><small id="mastery-search-result">${students.length} murid</small></div><div id="mastery-student-list" class="tp-student-list"></div>`;
    const renderList=(q='')=>{
      const query=q.trim().toLowerCase();
      const shown=query?students.filter(s=>`${s.studentName} ${s.year} ${s.className}`.toLowerCase().includes(query)):students;
      $('#mastery-search-result').textContent=`${shown.length} daripada ${students.length} murid`;
      $('#mastery-student-list').innerHTML=studentCards(shown,mastered)||'<div class="empty-state">Tiada murid sepadan.</div>';
    };
    window.PBDDashboard.renderMasteryList=renderList; renderList(); openModal();
  }
  function openModal(){ $('#detail-modal').classList.remove('hidden'); document.body.classList.add('modal-open'); }
  function closeModal(){ $('#detail-modal').classList.add('hidden'); document.body.classList.remove('modal-open'); }
  function renderTPStudentCards(students,tp,query=''){ const q=query.trim().toLowerCase(); const f=q?students.filter(s=>`${s.studentName} ${s.year} ${s.className}`.toLowerCase().includes(q)):students; $('#tp-search-result').textContent=`${f.length} daripada ${students.length} murid`; $('#tp-student-list').innerHTML=f.map(s=>`<article class="tp-student-card"><button class="tp-student-name" data-student="${esc(s.studentName)}" data-year="${s.year||''}" data-class="${esc(s.className)}"><span>${esc(s.studentName)}</span><span>›</span></button><p class="tp-student-class">Tahun ${s.year||'—'} · ${esc(s.className||'—')}</p><div class="subject-chips">${s.subjects.filter(x=>x.tp===tp).map(x=>`<span>${esc(x.subject)}</span>`).join('')}</div></article>`).join('')||'<div class="empty-state">Tiada murid sepadan.</div>'; }
  function showTPDetails(tp){ const records=filteredRecords.filter(r=>`TP${tpNo(r.tp)}`===tp); currentTPStudents=groupRecordsByStudent(records); $('#modal-eyebrow').textContent='SENARAI MURID MENGIKUT TP'; $('#modal-title').textContent=`Senarai Murid ${tp}`; $('#modal-subtitle').textContent=`${currentTPStudents.length} murid · ${records.length} rekod berdasarkan penapis aktif.`; $('#modal-body').innerHTML=`<div class="tp-modal-tools"><label class="modal-search-wrap"><span>🔍</span><input id="tp-student-search" class="modal-search" type="search" placeholder="Cari nama, kelas atau tahun..."></label><small id="tp-search-result"></small></div><div id="tp-student-list" class="tp-student-list"></div>`; renderTPStudentCards(currentTPStudents,tp); openModal(); }
  function renderSubjectSection(title,subjects,type){return `<section class="mastery-section ${type}"><header><div><small>${title}</small><strong>${subjects.length} subjek</strong></div></header><div class="mastery-subject-list">${subjects.length?subjects.map(x=>`<article><span>${esc(x.subject)}</span><strong class="tp-badge ${String(x.tp).toLowerCase()}">${x.tp}</strong></article>`).join(''):'<p class="mastery-empty">Tiada subjek.</p>'}</div></section>`}
  function openStudentDrawer(){ const drawer=$('#student-drawer'); if(!drawer)return; drawer.classList.remove('hidden'); drawer.setAttribute('aria-hidden','false'); document.body.classList.add('drawer-open'); setTimeout(()=>$('#student-drawer-close')?.focus(),30); }
  function closeStudentDrawer(){ const drawer=$('#student-drawer'); if(!drawer)return; drawer.classList.add('hidden'); drawer.setAttribute('aria-hidden','true'); document.body.classList.remove('drawer-open'); }
  function showStudentDetails(name,year,className){
    const analysis=window.PBDStudentAnalysis.getStudentAnalysis(currentSummary.items,name,{year,className});
    const m=analysis.subjects.filter(x=>tpNo(x.tp)>=3),tm=analysis.subjects.filter(x=>tpNo(x.tp)<=2);
    $('#drawer-student-name').textContent=analysis.summary.studentName;
    $('#drawer-student-meta').textContent=`Tahun ${analysis.summary.year||'—'} · ${shortClassLabel(analysis.summary.year,analysis.summary.className)||'—'} · ${analysis.summary.totalSubjects} subjek`;
    $('#student-drawer-body').innerHTML=`<div class="drawer-kpi-grid"><article><small>Menguasai</small><strong>${m.length}</strong><span>TP3–TP6</span></article><article class="attention"><small>Belum Menguasai</small><strong>${tm.length}</strong><span>TP1–TP2</span></article></div><div class="mastery-columns drawer-mastery-columns">${renderSubjectSection('Menguasai (TP3–TP6)',m,'mastered')}${renderSubjectSection('Belum Menguasai (TP1–TP2)',tm,'not-mastered')}</div>`;
    closeModal();
    openStudentDrawer();
  }
  function autocompleteStudentPool(){
    return groupRecordsByStudent(filteredRecords);
  }
  function hideStudentSuggestions(){
    const box=$('#student-suggestions');
    if(box){ box.classList.add('hidden'); box.innerHTML=''; }
  }
  function renderStudentSuggestions(query){
    const box=$('#student-suggestions');
    const count=$('#student-search-count');
    if(!box||!count)return;
    const q=String(query||'').trim().toLowerCase();
    if(q.length<2){
      hideStudentSuggestions();
      count.textContent='Taip sekurang-kurangnya 2 huruf, kemudian klik nama murid.';
      return;
    }
    const matches=autocompleteStudentPool().filter(s=>`${s.studentName} ${s.year} ${s.className}`.toLowerCase().includes(q)).slice(0,12);
    count.textContent=matches.length?`${matches.length} cadangan dipaparkan`:'Tiada nama murid sepadan.';
    box.innerHTML=matches.map(s=>`<button type="button" class="student-suggestion" role="option" data-search-student="${esc(s.studentName)}" data-search-year="${s.year||''}" data-search-class="${esc(s.className)}"><span><strong>${esc(s.studentName)}</strong><small>Tahun ${s.year||'—'} · ${esc(shortClassLabel(s.year,s.className))}</small></span><b>›</b></button>`).join('')||'<div class="student-suggestion-empty">Tiada nama murid sepadan.</div>';
    box.classList.remove('hidden');
  }
  function bindFilters(){
    $('#filter-subject').onchange=e=>{filters.subject=e.target.value;applyFilters()};
    $('#filter-year').onchange=e=>{filters.year=e.target.value;applyFilters()};
    $('#filter-classes').onchange=e=>{if(e.target.type==='checkbox'){e.target.checked?filters.classes.add(e.target.value):filters.classes.delete(e.target.value);applyFilters()}};
    if ($('#student-search')) {
      $('#student-search').oninput=e=>renderStudentSuggestions(e.target.value);
      $('#student-search').onfocus=e=>renderStudentSuggestions(e.target.value);
    }
    $('#btn-reset-filters').onclick=()=>{filters.subject='';filters.year='';filters.student='';filters.classes.clear();$('#filter-subject').value='';$('#filter-year').value='';if($('#student-search'))$('#student-search').value='';hideStudentSuggestions();$('#filter-classes').querySelectorAll('input').forEach(x=>x.checked=false);applyFilters()};
    $('#btn-show-all-subjects').onclick=()=>{filters.subject='';$('#filter-subject').value='';applyFilters()};
  }
  function render(summary){ const view=createViewModel(summary); currentSummary=summary; allRecords=window.PBDAnalysisCore.buildRecords(summary.items); filteredRecords=[...allRecords]; filters.subject=''; filters.year=''; filters.student=''; filters.classes.clear(); $('#welcome-screen').classList.add('hidden'); $('#app-screen').classList.remove('hidden'); $('#session-badge').textContent=view.sessionLabel; populateFilters(allRecords); bindFilters(); applyFilters(); }
  function searchClasses(q){if(currentSummary && $('#class-table-body'))renderTable(currentSummary.items,q)}
  function reset(){currentSummary=null;allRecords=[];filteredRecords=[];selectedAnalysisYear=null;filters.classes.clear();closeModal();closeStudentDrawer();window.PBDCharts.destroyAll?.();$('#app-screen').classList.add('hidden');$('#welcome-screen').classList.remove('hidden')}
  $('#modal-close')?.addEventListener('click',closeModal); document.querySelector('[data-close-modal]')?.addEventListener('click',closeModal); $('#student-drawer-close')?.addEventListener('click',closeStudentDrawer); document.querySelector('[data-close-drawer]')?.addEventListener('click',closeStudentDrawer); document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();closeStudentDrawer();}});
  $('#modal-body')?.addEventListener('input',e=>{if(e.target.matches('#tp-student-search'))renderTPStudentCards(currentTPStudents,window.PBDDashboard.activeTP,e.target.value);if(e.target.matches('#mastery-list-search'))window.PBDDashboard.renderMasteryList?.(e.target.value)});
  document.addEventListener('click',e=>{const subjectCard=e.target.closest('[data-subject-overview]');if(subjectCard){filters.subject=subjectCard.dataset.subjectOverview;$('#filter-subject').value=filters.subject;applyFilters();setTimeout(()=>$('#subject-overview-grid')?.scrollIntoView({behavior:'smooth',block:'start'}),20);return;}if(e.target.closest('#mastered-summary-card')){showMasteryList(true);return;}if(e.target.closest('#not-mastered-summary-card')){showMasteryList(false);return;}const suggestion=e.target.closest('[data-search-student]');if(suggestion){$('#student-search').value=suggestion.dataset.searchStudent;hideStudentSuggestions();showStudentDetails(suggestion.dataset.searchStudent,suggestion.dataset.searchYear,suggestion.dataset.searchClass);return;}if(!e.target.closest('.student-search-label'))hideStudentSuggestions();const yearButton=e.target.closest('[data-analysis-year]');if(yearButton){selectedAnalysisYear=yearButton.dataset.analysisYear;renderAnalyses(filteredRecords);setTimeout(()=>$('#class-analysis-panel')?.scrollIntoView({behavior:'smooth',block:'start'}),20);return;}if(e.target.closest('#btn-close-class-analysis')){selectedAnalysisYear=null;renderAnalyses(filteredRecords);return;}const b=e.target.closest('[data-student]');if(b)showStudentDetails(b.dataset.student,b.dataset.year,b.dataset.class);if(e.target.closest('[data-back-tp]')&&window.PBDDashboard.activeTP)showTPDetails(window.PBDDashboard.activeTP)});
  window.PBDDashboard={activeTP:null,createViewModel,subjectSummaries,groupRecordsByStudent,render,searchClasses,showTPDetails,closeModal,closeStudentDrawer,reset};
})();
