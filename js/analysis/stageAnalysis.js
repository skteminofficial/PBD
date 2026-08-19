(function () {
  function getStageAnalysis(items, stage) {
    const core = window.PBDAnalysisCore;
    const stageNumber = Number(stage);
    if (![1, 2].includes(stageNumber)) throw new Error('Tahap mesti 1 atau 2.');
    const filteredItems = items.filter(item => core.getStage(item.year) === stageNumber);
    const records = core.buildRecords(filteredItems);
    const stats = core.tpStats(records);

    return {
      type: 'stage',
      key: stageNumber,
      title: `Analisis Tahap ${stageNumber}`,
      summary: {
        totalStudents: core.countUniqueStudents(records),
        totalClasses: new Set(filteredItems.map(item => `${item.year}|${item.className}`)).size,
        totalAssessmentRecords: records.length,
        years: core.naturalSort(core.unique(filteredItems.map(item => Number(item.year)).filter(Boolean)))
      },
      tpDistribution: stats.distribution,
      mastery: stats.mastery,
      uniqueStudentsByTP: stats.uniqueStudentsByTP,
      detailsByTP: stats.details
    };
  }
  window.PBDStageAnalysis = { getStageAnalysis };
})();
