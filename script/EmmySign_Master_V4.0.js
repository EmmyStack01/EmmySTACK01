/**
 * EmmySign Master JS - Final Production V4.0
 *
 * MERGED FEATURES:
 *  - Multi-color logic for Signature & Text (V3.6)
 *  - Color-sync, Movement Grips, Extreme Zoom (V3.6)
 *  - PDF Export with PDF-Lib (V3.6)
 *  - High-DPI / Retina clarity on sig pad + PDF canvas (V3.7 / V3.8)
 *  - Signature Presets via localStorage (V3.7 / V3.8)
 *  - Zoom Percentage Indicator (V3.7)
 *  - Guided Signing / "Next Spot" button (V3.7)
 *  - Remote Signing Session via URL ?id= param (V3.7 / V3.8)
 *  - adjustCanvasDPI() helper (V3.8 deduplicated check)
 *  - updateGuidedButton() visibility helper (V3.8)
 *  - Cloud Sync Engine: Firebase upload + original file cleanup (V4.0)
 *  - handleCompleteAndDownload() replaces handleDownload() (V4.0)
 *
 * Author: Emmy STACK01
 */

// ─────────────────────────────────────────────
// GLOBAL STATE
// ─────────────────────────────────────────────
let pdfDoc          = null;
let currentPage     = 1;
let currentPdfBytes = null;
let pdfScale        = 1.0;
let signatures      = [];
let textFields      = [];
let currentStrokeColor = "#000000";
let currentFont        = "sans-serif";


