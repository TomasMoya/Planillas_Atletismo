const dropzone    = document.getElementById('dropzone');
const fileInput   = document.getElementById('fileInput');
const fileList    = document.getElementById('fileList');
const filesUl     = document.getElementById('filesUl');
const actionArea  = document.getElementById('actionArea');
const btnProcess  = document.getElementById('btnProcess');
const btnClear    = document.getElementById('btnClear');
const loader      = document.getElementById('loader');
const result      = document.getElementById('result');
const btnDownload = document.getElementById('btnDownload');
const btnRestart  = document.getElementById('btnRestart');
const errorBox    = document.getElementById('errorBox');
const errorMsg    = document.getElementById('errorMsg');
const btnRetry    = document.getElementById('btnRetry');
const dropzoneIdle = document.getElementById('dropzoneIdle');

let selectedFiles = [];

// ── Drag & drop ──
dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
});

dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
});

dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.xlsx'));
    if (files.length) addFiles(files);
});

dropzone.addEventListener('click', (e) => {
    if (e.target === dropzone || e.target.closest('.dropzone-idle')) {
        if (!e.target.closest('.btn-select')) {
            fileInput.click();
        }
    }
});

fileInput.addEventListener('change', () => {
    const files = Array.from(fileInput.files);
    if (files.length) addFiles(files);
    fileInput.value = '';
});

// ── File management ──
function addFiles(files) {
    const existing = new Set(selectedFiles.map(f => f.name));
    files.forEach(f => { if (!existing.has(f.name)) selectedFiles.push(f); });
    renderFileList();
}

function renderFileList() {
    filesUl.innerHTML = '';
    selectedFiles.forEach(f => {
        const li = document.createElement('li');
        li.className = 'file-item';
        li.innerHTML = `
            <span>${f.name}</span>
            <span class="file-size">${formatSize(f.size)}</span>
        `;
        filesUl.appendChild(li);
    });

    const hasFiles = selectedFiles.length > 0;
    fileList.style.display   = hasFiles ? 'block' : 'none';
    actionArea.style.display = hasFiles ? 'block' : 'none';
    dropzoneIdle.style.display = hasFiles ? 'none' : 'flex';
}

function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

btnClear.addEventListener('click', () => {
    selectedFiles = [];
    renderFileList();
});

// ── Process ──
btnProcess.addEventListener('click', processFiles);

async function processFiles() {
    if (!selectedFiles.length) return;

    showState('loader');

    const formData = new FormData();
    selectedFiles.forEach(f => formData.append('Planillas', f));

    try {
        const response = await fetch('http://localhost:3000/procesar', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || `Error ${response.status}`);
        }

        const blob = await response.blob();
        const url  = URL.createObjectURL(blob);
        btnDownload.href = url;

        showState('result');

    } catch (err) {
        errorMsg.textContent = err.message || 'No se pudo conectar con el servidor.';
        showState('error');
    }
}

// ── State machine ──
function showState(state) {
    loader.style.display   = 'none';
    result.style.display   = 'none';
    errorBox.style.display = 'none';
    dropzone.style.display = 'block';
    fileList.style.display = selectedFiles.length ? 'block' : 'none';
    actionArea.style.display = selectedFiles.length ? 'block' : 'none';

    if (state === 'loader') {
        loader.style.display     = 'flex';
        dropzone.style.display   = 'none';
        fileList.style.display   = 'none';
        actionArea.style.display = 'none';
    } else if (state === 'result') {
        result.style.display     = 'flex';
        dropzone.style.display   = 'none';
        fileList.style.display   = 'none';
        actionArea.style.display = 'none';
    } else if (state === 'error') {
        errorBox.style.display   = 'flex';
        dropzone.style.display   = 'none';
        fileList.style.display   = 'none';
        actionArea.style.display = 'none';
    }
}

// ── Reset ──
btnRestart.addEventListener('click', reset);
btnRetry.addEventListener('click', reset);

function reset() {
    selectedFiles = [];
    renderFileList();
    showState('idle');
    dropzone.style.display = 'block';
    dropzoneIdle.style.display = 'flex';
}
