(function () {
  function masteryFrom(distribution) {
    const belumMenguasai = Number(distribution?.TP1 || 0) + Number(distribution?.TP2 || 0);
    const menguasai = Number(distribution?.TP3 || 0) + Number(distribution?.TP4 || 0) + Number(distribution?.TP5 || 0) + Number(distribution?.TP6 || 0);
    const jumlahRekod = belumMenguasai + menguasai;
    return {
      belumMenguasai,
      menguasai,
      jumlahRekod,
      peratusBelumMenguasai: jumlahRekod ? Number(((belumMenguasai / jumlahRekod) * 100).toFixed(1)) : 0,
      peratusMenguasai: jumlahRekod ? Number(((menguasai / jumlahRekod) * 100).toFixed(1)) : 0
    };
  }
  window.SAPCoreMastery = { masteryFrom };
})();
