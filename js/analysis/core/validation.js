(function () {
  function validateItems(items) {
    if (!Array.isArray(items)) throw new TypeError('Data import mesti dalam bentuk senarai.');
    return true;
  }
  function validateYear(year) {
    const value = Number(year);
    if (!Number.isInteger(value) || value < 1 || value > 6) throw new Error('Tahun mesti antara 1 hingga 6.');
    return value;
  }
  function validateStage(stage) {
    const value = Number(stage);
    if (![1, 2].includes(value)) throw new Error('Tahap mesti 1 atau 2.');
    return value;
  }
  function validateRequiredText(value, label) {
    const text = String(value ?? '').trim();
    if (!text) throw new Error(`${label} diperlukan.`);
    return text;
  }
  window.SAPCoreValidation = { validateItems, validateYear, validateStage, validateRequiredText };
})();
