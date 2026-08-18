(function () {
  function getClassAnalysis(items, className, year = null) {
    const core = window.PBDAnalysisCore;
    const wantedClass = String(className || '').trim().toUpperCase();
    if (!wantedClass) throw new Error('Nama kelas diperlukan.');
    const filteredItems = items.filter(item =>
      String(item.className || '').trim().toUpperCase() === wantedClass &&
      (year === null || year === undefined || Number(item.year) === Number(year))
    );
    const records = core.buildRecords(filteredItems);
    const stats = core.tpStats(records);
    const displayName = filteredItems[0]?.className || className;

    return {
      type: 'class',
      key: `${year || ''}|${displayName}`,
      title: `Analisis Kelas ${displayName}`,
      summary: {
        totalStudents: core.countUniqueStudents(records),
        totalAssessmentRecords: records.length,
        totalSubjects: core.unique(records.map(record => record.subject)).length,
        year: filteredItems[0]?.year || Number(year) || null
      },
      tpDistribution: stats.distribution,
      mastery: stats.mastery,
      uniqueStudentsByTP: stats.uniqueStudentsByTP,
      detailsByTP: stats.details
    };
  }
  window.PBDClassAnalysis = { getClassAnalysis };
})();
