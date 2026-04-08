/**
 * EmmySign Master JS - Final Production V3.6
 * RESTORED: Multi-Color logic for Signature & Text.
 * FEATURES: Color-sync, Movement Grips, Extreme Zoom, and PDF Export.
 * Author: Emmy STACK01
 */

// --- Global State ---
let pdfDoc = null;
let currentPage = 1;
let currentPdfBytes = null; 
let pdfScale = 1.0; 
let signatures = []; 
let textFields = []; 
let currentStrokeColor = "#000000"; // Default
let currentFont = "sans-serif";

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. COLOR PICKER LOGIC (RE-INTEGRATED) ---
    const colorBtns = document.querySelectorAll('.color-btn');
    colorBtns.forEach(btn => {
        btn.onclick = () => {
            currentStrokeColor = btn.getAttribute('data-color');
            // Visual feedback for selection
            colorBtns.forEach(b => {
                b.style.border = 'none';
                b.style.transform = 'scale(1)';
            });
            btn.style.border = '3px solid white';
            btn.style.boxShadow = '0 0 8px rgba(0,0,0,0.3)';
            btn.style.transform = 'scale(1.1)';
            
            // Immediately update signature pad if it's open
            if (sigCtx) sigCtx.strokeStyle = currentStrokeColor;
        };
    });

    // --- 2. SIGNATURE PAD (Color-Sync) ---
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
            sigCtx.strokeStyle = currentStrokeColor; // Applying the color
            sigCtx.lineWidth = 3;
            sigCtx.lineCap = "round";
            sigCtx.lineJoin = "round";
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

    // --- 3. UI & PDF CONTROLS ---
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

    document.getElementById('open-sig-btn').onclick = () => {
        document.getElementById('sig-modal').style.display = 'flex';
        document.body.style.overflow = 'hidden'; 
    };

    document.getElementById('save-sig-btn').onclick = () => {
        const dataURL = sigPad.toDataURL();
        signatures.push({ 
            id: Date.now(), dataURL: dataURL, page: currentPage, 
            left: 50, top: 50, width: 120, height: 60, color: currentStrokeColor 
        });
        renderAllElements();
        closeModal();
    };

    document.getElementById('add-text-btn').onclick = () => {
        textFields.push({ id: Date.now(), text: "Type...", page: currentPage, left: 50, top: 50, width: 90, height: 35, color: currentStrokeColor, font: currentFont });
        renderAllElements();
    };

    document.getElementById('add-date-btn').onclick = () => {
        const today = new Date().toLocaleDateString('en-GB'); 
        textFields.push({ id: Date.now(), text: today, page: currentPage, left: 50, top: 120, width: 90, height: 35, color: currentStrokeColor, font: currentFont });
        renderAllElements();
    };

    document.getElementById('prev-page').onclick = () => { if (currentPage > 1) renderPage(currentPage - 1); };
    document.getElementById('next-page').onclick = () => { if (currentPage < pdfDoc.numPages) renderPage(currentPage + 1); };
    document.getElementById('download-btn').onclick = handleDownload;
    document.getElementById('clear-pad').onclick = () => sigCtx.clearRect(0,0,sigPad.width,sigPad.height);
    document.getElementById('close-modal').onclick = closeModal;
});

// --- 4. ENGINE: RENDERING ---

async function renderPage(num) {
    if (!pdfDoc || num < 1 || num > pdfDoc.numPages) return;
    currentPage = num;
    const page = await pdfDoc.getPage(num);
    const canvas = document.getElementById('pdf-render-canvas');
    const container = document.getElementById('pdf-container');
    
    const unscaledViewport = page.getViewport({ scale: 1 });
    const fitScale = (container.clientWidth / unscaledViewport.width) * pdfScale;
    const viewport = page.getViewport({ scale: fitScale });
    
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = viewport.width * dpr; canvas.height = viewport.height * dpr;
    canvas.style.width = viewport.width + 'px'; canvas.style.height = viewport.height + 'px';
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
        el.style.cssText = `position: absolute; left:${item.left}px; top:${item.top}px; width:${item.width}px; height:${item.height}px; touch-action:none; z-index:100; border:1px solid ${item.color}; background: rgba(255,255,255,0.1);`;

        // DRAG GRIP (Matches Element Color)
        const grip = document.createElement('div');
        grip.className = "drag-grip";
        grip.style.cssText = `position:absolute; top:-24px; left:-1px; background:${item.color}; color:white; font-size:10px; padding:2px 8px; cursor:move; border-radius:3px 3px 0 0; z-index:110;`;
        grip.innerText = item.type === 'sig' ? 'MOVE' : 'MOVE';
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
            <div class="resizer" style="position:absolute; width:18px; height:18px; background:${item.color}; bottom:-9px; right:-9px; cursor:nwse-resize; border-radius:50%; border:2px solid white; z-index:115;"></div>
            <div class="delete-btn" style="position:absolute; top:-12px; right:-12px; background:#ff4757; color:white; border-radius:50%; width:24px; height:24px; text-align:center; cursor:pointer; line-height:22px; font-weight:bold; z-index:115; border:2px solid white;">×</div>
        `;

        // POINTER ENGINE
        el.onpointerdown = (e) => {
            const isResizing = e.target.classList.contains('resizer');
            const isGrip = e.target.classList.contains('drag-grip');
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
                } else {
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

// --- 5. EXPORT ---
async function handleDownload() {
    if (!currentPdfBytes) return alert("Upload a PDF first.");
    const pdfDocLib = await PDFLib.PDFDocument.load(currentPdfBytes.slice(0));
    const pages = pdfDocLib.getPages();
    const canvRect = document.getElementById('pdf-render-canvas').getBoundingClientRect();
    
    for (const sig of signatures) {
        const page = pages[sig.page - 1];
        const { width, height } = page.getSize();
        const sigImage = await pdfDocLib.embedPng(sig.dataURL);
        const sX = width / canvRect.width; const sY = height / canvRect.height;
        page.drawImage(sigImage, { 
            x: sig.left * sX, y: (canvRect.height - sig.top - sig.height) * sY, 
            width: sig.width * sX, height: sig.height * sY 
        });
    }

    for (const tf of textFields) {
        const page = pages[tf.page - 1];
        const { width, height } = page.getSize();
        const sX = width / canvRect.width; const sY = height / canvRect.height;
        const rgb = hexToRgb(tf.color);
        page.drawText(tf.text, { 
            x: tf.left * sX, y: (canvRect.height - tf.top - (tf.height * 0.75)) * sY, 
            size: (tf.height * 0.6) * sX, 
            color: PDFLib.rgb(rgb.r/255, rgb.g/255, rgb.b/255) 
        });
    }

    const pdfBytes = await pdfDocLib.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "EmmySign_Signed.pdf";
    link.click();
}

// --- UTILS ---
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : {r:0, g:0, b:0};
}
window.changeZoom = (d) => { pdfScale = Math.min(Math.max(0.1, pdfScale + d), 3.0); renderPage(currentPage); };
function closeModal() { document.getElementById('sig-modal').style.display = 'none'; document.body.style.overflow = 'auto'; if (sigCtx) sigCtx.clearRect(0,0,sigPad.width,sigPad.height); }
                    
