(function () {
  function getYearAnalysis(items, year) {
    const core = window.PBDAnalysisCore;
    const selectedYear = Number(year);
    if (!(selectedYear >= 1 && selectedYear <= 6)) throw new Error('Tahun mesti antara 1 hingga 6.');
    const filteredItems = items.filter(item => Number(item.year) === selectedYear);
    const records = core.buildRecords(filteredItems);
    const stats = core.tpStats(records);

    return {
      type: 'year',
      key: selectedYear,
      title: `Analisis Tahun ${selectedYear}`,
      summary: {
        totalStudents: core.countUniqueStudents(records),
        totalClasses: new Set(filteredItems.map(item => item.className)).size,
        totalAssessmentRecords: records.length,
        totalSubjects: core.unique(records.map(record => record.subject)).length
      },
      tpDistribution: stats.distribution,
      mastery: stats.mastery,
      uniqueStudentsByTP: stats.uniqueStudentsByTP,
      detailsByTP: stats.details
    };
  }
  window.PBDYearAnalysis = { getYearAnalysis };
})();
