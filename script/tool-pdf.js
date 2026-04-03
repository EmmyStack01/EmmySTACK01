/**
 * EmmySign Master JS 
 * Version: 2.4 (Final Production - Multi-Signature + Zoom + Resize + Drag)
 * Optimized for: Emmy STACK01
 * Dependencies: PDF-Lib, PDF.js
 */

// --- Global State ---
let pdfDoc = null;
let currentPage = 1;
let currentPdfBytes = null;
let pdfScale = 1.0; 
let signatures = []; // Array of signature objects
let currentStrokeColor = "#000000"; 

// --- 1. PDF Rendering & Zoom Engine ---
const pdfUpload = document.getElementById('pdf-upload');

if (pdfUpload) {
    pdfUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const buffer = await file.arrayBuffer();
        
        // Clone buffer to prevent "Detached ArrayBuffer" errors on re-renders
        currentPdfBytes = new Uint8Array(buffer); 
        
        const loadingTask = pdfjsLib.getDocument({ data: currentPdfBytes });
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
    
    // Support for High-DPI / Retina displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = viewport.width * dpr;
    canvas.height = viewport.height * dpr;
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
    ctx.scale(dpr, dpr);

    await page.render({ canvasContext: ctx, viewport: viewport }).promise;
    document.getElementById('current-page').textContent = num;
    
    renderAllSignatures(); 
}

window.changeZoom = (delta) => {
    // Clamp zoom between 50% and 300%
    pdfScale = Math.min(Math.max(0.5, pdfScale + delta), 3.0);
    renderPage(currentPage);
};

// --- 2. Signature Pad Logic ---
const sigPad = document.getElementById('sig-pad');
const sigCtx = sigPad ? sigPad.getContext('2d') : null;
let isDrawing = false;

