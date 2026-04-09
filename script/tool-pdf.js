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
let selectedId = null;
let sigCtx = null;

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

    /*added recently*/
    document.getElementById('pdf-container').onpointerdown = (e) => {
        // 1. Check if the click is on the background/canvas
        if (e.target.id === 'pdf-container' || e.target.id === 'pdf-render-canvas') {
            
            // 2. FORCE a sync of all text fields right now
            syncAllTextFields(); 
            
            // 3. Now it is safe to deselect and re-render
            selectedId = null;
            renderAllElements();
        }
    };

    document.getElementById('open-sig-btn').onclick = () => {
        document.getElementById('sig-modal').style.display = 'flex';
        document.body.style.overflow = 'hidden'; 
    };

    document.getElementById('add-text-btn').onclick = () => {
        syncAllTextFields(); // Save whatever is currently typed
        const id = Date.now();
        textFields.push({ id: id, text: "Type...", page: currentPage, left: 50, top: 50, width: 90, height: 35, color: currentStrokeColor, font: currentFont });
        selectedId = id;
        renderAllElements();
    };

    document.getElementById('add-date-btn').onclick = () => {
        syncAllTextFields(); // Save whatever is currently typed
        const id = Date.now();
        const today = new Date().toLocaleDateString('en-GB'); 
        textFields.push({ id: id, text: today, page: currentPage, left: 50, top: 120, width: 90, height: 35, color: currentStrokeColor, font: currentFont });
        selectedId = id;
        renderAllElements();
    };

    document.getElementById('save-sig-btn').onclick = () => {
        syncAllTextFields(); // Save whatever is currently typed
        const dataURL = sigPad.toDataURL();
        const id = Date.now();
        signatures.push({ id: id, dataURL: dataURL, page: currentPage, left: 50, top: 50, width: 120, height: 60, color: currentStrokeColor });
        selectedId = id;
        renderAllElements();
        closeModal();
    };

    document.getElementById('prev-page').onclick = () => { if (currentPage > 1) renderPage(currentPage - 1); };
    document.getElementById('next-page').onclick = () => { if (currentPage < pdfDoc.numPages) renderPage(currentPage + 1); };
    document.getElementById('download-btn').onclick = handleDownload;
    document.getElementById('clear-pad').onclick = () => sigCtx.clearRect(0,0,sigPad.width,sigPad.height);
    document.getElementById('close-modal').onclick = closeModal;

    function syncAllTextFields() {
        document.querySelectorAll('.editable-text').forEach(div => {
            // Find the parent's ID to match with our array
            const parentEl = div.closest('.text-instance');
            if (parentEl) {
                // We'll store the ID on the element to find it easily
                const id = parseInt(parentEl.getAttribute('data-id'));
                const field = textFields.find(t => t.id === id);
                if (field) {
                    field.text = div.innerText;
                }
            }
        });
    }
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
        const isSelected = selectedId === item.id;
        const el = document.createElement('div');
        el.className = item.type === 'sig' ? 'sig-instance' : 'text-instance';
        el.setAttribute('data-id', item.id); // Add this line!
        
        const borderStyle = isSelected ? `2px dashed ${item.color}` : `1px solid transparent`;
        el.style.cssText = `position: absolute; left:${item.left}px; top:${item.top}px; width:${item.width}px; height:${item.height}px; touch-action:none; z-index:100; border:${borderStyle}; cursor: pointer;`;

        // 1. CONTENT
        if (item.type === 'sig') {
            el.innerHTML += `<img src="${item.dataURL}" style="width:100%; height:100%; pointer-events:none; user-select:none;">`;
        } else {
            const fs = item.height * 0.7; 
            const textDiv = document.createElement('div');
            textDiv.className = "editable-text";
            textDiv.contentEditable = "true";
            textDiv.style.cssText = `outline:none; width:100%; height:100%; font-size:${item.height * 0.7}px; color:${item.color}; font-family:${item.font}; overflow:hidden; white-space:nowrap; padding: 2px; display:flex; align-items:center; /* Vertically centers the text in the box */`;
            
            // CRITICAL: Pull directly from the item object
            textDiv.innerText = item.text;

            // PERSISTENCE: Immediate sync to master array
            textDiv.oninput = (e) => {
                const newText = e.target.innerText;
                // Update local reference
                item.text = newText;
                // Update master array reference
                const masterIdx = textFields.findIndex(t => t.id === item.id);
                if (masterIdx !== -1) {
                    textFields[masterIdx].text = newText;
                }
            };

            // SELECTION: Fix for text fields
            textDiv.onpointerdown = (e) => {
                e.stopPropagation(); 
                if (selectedId !== item.id) {
                    selectedId = item.id;
                    renderAllElements();
                }
            };
            
            el.appendChild(textDiv);
        }

        // 2. CONTROLS
        if (isSelected) {
            el.innerHTML += `
                <div class="drag-grip" style="position:absolute; top:-28px; left:-1px; background:${item.color}; color:white; font-size:10px; padding:4px 10px; cursor:move; border-radius:4px 4px 0 0; z-index:110; font-weight:bold;">MOVE</div>
                <div class="resizer" style="position:absolute; width:16px; height:16px; background:${item.color}; bottom:-8px; right:-8px; cursor:nwse-resize; border-radius:50%; border:2px solid white; z-index:115;"></div>
                <div class="delete-btn" style="position:absolute; top:-12px; right:-12px; background:#ff4757; color:white; border-radius:50%; width:22px; height:22px; text-align:center; cursor:pointer; line-height:20px; font-weight:bold; z-index:115; border:2px solid white;">×</div>
            `;
        }

        // 3. INTERACTION
        el.onpointerdown = (e) => {
            e.stopPropagation(); 
            
            if (selectedId !== item.id) {
                selectedId = item.id;
                renderAllElements();
                return;
            }

            const isResizing = e.target.classList.contains('resizer');
            const isGrip = e.target.classList.contains('drag-grip');
            const isDelete = e.target.classList.contains('delete-btn');

            if (isDelete) {
                if (item.type === 'sig') signatures = signatures.filter(s => s.id !== item.id);
                else textFields = textFields.filter(t => t.id !== item.id);
                selectedId = null;
                renderAllElements();
                return;
            }

            if (!isResizing && !isGrip) return;

            const startX = e.clientX; const startY = e.clientY;
            const startW = item.width; const startH = item.height;
            const startL = item.left; const startT = item.top;

            el.setPointerCapture(e.pointerId);

             el.onpointermove = (em) => {
                const dx = em.clientX - startX; 
                const dy = em.clientY - startY;

                if (isResizing) {
                    // 1. Calculate new dimensions
                    item.width = Math.max(30, startW + dx);
                    item.height = Math.max(15, startH + dy); // Minimum height for mobile

                    // 2. Apply dimensions to the container
                    el.style.width = item.width + 'px';
                    el.style.height = item.height + 'px';

                    // 3. SCALE THE FONT (The Magic Part)
                    if (item.type === 'text') {
                        const tDiv = el.querySelector('.editable-text');
                        if (tDiv) {
                            // Adjust the 0.7 multiplier to change how "tight" the font fits the box
                            const newFs = item.height * 0.7; 
                            tDiv.style.fontSize = newFs + 'px';
                        }
                    }
                } else {
                    // Movement logic stays the same...
                    item.left = startL + dx;
                    item.top = startT + dy;
                    el.style.left = item.left + 'px';
                    el.style.top = item.top + 'px';
                }
            };

            el.onpointerup = () => {
                el.onpointermove = null;
                el.releasePointerCapture(e.pointerId);
                // Final save to master arrays
                const master = item.type === 'sig' ? signatures : textFields;
                const rec = master.find(i => i.id === item.id);
                if (rec) {
                    rec.left = item.left;
                    rec.top = item.top;
                    rec.width = item.width;
                    rec.height = item.height;
                }
            };
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
                    
