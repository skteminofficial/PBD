(function () {
  const $ = selector => document.querySelector(selector);

  function toast(message, error = false) {
    const element = $('#toast');
    element.textContent = message;
    element.className = `toast show${error ? ' error' : ''}`;
    setTimeout(() => { element.className = 'toast'; }, 3200);
  }

  function busy(isBusy) {
    ['#btn-import-zip', '#btn-import-files', '#btn-new-import'].forEach(selector => {
      const element = $(selector);
      if (element) element.disabled = isBusy;
    });
  }

  function showImportedData(imported) {
    const summary = window.PBDAnalysis.summarize(imported.results, imported.totalFiles, imported.errors);
    if (!summary.items.length) {
      toast('Tiada fail berjaya diproses.', true);
      return;
    }

    window.PBDDashboard.render(summary);
    toast('Data SPPB berjaya dibaca');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleZip(file) {
    if (!file) return;
    busy(true);
    toast('Sedang membaca ZIP SPPB…');
    try {
      showImportedData(await window.PBDImporter.fromZip(file));
    } catch (error) {
      toast(error.message, true);
    } finally {
      busy(false);
    }
  }

  async function handleFiles(files) {
    if (!files?.length) return;
    busy(true);
    toast('Sedang membaca fail SPPB…');
    try {
      showImportedData(await window.PBDImporter.fromFiles([...files]));
    } catch (error) {
      toast(error.message, true);
    } finally {
      busy(false);
    }
  }

  function resetApplication() {
    window.PBDDashboard.reset();
    $('#zip-input').value = '';
    $('#files-input').value = '';
  }

  $('#btn-import-zip').addEventListener('click', () => $('#zip-input').click());
  $('#btn-import-files').addEventListener('click', () => $('#files-input').click());
  $('#zip-input').addEventListener('change', event => handleZip(event.target.files[0]));
  $('#files-input').addEventListener('change', event => handleFiles(event.target.files));
  $('#class-search')?.addEventListener('input', event => window.PBDDashboard.searchClasses(event.target.value));

  const dropZone = $('#drop-zone');
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, event => {
      event.preventDefault();
      dropZone.classList.add('dragover');
    });
  });
  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, event => {
      event.preventDefault();
      dropZone.classList.remove('dragover');
    });
  });
  dropZone.addEventListener('drop', event => {
    const files = [...event.dataTransfer.files];
    const zip = files.find(file => file.name.toLowerCase().endsWith('.zip'));
    zip ? handleZip(zip) : handleFiles(files);
  });
})();
