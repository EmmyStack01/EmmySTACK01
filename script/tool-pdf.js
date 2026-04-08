/**
 * EmmySign Master JS - Final Production V3.5
 * FEATURES: Pagination, Multi-Color, Movement Grips, Extreme Zoom, Micro-Scaling, and PDF Export.
 * Author: Emmy STACK01
 */

// --- Global State ---
let pdfDoc = null;
let currentPage = 1;
let currentPdfBytes = null; 
let pdfScale = 1.0; 
let signatures = []; 
let textFields = []; 
let currentStrokeColor = "#000000";
let currentFont = "sans-serif";

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. PDF LOADING ---
    const pdfUpload = document.getElementById('pdf-upload');
    if (pdfUpload) {
        pdfUpload.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const buffer = await file.arrayBuffer();
            currentPdfBytes = new Uint8Array(buffer.slice(0)); 
            const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(currentPdfBytes.slice(0)) });
            pdfDoc = await loadingTask.promise;
            document.getElementById('total-pages').textContent = pdfDoc.numPages;
            renderPage(1);
        });
    }

    // --- 2. SIGNATURE PAD LOGIC ---
    const sigPad = document.getElementById('sig-pad');
    const sigCtx = sigPad ? sigPad.getContext('2d') : null;
    let isDrawing = false;

    if (sigPad) {
        const getPos = (e) => {
            const rect = sigPad.getBoundingClientRect();
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);
            return {
                x: (clientX - rect.left) * (sigPad.width / rect.width),
                y: (clientY - rect.top) * (sigPad.height / rect.height)
            };
        };

        sigPad.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
        sigPad.onpointerdown = (e) => {
            isDrawing = true;
            const pos = getPos(e);
            sigCtx.beginPath();
            sigCtx.strokeStyle = currentStrokeColor;
            sigCtx.lineWidth = 3;
            sigCtx.lineCap = "round";
            sigCtx.moveTo(pos.x, pos.y);
            sigPad.setPointerCapture(e.pointerId);
        };
        sigPad.onpointermove = (e) => {
            if (!isDrawing) return;
            const pos = getPos(e);
            sigCtx.lineTo(pos.x, pos.y);
            sigCtx.stroke();
        };
        window.addEventListener('pointerup', () => isDrawing = false);
    }

    // --- 3. UI BUTTONS (SIGN, TEXT, DATE, DOWNLOAD, NAVIGATION) ---
    
    // Create Signature Modal
    document.getElementById('open-sig-btn').onclick = () => {
        document.getElementById('sig-modal').style.display = 'flex';
        document.body.style.overflow = 'hidden'; 
    };

    document.getElementById('save-sig-btn').onclick = () => {
        const dataURL = sigPad.toDataURL();
        signatures.push({ 
            id: Date.now(), dataURL: dataURL, page: currentPage, 
            left: 50, top: 50, width: 100, height: 50 
        });
        renderAllElements();
        closeModal();
    };

    document.getElementById('add-text-btn').onclick = () => {
        textFields.push({ id: Date.now(), text: "Type...", page: currentPage, left: 50, top: 50, width: 80, height: 30, color: currentStrokeColor, font: currentFont });
        renderAllElements();
    };

    document.getElementById('add-date-btn').onclick = () => {
        const today = new Date().toLocaleDateString('en-GB'); 
        textFields.push({ id: Date.now(), text: today, page: currentPage, left: 50, top: 120, width: 80, height: 30, color: currentStrokeColor, font: currentFont });
        renderAllElements();
    };

    // Pagination
    document.getElementById('prev-page').onclick = () => { if (currentPage > 1) renderPage(currentPage - 1); };
    document.getElementById('next-page').onclick = () => { if (currentPage < pdfDoc.numPages) renderPage(currentPage + 1); };

    // Export & Utils
    document.getElementById('download-btn').onclick = handleDownload;
    document.getElementById('clear-pad').onclick = () => sigCtx.clearRect(0,0,sigPad.width,sigPad.height);
    document.getElementById('close-modal').onclick = closeModal;
});

// --- 4. ENGINE: RENDERING & INTERACTION ---

async function renderPage(num) {
    if (!pdfDoc || num < 1 || num > pdfDoc.numPages) return;
    currentPage = num;
    const page = await pdfDoc.getPage(num);
    const canvas = document.getElementById('pdf-render-canvas');
    const container = document.getElementById('pdf-container');
    
    const unscaledViewport = page.getViewport({ scale: 1 });
    // Zoom Out to full canvas size (min 0.1)
    const fitScale = (container.clientWidth / unscaledViewport.width) * pdfScale;
    const viewport = page.getViewport({ scale: fitScale });
    
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = viewport.width * dpr;
    canvas.height = viewport.height * dpr;
    canvas.style.width = viewport.width + 'px';
    canvas.style.height = viewport.height + 'px';
    ctx.scale(dpr, dpr); 

    await page.render({ canvasContext: ctx, viewport: viewport }).promise;
    document.getElementById('current-page').textContent = num;
    renderAllElements(); 
}

