(function () {
  function summarize(items, totalFiles, errors = []) {
    const school = window.PBDSchoolAnalysis.getSchoolAnalysis(items, {
      totalFiles,
      failedFiles: errors.length,
      importedAt: new Date().toISOString()
    });

    const byYear = {};
    items.forEach(item => {
      const key = item.year || 'Lain';
      byYear[key] = (byYear[key] || 0) + (item.studentCount || (item.students || []).length || 0);
    });

    return {
      files: totalFiles,
      classes: items.length,
      students: items.reduce((total, item) => total + (item.studentCount || (item.students || []).length || 0), 0),
      subjects: school.metadata.subjects,
      years: school.metadata.years,
      sessions: school.metadata.sessions,
      byYear,
      items,
      errors,
      school
    };
  }

  window.PBDAnalysis = {
    summarize,
    getSchool: window.PBDSchoolAnalysis.getSchoolAnalysis,
    getStage: window.PBDStageAnalysis.getStageAnalysis,
    getYear: window.PBDYearAnalysis.getYearAnalysis,
    getClass: window.PBDClassAnalysis.getClassAnalysis,
    getSubject: window.PBDSubjectAnalysis.getSubjectAnalysis,
    getStudent: window.PBDStudentAnalysis.getStudentAnalysis
  };
})();
