(function () {
  function countUniqueStudents(records) {
    return new Set((records || []).map(record => record.studentKey).filter(Boolean)).size;
  }
  function findStudentsByTP(records, tp) {
    const normalizedTP = window.SAPCoreFormatter.normalizeTP(tp);
    if (!normalizedTP) return [];
    return (records || []).filter(record => record.tp === normalizedTP);
  }
  function uniqueStudentList(records) {
    const seen = new Set();
    return (records || []).filter(record => {
      if (!record.studentKey || seen.has(record.studentKey)) return false;
      seen.add(record.studentKey);
      return true;
    }).map(record => ({
      studentKey: record.studentKey,
      studentName: record.studentName,
      year: record.year,
      className: record.className
    }));
  }
  window.SAPCoreStudents = { countUniqueStudents, findStudentsByTP, uniqueStudentList };
})();