// ─────────────────────────────────────────────
// DOM READY
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

    // ── 1. SIGNATURE PRESETS (localStorage) ──────────────────────────────────
    initSignaturePresets();

    // ── 2. COLOR PICKER ───────────────────────────────────────────────────────
    const colorBtns = document.querySelectorAll('.color-btn');
    colorBtns.forEach(btn => {
        btn.onclick = () => {
            currentStrokeColor = btn.getAttribute('data-color');
            colorBtns.forEach(b => {
                b.style.border     = 'none';
                b.style.transform  = 'scale(1)';
                b.style.boxShadow  = 'none';
            });
            btn.style.border     = '3px solid white';
            btn.style.boxShadow  = '0 0 8px rgba(0,0,0,0.3)';
            btn.style.transform  = 'scale(1.1)';
            // Live-update sig pad if open
            if (sigCtx) sigCtx.strokeStyle = currentStrokeColor;
        };
    });

    // ── 3. SIGNATURE PAD (High-DPI + Color-Sync) ─────────────────────────────
    const sigPad = document.getElementById('sig-pad');
    const sigCtx = sigPad ? sigPad.getContext('2d') : null;
    let isDrawing = false;

    if (sigPad) {
        // High-DPI setup
        setupHighDPI(sigPad, sigCtx);
        window.addEventListener('resize', () => setupHighDPI(sigPad, sigCtx));

        const getPos = (e) => {
            const rect    = sigPad.getBoundingClientRect();
            const clientX = e.clientX ?? (e.touches?.[0]?.clientX);
            const clientY = e.clientY ?? (e.touches?.[0]?.clientY);
            // After High-DPI setup the CSS and logical coords align, so no manual
            // DPR division is needed — getBoundingClientRect gives CSS pixels.
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        };

        sigPad.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });

        sigPad.onpointerdown = (e) => {
            isDrawing = true;
            const pos = getPos(e);
            sigCtx.beginPath();
            sigCtx.strokeStyle = currentStrokeColor;
            sigCtx.lineWidth   = 3;
            sigCtx.lineCap     = "round";
            sigCtx.lineJoin    = "round";
            sigCtx.moveTo(pos.x, pos.y);
            sigPad.setPointerCapture(e.pointerId);
        };

        sigPad.onpointermove = (e) => {
            if (!isDrawing) return;
            const pos = getPos(e);
            sigCtx.lineTo(pos.x, pos.y);
            sigCtx.stroke();
        };

        window.addEventListener('pointerup', () => { isDrawing = false; });
    }

    // ── 4. PDF UPLOAD ─────────────────────────────────────────────────────────
    const pdfUpload = document.getElementById('pdf-upload');
    if (pdfUpload) {
        pdfUpload.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const buffer       = await file.arrayBuffer();
            currentPdfBytes    = new Uint8Array(buffer.slice(0));
            const loadingTask  = pdfjsLib.getDocument({ data: new Uint8Array(currentPdfBytes.slice(0)) });
            pdfDoc             = await loadingTask.promise;
            document.getElementById('total-pages').textContent = pdfDoc.numPages;
            renderPage(1);
        });
    }

    // ── 5. OPEN / CLOSE MODAL ─────────────────────────────────────────────────
    document.getElementById('open-sig-btn').onclick = () => {
        document.getElementById('sig-modal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    };
    document.getElementById('close-modal').onclick  = closeModal;
    document.getElementById('clear-pad').onclick    = () => {
        if (sigCtx) sigCtx.clearRect(0, 0, sigPad.width, sigPad.height);
    };

    // ── 6. SAVE SIGNATURE ─────────────────────────────────────────────────────
    document.getElementById('save-sig-btn').onclick = () => {
        const dataURL = sigPad.toDataURL('image/png');
        // Optional "Save as Preset" checkbox — add <input type="checkbox" id="save-preset"> to HTML
        const saveAsPreset = document.getElementById('save-preset')?.checked;
        if (saveAsPreset) {
            localStorage.setItem('emmysign_master_sig', dataURL);
            updatePresetUI(dataURL);
        }
        addSignatureToCanvas(dataURL);
        closeModal();
    };

    // ── 7. ADD TEXT / DATE ────────────────────────────────────────────────────
    document.getElementById('add-text-btn').onclick = () => {
        textFields.push({
            id: Date.now(), text: "Type...", page: currentPage,
            left: 50, top: 50, width: 90, height: 35,
            color: currentStrokeColor, font: currentFont
        });
        renderAllElements();
    };

    document.getElementById('add-date-btn').onclick = () => {
        const today = new Date().toLocaleDateString('en-GB');
        textFields.push({
            id: Date.now(), text: today, page: currentPage,
            left: 50, top: 120, width: 90, height: 35,
            color: currentStrokeColor, font: currentFont
        });
        renderAllElements();
    };

    // ── 8. PAGINATION ─────────────────────────────────────────────────────────
    document.getElementById('prev-page').onclick = () => {
        if (currentPage > 1) renderPage(currentPage - 1);
    };
    document.getElementById('next-page').onclick = () => {
        if (pdfDoc && currentPage < pdfDoc.numPages) renderPage(currentPage + 1);
    };

    // ── 9. DOWNLOAD / COMPLETE ────────────────────────────────────────────────
    // handleCompleteAndDownload() replaces the old handleDownload().
    // Wire it to your download button:
    document.getElementById('download-btn').onclick = handleCompleteAndDownload;

    // ── 10. ZOOM ──────────────────────────────────────────────────────────────
    window.changeZoom = (delta) => {
        pdfScale = Math.min(Math.max(0.1, pdfScale + delta), 3.0);
        updateZoomIndicator();
        renderPage(currentPage);
    };
    updateZoomIndicator(); // Set initial display

    // ── 11. GUIDED SIGNING ────────────────────────────────────────────────────
    window.scrollToNextSign = () => {
        const nextEl = [...signatures, ...textFields].find(el => el.page > currentPage);
        if (nextEl) {
            renderPage(nextEl.page);
            document.getElementById('pdf-container').scrollTop = 0;
        } else {
            alert("No more signatures required!");
        }
    };

    // ── 12. REMOTE SIGNING SESSION ────────────────────────────────────────────
    // Reads ?id=<docId> from the URL and auto-loads the PDF from Firestore.
    const urlParams = new URLSearchParams(window.location.search);
    const docId     = urlParams.get('id');

    if (docId) {
        console.log("Remote Signing Session Detected: " + docId);
        // Requires Firebase db to be initialised before this script runs.
        if (typeof db !== 'undefined') {
            db.collection("documents").doc(docId).get().then((doc) => {
                if (doc.exists) {
                    const data = doc.data();
                    loadRemotePDF(data.originalPDF);
                } else {
                    alert("This signing link is invalid or has expired.");
                }
            }).catch(err => console.error("Firestore fetch error:", err));
        } else {
            console.warn("Firebase 'db' not found. Remote session will not load.");
        }
    }

    // ── 13. CUSTOM renderDone EVENT → update guided button ───────────────────
    window.addEventListener('renderDone', updateGuidedButton);
});


