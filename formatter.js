(function () {
  function normalizeText(value) {
    return String(value ?? '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function normalizeTP(value) {
    const match = normalizeText(value).toUpperCase().replace(/\s+/g, '').match(/^TP([1-6])$/);
    return match ? `TP${match[1]}` : null;
  }
  function formatPercentage(value, digits = 1) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '0%';
    return `${number.toFixed(digits).replace(/\.0+$/, '')}%`;
  }
  function formatDate(value, locale = 'ms-MY') {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  }
  window.SAPCoreFormatter = { normalizeText, normalizeTP, formatPercentage, formatDate };
})();
