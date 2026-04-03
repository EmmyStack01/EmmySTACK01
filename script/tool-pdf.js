/**
 * EmmySign Master JS - Final Production V2.6
 * Includes: Multi-sig, Color Picker Fix, Zoom, and Mobile Coordinate Fix
 * Author: Emmy STACK01
 */

// --- Global State ---
let pdfDoc = null;
let currentPage = 1;
let currentPdfBytes = null; 
let pdfScale = 1.0; 
let signatures = []; 
let currentStrokeColor = "#000000";

// --- 1. PDF Handling ---
const pdfUpload = document.getElementById('pdf-upload');
if (pdfUpload) {
    pdfUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const buffer = await file.arrayBuffer();
        // Slice(0) to ensure we have a fresh copy of the data
        currentPdfBytes = new Uint8Array(buffer.slice(0)); 
        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(currentPdfBytes.slice(0)) });
        pdfDoc = await loadingTask.promise;
        document.getElementById('total-pages').textContent = pdfDoc.numPages;
        renderPage(1);
    });
}

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
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({ canvasContext: ctx, viewport: viewport }).promise;
    document.getElementById('current-page').textContent = num;
    renderAllSignatures(); 
}

// --- 2. SIGNATURE PAD (Mobile Optimized) ---
const sigPad = document.getElementById('sig-pad');
const sigCtx = sigPad ? sigPad.getContext('2d') : null;
let isDrawing = false;

if (sigPad) {
    // FIX: Perfect coordinates for Modal + Mobile (handles CSS scaling)
    const getPos = (e) => {
        const rect = sigPad.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        return {
            x: (clientX - rect.left) * (sigPad.width / rect.width),
            y: (clientY - rect.top) * (sigPad.height / rect.height)
        };
    };

    // FIX: Stop "Shaky" screen movement while drawing on mobile
    sigPad.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    sigPad.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

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

// --- COLOR PICKER LOGIC (Corrected for .color-btn) ---
document.querySelectorAll('.color-btn').forEach(btn => {
    btn.onclick = () => {
        currentStrokeColor = btn.getAttribute('data-color');
        // Visual feedback
        document.querySelectorAll('.color-btn').forEach(b => b.style.border = 'none');
        btn.style.border = '3px solid white';
        btn.style.boxShadow = '0 0 5px rgba(0,0,0,0.5)';
    };
});

// Modal Controls with Body Scroll Lock
document.getElementById('open-sig-btn').onclick = () => {
    document.getElementById('sig-modal').style.display = 'flex';
    document.body.style.overflow = 'hidden'; 
};
document.getElementById('close-modal').onclick = () => {
    document.getElementById('sig-modal').style.display = 'none';
    document.body.style.overflow = 'auto'; 
};

// --- 3. MULTI-SIGNATURE LOGIC ---
document.getElementById('save-sig-btn').onclick = () => {
    const dataURL = sigPad.toDataURL();
    signatures.push({
        id: Date.now(),
        dataURL: dataURL,
        page: currentPage,
        left: 50, top: 50, width: 160, height: 80
    });
    renderAllSignatures();
    document.getElementById('sig-modal').style.display = 'none';
    document.body.style.overflow = 'auto';
    sigCtx.clearRect(0, 0, sigPad.width, sigPad.height);
};

function renderAllSignatures() {
    const container = document.getElementById('pdf-container');
    container.querySelectorAll('.sig-instance').forEach(el => el.remove());

    signatures.filter(s => s.page === currentPage).forEach(sig => {
        const sigEl = document.createElement('div');
        sigEl.className = 'sig-instance';
        // touch-action: none is critical for mobile dragging!
        sigEl.style.cssText = `position: absolute; left:${sig.left}px; top:${sig.top}px; width:${sig.width}px; height:${sig.height}px; cursor:move; touch-action:none; z-index:100; border:1px dashed #3498db;`;
        
        sigEl.innerHTML = `
            <img src="${sig.dataURL}" style="width:100%; height:100%; pointer-events:none;">
            <div class="resizer" style="position:absolute; width:24px; height:24px; background:#3498db; bottom:-12px; right:-12px; cursor:nwse-resize; border-radius:50%; border:2px solid white;"></div>
            <div class="delete-sig" style="position:absolute; top:-15px; right:-15px; background:#ff4757; color:white; border-radius:50%; width:30px; height:30px; text-align:center; cursor:pointer; line-height:30px; font-weight:bold;">×</div>
        `;

        sigEl.querySelector('.delete-sig').onpointerdown = (e) => {
            e.stopPropagation();
            signatures = signatures.filter(s => s.id !== sig.id);
            renderAllSignatures();
        };

        sigEl.onpointerdown = (e) => {
            if (e.target.classList.contains('delete-sig')) return;
            e.preventDefault();
            const isResizing = e.target.classList.contains('resizer');
            const startX = e.clientX; 
            const startY = e.clientY;
            const startW = sig.width; 
            const startH = sig.height;
            const startL = sig.left; 
            const startT = sig.top;

            sigEl.setPointerCapture(e.pointerId);
            sigEl.onpointermove = (em) => {
                const dx = em.clientX - startX; 
                const dy = em.clientY - startY;
                if (isResizing) {
                    sig.width = Math.max(40, startW + dx);
                    sig.height = Math.max(20, startH + dy);
                } else {
                    sig.left = startL + dx; 
                    sig.top = startT + dy;
                }
                // Directly update style for performance
                sigEl.style.left = sig.left + 'px';
                sigEl.style.top = sig.top + 'px';
                sigEl.style.width = sig.width + 'px';
                sigEl.style.height = sig.height + 'px';
            };
            sigEl.onpointerup = () => { 
                sigEl.onpointermove = null; 
                sigEl.releasePointerCapture(e.pointerId); 
            };
        };
        container.appendChild(sigEl);
    });
}

// --- 4. EXPORT ENGINE ---
document.getElementById('download-btn').onclick = async () => {
    if (!currentPdfBytes || signatures.length === 0) return alert("Add a signature first!");
    const pdfDocLib = await PDFLib.PDFDocument.load(currentPdfBytes.slice(0));
    const pages = pdfDocLib.getPages();
    const canvRect = document.getElementById('pdf-render-canvas').getBoundingClientRect();
    
    for (const sig of signatures) {
        const page = pages[sig.page - 1];
        const { width, height } = page.getSize();
        const sigImage = await pdfDocLib.embedPng(sig.dataURL);
        const sX = width / canvRect.width;
        const sY = height / canvRect.height;

        page.drawImage(sigImage, {
            x: sig.left * sX,
            y: (canvRect.height - sig.top - sig.height) * sY, // Correct Y inversion
            width: sig.width * sX,
            height: sig.height * sY,
        });
    }
    const pdfBytes = await pdfDocLib.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "EmmySign_Signed.pdf";
    link.click();
};

// --- Navigation & Utils ---
document.getElementById('next-page').onclick = () => { if (pdfDoc && currentPage < pdfDoc.numPages) renderPage(currentPage + 1); };
document.getElementById('prev-page').onclick = () => { if (pdfDoc && currentPage > 1) renderPage(currentPage - 1); };
document.getElementById('clear-pad').onclick = () => sigCtx.clearRect(0, 0, sigPad.width, sigPad.height);
window.changeZoom = (d) => { pdfScale = Math.min(Math.max(0.5, pdfScale + d), 3.0); renderPage(currentPage); };
            