// ─────────────────────────────────────────────
// HIGH-DPI HELPER
// ─────────────────────────────────────────────

/**
 * Scales a canvas internal buffer to match the device pixel ratio so lines
 * are crisp on Retina / high-DPI displays. Call once after the canvas is
 * visible and again on resize.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {CanvasRenderingContext2D} ctx  – pass null to auto-get
 * @returns {CanvasRenderingContext2D}
 */
function adjustCanvasDPI(canvas, ctx) {
    const dpr  = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width  = rect.width  * dpr;
    canvas.height = rect.height * dpr;
    const context = ctx || canvas.getContext('2d');
    context.scale(dpr, dpr);
    return context;
}

/** Alias used by the sig-pad setup block above */
function setupHighDPI(canvas, ctx) {
    return adjustCanvasDPI(canvas, ctx);
}


// ─────────────────────────────────────────────
// ZOOM INDICATOR
// ─────────────────────────────────────────────
function updateZoomIndicator() {
    const indicator = document.getElementById('zoom-val');
    if (indicator) indicator.innerText = `${Math.round(pdfScale * 100)}%`;
}


// ─────────────────────────────────────────────
// GUIDED SIGNING — button visibility
// ─────────────────────────────────────────────
function updateGuidedButton() {
    const nextBtn      = document.getElementById('next-sig-btn');
    const hasMorePages = [...signatures, ...textFields].some(el => el.page > currentPage);
    if (nextBtn) nextBtn.style.display = hasMorePages ? 'block' : 'none';
}


// ─────────────────────────────────────────────
// SIGNATURE PRESETS (localStorage)
// ─────────────────────────────────────────────
function initSignaturePresets() {
    const savedSig = localStorage.getItem('emmysign_master_sig');
    if (savedSig) updatePresetUI(savedSig);
}

function updatePresetUI(dataURL) {
    const presetBox = document.getElementById('preset-container');
    if (!presetBox) return;

    presetBox.innerHTML = `
        <div style="margin-top:15px; border-top:1px solid #eee; padding-top:10px;">
            <p style="font-size:11px; font-weight:bold; color:#3498db; margin-bottom:5px;">SAVED MASTER SIGNATURE</p>
            <div id="preset-sig-wrapper"
                 style="border:2px dashed #3498db; border-radius:8px; padding:10px;
                        background:#f9f9f9; cursor:pointer; text-align:center;">
                <img src="${dataURL}" style="max-width:100%; height:auto; max-height:60px;">
            </div>
            <button id="clear-preset"
                    style="background:none; border:none; color:#ff4757;
                           font-size:10px; cursor:pointer; margin-top:5px;">
                Remove Preset
            </button>
        </div>
    `;

    document.getElementById('preset-sig-wrapper').onclick = () => {
        addSignatureToCanvas(dataURL);
        closeModal();
    };

    document.getElementById('clear-preset').onclick = () => {
        localStorage.removeItem('emmysign_master_sig');
        presetBox.innerHTML = '';
    };
}


// ─────────────────────────────────────────────
// REMOTE PDF LOADER  (called from signing-link flow)
// ─────────────────────────────────────────────
async function loadRemotePDF(url) {
    try {
        const response      = await fetch(url);
        const buffer        = await response.arrayBuffer();
        currentPdfBytes     = new Uint8Array(buffer);
        const loadingTask   = pdfjsLib.getDocument({ data: currentPdfBytes });
        pdfDoc              = await loadingTask.promise;
        document.getElementById('total-pages').textContent = pdfDoc.numPages;
        renderPage(1);
    } catch (err) {
        console.error("Failed to load remote PDF:", err);
        alert("Could not load the document. Please try again.");
    }
}

