(function () {
  const API_URL = 'https://script.google.com/macros/s/AKfycbzhqOIoNgLjJy1K4k4NeOoqBspvBZZK6qA28Jwy6EvI7usHvJq_weWol9mQw3BkNXgbgQ/exec?action=dataset';
  window.SAP_TEMIN_API_BASE = API_URL.replace(/\?action=dataset$/, '');
  const $ = selector => document.querySelector(selector);

  function toast(message, error = false) {
    const element = $('#toast');
    element.textContent = message;
    element.className = `toast show${error ? ' error' : ''}`;
    setTimeout(() => { element.className = 'toast'; }, 3600);
  }

  function setLoading(message, detail, failed = false) {
    $('#load-status').textContent = message;
    $('#load-detail').textContent = detail || '';
    $('.loader-ring').classList.toggle('hidden', failed);
    $('#btn-retry').classList.toggle('hidden', !failed);
  }

  function datasetToImported(data) {
    const classes = new Map();
    for (const record of data.records || []) {
      const key = `${record.year}|${record.className}`;
      if (!classes.has(key)) {
        classes.set(key, {
          year: Number(record.year), className: record.className, session: String(data.session),
          fileName: `Data pusat · Tahun ${record.year} ${record.className}`,
          subjects: new Set(), students: new Map()
        });
      }
      const item = classes.get(key);
      item.subjects.add(record.subject);
      if (!item.students.has(record.studentId)) {
        item.students.set(record.studentId, {name: record.studentId, gender: record.gender || '', subjects: {}});
      }
      item.students.get(record.studentId).subjects[record.subject] = record.tp;
    }
    const results = [...classes.values()].map(item => ({
      year: item.year,
      className: item.className,
      session: item.session,
      fileName: item.fileName,
      studentCount: item.students.size,
      subjects: [...item.subjects],
      students: [...item.students.values()]
    }));
    return {results, errors: [], totalFiles: results.length};
  }

  async function loadCentralData() {
    setLoading('Memuatkan analisis terkini…', 'Menghubungi pangkalan data SAP-TEMIN');
    try {
      const response = await fetch(`${API_URL}&t=${Date.now()}`, {cache: 'no-store'});
      if (!response.ok) throw new Error(`Pelayan memberi status ${response.status}`);
      const data = await response.json();
      if (!data.ok) throw new Error(data.error || 'API tidak memulangkan data yang sah.');
      if (!Array.isArray(data.records) || !data.records.length) throw new Error('Data sesi aktif masih kosong.');
      const imported = datasetToImported(data);
      const summary = window.PBDAnalysis.summarize(imported.results, imported.totalFiles, imported.errors);
      if (!summary.items.length) throw new Error('Data pusat tidak dapat dibentuk menjadi analisis.');
      window.PBDDashboard.render(summary, data.teacherAssignments || []);
      window.dispatchEvent(new CustomEvent('sap-data-ready',{detail:{records:window.SAP_TEMIN_PORTAL_DATA?.records||[],teacherAssignments:data.teacherAssignments||[],session:String(data.session||''),activity:data.activity||'',updatedAt:data.updatedAt||''}}));
      $('#presentation-session').textContent = `SESI ${data.session || '—'}`;
      $('#presentation-subtitle').textContent = `${data.activity || 'Pentaksiran Bilik Darjah'} · data iDMe dikemas kini secara berpusat.`;
      const updated = data.updatedAt ? new Date(data.updatedAt).toLocaleString('ms-MY', {timeZone:'Asia/Kuala_Lumpur'}) : 'Tidak diketahui';
      $('#updated-at').textContent = `Dikemas kini ${updated}`;
      toast(`${summary.students} murid · ${summary.items.length} kelas · data pusat berjaya dimuatkan`);
      window.scrollTo({top:0,behavior:'smooth'});
    } catch (error) {
      setLoading('Data tidak dapat dimuatkan', error.message, true);
      toast(error.message, true);
    }
  }

  $('#btn-retry').addEventListener('click', loadCentralData);
  loadCentralData();
})();
