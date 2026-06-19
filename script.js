// ============================================================
//  Devu QR Code Generator - Main Application Logic
//  Author: Divyanshu Thakur
//  Description: Handles QR generation, color/logo updates,
//  title syncing, and clipboard/share/download actions.
// ============================================================

(function() {
    'use strict';

    // --- DOM References ---
    const urlInput = document.getElementById('urlInput');
    const titleInput = document.getElementById('titleInput');
    const colorPicker = document.getElementById('colorPicker');
    const bgPicker = document.getElementById('bgPicker');
    const logoUpload = document.getElementById('logoUpload');
    const generateBtn = document.getElementById('generateBtn');
    const qrContainer = document.getElementById('qrCodeContainer');
    const qrTitleElement = document.getElementById('qrTitle');
    const downloadBtn = document.getElementById('downloadBtn');
    const copyBtn = document.getElementById('copyBtn');
    const shareBtn = document.getElementById('shareBtn');
    const toast = document.getElementById('toast');

    // --- State ---
    let qrCodeInstance = null;
    let currentLogoDataURL = null;
    let toastTimeout = null;

    // --- Defaults ---
    const DEFAULT_URL = 'https://github.com/Devu77';
    const DEFAULT_TITLE = 'Devu\'s GitHub';
    const DEFAULT_COLOR = '#3b82f6';
    const DEFAULT_BG = '#ffffff';

    // --- Toast System ---
    function showToast(message, duration = 2500) {
        if (toastTimeout) {
            clearTimeout(toastTimeout);
            toast.classList.remove('show');
            toast.classList.add('hidden');
        }
        // Force reflow for smooth re-entry
        void toast.offsetWidth; 
        toast.textContent = message;
        toast.classList.remove('hidden');
        toast.classList.add('show');
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
            toast.classList.add('hidden');
            toastTimeout = null;
        }, duration);
    }

    // --- QR Code Initialization / Update ---
    function generateQR() {
        const url = urlInput.value.trim();
        if (!url) {
            showToast('⚠️ Please enter a valid URL.', 3000);
            return;
        }

        // Validate URL format (simple check)
        try {
            new URL(url);
        } catch (_) {
            showToast('⚠️ Please enter a full URL (include https://).', 3000);
            return;
        }

        const title = titleInput.value.trim() || 'My QR Code';
        qrTitleElement.textContent = title;

        const dotColor = colorPicker.value || DEFAULT_COLOR;
        const bgColor = bgPicker.value || DEFAULT_BG;

        const options = {
            width: 280,
            height: 280,
            type: 'canvas',
            data: url,
            dotsOptions: {
                color: dotColor,
                type: 'square'
            },
            backgroundOptions: {
                color: bgColor
            },
            image: currentLogoDataURL || null,
            imageOptions: {
                crossOrigin: 'anonymous',
                margin: 12,
                imageSize: 0.25 // Logo takes up 25% of QR space
            },
            cornersSquareOptions: {
                type: 'extra-rounded'
            }
        };

        if (!qrCodeInstance) {
            // First time creation
            qrCodeInstance = new QRCodeStyling(options);
            qrContainer.innerHTML = ''; // Clear any placeholder
            qrCodeInstance.append(qrContainer);
            showToast('✅ QR Code generated successfully!', 2000);
        } else {
            // Update existing instance
            qrCodeInstance.update(options);
            showToast('🔄 QR Code updated!', 1500);
        }
    }

    // --- Update Color (Live Preview) ---
    function updateColor() {
        if (!qrCodeInstance) {
            // If no QR exists, just silently update the picker state
            return;
        }
        const dotColor = colorPicker.value;
        const bgColor = bgPicker.value;
        qrCodeInstance.update({
            dotsOptions: { color: dotColor },
            backgroundOptions: { color: bgColor }
        });
        // No toast here to avoid spam; the user sees it live.
    }

    // --- Update Logo ---
    function handleLogoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            showToast('⚠️ Please upload a valid image file.', 3000);
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            currentLogoDataURL = e.target.result;
            if (qrCodeInstance) {
                qrCodeInstance.update({
                    image: currentLogoDataURL
                });
                showToast('🖼️ Logo added to QR!', 2000);
            } else {
                // If QR not generated yet, store it; generate will pick it up.
                showToast('🖼️ Logo loaded. Generate the QR to see it.', 2000);
            }
            // Update the file placeholder text
            const placeholder = document.querySelector('.file-placeholder');
            if (placeholder) {
                placeholder.textContent = `📎 ${file.name}`;
            }
        };
        reader.readAsDataURL(file);
    }

    // --- Sync Title ---
    function updateTitle() {
        const title = titleInput.value.trim() || 'My QR Code';
        qrTitleElement.textContent = title;
    }

    // --- Download QR ---
    function downloadQR() {
        if (!qrCodeInstance) {
            showToast('⚠️ Generate a QR code first!', 2500);
            return;
        }
        const title = (titleInput.value.trim() || 'devu-qr').replace(/[^a-zA-Z0-9]/g, '_');
        qrCodeInstance.download({
            name: title,
            extension: 'png'
        });
        showToast('📥 Download started!', 2000);
    }

    // --- Copy QR to Clipboard ---
    async function copyQR() {
        if (!qrCodeInstance) {
            showToast('⚠️ Generate a QR code first!', 2500);
            return;
        }

        try {
            // Get the canvas element from the container
            const canvas = qrContainer.querySelector('canvas');
            if (!canvas) {
                showToast('⚠️ No canvas found to copy.', 2500);
                return;
            }
            
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            await navigator.clipboard.write([
                new ClipboardItem({
                    [blob.type]: blob
                })
            ]);
            showToast('📋 QR code copied to clipboard!', 2000);
        } catch (err) {
            console.error('Copy failed:', err);
            // Fallback: copy the URL instead
            try {
                const url = urlInput.value.trim() || DEFAULT_URL;
                await navigator.clipboard.writeText(url);
                showToast('📋 URL copied to clipboard (image copy failed).', 2500);
            } catch (_) {
                showToast('⚠️ Unable to copy. Try downloading instead.', 3000);
            }
        }
    }

    // --- Share QR ---
    async function shareQR() {
        if (!qrCodeInstance) {
            showToast('⚠️ Generate a QR code first!', 2500);
            return;
        }

        const canvas = qrContainer.querySelector('canvas');
        if (!canvas) {
            showToast('⚠️ No QR image to share.', 2500);
            return;
        }

        try {
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            const file = new File([blob], 'devu-qr.png', { type: 'image/png' });
            
            if (navigator.share) {
                await navigator.share({
                    title: titleInput.value.trim() || 'My QR Code',
                    text: `Check out this QR code generated by Devu QR Generator!`,
                    files: [file]
                });
                showToast('📤 Shared successfully!', 2000);
            } else {
                // Fallback: Download if Web Share API not available
                showToast('⚠️ Share API not supported. Downloading instead.', 2500);
                downloadQR();
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Share failed:', err);
                showToast('⚠️ Share cancelled or failed.', 2500);
            }
        }
    }

    // --- Initialize on Load ---
    function init() {
        // Set default values
        urlInput.value = DEFAULT_URL;
        titleInput.value = DEFAULT_TITLE;
        colorPicker.value = DEFAULT_COLOR;
        bgPicker.value = DEFAULT_BG;

        // Generate initial QR
        generateQR();

        // --- Event Listeners ---
        generateBtn.addEventListener('click', generateQR);

        // Live color update with debounce (throttle to avoid rapid flickers)
        let colorTimeout;
        colorPicker.addEventListener('input', function() {
            clearTimeout(colorTimeout);
            colorTimeout = setTimeout(() => {
                updateColor();
            }, 50);
        });
        bgPicker.addEventListener('input', function() {
            clearTimeout(colorTimeout);
            colorTimeout = setTimeout(() => {
                updateColor();
            }, 50);
        });

        titleInput.addEventListener('input', updateTitle);

        logoUpload.addEventListener('change', handleLogoUpload);

        downloadBtn.addEventListener('click', downloadQR);
        copyBtn.addEventListener('click', copyQR);
        shareBtn.addEventListener('click', shareQR);

        // Keyboard shortcut: Enter key in URL input triggers generate
        urlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                generateBtn.click();
            }
        });
        titleInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                generateBtn.click();
            }
        });

        console.log('⚡ Devu QR Code Generator initialized successfully.');
        console.log('👨‍💻 Built by Divyanshu Thakur (https://github.com/Devu77)');
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();