(function () {
  const TP_KEYS = window.SAPCoreConstants.TP_KEYS;
  function tpStats(records) {
    const distribution = window.SAPCoreDistribution.distributionFrom(records);
    const details = window.SAPCoreDistribution.groupDetailsByTP(records);
    const uniqueStudentsByTP = Object.fromEntries(TP_KEYS.map(tp => [tp, window.SAPCoreStudents.countUniqueStudents(details[tp])]));
    return {
      distribution,
      percentageDistribution: window.SAPCoreDistribution.percentageDistribution(distribution),
      mastery: window.SAPCoreMastery.masteryFrom(distribution),
      uniqueStudentsByTP,
      details
    };
  }
  window.PBDAnalysisCore = {
    ...window.SAPCoreConstants,
    ...window.SAPCoreFormatter,
    ...window.SAPCoreValidation,
    ...window.SAPCoreCollections,
    ...window.SAPCoreRecords,
    ...window.SAPCoreStudents,
    ...window.SAPCoreDistribution,
    ...window.SAPCoreMastery,
    ...window.SAPCoreStatistics,
    ...window.SAPCoreFilters,
    ...window.SAPCoreMetadata,
    tpStats
  };
})();
