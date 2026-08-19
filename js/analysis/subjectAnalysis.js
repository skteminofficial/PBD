(function () {
  function getSubjectAnalysis(items, subject, filters = {}) {
    const core = window.PBDAnalysisCore;
    const wantedSubject = String(subject || '').trim().toUpperCase();
    if (!wantedSubject) throw new Error('Mata pelajaran diperlukan.');
    let records = core.buildRecords(items).filter(record => record.subject.trim().toUpperCase() === wantedSubject);
    if (filters.stage) records = records.filter(record => record.stage === Number(filters.stage));
    if (filters.year) records = records.filter(record => record.year === Number(filters.year));
    if (filters.className) records = records.filter(record => record.className.trim().toUpperCase() === String(filters.className).trim().toUpperCase());
    const stats = core.tpStats(records);
    const displaySubject = records[0]?.subject || subject;

    return {
      type: 'subject',
      key: displaySubject,
      title: `Analisis ${displaySubject}`,
      filters: { ...filters },
      summary: {
        totalStudents: core.countUniqueStudents(records),
        totalAssessmentRecords: records.length,
        totalClasses: new Set(records.map(record => `${record.year}|${record.className}`)).size,
        years: core.naturalSort(core.unique(records.map(record => record.year)))
      },
      tpDistribution: stats.distribution,
      mastery: stats.mastery,
      uniqueStudentsByTP: stats.uniqueStudentsByTP,
      detailsByTP: stats.details
    };
  }
  window.PBDSubjectAnalysis = { getSubjectAnalysis };
})();
