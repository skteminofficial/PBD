(function () {
  function getStage(year) {
    const numericYear = Number(year);
    if (numericYear >= 1 && numericYear <= 3) return 1;
    if (numericYear >= 4 && numericYear <= 6) return 2;
    return null;
  }
  function buildRecords(items) {
    window.SAPCoreValidation.validateItems(items);
    const records = [];
    items.forEach((classItem, classIndex) => {
      const year = Number(classItem.year) || null;
      const stage = getStage(year);
      const className = classItem.className || 'Tidak Diketahui';
      const session = classItem.session || null;
      const fileName = classItem.fileName || null;
      (classItem.students || []).forEach((student, studentIndex) => {
        const studentName = window.SAPCoreFormatter.normalizeText(student.name);
        const studentKey = `${year || 'x'}|${className}|${studentName.toUpperCase()}`;
        Object.entries(student.subjects || {}).forEach(([subject, value]) => {
          const tp = window.SAPCoreFormatter.normalizeTP(value);
          if (!tp) return;
          records.push({
            recordId: `${classIndex}-${studentIndex}-${subject}`,
            studentKey,
            studentName,
            year,
            stage,
            className,
            subject: window.SAPCoreFormatter.normalizeText(subject),
            tp,
            session,
            fileName
          });
        });
      });
    });
    return records;
  }
  window.SAPCoreRecords = { getStage, buildRecords };
})();
