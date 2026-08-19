(function () {
  function getSchoolAnalysis(items, metadata = {}) {
    const core = window.PBDAnalysisCore;
    const records = core.buildRecords(items);
    const stats = core.tpStats(records);
    const studentKeys = new Set();
    const classKeys = new Set();
    const subjects = [];
    const years = [];
    const sessions = [];
    const studentsByYear = {};

    items.forEach(item => {
      const year = Number(item.year) || null;
      const className = item.className || 'Tidak Diketahui';
      classKeys.add(`${year || 'x'}|${className}`);
      if (year) years.push(year);
      if (item.session) sessions.push(item.session);
      (item.subjects || []).forEach(subject => subjects.push(subject));
      const itemStudentKeys = new Set();
      (item.students || []).forEach(student => {
        const normalizedName = String(student.name || '').trim().toUpperCase();
        const studentKey = `${year || 'x'}|${className}|${normalizedName}`;
        studentKeys.add(studentKey);
        itemStudentKeys.add(studentKey);
      });
      const yearKey = year || 'Lain';
      studentsByYear[yearKey] = (studentsByYear[yearKey] || 0) + itemStudentKeys.size;
    });

    const stage1Students = new Set(records.filter(r => r.stage === 1).map(r => r.studentKey)).size;
    const stage2Students = new Set(records.filter(r => r.stage === 2).map(r => r.studentKey)).size;

    return {
      type: 'school',
      title: 'Analisis Sekolah',
      summary: {
        totalStudents: studentKeys.size,
        totalClasses: classKeys.size,
        stage1Students,
        stage2Students,
        totalAssessmentRecords: records.length,
        totalSubjects: core.unique(subjects).length,
        studentsByYear
      },
      tpDistribution: stats.distribution,
      mastery: stats.mastery,
      uniqueStudentsByTP: stats.uniqueStudentsByTP,
      detailsByTP: stats.details,
      metadata: {
        totalFiles: metadata.totalFiles ?? items.length,
        failedFiles: metadata.failedFiles ?? 0,
        importedAt: metadata.importedAt || new Date().toISOString(),
        years: core.naturalSort(core.unique(years)),
        sessions: core.naturalSort(core.unique(sessions)),
        subjects: core.naturalSort(core.unique(subjects))
      }
    };
  }

  window.PBDSchoolAnalysis = { getSchoolAnalysis };
})();
