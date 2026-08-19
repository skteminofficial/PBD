(function () {
  function unique(values) {
    return [...new Set((values || []).filter(value => value !== null && value !== undefined && value !== ''))];
  }
  function naturalSort(values) {
    return [...(values || [])].sort((a, b) => String(a).localeCompare(String(b), 'ms', { numeric: true, sensitivity: 'base' }));
  }
  function groupBy(records, selector) {
    return (records || []).reduce((groups, record) => {
      const key = typeof selector === 'function' ? selector(record) : record?.[selector];
      const normalizedKey = key === null || key === undefined || key === '' ? 'Tidak Diketahui' : key;
      (groups[normalizedKey] ||= []).push(record);
      return groups;
    }, {});
  }
  window.SAPCoreCollections = { unique, naturalSort, groupBy };
})();
