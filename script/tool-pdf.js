/**
 * EmmySign Master JS - Final Production V3.3
 * IMPROVEMENTS: Real-time Scaling, GSAP-Style Multi-Drag, and Mobile Touch Optimization.
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

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. INITIALIZE PDF HANDLING ---
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

    // --- 2. SIGNATURE PAD (High-Fidelity Mobile Logic) ---
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

        // CRITICAL: Prevent mobile scrolling while signing
        sigPad.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
        sigPad.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

        sigPad.onpointerdown = (e) => {
            isDrawing = true;
            const pos = getPos(e);
            sigCtx.beginPath();
            sigCtx.strokeStyle = currentStrokeColor;
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

    // --- 3. UI & ELEMENT CREATION ---
    const openSigBtn = document.getElementById('open-sig-btn');
    if (openSigBtn) {
        openSigBtn.onclick = () => {
            document.getElementById('sig-modal').style.display = 'flex';
            document.body.style.overflow = 'hidden'; 
        };
    }

    // UI Buttons for adding elements
    document.getElementById('save-sig-btn').onclick = () => {
        const dataURL = sigPad.toDataURL();
        signatures.push({ 
            id: Date.now(), dataURL: dataURL, page: currentPage, 
            left: 50, top: 50, width: 160, height: 80 
        });
        renderAllElements();
        closeSigModal();
    };

    document.getElementById('add-text-btn').onclick = () => {
        textFields.push({ id: Date.now(), text: "Type here...", page: currentPage, left: 100, top: 100, width: 150, height: 50, color: currentStrokeColor });
        renderAllElements();
    };

    document.getElementById('add-date-btn').onclick = () => {
        const today = new Date().toLocaleDateString('en-GB'); 
        textFields.push({ id: Date.now(), text: today, page: currentPage, left: 100, top: 160, width: 140, height: 45, color: currentStrokeColor });
        renderAllElements();
    };

    // Color Pickers
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.onclick = () => {
            currentStrokeColor = btn.getAttribute('data-color');
            document.querySelectorAll('.color-btn').forEach(b => b.style.border = 'none');
            btn.style.border = '3px solid white';
        };
    });

    // Modal Helpers
    const closeSigModal = () => {
        document.getElementById('sig-modal').style.display = 'none';
        document.body.style.overflow = 'auto';
        if(sigCtx) sigCtx.clearRect(0, 0, sigPad.width, sigPad.height);
    };
    document.getElementById('close-modal').onclick = closeSigModal;
    document.getElementById('clear-pad').onclick = () => sigCtx.clearRect(0, 0, sigPad.width, sigPad.height);

    // Navigation
    document.getElementById('next-page').onclick = () => { if (currentPage < pdfDoc.numPages) renderPage(currentPage + 1); };
    document.getElementById('prev-page').onclick = () => { if (currentPage > 1) renderPage(currentPage - 1); };
    document.getElementById('download-btn').onclick = handleDownload;
});

// --- 4. CORE ENGINE (Real-time Scaling & Drag) ---

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

    const currentPageElements = [
        ...signatures.filter(s => s.page === currentPage).map(s => ({...s, type: 'sig'})),
        ...textFields.filter(t => t.page === currentPage).map(t => ({...t, type: 'text'}))
    ];

    currentPageElements.forEach(item => {
        const el = document.createElement('div');
        el.className = item.type === 'sig' ? 'sig-instance' : 'text-instance';
        el.style.cssText = `position: absolute; left:${item.left}px; top:${item.top}px; width:${item.width}px; height:${item.height}px; cursor:move; touch-action:none; z-index:100; border:1px dashed #3498db; background: rgba(52, 152, 219, 0.08);`;

        if (item.type === 'sig') {
            el.innerHTML = `<img src="${item.dataURL}" style="width:100%; height:100%; pointer-events:none; user-select:none;">`;
        } else {
            const fs = item.height * 0.65; // Dynamic font scaling
            el.innerHTML = `<div class="editable-text" contenteditable="true" style="outline:none; width:100%; height:100%; font-size:${fs}px; color:${item.color}; overflow:hidden; font-family:sans-serif; display:flex; align-items:center;">${item.text}</div>`;
            el.querySelector('.editable-text').onblur = (e) => {
                const target = textFields.find(t => t.id === item.id);
                if (target) target.text = e.target.innerText;
            };
        }

        // Action Buttons (Resize & Delete)
        el.innerHTML += `
            <div class="resizer" style="position:absolute; width:22px; height:22px; background:#3498db; bottom:-11px; right:-11px; cursor:nwse-resize; border-radius:50%; border:3px solid white; z-index:110;"></div>
            <div class="delete-btn" style="position:absolute; top:-14px; right:-14px; background:#ff4757; color:white; border-radius:50%; width:28px; height:28px; text-align:center; cursor:pointer; line-height:28px; font-weight:bold; z-index:110; border:2px solid white;">×</div>
        `;

        // --- THE ENGINE: DRAG & SCALE LOGIC ---
        el.onpointerdown = (e) => {
            if (e.target.classList.contains('delete-btn') || e.target.contentEditable === "true") return;
            
            const isResizing = e.target.classList.contains('resizer');
            const startX = e.clientX; const startY = e.clientY;
            const startW = item.width; const startH = item.height;
            const startL = item.left; const startT = item.top;

            el.setPointerCapture(e.pointerId);
            
            el.onpointermove = (em) => {
                const dx = em.clientX - startX; const dy = em.clientY - startY;
                
                if (isResizing) {
                    item.width = Math.max(45, startW + dx);
                    item.height = Math.max(25, startH + dy);
                    el.style.width = item.width + 'px';
                    el.style.height = item.height + 'px';
                    // Trigger real-time font scaling for text
                    if(item.type === 'text') {
                        el.querySelector('.editable-text').style.fontSize = (item.height * 0.65) + 'px';
                    }
                } else {
                    item.left = startL + dx;
                    item.top = startT + dy;
                    el.style.left = item.left + 'px';
                    el.style.top = item.top + 'px';
                }
            };

            el.onpointerup = () => {
                // PERSISTENCE: Save final state to master arrays
                const master = item.type === 'sig' ? signatures : textFields;
                const record = master.find(i => i.id === item.id);
                if (record) {
                    record.left = item.left; record.top = item.top;
                    record.width = item.width; record.height = item.height;
                }
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

// --- 5. FINAL EXPORT (PDF-LIB) ---
async function handleDownload() {
    if (!currentPdfBytes || (signatures.length === 0 && textFields.length === 0)) return alert("Document is empty!");
    
    const pdfDocLib = await PDFLib.PDFDocument.load(currentPdfBytes.slice(0));
    const pages = pdfDocLib.getPages();
    const canvRect = document.getElementById('pdf-render-canvas').getBoundingClientRect();
    
    // Embed and Draw Signatures
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

    // Draw Text Fields
    for (const tf of textFields) {
        const page = pages[tf.page - 1];
        const { width, height } = page.getSize();
        const sX = width / canvRect.width; const sY = height / canvRect.height;
        
        page.drawText(tf.text, { 
            x: tf.left * sX, 
            y: (canvRect.height - tf.top - (tf.height * 0.75)) * sY, 
            size: (tf.height * 0.6) * sX, 
            color: PDFLib.rgb(0, 0, 0) 
        });
    }

    const pdfBytes = await pdfDocLib.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `EmmySign_Final_${Date.now()}.pdf`;
    link.click();
}

window.changeZoom = (d) => { 
    pdfScale = Math.min(Math.max(0.5, pdfScale + d), 3.0); 
    renderPage(currentPage); 
};
            
