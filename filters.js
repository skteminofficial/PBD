(function () {
  function applyFilters(records, filters = {}) {
    return (records || []).filter(record => {
      if (filters.stage && record.stage !== Number(filters.stage)) return false;
      if (filters.year && record.year !== Number(filters.year)) return false;
      if (filters.className && record.className.trim().toUpperCase() !== String(filters.className).trim().toUpperCase()) return false;
      if (filters.subject && record.subject.trim().toUpperCase() !== String(filters.subject).trim().toUpperCase()) return false;
      if (filters.studentName && record.studentName.trim().toUpperCase() !== String(filters.studentName).trim().toUpperCase()) return false;
      if (filters.tp && record.tp !== window.SAPCoreFormatter.normalizeTP(filters.tp)) return false;
      return true;
    });
  }
  function buildFilterOptions(records) {
    const c = window.SAPCoreCollections;
    return {
      stages: c.naturalSort(c.unique((records || []).map(r => r.stage))),
      years: c.naturalSort(c.unique((records || []).map(r => r.year))),
      classes: c.naturalSort(c.unique((records || []).map(r => r.className))),
      subjects: c.naturalSort(c.unique((records || []).map(r => r.subject)))
    };
  }
  window.SAPCoreFilters = { applyFilters, buildFilterOptions };
})();
