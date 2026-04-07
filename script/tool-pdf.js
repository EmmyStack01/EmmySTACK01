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
let textFields = []; // Array to store { id, text, page, left, top, fontSize, color }
let currentFontSize = 16;

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

    // --- NEW: HIGH-DPI FIX ---
    const dpr = window.devicePixelRatio || 1;
    canvas.width = viewport.width * dpr;
    canvas.height = viewport.height * dpr;
    canvas.style.width = viewport.width + 'px';
    canvas.style.height = viewport.height + 'px';
    ctx.scale(dpr, dpr);
    // -------------------------

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

document.getElementById('add-text-btn').onclick = () => {
    const newText = {
        id: Date.now(),
        text: "Type here...",
        page: currentPage,
        left: 100,
        top: 100,
        fontSize: currentFontSize,
        color: currentStrokeColor // Uses your existing color picker color!
    };
    textFields.push(newText);
    renderAllElements(); // Consolidate your render functions
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
    renderAllElements();
    document.getElementById('sig-modal').style.display = 'none';
    document.body.style.overflow = 'auto';
    sigCtx.clearRect(0, 0, sigPad.width, sigPad.height);
};

function renderAllElements() {
    const container = document.getElementById('pdf-container');
    // Clear both signatures and text instances
    container.querySelectorAll('.sig-instance, .text-instance').forEach(el => el.remove());

    const currentPageElements = [
        ...signatures.filter(s => s.page === currentPage).map(s => ({...s, type: 'sig'})),
        ...textFields.filter(t => t.page === currentPage).map(t => ({...t, type: 'text'}))
    ];

    currentPageElements.forEach(item => {
        const el = document.createElement('div');
        el.className = item.type === 'sig' ? 'sig-instance' : 'text-instance';
       
        // Base styles for both
        el.style.cssText = `position: absolute; left:${item.left}px; top:${item.top}px; cursor:move; touch-action:none; z-index:100; border:1px dashed #3498db;`;

        if (item.type === 'sig') {
            el.style.width = `${item.width}px`;
            el.style.height = `${item.height}px`;
            el.innerHTML = `
                <img src="${item.dataURL}" style="width:100%; height:100%; pointer-events:none;">
                <div class="resizer"></div>
                <div class="delete-btn">×</div>`;
        } else {
            // Text specific UI
            el.style.padding = "5px";
            el.style.fontSize = `${item.fontSize}px`;
            el.style.color = item.color;
            el.style.background = "rgba(255, 255, 255, 0.7)";
            el.innerHTML = `
                <div class="editable-text" contenteditable="true">${item.text}</div>
                <div class="delete-btn">×</div>`;
           
            // Sync text changes back to the array
            el.querySelector('.editable-text').onblur = (e) => {
                const index = textFields.findIndex(t => t.id === item.id);
                if (index !== -1) textFields[index].text = e.target.innerText;
            };
        }

        // --- Dragging Logic (Apply to both) ---
        el.onpointerdown = (e) => {
            if (e.target.classList.contains('delete-btn') || e.target.contentEditable === "true") return;
            e.preventDefault();
            const startX = e.clientX; const startY = e.clientY;
            const startL = item.left; const startT = item.top;

            el.setPointerCapture(e.pointerId);
            el.onpointermove = (em) => {
                item.left = startL + (em.clientX - startX);
                item.top = startT + (em.clientY - startY);
                el.style.left = item.left + 'px';
                el.style.top = item.top + 'px';
            };
            el.onpointerup = () => { el.onpointermove = null; el.releasePointerCapture(e.pointerId); };
        };

        // Delete Logic
        el.querySelector('.delete-btn').onclick = () => {
            if (item.type === 'sig') signatures = signatures.filter(s => s.id !== item.id);
            else textFields = textFields.filter(t => t.id !== item.id);
            renderAllElements();
        };

        container.appendChild(el);
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
    // After signature loop in download-btn handler:
    for (const tf of textFields) {
        const page = pages[tf.page - 1];
        const { height } = page.getSize();
        const sX = page.getSize().width / canvRect.width;
        const sY = height / canvRect.height;
    
        page.drawText(tf.text, {
            x: tf.left * sX,
            y: (canvRect.height - tf.top - (tf.fontSize)) * sY, // Standardize Y flip
            size: tf.fontSize * sX,
            color: PDFLib.rgb(0, 0, 0), // You can convert tf.color to RGB here
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
            
