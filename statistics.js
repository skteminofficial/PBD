(function () {
  function countRecords(records) { return (records || []).length; }
  function countClasses(records) { return new Set((records || []).map(r => `${r.year || 'x'}|${r.className}`)).size; }
  function countSubjects(records) { return window.SAPCoreCollections.unique((records || []).map(r => r.subject)).length; }
  function buildSummary(records) {
    return {
      totalStudents: window.SAPCoreStudents.countUniqueStudents(records),
      totalClasses: countClasses(records),
      totalSubjects: countSubjects(records),
      totalAssessmentRecords: countRecords(records)
    };
  }
  window.SAPCoreStatistics = { countRecords, countClasses, countSubjects, buildSummary };
})();