/**
 * loadDocumentFromLink — alternative entry point if you prefer calling this
 * directly rather than inline in DOMContentLoaded.
 */
async function loadDocumentFromLink() {
    const urlParams = new URLSearchParams(window.location.search);
    const docId     = urlParams.get('id');
    if (!docId) return;

    const docSnap = await db.collection('documents').doc(docId).get();
    if (docSnap.exists) {
        const data = docSnap.data();
        await loadRemotePDF(data.originalPDF);
    }
}


// ─────────────────────────────────────────────
// ADD SIGNATURE TO CANVAS
// ─────────────────────────────────────────────
function addSignatureToCanvas(dataURL) {
    signatures.push({
        id: Date.now(), dataURL, page: currentPage,
        left: 50, top: 50, width: 120, height: 60,
        color: currentStrokeColor
    });
    renderAllElements();
}


// ─────────────────────────────────────────────
// CLOSE MODAL
// ─────────────────────────────────────────────
function closeModal() {
    const modal  = document.getElementById('sig-modal');
    const sigPad = document.getElementById('sig-pad');
    const sigCtx = sigPad ? sigPad.getContext('2d') : null;
    if (modal)  modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    if (sigCtx) sigCtx.clearRect(0, 0, sigPad.width, sigPad.height);
}


// ─────────────────────────────────────────────
// ENGINE: RENDER PAGE  (High-DPI PDF canvas)
// ─────────────────────────────────────────────
async function renderPage(num) {
    if (!pdfDoc || num < 1 || num > pdfDoc.numPages) return;
    currentPage = num;

    const page      = await pdfDoc.getPage(num);
    const canvas    = document.getElementById('pdf-render-canvas');
    const container = document.getElementById('pdf-container');

    const unscaledViewport = page.getViewport({ scale: 1 });
    const fitScale         = (container.clientWidth / unscaledViewport.width) * pdfScale;
    const viewport         = page.getViewport({ scale: fitScale });

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // High-DPI PDF canvas
    canvas.width        = viewport.width  * dpr;
    canvas.height       = viewport.height * dpr;
    canvas.style.width  = viewport.width  + 'px';
    canvas.style.height = viewport.height + 'px';

    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset any previous transform
    ctx.scale(dpr, dpr);

    await page.render({ canvasContext: ctx, viewport }).promise;

    document.getElementById('current-page').textContent = num;
    updateZoomIndicator();
    renderAllElements();

    // Notify guided-signing logic
    window.dispatchEvent(new Event('renderDone'));
}


