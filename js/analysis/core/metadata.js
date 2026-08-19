(function () {
  function buildMetadata(items, records, metadata = {}) {
    const c = window.SAPCoreCollections;
    return {
      totalFiles: metadata.totalFiles ?? items.length,
      failedFiles: metadata.failedFiles ?? 0,
      importedAt: metadata.importedAt || new Date().toISOString(),
      years: c.naturalSort(c.unique((records || []).map(r => r.year))),
      sessions: c.naturalSort(c.unique((records || []).map(r => r.session))),
      subjects: c.naturalSort(c.unique((records || []).map(r => r.subject))),
      classes: c.naturalSort(c.unique((records || []).map(r => r.className)))
    };
  }
  window.SAPCoreMetadata = { buildMetadata };
})();
