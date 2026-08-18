(function () {
  const TP_KEYS = Object.freeze(['TP1', 'TP2', 'TP3', 'TP4', 'TP5', 'TP6']);
  const MASTERY_MIN_TP = 3;
  const STAGES = Object.freeze({ 1: Object.freeze([1, 2, 3]), 2: Object.freeze([4, 5, 6]) });
  window.SAPCoreConstants = { TP_KEYS, MASTERY_MIN_TP, STAGES };
})();