// ─────────────────────────────────────────────
// ENGINE: RENDER ALL ELEMENTS
// ─────────────────────────────────────────────
function renderAllElements() {
    const container = document.getElementById('pdf-container');
    container.querySelectorAll('.sig-instance, .text-instance').forEach(el => el.remove());

    const items = [
        ...signatures.filter(s => s.page === currentPage).map(s => ({ ...s, type: 'sig' })),
        ...textFields.filter(t => t.page === currentPage).map(t => ({ ...t, type: 'text' }))
    ];

    items.forEach(item => {
        const el        = document.createElement('div');
        el.className    = item.type === 'sig' ? 'sig-instance' : 'text-instance';
        el.style.cssText = `
            position: absolute;
            left:   ${item.left}px;
            top:    ${item.top}px;
            width:  ${item.width}px;
            height: ${item.height}px;
            touch-action: none;
            z-index: 100;
            border: 1px solid ${item.color};
            background: rgba(255,255,255,0.1);
        `;

        // DRAG GRIP
        const grip         = document.createElement('div');
        grip.className     = "drag-grip";
        grip.style.cssText = `
            position: absolute; top: -24px; left: -1px;
            background: ${item.color}; color: white;
            font-size: 10px; padding: 2px 8px;
            cursor: move; border-radius: 3px 3px 0 0; z-index: 110;
        `;
        grip.innerText = 'MOVE';
        el.appendChild(grip);

        // CONTENT
        if (item.type === 'sig') {
            const img          = document.createElement('img');
            img.src            = item.dataURL;
            img.style.cssText  = "width:100%; height:100%; pointer-events:none;";
            el.appendChild(img);
        } else {
            const fs           = item.height * 0.7;
            const editable     = document.createElement('div');
            editable.className = "editable-text";
            editable.contentEditable = "true";
            editable.style.cssText   = `
                outline: none; width: 100%; height: 100%;
                font-size: ${fs}px; color: ${item.color};
                font-family: ${item.font};
                overflow: hidden; white-space: nowrap;
            `;
            editable.innerText = item.text;
            editable.onblur    = (e) => {
                const record = textFields.find(t => t.id === item.id);
                if (record) record.text = e.target.innerText;
            };
            el.appendChild(editable);
        }

        // RESIZER HANDLE
        const resizer         = document.createElement('div');
        resizer.className     = "resizer";
        resizer.style.cssText = `
            position: absolute; width: 18px; height: 18px;
            background: ${item.color}; bottom: -9px; right: -9px;
            cursor: nwse-resize; border-radius: 50%;
            border: 2px solid white; z-index: 115;
        `;
        el.appendChild(resizer);

        // DELETE BUTTON
        const delBtn         = document.createElement('div');
        delBtn.className     = "delete-btn";
        delBtn.style.cssText = `
            position: absolute; top: -12px; right: -12px;
            background: #ff4757; color: white; border-radius: 50%;
            width: 24px; height: 24px; text-align: center;
            cursor: pointer; line-height: 22px; font-weight: bold;
            z-index: 115; border: 2px solid white;
        `;
        delBtn.innerText = '×';
        delBtn.onclick   = (e) => {
            e.stopPropagation();
            if (item.type === 'sig') signatures  = signatures.filter(s => s.id !== item.id);
            else                      textFields  = textFields.filter(t => t.id !== item.id);
            renderAllElements();
        };
        el.appendChild(delBtn);

        // POINTER ENGINE (drag + resize)
        el.onpointerdown = (e) => {
            const isResizing = e.target.classList.contains('resizer');
            const isGrip     = e.target.classList.contains('drag-grip');
            if (!isResizing && !isGrip) return;

            const startX = e.clientX, startY = e.clientY;
            const startW = item.width,  startH = item.height;
            const startL = item.left,   startT = item.top;

            el.setPointerCapture(e.pointerId);

            el.onpointermove = (em) => {
                const dx = em.clientX - startX;
                const dy = em.clientY - startY;

                if (isResizing) {
                    item.width  = Math.max(15, startW + dx);
                    item.height = Math.max(10, startH + dy);
                    el.style.width  = item.width  + 'px';
                    el.style.height = item.height + 'px';
                    if (item.type === 'text') {
                        el.querySelector('.editable-text').style.fontSize = (item.height * 0.7) + 'px';
                    }
                } else {
                    item.left = startL + dx;
                    item.top  = startT + dy;
                    el.style.left = item.left + 'px';
                    el.style.top  = item.top  + 'px';
                }
            };

            el.onpointerup = () => {
                const master = item.type === 'sig' ? signatures : textFields;
                const record = master.find(i => i.id === item.id);
                if (record) Object.assign(record, {
                    left: item.left, top: item.top,
                    width: item.width, height: item.height
                });
                el.onpointermove = null;
                el.releasePointerCapture(e.pointerId);
            };
        };

        container.appendChild(el);
    });
}


