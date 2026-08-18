(function () {
  const { TP_KEYS } = window.SAPCoreConstants;
  function emptyDistribution() {
    return Object.fromEntries(TP_KEYS.map(tp => [tp, 0]));
  }
  function distributionFrom(records) {
    const distribution = emptyDistribution();
    (records || []).forEach(record => {
      if (Object.prototype.hasOwnProperty.call(distribution, record.tp)) distribution[record.tp] += 1;
    });
    return distribution;
  }
  function percentageDistribution(distribution) {
    const total = TP_KEYS.reduce((sum, tp) => sum + Number(distribution?.[tp] || 0), 0);
    return Object.fromEntries(TP_KEYS.map(tp => [tp, total ? Number(((Number(distribution?.[tp] || 0) / total) * 100).toFixed(1)) : 0]));
  }
  function groupDetailsByTP(records) {
    const details = Object.fromEntries(TP_KEYS.map(tp => [tp, []]));
    (records || []).forEach(record => {
      if (details[record.tp]) details[record.tp].push({ ...record });
    });
    TP_KEYS.forEach(tp => details[tp].sort((a, b) =>
      (a.year || 0) - (b.year || 0) ||
      a.className.localeCompare(b.className, 'ms', { numeric: true }) ||
      a.studentName.localeCompare(b.studentName, 'ms') ||
      a.subject.localeCompare(b.subject, 'ms')
    ));
    return details;
  }
  window.SAPCoreDistribution = { emptyDistribution, distributionFrom, percentageDistribution, groupDetailsByTP };
})();