if (sigPad) {
    const getPos = (e) => {
        const rect = sigPad.getBoundingClientRect();
        return {
            x: (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left,
            y: (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top
        };
    };

    sigPad.addEventListener('pointerdown', (e) => {
        isDrawing = true;
        const pos = getPos(e);
        sigCtx.beginPath();
        sigCtx.strokeStyle = currentStrokeColor;
        sigCtx.lineWidth = 2;
        sigCtx.lineCap = "round";
        sigCtx.moveTo(pos.x, pos.y);
        sigPad.setPointerCapture(e.pointerId);
    });

    sigPad.addEventListener('pointermove', (e) => {
        if (!isDrawing) return;
        const pos = getPos(e);
        sigCtx.lineTo(pos.x, pos.y);
        sigCtx.stroke();
    });

    window.addEventListener('pointerup', () => isDrawing = false);
    sigPad.style.cursor = `crosshair`;
}

// Color Management
document.querySelectorAll('.color-btn').forEach(btn => {
    btn.onclick = () => {
        currentStrokeColor = btn.getAttribute('data-color');
        if (sigCtx) sigCtx.strokeStyle = currentStrokeColor;
        
        document.querySelectorAll('.color-btn').forEach(b => b.style.border = "none");
        btn.style.border = "2px solid #3498db";
    };
});

document.getElementById('open-sig-btn').onclick = () => document.getElementById('sig-modal').style.display = 'flex';
document.getElementById('close-modal').onclick = () => document.getElementById('sig-modal').style.display = 'none';
document.getElementById('clear-pad').onclick = () => sigCtx.clearRect(0, 0, sigPad.width, sigPad.height);

// --- 3. Multi-Signature UI Logic ---
document.getElementById('save-sig-btn').onclick = () => {
    const dataURL = sigPad.toDataURL();
    
    signatures.push({
        id: Date.now(),
        dataURL: dataURL,
        page: currentPage,
        left: 50, 
        top: 50, 
        width: 150, 
        height: 75
    });
    
    renderAllSignatures();
    document.getElementById('sig-modal').style.display = 'none';
    sigCtx.clearRect(0, 0, sigPad.width, sigPad.height);
};

function renderAllSignatures() {
    const container = document.getElementById('pdf-container');
    container.querySelectorAll('.sig-instance').forEach(el => el.remove());

    signatures.filter(s => s.page === currentPage).forEach(sig => {
        const sigEl = document.createElement('div');
        sigEl.className = 'sig-instance';
        
        sigEl.style.cssText = `
            position: absolute; 
            left: ${sig.left}px; 
            top: ${sig.top}px; 
            width: ${sig.width}px; 
            height: ${sig.height}px; 
            cursor: move; 
            touch-action: none; 
            z-index: 10; 
            border: 1px dashed #3498db;
        `;
        
        sigEl.innerHTML = `
            <img src="${sig.dataURL}" style="width:100%; height:100%; pointer-events:none;">
            <div class="resizer" style="position:absolute; width:15px; height:15px; background:#3498db; bottom:-7px; right:-7px; cursor:nwse-resize; border-radius:50%;"></div>
            <div class="delete-sig" style="position:absolute; top:-12px; right:-12px; background:#ff4757; color:white; border-radius:50%; width:24px; height:24px; text-align:center; cursor:pointer; line-height:24px; font-weight:bold;">×</div>
        `;

        // Handle Signature Removal
        sigEl.querySelector('.delete-sig').onpointerdown = (e) => {
            e.stopPropagation();
            signatures = signatures.filter(s => s.id !== sig.id);
            renderAllSignatures();
        };

        // Integrated Drag and Resize
        sigEl.onpointerdown = (e) => {
            if (e.target.classList.contains('delete-sig')) return;
            
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
                
                sigEl.style.width = `${sig.width}px`;
                sigEl.style.height = `${sig.height}px`;
                sigEl.style.left = `${sig.left}px`;
                sigEl.style.top = `${sig.top}px`;
            };

            sigEl.onpointerup = () => {
                sigEl.onpointermove = null;
                sigEl.releasePointerCapture(e.pointerId);
            };
        };
        container.appendChild(sigEl);
    });
}

// --- 4. Production PDF Export (The "Bake") ---
document.getElementById('download-btn').onclick = async () => {
    if (!currentPdfBytes || signatures.length === 0) return alert("Please add at least one signature.");
    
    try {
        const pdfDocLib = await PDFLib.PDFDocument.load(currentPdfBytes);
        const pages = pdfDocLib.getPages();
        const canvas = document.getElementById('pdf-render-canvas');
        
        // Accurate viewport dimensions for scaling
        const displayWidth = parseFloat(canvas.style.width);
        const displayHeight = parseFloat(canvas.style.height);

        for (const sig of signatures) {
            const page = pages[sig.page - 1];
            const { width, height } = page.getSize();
            const sigImage = await pdfDocLib.embedPng(sig.dataURL);
            
            // Calculate ratios between screen CSS pixels and PDF points
            const ratioX = width / displayWidth;
            const ratioY = height / displayHeight;

            page.drawImage(sigImage, {
                x: sig.left * ratioX,
                // PDF coordinates start at bottom-left, so we flip the Y axis
                y: height - ((sig.top + sig.height) * ratioY), 
                width: sig.width * ratioX,
                height: sig.height * ratioY,
            });
        }

        const pdfBytes = await pdfDocLib.save();
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const downloadUrl = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `Signed_Document_${Date.now()}.pdf`;
        link.click();
        
        // Cleanup memory
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 2000);
    } catch (err) {
        console.error("Export Error:", err);
        alert("Signature embedding failed. Check console for details.");
    }
};

// --- 5. Pagination ---
document.getElementById('next-page').onclick = () => { 
    if (pdfDoc && currentPage < pdfDoc.numPages) renderPage(currentPage + 1); 
};
document.getElementById('prev-page').onclick = () => { 
    if (pdfDoc && currentPage > 1) renderPage(currentPage - 1); 
};