function renderAllElements() {
    const container = document.getElementById('pdf-container');
    container.querySelectorAll('.sig-instance, .text-instance').forEach(el => el.remove());

    const items = [
        ...signatures.filter(s => s.page === currentPage).map(s => ({...s, type: 'sig'})),
        ...textFields.filter(t => t.page === currentPage).map(t => ({...t, type: 'text'}))
    ];

    items.forEach(item => {
        const el = document.createElement('div');
        el.className = item.type === 'sig' ? 'sig-instance' : 'text-instance';
        el.style.cssText = `position: absolute; left:${item.left}px; top:${item.top}px; width:${item.width}px; height:${item.height}px; touch-action:none; z-index:100; border:1px solid #3498db;`;

        // THE MOVEMENT HANDLE (Grip)
        const grip = document.createElement('div');
        grip.className = "drag-grip";
        grip.style.cssText = `position:absolute; top:-24px; left:-1px; background:#3498db; color:white; font-size:10px; padding:2px 8px; cursor:move; border-radius:3px 3px 0 0; z-index:110;`;
        grip.innerText = item.type === 'sig' ? 'SIGN' : 'MOVE';
        el.appendChild(grip);

        if (item.type === 'sig') {
            el.innerHTML += `<img src="${item.dataURL}" style="width:100%; height:100%; pointer-events:none;">`;
        } else {
            const fs = item.height * 0.7; 
            el.innerHTML += `<div class="editable-text" contenteditable="true" style="outline:none; width:100%; height:100%; font-size:${fs}px; color:${item.color}; font-family:${item.font}; overflow:hidden; white-space:nowrap;">${item.text}</div>`;
            el.querySelector('.editable-text').onblur = (e) => {
                const target = textFields.find(t => t.id === item.id);
                if (target) target.text = e.target.innerText;
            };
        }

        // Action Buttons
        el.innerHTML += `
            <div class="resizer" style="position:absolute; width:18px; height:18px; background:#3498db; bottom:-9px; right:-9px; cursor:nwse-resize; border-radius:50%; border:2px solid white; z-index:115;"></div>
            <div class="delete-btn" style="position:absolute; top:-12px; right:-12px; background:#ff4757; color:white; border-radius:50%; width:24px; height:24px; text-align:center; cursor:pointer; line-height:22px; font-weight:bold; z-index:115; border:2px solid white;">×</div>
        `;

        // FIXED INTERACTION ENGINE
        el.onpointerdown = (e) => {
            const isResizing = e.target.classList.contains('resizer');
            const isGrip = e.target.classList.contains('drag-grip') || e.target === grip;
            
            if (!isResizing && !isGrip) return; 

            const startX = e.clientX; const startY = e.clientY;
            const startW = item.width; const startH = item.height;
            const startL = item.left; const startT = item.top;

            el.setPointerCapture(e.pointerId);
            el.onpointermove = (em) => {
                const dx = em.clientX - startX; const dy = em.clientY - startY;
                if (isResizing) {
                    item.width = Math.max(15, startW + dx);
                    item.height = Math.max(10, startH + dy);
                    el.style.width = item.width + 'px';
                    el.style.height = item.height + 'px';
                    if(item.type === 'text') el.querySelector('.editable-text').style.fontSize = (item.height * 0.7) + 'px';
                } else if (isGrip) {
                    item.left = startL + dx;
                    item.top = startT + dy;
                    el.style.left = item.left + 'px';
                    el.style.top = item.top + 'px';
                }
            };
            el.onpointerup = () => {
                const master = item.type === 'sig' ? signatures : textFields;
                const record = master.find(i => i.id === item.id);
                if (record) Object.assign(record, { left: item.left, top: item.top, width: item.width, height: item.height });
                el.onpointermove = null;
                el.releasePointerCapture(e.pointerId);
            };
        };

        el.querySelector('.delete-btn').onclick = (e) => {
            e.stopPropagation();
            if (item.type === 'sig') signatures = signatures.filter(s => s.id !== item.id);
            else textFields = textFields.filter(t => t.id !== item.id);
            renderAllElements();
        };

        container.appendChild(el);
    });
}

// --- 5. PDF EXPORT ENGINE ---
async function handleDownload() {
    if (!currentPdfBytes) return alert("Please upload a PDF first.");
    const pdfDocLib = await PDFLib.PDFDocument.load(currentPdfBytes.slice(0));
    const pages = pdfDocLib.getPages();
    const canvRect = document.getElementById('pdf-render-canvas').getBoundingClientRect();
    
    for (const sig of signatures) {
        const page = pages[sig.page - 1];
        const { width, height } = page.getSize();
        const sigImage = await pdfDocLib.embedPng(sig.dataURL);
        const sX = width / canvRect.width; const sY = height / canvRect.height;
        page.drawImage(sigImage, { 
            x: sig.left * sX, 
            y: (canvRect.height - sig.top - sig.height) * sY, 
            width: sig.width * sX, 
            height: sig.height * sY 
        });
    }

    for (const tf of textFields) {
        const page = pages[tf.page - 1];
        const { width, height } = page.getSize();
        const sX = width / canvRect.width; const sY = height / canvRect.height;
        page.drawText(tf.text, { 
            x: tf.left * sX, 
            y: (canvRect.height - tf.top - (tf.height * 0.75)) * sY, 
            size: (tf.height * 0.6) * sX, 
            color: PDFLib.rgb(0,0,0) 
        });
    }

    const pdfBytes = await pdfDocLib.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `EmmySign_Signed_${Date.now()}.pdf`;
    link.click();
}

// --- 6. UTILS ---
window.changeZoom = (d) => { 
    pdfScale = Math.min(Math.max(0.1, pdfScale + d), 3.0); 
    renderPage(currentPage); 
};

function closeModal() { 
    document.getElementById('sig-modal').style.display = 'none'; 
    document.body.style.overflow = 'auto'; 
    if (sigCtx) sigCtx.clearRect(0,0,sigPad.width,sigPad.height); 
}
    
