(function () {
  function getStudentAnalysis(items, studentName, filters = {}) {
    const core = window.PBDAnalysisCore;
    const wantedName = String(studentName || '').trim().toUpperCase();
    if (!wantedName) throw new Error('Nama murid diperlukan.');
    let records = core.buildRecords(items).filter(record => record.studentName.trim().toUpperCase() === wantedName);
    if (filters.year) records = records.filter(record => record.year === Number(filters.year));
    if (filters.className) records = records.filter(record => record.className.trim().toUpperCase() === String(filters.className).trim().toUpperCase());
    records.sort((a, b) => a.subject.localeCompare(b.subject, 'ms'));
    const distribution = core.distributionFrom(records);

    return {
      type: 'student',
      key: wantedName,
      title: `Analisis Murid: ${records[0]?.studentName || studentName}`,
      summary: {
        studentName: records[0]?.studentName || studentName,
        year: records[0]?.year || Number(filters.year) || null,
        className: records[0]?.className || filters.className || null,
        totalSubjects: records.length
      },
      tpDistribution: distribution,
      mastery: core.masteryFrom(distribution),
      subjects: records.map(record => ({ subject: record.subject, tp: record.tp })),
      records
    };
  }
  window.PBDStudentAnalysis = { getStudentAnalysis };
})();
