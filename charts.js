(function () {
  let yearChart = null;
  let tpChart = null;

  function destroy(chart) {
    if (chart) chart.destroy();
    return null;
  }

  function destroyAll() {
    yearChart = destroy(yearChart);
    tpChart = destroy(tpChart);
  }

  function renderYearChart(studentsByYear) {
    const context = document.getElementById('year-chart');
    yearChart = destroy(yearChart);

    const keys = Object.keys(studentsByYear).sort((a, b) => Number(a) - Number(b));
    const labels = keys.map(year => year === 'Lain' ? 'Lain-lain' : `Tahun ${year}`);
    const values = keys.map(year => studentsByYear[year]);

    yearChart = new Chart(context, {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Bilangan Murid', data: values, backgroundColor: ['#2563eb','#7c3aed','#0891b2','#059669','#d97706','#475569'], borderRadius: 8, maxBarThickness: 55 }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#e9eff6' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  function renderTPChart(distribution, onSelect) {
    const context = document.getElementById('tp-chart');
    tpChart = destroy(tpChart);
    const labels = ['TP1', 'TP2', 'TP3', 'TP4', 'TP5', 'TP6'];
    const values = labels.map(tp => Number(distribution?.[tp] || 0));

    tpChart = new Chart(context, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Rekod Pentaksiran',
          data: values,
          backgroundColor: ['#dc5a5a', '#e58b4a', '#e6b83f', '#56a36c', '#14b8a6', '#6757b8'],
          borderRadius: 8,
          maxBarThickness: 62
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onHover(event, elements) {
          event.native.target.style.cursor = elements.length ? 'pointer' : 'default';
        },
        onClick(event, elements) {
          if (!elements.length) return;
          const tp = labels[elements[0].index];
          onSelect?.(tp);
        },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { afterLabel: () => 'Klik untuk lihat senarai murid' } }
        },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#e9eff6' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  window.PBDCharts = { renderYearChart, renderTPChart, destroyAll };
})();