// ─────────────────────────────────────────────
// EXPORT: handleCompleteAndDownload
// Replaces the old handleDownload().
// Handles: Local download + Firebase cloud sync + original file cleanup.
// ─────────────────────────────────────────────
async function handleCompleteAndDownload() {
    if (!currentPdfBytes) return alert("Please upload a PDF first.");

    // 1. Build the signed PDF
    const pdfDocLib = await PDFLib.PDFDocument.load(currentPdfBytes.slice(0));
    const pages     = pdfDocLib.getPages();
    const canvRect  = document.getElementById('pdf-render-canvas').getBoundingClientRect();

    // Draw signatures
    for (const sig of signatures) {
        const page           = pages[sig.page - 1];
        const { width, height } = page.getSize();
        const sigImage       = await pdfDocLib.embedPng(sig.dataURL);
        const sX             = width  / canvRect.width;
        const sY             = height / canvRect.height;
        page.drawImage(sigImage, {
            x:      sig.left   * sX,
            y:      (canvRect.height - sig.top - sig.height) * sY,
            width:  sig.width  * sX,
            height: sig.height * sY
        });
    }

    // Draw text fields
    for (const tf of textFields) {
        const page           = pages[tf.page - 1];
        const { width, height } = page.getSize();
        const sX             = width  / canvRect.width;
        const sY             = height / canvRect.height;
        const rgb            = hexToRgb(tf.color);
        page.drawText(tf.text, {
            x:     tf.left  * sX,
            y:     (canvRect.height - tf.top - (tf.height * 0.75)) * sY,
            size:  (tf.height * 0.6) * sX,
            color: PDFLib.rgb(rgb.r, rgb.g, rgb.b)
        });
    }

    const pdfBytes = await pdfDocLib.save();
    const pdfBlob  = new Blob([pdfBytes], { type: "application/pdf" });

    // 2. Remote session detection (?id=<docId>)
    const urlParams = new URLSearchParams(window.location.search);
    const docId     = urlParams.get('id');

    if (docId && typeof storage !== 'undefined' && typeof db !== 'undefined') {
        // 3. CLOUD SYNC
        try {
            console.log("Remote session detected. Syncing to Digital DNA Vault...");

            // A. Upload signed PDF
            const signedFileRef = storage.ref().child(`signed_outputs/${docId}_signed.pdf`);
            const uploadTask    = await signedFileRef.put(pdfBlob);
            const downloadURL   = await uploadTask.ref.getDownloadURL();

            // B. Fetch original file URL then delete it
            const docSnap       = await db.collection("documents").doc(docId).get();
            const data          = docSnap.data();

            if (data && data.originalPDF) {
                await firebase.storage().refFromURL(data.originalPDF).delete();
                console.log("Original file purged to save storage.");
            }

            // C. Update Firestore status
            await db.collection("documents").doc(docId).update({
                status:      "signed",
                signedPDF:   downloadURL,
                originalPDF: firebase.firestore.FieldValue.delete(),
                completedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            console.log("Cloud sync complete.");
        } catch (error) {
            console.error("Cloud Sync Error:", error);
            alert("Signed locally, but failed to sync to cloud. Your local file will still download.");
        }
    }

    // 4. LOCAL DOWNLOAD (always runs)
    const link    = document.createElement('a');
    link.href     = URL.createObjectURL(pdfBlob);
    link.download = `EmmySign_Signed_${Date.now()}.pdf`;
    link.click();
}

/**
 * completeAndCleanup — standalone cloud cleanup utility.
 * Call this manually if you need to clean up a specific doc after upload.
 *
 * @param {string} docId           - Firestore document ID
 * @param {string} originalFilePath - Firebase Storage URL of the original PDF
 */
async function completeAndCleanup(docId, originalFilePath) {
    try {
        console.log("Cleanup initiated for: " + docId);

        // Delete the original un-signed PDF
        const fileRef = firebase.storage().refFromURL(originalFilePath);
        await fileRef.delete();

        // Mark as completed in Firestore
        await db.collection("documents").doc(docId).update({
            status:      "completed",
            originalPDF: firebase.firestore.FieldValue.delete(),
            completedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert("Document signed and storage cleaned!");
    } catch (error) {
        console.error("Cleanup failed:", error);
    }
}


// ─────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────

/**
 * Converts a CSS hex color to an RGB object with values in the 0–1 range
 * (as expected by PDF-Lib's PDFLib.rgb()).
 */
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 0, b: 0 };
}
