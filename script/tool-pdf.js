/**
 * EmmySign Master JS 
 * Version: 2.1 (Multi-Signature + Zoom + Resize + Drag)
 * Optimized for: Emmy STACK01
 */

// --- Global State ---
let pdfDoc = null;
let currentPage = 1;
let currentPdfBytes = null;
let pdfScale = 1.0; 
let signatures = []; // Array to hold all signature objects
let currentStrokeColor = "#000000"; // Default Black

// --- 1. PDF Rendering & Zoom Engine ---
const pdfUpload = document.getElementById('pdf-upload');

if (pdfUpload) {
    pdfUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const buffer = await file.arrayBuffer();
        
        // CLONE THE BUFFER to prevent "Detached ArrayBuffer" errors
        currentPdfBytes = new Uint8Array(buffer); 
        
        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(currentPdfBytes) });
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

window.changeZoom = (delta) => {
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
        sigCtx.strokeStyle = currentStrokeColor; // <--- Set color here
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
    // Add this inside your color button click logic
    sigPad.style.cursor = `crosshair`;
}

// Map all color buttons
document.querySelectorAll('.color-btn').forEach(btn => {
    btn.onclick = () => {
        currentStrokeColor = btn.getAttribute('data-color');
        sigCtx.strokeStyle = currentStrokeColor;
        
        // Optional: Visual feedback for active color
        document.querySelectorAll('.color-btn').forEach(b => b.style.border = "none");
        btn.style.border = "2px solid #3498db";
    };
});

document.getElementById('open-sig-btn').onclick = () => document.getElementById('sig-modal').style.display = 'flex';
document.getElementById('close-modal').onclick = () => document.getElementById('sig-modal').style.display = 'none';
document.getElementById('clear-pad').onclick = () => sigCtx.clearRect(0, 0, sigPad.width, sigPad.height);

// --- 3. Multi-Signature, Drag, & Resize Logic ---
document.getElementById('save-sig-btn').onclick = () => {
    const dataURL = sigPad.toDataURL();
    
    // Create new signature object
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
        
        // Inline styles mapped here to avoid missing CSS issues
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

        // Delete Logic
        sigEl.querySelector('.delete-sig').onpointerdown = (e) => {
            e.stopPropagation(); // Stop drag from firing
            signatures = signatures.filter(s => s.id !== sig.id);
            renderAllSignatures();
        };

        // Unified Drag & Resize Logic
        sigEl.onpointerdown = (e) => {
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
                    // Update scale measurements
                    sig.width = Math.max(50, startW + dx);
                    sig.height = Math.max(25, startH + dy);
                    sigEl.style.width = `${sig.width}px`;
                    sigEl.style.height = `${sig.height}px`;
                } else {
                    // Update drag measurements
                    sig.left = startL + dx;
                    sig.top = startT + dy;
                    sigEl.style.left = `${sig.left}px`;
                    sigEl.style.top = `${sig.top}px`;
                }
            };

            sigEl.onpointerup = () => {
                sigEl.onpointermove = null;
                sigEl.releasePointerCapture(e.pointerId);
            };
        };
        container.appendChild(sigEl);
    });
}

// --- 4. Precise PDF Export ---
document.getElementById('download-btn').onclick = async () => {
    if (!currentPdfBytes || signatures.length === 0) return alert("Add at least one signature first!");
    
    try {
        const pdfDocLib = await PDFLib.PDFDocument.load(currentPdfBytes);
        const pages = pdfDocLib.getPages();
        const canvas = document.getElementById('pdf-render-canvas');
        const canvRect = canvas.getBoundingClientRect();

        for (const sig of signatures) {
            const page = pages[sig.page - 1];
            const { width, height } = page.getSize();
            const sigImage = await pdfDocLib.embedPng(sig.dataURL);
            
            // Coordinate scaling (Screen pixels to PDF points)
            const scaleX = width / canvRect.width;
            const scaleY = height / canvRect.height;

            page.drawImage(sigImage, {
                x: sig.left * scaleX,
                y: (canvRect.height - sig.top - sig.height) * scaleY, // Flip Y coordinate
                width: sig.width * scaleX,
                height: sig.height * scaleY,
            });
        }

        const pdfBytes = await pdfDocLib.save();
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const downloadUrl = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = "EmmySign_Signed.pdf";
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);
    } catch (err) {
        console.error(err);
        alert("Bake failed. Check console for details.");
    }
};

// --- 5. Navigation ---
document.getElementById('next-page').onclick = () => { if (pdfDoc && currentPage < pdfDoc.numPages) renderPage(currentPage + 1); };
document.getElementById('prev-page').onclick = () => { if (pdfDoc && currentPage > 1) renderPage(currentPage - 1); };
