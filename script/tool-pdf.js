/**
 * EmmySign Master JS 
 * Version: 2.4 (Mobile Coordinate & Scroll Lock Fix)
 * Optimized for: Emmy STACK01
 */

// --- Global State ---
let pdfDoc = null;
let currentPage = 1;
let currentPdfBytes = null; 
let pdfScale = 1.0; 
let signatures = []; 
let currentStrokeColor = "#000000";

// --- 1. PDF Rendering & Memory Management ---
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

// --- 2. THE MOBILE FIX: Signature Pad Logic ---
const sigPad = document.getElementById('sig-pad');
const sigCtx = sigPad ? sigPad.getContext('2d') : null;
let isDrawing = false;

if (sigPad) {
    // FIX: Better coordinate calculation for Mobile Modals
    const getPos = (e) => {
        const rect = sigPad.getBoundingClientRect();
        // Use clientX/Y for cross-browser/mobile stability
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    // FIX: Stop background scroll on mobile
    const stopScroll = (e) => { if (e.target === sigPad) e.preventDefault(); };
    sigPad.addEventListener('touchstart', stopScroll, { passive: false });
    sigPad.addEventListener('touchmove', stopScroll, { passive: false });

    sigPad.addEventListener('pointerdown', (e) => {
        isDrawing = true;
        const pos = getPos(e);
        sigCtx.beginPath();
        sigCtx.strokeStyle = currentStrokeColor;
        sigCtx.lineWidth = 2.5;
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
}

// Modal Control with Body Lock
document.getElementById('open-sig-btn').onclick = () => {
    document.getElementById('sig-modal').style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Lock background scroll
};
document.getElementById('close-modal').onclick = () => {
    document.getElementById('sig-modal').style.display = 'none';
    document.body.style.overflow = 'auto'; // Unlock background scroll
};

// --- 3. Multi-Signature & UI ---
document.getElementById('save-sig-btn').onclick = () => {
    const dataURL = sigPad.toDataURL();
    signatures.push({
        id: Date.now(),
        dataURL: dataURL,
        page: currentPage,
        left: 50, top: 50, width: 150, height: 75
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
        sigEl.style.cssText = `position: absolute; left:${sig.left}px; top:${sig.top}px; width:${sig.width}px; height:${sig.height}px; cursor:move; touch-action:none; z-index:10; border:1px dashed #3498db;`;
        
        sigEl.innerHTML = `
            <img src="${sig.dataURL}" style="width:100%; height:100%; pointer-events:none;">
            <div class="resizer" style="position:absolute; width:20px; height:20px; background:#3498db; bottom:-10px; right:-10px; cursor:nwse-resize; border-radius:50%; border:2px solid white;"></div>
            <div class="delete-sig" style="position:absolute; top:-12px; right:-12px; background:#ff4757; color:white; border-radius:50%; width:28px; height:28px; text-align:center; cursor:pointer; line-height:28px; font-weight:bold; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">×</div>
        `;

        sigEl.querySelector('.delete-sig').onpointerdown = (e) => {
            e.stopPropagation();
            signatures = signatures.filter(s => s.id !== sig.id);
            renderAllSignatures();
        };

        sigEl.onpointerdown = (e) => {
            const isResizing = e.target.classList.contains('resizer');
            const startX = e.clientX; const startY = e.clientY;
            const startW = sig.width; const startH = sig.height;
            const startL = sig.left; const startT = sig.top;

            sigEl.setPointerCapture(e.pointerId);
            sigEl.onpointermove = (em) => {
                const dx = em.clientX - startX; const dy = em.clientY - startY;
                if (isResizing) {
                    sig.width = Math.max(50, startW + dx);
                    sig.height = Math.max(25, startH + dy);
                } else {
                    sig.left = startL + dx; sig.top = startT + dy;
                }
                renderAllSignatures();
            };
            sigEl.onpointerup = () => { sigEl.onpointermove = null; sigEl.releasePointerCapture(e.pointerId); };
        };
        container.appendChild(sigEl);
    });
}

// --- 4. Final PDF Export (Bake) ---
document.getElementById('download-btn').onclick = async () => {
    if (!currentPdfBytes || signatures.length === 0) return alert("Add a signature!");
    try {
        const pdfDocLib = await PDFLib.PDFDocument.load(currentPdfBytes.slice(0));
        const pages = pdfDocLib.getPages();
        const canvRect = document.getElementById('pdf-render-canvas').getBoundingClientRect();
        for (const sig of signatures) {
            const page = pages[sig.page - 1];
            const { width, height } = page.getSize();
            const sigImage = await pdfDocLib.embedPng(sig.dataURL);
            const scaleX = width / canvRect.width;
            const scaleY = height / canvRect.height;
            page.drawImage(sigImage, {
                x: sig.left * scaleX,
                y: (canvRect.height - sig.top - sig.height) * scaleY,
                width: sig.width * scaleX,
                height: sig.height * scaleY,
            });
        }
        const pdfBytes = await pdfDocLib.save();
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl; link.download = "EmmySign_Signed.pdf";
        document.body.appendChild(link); link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);
    } catch (err) { alert("Bake failed: " + err.message); }
};

// --- 5. Navigation & Zoom ---
document.getElementById('next-page').onclick = () => { if (pdfDoc && currentPage < pdfDoc.numPages) renderPage(currentPage + 1); };
document.getElementById('prev-page').onclick = () => { if (pdfDoc && currentPage > 1) renderPage(currentPage - 1); };
document.getElementById('clear-pad').onclick = () => sigCtx.clearRect(0, 0, sigPad.width, sigPad.height);
window.changeZoom = (delta) => { pdfScale = Math.min(Math.max(0.5, pdfScale + delta), 3.0); renderPage(currentPage); };
                                                       
