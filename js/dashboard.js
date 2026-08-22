(function () {
  let currentSummary = null;
  let allRecords = [];
  let filteredRecords = [];
  let currentTPStudents = [];
  let selectedAnalysisYear = null;
  let subjectComparisonChart = null;
  let activeStudent = null;
  let activeStudentAnalysis = null;
  let activeInterventions = [];
  let teacherAssignments = [];
  const filters = { subject: '', year: '', classes: new Set(), student: '' };
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const tpNo = tp => Number(String(tp || '').replace(/\D/g,'')) || 0;
  const isMastered = record => tpNo(record.tp) >= 3;
  const SUBJECT_ORDER = ['BM','BI','MM','SAINS','SEJARAH','PAI','BA','RBT','PJPK','PMZ','PSV','PM'];
  function subjectCode(subject) {
    const value=String(subject||'').toUpperCase().replace(/[._-]/g,' ').replace(/\s+/g,' ').trim();
    if (['BM','BAHASA MELAYU'].includes(value)) return 'BM';
    if (['BI','BAHASA INGGERIS'].includes(value)) return 'BI';
    if (['MM','MATEMATIK'].includes(value)) return 'MM';
    if (value==='SAINS') return 'SAINS';
    if (['SEJ','SEJARAH'].includes(value)) return 'SEJARAH';
    if (['PAI','P ISLAM','PENDIDIKAN ISLAM'].includes(value)) return 'PAI';
    if (['AR','BA','B ARAB','BAHASA ARAB'].includes(value)) return 'BA';
    if (value==='RBT'||value==='REKA BENTUK DAN TEKNOLOGI') return 'RBT';
    if (['PJPK','PJK','PJ'].includes(value)) return 'PJPK';
    if (['PMZ','PENDIDIKAN MUZIK','MUZIK'].includes(value)) return 'PMZ';
    if (['PSV','PENDIDIKAN SENI VISUAL'].includes(value)) return 'PSV';
    if (['PM','PENDIDIKAN MORAL'].includes(value)) return 'PM';
    return value;
  }
  function compareSubjects(a,b) {
    const ai=SUBJECT_ORDER.indexOf(subjectCode(a)),bi=SUBJECT_ORDER.indexOf(subjectCode(b));
    if (ai!==bi) return (ai<0?999:ai)-(bi<0?999:bi);
    return String(a).localeCompare(String(b),'ms');
  }
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
    $('#metric-classes').textContent = unique(records.map(r=>`${r.year}|${r.className}`)).length;
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
    }).sort((a,b) => compareSubjects(a.subject,b.subject));
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
        <span class="subject-mastery-line"><span><small>Menguasai</small><strong>${item.mastered} · ${item.masteryRate.toFixed(1)}%</strong></span><span class="attention"><small>Belum Menguasai</small><strong>${item.notMastered} · ${(100-item.masteryRate).toFixed(1)}%</strong></span></span>
        <span class="subject-tp-row">${tpChips}</span>
      </button>`;
    }).join('') || '<div class="empty-state">Tiada data subjek untuk penapis semasa.</div>';
  }
  function renderExecutiveSummary(records) {
    const summaries = subjectSummaries(records);
    const studentKeys = new Set(records.map(r=>`${String(r.studentName||'').trim().toUpperCase()}|${r.year||''}|${String(r.className||'').trim().toUpperCase()}`));
    const mastered = records.filter(isMastered).length;
    const notMastered = records.length - mastered;
    const masteredRate = records.length ? mastered / records.length * 100 : 0;
    const notMasteredRate = records.length ? notMastered / records.length * 100 : 0;
    $('#executive-students').textContent = studentKeys.size.toLocaleString('ms-MY');
    $('#executive-records').textContent = records.length.toLocaleString('ms-MY');
    $('#executive-mastered').textContent = `${masteredRate.toFixed(1)}%`;
    $('#executive-not-mastered').textContent = `${notMasteredRate.toFixed(1)}%`;
    $('#executive-mastered-count').textContent = `${mastered.toLocaleString('ms-MY')} rekod · TP3–TP6`;
    $('#executive-not-mastered-count').textContent = `${notMastered.toLocaleString('ms-MY')} rekod · TP1–TP2`;
    $('#subject-summary-body').innerHTML = summaries.map(item => `<tr data-summary-subject="${esc(item.subject)}"><td><button type="button" class="subject-table-link" data-subject-overview="${esc(item.subject)}">${esc(item.subject)}</button></td><td>${item.students}</td><td>${item.distribution.TP1}</td><td>${item.distribution.TP2}</td><td>${item.distribution.TP3}</td><td>${item.distribution.TP4}</td><td>${item.distribution.TP5}</td><td>${item.distribution.TP6}</td><td class="tm-cell">${item.notMastered}</td><td class="tm-cell"><strong>${(100-item.masteryRate).toFixed(1)}%</strong></td><td class="m-cell">${item.mastered}</td><td class="m-cell"><strong>${item.masteryRate.toFixed(1)}%</strong></td></tr>`).join('') || '<tr><td colspan="12">Tiada data.</td></tr>';
    if (['utama','dialog'].includes(document.body.dataset.dashboardView)) renderSubjectComparisonChart(summaries);
  }
  function renderDialogPriorities(records) {
    const body = $('#dialog-priority-body');
    if (!body) return;
    const summaries = subjectSummaries(records);
    body.innerHTML = summaries.map((item,index) => {
      const isCore = ['BM','BI','MM','SAINS','SEJARAH'].includes(subjectCode(item.subject));
      const category = isCore
        ? '<span class="priority-badge focus">Subjek teras</span>'
        : '<span class="priority-badge">Mata pelajaran lain</span>';
      return `<tr class="${isCore?'priority-row':''}"><td><span class="priority-rank">${index+1}</span></td><td><strong>${esc(item.subject)}</strong></td><td>${item.students}</td><td>${item.mastered}</td><td class="m-cell"><strong>${item.masteryRate.toFixed(1)}%</strong></td><td>${item.notMastered}</td><td class="tm-cell"><strong>${(100-item.masteryRate).toFixed(1)}%</strong></td><td>${category}</td></tr>`;
    }).join('') || '<tr><td colspan="8">Tiada data untuk dipaparkan.</td></tr>';
  }
  function renderSubjectComparisonChart(summaries) {
    const canvas = $('#subject-comparison-chart');
    if (!canvas || !window.Chart) return;
    subjectComparisonChart?.destroy();
    subjectComparisonChart = new Chart(canvas, {type:'bar',data:{labels:summaries.map(x=>x.subject),datasets:[{label:'% Menguasai (TP3–TP6)',data:summaries.map(x=>Number(x.masteryRate.toFixed(1))),backgroundColor:'#10b981',borderRadius:5},{label:'% Belum Menguasai (TP1–TP2)',data:summaries.map(x=>Number((100-x.masteryRate).toFixed(1))),backgroundColor:'#f43f5e',borderRadius:5}]},options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',scales:{x:{beginAtZero:true,max:100,title:{display:true,text:'Peratus (%)'}},y:{ticks:{autoSkip:false}}},plugins:{legend:{position:'bottom'},tooltip:{callbacks:{label:ctx=>`${ctx.dataset.label}: ${ctx.raw}%`}}}}});
  }
  function studentsByYear(records){ const map={}; const sets={}; records.forEach(r=>{const y=r.year||'Lain'; sets[y]??=new Set(); sets[y].add(`${r.studentName}|${r.className}`)}); Object.keys(sets).forEach(y=>map[y]=sets[y].size); return map; }
  function populateFilters(records){
    $('#filter-subject').innerHTML='<option value="">Semua subjek</option>'+unique(records.map(r=>r.subject)).map(v=>`<option>${esc(v)}</option>`).join('');
    $('#filter-year').innerHTML='<option value="">Semua tahun</option>'+unique(records.map(r=>r.year)).map(v=>`<option value="${v}">Tahun ${v}</option>`).join('');
    $('#filter-classes').innerHTML=unique(records.map(r=>r.className)).map(v=>`<label><input type="checkbox" value="${esc(v)}">${esc(v)}</label>`).join('');
  }
  function populateReportControls(records){
    const subjects=unique(records.map(r=>r.subject));
    const years=unique(records.map(r=>r.year));
    $('#report-subject').innerHTML='<option value="">Pilih subjek</option>'+subjects.map(v=>`<option>${esc(v)}</option>`).join('');
    $('#report-year').innerHTML='<option value="">Pilih tahun</option>'+years.map(v=>`<option value="${v}">Tahun ${v}</option>`).join('');
    $('#report-class').innerHTML='<option value="">Pilih kelas</option>';
  }
  function assignment(role, options={}){
    const wantedRole=String(role).toUpperCase();
    return teacherAssignments.filter(x=>x.role===wantedRole&&(!options.subject||x.subject===String(options.subject).toUpperCase())&&(!options.year||Number(x.year)===Number(options.year))&&(!options.className||x.className===String(options.className).toUpperCase()));
  }
  function teacherNames(items, nameField='teacherName'){return unique(items.map(x=>x[nameField]||x.teacherName)).join(', ')||'Belum ditetapkan';}
  function reportDistributionCells(d){return `<td>${d.TP1}</td><td>${d.TP2}</td><td>${d.TP3}</td><td>${d.TP4}</td><td>${d.TP5}</td><td>${d.TP6}</td>`;}
  function reportHeader(title,meta){return `<header class="formal-report-header"><p>SEKOLAH KEBANGSAAN TEMIN</p><h2>${esc(title)}</h2><span>SESI ${esc(sessionValue())}</span><small>${esc(meta)}</small></header>`;}
  function openFormalReport(title,subtitle,html,reportType=''){ 
    $('#modal-eyebrow').textContent='LAPORAN RASMI PBD';$('#modal-title').textContent=title;$('#modal-subtitle').textContent=subtitle;
    $('#modal-body').innerHTML=`<section id="formal-report" class="formal-report ${esc(reportType)}">${html}</section><button id="btn-print-formal-report" class="btn btn-primary formal-report-print" type="button">🖨️ Cetak / Simpan PDF</button>`;
    document.body.classList.add('formal-report-open');openModal();
  }
  function closeFormalReportMode(){document.body.classList.remove('formal-report-open');}
  function generateSubjectReport(){
    const subject=$('#report-subject').value;if(!subject){alert('Pilih mata pelajaran dahulu.');return;}
    const records=allRecords.filter(r=>r.subject===subject), summary=subjectSummaries(records)[0];if(!summary)return;
    const panelHead=teacherNames(assignment('KETUA PANITIA',{subject}));
    const subjectTeachers=teacherNames(assignment('GURU SUBJEK',{subject}));
    const classGroups=new Map();records.forEach(r=>{const key=`${r.year}|${r.className}`;if(!classGroups.has(key))classGroups.set(key,[]);classGroups.get(key).push(r)});
    const rows=[...classGroups.entries()].map(([key,items])=>{const [year,className]=key.split('|'),d=distribution(items),m=items.filter(isMastered).length,students=new Set(items.map(r=>r.studentName.trim().toUpperCase())).size,teacher=teacherNames(assignment('GURU SUBJEK',{subject,year,className}));return `<tr><td>Tahun ${year}</td><td>${esc(className)}</td><td>${esc(teacher)}</td><td>${students}</td>${reportDistributionCells(d)}<td>${items.length?(m/items.length*100).toFixed(1):'0.0'}%</td></tr>`}).sort((a,b)=>a.localeCompare(b,'ms',{numeric:true})).join('');
    const html=`${reportHeader(`Analisis Mata Pelajaran ${subject}`,`Ketua Panitia: ${panelHead}`)}<div class="formal-meta-grid"><div><small>Ketua Panitia</small><strong>${esc(panelHead)}</strong></div><div><small>Guru Mata Pelajaran</small><strong>${esc(subjectTeachers)}</strong></div><div><small>Jumlah Murid</small><strong>${summary.students}</strong></div><div><small>Peratus Menguasai</small><strong>${summary.masteryRate.toFixed(1)}%</strong></div></div><h3>Rumusan Tahap Penguasaan</h3><table><thead><tr><th>TP1</th><th>TP2</th><th>TP3</th><th>TP4</th><th>TP5</th><th>TP6</th><th>Belum Menguasai</th><th>Menguasai</th></tr></thead><tbody><tr>${reportDistributionCells(summary.distribution)}<td>${summary.notMastered}</td><td>${summary.mastered}</td></tr></tbody></table><h3>Analisis Mengikut Kelas</h3><table><thead><tr><th>Tahun</th><th>Kelas</th><th>Guru Subjek</th><th>Murid</th><th>TP1</th><th>TP2</th><th>TP3</th><th>TP4</th><th>TP5</th><th>TP6</th><th>% Menguasai</th></tr></thead><tbody>${rows}</tbody></table><div class="formal-signature"><div>Disediakan oleh:<br><br><strong>${esc(panelHead)}</strong><br>Ketua Panitia ${esc(subject)}</div><div>Disemak oleh:<br><br>________________________<br>Pentadbir</div></div>`;
    openFormalReport(`Analisis ${subject}`,`${summary.students} murid · ${summary.classes} kelas`,html);
  }
  function generateClassReport(){
    const year=$('#report-year').value,className=$('#report-class').value;if(!year||!className){alert('Pilih tahun dan kelas dahulu.');return;}
    const records=allRecords.filter(r=>Number(r.year)===Number(year)&&r.className===className),summaries=subjectSummaries(records);if(!summaries.length)return;
    const classTeacher=teacherNames(assignment('GURU KELAS',{year,className}));
    const rows=summaries.map(s=>{const teacher=teacherNames(assignment('GURU SUBJEK',{subject:s.subject,year,className}),'teacherShortName');return `<tr><td>${esc(s.subject)}</td><td>${esc(teacher)}</td><td>${s.students}</td>${reportDistributionCells(s.distribution)}<td>${s.masteryRate.toFixed(1)}%</td></tr>`}).join('');
    const studentCount=new Set(records.map(r=>r.studentName.trim().toUpperCase())).size;
    const html=`${reportHeader(`Analisis Kelas Tahun ${year} ${className}`,`Guru Kelas: ${classTeacher}`)}<div class="formal-meta-grid"><div><small>Guru Kelas</small><strong>${esc(classTeacher)}</strong></div><div><small>Jumlah Murid</small><strong>${studentCount}</strong></div><div><small>Jumlah Mata Pelajaran</small><strong>${summaries.length}</strong></div><div><small>Jumlah Rekod Pentaksiran</small><strong>${records.length}</strong></div></div><h3>Rumusan Mata Pelajaran</h3><table><thead><tr><th>Mata Pelajaran</th><th>Guru Subjek</th><th>Murid</th><th>TP1</th><th>TP2</th><th>TP3</th><th>TP4</th><th>TP5</th><th>TP6</th><th>% Menguasai</th></tr></thead><tbody>${rows}</tbody></table><div class="formal-signature"><div>Disediakan oleh:<br><br><strong>${esc(classTeacher)}</strong><br>Guru Kelas Tahun ${esc(year)} ${esc(className)}</div><div>Disemak oleh:<br><br>________________________<br>Pentadbir</div></div>`;
    openFormalReport(`Analisis Tahun ${year} ${className}`,`${studentCount} murid · ${summaries.length} mata pelajaran`,html,'class-report');
  }
  function switchDashboardView(view){
    const wanted=String(view||'utama');
    document.querySelectorAll('.dashboard-view[data-dashboard-view]').forEach(section=>{
      const views=String(section.dataset.dashboardView||'').split(',').map(value=>value.trim());
      section.classList.toggle('hidden',!views.includes(wanted));
    });
    document.querySelectorAll('[data-dashboard-nav]').forEach(button=>button.classList.toggle('active',button.dataset.dashboardNav===wanted));
    document.body.dataset.dashboardView=wanted;
    if (currentSummary && filteredRecords.length) {
      if (wanted === 'utama' || wanted === 'dialog') {
        renderExecutiveSummary(filteredRecords);
        if (wanted === 'dialog') renderDialogPriorities(filteredRecords);
      }
      if (wanted === 'analisis') {
        window.PBDCharts.renderYearChart(studentsByYear(filteredRecords));
        window.PBDCharts.renderTPChart(distribution(filteredRecords),tp=>{window.PBDDashboard.activeTP=tp;showTPDetails(tp)});
      }
    }
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function updateFocusMode(){
    const isFocused = Boolean(filters.subject && filters.classes.size);
    $('#app-screen').classList.toggle('focus-analysis', isFocused);
  }
  function applyFilters(){
    filteredRecords=allRecords.filter(r=>(!filters.subject||r.subject===filters.subject)&&(!filters.year||Number(r.year)===Number(filters.year))&&(!filters.classes.size||filters.classes.has(r.className)));
    renderMetricsFromRecords(filteredRecords);
    if ($('#class-table-body')) renderTable(currentSummary.items,$('#class-search')?.value || '');
    if (document.body.dataset.dashboardView === 'analisis') {
      window.PBDCharts.renderYearChart(studentsByYear(filteredRecords));
      window.PBDCharts.renderTPChart(distribution(filteredRecords),tp=>{window.PBDDashboard.activeTP=tp;showTPDetails(tp)});
    }
    renderSubjectOverview(filteredRecords);
    renderExecutiveSummary(filteredRecords);
    renderDialogPriorities(filteredRecords);
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
    activeStudent={name,year:Number(year),className}; activeStudentAnalysis=analysis; activeInterventions=[];
    const m=analysis.subjects.filter(x=>tpNo(x.tp)>=3),tm=analysis.subjects.filter(x=>tpNo(x.tp)<=2);
    $('#drawer-student-name').textContent=analysis.summary.studentName;
    $('#drawer-student-meta').textContent=`Tahun ${analysis.summary.year||'—'} · ${shortClassLabel(analysis.summary.year,analysis.summary.className)||'—'} · ${analysis.summary.totalSubjects} subjek`;
    $('#student-drawer-body').innerHTML=`<div class="drawer-kpi-grid"><article><small>Menguasai</small><strong>${m.length}</strong><span>TP3–TP6</span></article><article class="attention"><small>Belum Menguasai</small><strong>${tm.length}</strong><span>TP1–TP2</span></article></div><div class="mastery-columns drawer-mastery-columns">${renderSubjectSection('Menguasai (TP3–TP6)',m,'mastered')}${renderSubjectSection('Belum Menguasai (TP1–TP2)',tm,'not-mastered')}</div>`;
    setDrawerTab('achievement');
    closeModal();
    openStudentDrawer();
  }
  function setDrawerTab(tab){ document.querySelectorAll('[data-drawer-tab]').forEach(b=>b.classList.toggle('active',b.dataset.drawerTab===tab)); }
  function sessionValue(){ return String(currentSummary?.school?.metadata?.sessions?.[0] || '').trim(); }
  function achievementMarkup(){
    const a=activeStudentAnalysis;if(!a)return '<div class="empty-state">Tiada murid dipilih.</div>';
    const m=a.subjects.filter(x=>tpNo(x.tp)>=3),tm=a.subjects.filter(x=>tpNo(x.tp)<=2);
    return `<div class="drawer-kpi-grid"><article><small>Menguasai</small><strong>${m.length}</strong><span>TP3–TP6</span></article><article class="attention"><small>Belum Menguasai</small><strong>${tm.length}</strong><span>TP1–TP2</span></article></div><div class="mastery-columns drawer-mastery-columns">${renderSubjectSection('Menguasai (TP3–TP6)',m,'mastered')}${renderSubjectSection('Belum Menguasai (TP1–TP2)',tm,'not-mastered')}</div>`;
  }
  async function loadInterventions(){
    if(!activeStudent)return [];
    const q=new URLSearchParams({action:'interventions',session:sessionValue(),year:String(activeStudent.year),className:activeStudent.className,studentName:activeStudent.name,t:String(Date.now())});
    const response=await fetch(`${window.SAP_TEMIN_API_BASE}?${q}`,{cache:'no-store'});const data=await response.json();if(!data.ok)throw new Error(data.error||'Intervensi gagal dimuatkan.');activeInterventions=data.records||[];return activeInterventions;
  }
  function interventionListMarkup(records){return records.length?`<div class="intervention-history">${records.map(x=>`<article><header><strong>${esc(x.subject)}</strong><span class="intervention-status">${esc(x.status)}</span></header><small>${esc(x.recordDate)} · ${esc(x.teacherName||x.teacherEmail)}</small><p><b>Isu:</b> ${esc(x.issue)}</p><p><b>Tindakan:</b> ${esc(x.interventionAction)}</p>${x.progress?`<p><b>Perkembangan:</b> ${esc(x.progress)}</p>`:''}${x.reviewDate?`<p><b>Semakan:</b> ${esc(x.reviewDate)}</p>`:''}</article>`).join('')}</div>`:'<div class="empty-state">Belum ada rekod intervensi untuk murid ini.</div>'}
  async function showInterventionTab(){
    setDrawerTab('intervention');const body=$('#student-drawer-body');body.innerHTML='<div class="drawer-loading">Memuatkan rekod intervensi…</div>';
    try{await loadInterventions();const subjects=activeStudentAnalysis.subjects.map(x=>x.subject);body.innerHTML=`<form id="intervention-form" class="intervention-form"><h3>Catat Intervensi Baharu</h3><div class="form-grid"><label>Tarikh<input name="recordDate" type="date" required value="${new Date().toISOString().slice(0,10)}"></label><label>Mata Pelajaran<select name="subject" required><option value="">Pilih subjek</option>${subjects.map(x=>`<option>${esc(x)}</option>`).join('')}</select></label><label class="full">Isu/Kemahiran Belum Dikuasai<textarea name="issue" required placeholder="Contoh: Belum menguasai operasi bahagi..."></textarea></label><label class="full">Tindakan Intervensi<textarea name="interventionAction" required placeholder="Contoh: Bimbingan kumpulan kecil dan modul pengukuhan..."></textarea></label><label class="full">Catatan Perkembangan<textarea name="progress" placeholder="Boleh dikemas kini dalam catatan berikutnya"></textarea></label><label>Status<select name="status"><option>BELUM MULA</option><option>SEDANG DILAKSANAKAN</option><option>SELESAI</option></select></label><label>Tarikh Semakan<input name="reviewDate" type="date"></label><label>E-mel DELIMa Guru<input name="teacherEmail" type="email" required value="${esc(localStorage.getItem('sapTeacherEmail')||'')}" placeholder="nama@moe-dl.edu.my"></label><label>PIN Guru<input name="teacherPin" type="password" inputmode="numeric" required placeholder="PIN dalam AKSES_GURU"></label></div><button class="btn btn-primary" type="submit">Simpan Intervensi</button><p id="intervention-form-status" class="form-status"></p></form><section class="intervention-list-section"><h3>Sejarah Intervensi</h3>${interventionListMarkup(activeInterventions)}</section>`;}catch(e){body.innerHTML=`<div class="empty-state">${esc(e.message)}</div>`;}
  }
  async function saveIntervention(form){
    const fd=new FormData(form), status=$('#intervention-form-status');status.textContent='Menyimpan…';
    const payload={action:'save_intervention',session:sessionValue(),year:activeStudent.year,className:activeStudent.className,studentName:activeStudent.name,...Object.fromEntries(fd.entries())};
    localStorage.setItem('sapTeacherEmail',payload.teacherEmail);
    try{const response=await fetch(window.SAP_TEMIN_API_BASE,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)});const data=await response.json();if(!data.ok)throw new Error(data.error||'Gagal menyimpan.');await showInterventionTab();}catch(e){status.textContent=e.message;status.classList.add('error');}
  }
  async function showReportTab(){
    setDrawerTab('report');const body=$('#student-drawer-body');body.innerHTML='<div class="drawer-loading">Menjana laporan murid…</div>';
    try{await loadInterventions();const a=activeStudentAnalysis,m=a.subjects.filter(x=>tpNo(x.tp)>=3),tm=a.subjects.filter(x=>tpNo(x.tp)<=2);body.innerHTML=`<section id="student-report" class="student-report"><header><p>SEKOLAH KEBANGSAAN TEMIN</p><h2>Laporan Pencapaian dan Intervensi PBD</h2><small>Sesi ${esc(sessionValue())}</small></header><dl><div><dt>Nama Murid</dt><dd>${esc(a.summary.studentName)}</dd></div><div><dt>Tahun / Kelas</dt><dd>Tahun ${a.summary.year} · ${esc(shortClassLabel(a.summary.year,a.summary.className))}</dd></div><div><dt>Jumlah Subjek</dt><dd>${a.summary.totalSubjects}</dd></div></dl><h3>Pencapaian Mata Pelajaran</h3><table><thead><tr><th>Mata Pelajaran</th><th>TP</th><th>Status</th></tr></thead><tbody>${a.subjects.map(x=>`<tr><td>${esc(x.subject)}</td><td><strong>${esc(x.tp)}</strong></td><td>${tpNo(x.tp)>=3?'Menguasai':'Belum Menguasai'}</td></tr>`).join('')}</tbody></table><div class="report-summary"><p><b>Menguasai:</b> ${m.length} subjek</p><p><b>Belum Menguasai:</b> ${tm.length} subjek</p></div><h3>Rekod Intervensi</h3>${interventionListMarkup(activeInterventions)}<footer>Dijana pada ${new Date().toLocaleString('ms-MY')} daripada SAP-TEMIN PBD.</footer></section><button id="btn-print-student-report" class="btn btn-primary report-print-btn" type="button">🖨️ Cetak / Simpan PDF</button>`;}catch(e){body.innerHTML=`<div class="empty-state">${esc(e.message)}</div>`;}
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
    $('#btn-presentation').onclick=()=>{switchDashboardView('utama');document.body.classList.toggle('presentation-mode');$('#btn-presentation').textContent=document.body.classList.contains('presentation-mode')?'✕ Keluar Pembentangan':'🖥️ Mod Pembentangan';$('#presentation-summary').scrollIntoView({behavior:'smooth',block:'start'});};
    $('#btn-print-summary').onclick=()=>window.print();
    $('#report-year').onchange=e=>{const year=e.target.value;const classes=unique(allRecords.filter(r=>!year||Number(r.year)===Number(year)).map(r=>r.className));$('#report-class').innerHTML='<option value="">Pilih kelas</option>'+classes.map(v=>`<option>${esc(v)}</option>`).join('');};
    $('#btn-generate-subject-report').onclick=generateSubjectReport;
    $('#btn-generate-class-report').onclick=generateClassReport;
    document.querySelectorAll('[data-dashboard-nav]').forEach(button=>button.onclick=()=>{switchDashboardView(button.dataset.dashboardNav);if(window.matchMedia('(max-width:900px)').matches){document.body.classList.remove('mobile-menu-open');$('#mobile-menu-toggle')?.setAttribute('aria-expanded','false')}});
    $('#sidebar-toggle')?.addEventListener('click',()=>{if(window.matchMedia('(max-width:900px)').matches){document.body.classList.remove('mobile-menu-open');$('#mobile-menu-toggle')?.setAttribute('aria-expanded','false')}else document.body.classList.toggle('sidebar-collapsed')});
    $('#mobile-menu-toggle')?.addEventListener('click',()=>{const open=document.body.classList.toggle('mobile-menu-open');$('#mobile-menu-toggle').setAttribute('aria-expanded',String(open))});
    $('#mobile-nav-backdrop')?.addEventListener('click',()=>{document.body.classList.remove('mobile-menu-open');$('#mobile-menu-toggle')?.setAttribute('aria-expanded','false')});
  }
  function render(summary, assignments=[]){ const view=createViewModel(summary); currentSummary=summary; teacherAssignments=Array.isArray(assignments)?assignments:[]; allRecords=window.PBDAnalysisCore.buildRecords(summary.items); filteredRecords=[...allRecords]; window.SAP_TEMIN_PORTAL_DATA={records:allRecords,teacherAssignments:teacherAssignments,session:view.sessionLabel.replace(/^Sesi\s+/i,'')}; filters.subject=''; filters.year=''; filters.student=''; filters.classes.clear(); $('#welcome-screen').classList.add('hidden'); $('#app-screen').classList.remove('hidden'); $('#session-badge').textContent=view.sessionLabel; populateFilters(allRecords);populateReportControls(allRecords); bindFilters(); switchDashboardView('utama'); applyFilters(); }
  function searchClasses(q){if(currentSummary && $('#class-table-body'))renderTable(currentSummary.items,q)}
  function reset(){currentSummary=null;allRecords=[];filteredRecords=[];selectedAnalysisYear=null;filters.classes.clear();closeModal();closeStudentDrawer();window.PBDCharts.destroyAll?.();subjectComparisonChart?.destroy();subjectComparisonChart=null;$('#app-screen').classList.add('hidden');$('#welcome-screen').classList.remove('hidden')}
  $('#modal-close')?.addEventListener('click',()=>{closeModal();closeFormalReportMode()}); document.querySelector('[data-close-modal]')?.addEventListener('click',()=>{closeModal();closeFormalReportMode()}); $('#student-drawer-close')?.addEventListener('click',closeStudentDrawer); document.querySelector('[data-close-drawer]')?.addEventListener('click',closeStudentDrawer); document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();closeFormalReportMode();closeStudentDrawer();}});
  $('#modal-body')?.addEventListener('input',e=>{if(e.target.matches('#tp-student-search'))renderTPStudentCards(currentTPStudents,window.PBDDashboard.activeTP,e.target.value);if(e.target.matches('#mastery-list-search'))window.PBDDashboard.renderMasteryList?.(e.target.value)});
  $('#student-drawer')?.addEventListener('click',e=>{const tab=e.target.closest('[data-drawer-tab]');if(tab){if(tab.dataset.drawerTab==='achievement'){$('#student-drawer-body').innerHTML=achievementMarkup();setDrawerTab('achievement')}if(tab.dataset.drawerTab==='intervention')showInterventionTab();if(tab.dataset.drawerTab==='report')showReportTab();}if(e.target.closest('#btn-print-student-report'))window.print();});
  $('#student-drawer')?.addEventListener('submit',e=>{if(e.target.matches('#intervention-form')){e.preventDefault();saveIntervention(e.target);}});
  $('#modal-body')?.addEventListener('click',e=>{if(e.target.closest('#btn-print-formal-report'))window.print();});
  document.addEventListener('click',e=>{const subjectCard=e.target.closest('[data-subject-overview]');if(subjectCard){filters.subject=subjectCard.dataset.subjectOverview;$('#filter-subject').value=filters.subject;applyFilters();switchDashboardView('analisis');setTimeout(()=>$('#presentation-summary')?.scrollIntoView({behavior:'smooth',block:'start'}),20);return;}if(e.target.closest('#mastered-summary-card')){showMasteryList(true);return;}if(e.target.closest('#not-mastered-summary-card')){showMasteryList(false);return;}const suggestion=e.target.closest('[data-search-student]');if(suggestion){$('#student-search').value=suggestion.dataset.searchStudent;hideStudentSuggestions();showStudentDetails(suggestion.dataset.searchStudent,suggestion.dataset.searchYear,suggestion.dataset.searchClass);return;}if(!e.target.closest('.student-search-label'))hideStudentSuggestions();const yearButton=e.target.closest('[data-analysis-year]');if(yearButton){selectedAnalysisYear=yearButton.dataset.analysisYear;renderAnalyses(filteredRecords);setTimeout(()=>$('#class-analysis-panel')?.scrollIntoView({behavior:'smooth',block:'start'}),20);return;}if(e.target.closest('#btn-close-class-analysis')){selectedAnalysisYear=null;renderAnalyses(filteredRecords);return;}const b=e.target.closest('[data-student]');if(b)showStudentDetails(b.dataset.student,b.dataset.year,b.dataset.class);if(e.target.closest('[data-back-tp]')&&window.PBDDashboard.activeTP)showTPDetails(window.PBDDashboard.activeTP)});
  window.PBDDashboard={activeTP:null,createViewModel,subjectSummaries,groupRecordsByStudent,render,searchClasses,showTPDetails,closeModal,closeStudentDrawer,reset};
})();
