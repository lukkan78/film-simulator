/**
 * Film Simulator App - Clean Mobile UI
 * Version 37 - Crop rotation and aspect ratio flip
 */

class FilmSimulatorApp {
    constructor() {
        console.log('Film Simulator v36 loaded');
        this.processor = new ImageProcessor();
        this.currentProfile = null;
        this.currentCategory = 'color';
        this.processedPreview = null;
        this.isProcessing = false;
        this.processTimer = null;
        this.lastProcessedKey = '';
        this.pendingProfile = null;
        this.originalBackup = null;

        this.initElements();
        this.initEventListeners();
        this.selectDefaultProfile();
    }

    initElements() {
        // Sections
        this.appHeader = document.getElementById('appHeader');
        this.uploadSection = document.getElementById('uploadSection');
        this.editorSection = document.getElementById('editorSection');
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');

        // Canvas
        this.canvasContainer = document.getElementById('canvasContainer');
        this.previewCanvas = document.getElementById('previewCanvas');
        this.previewCtx = this.previewCanvas.getContext('2d');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.loadingText = document.getElementById('loadingText');

        // Original canvas for compare
        this.originalCanvas = document.createElement('canvas');
        this.originalCanvas.className = 'original-canvas';
        this.canvasContainer.insertBefore(this.originalCanvas, this.canvasContainer.firstChild);
        this.originalCtx = this.originalCanvas.getContext('2d');

        // Film selector
        this.selectedFilm = document.getElementById('selectedFilm');
        this.selectedFilmName = document.getElementById('selectedFilmName');
        this.selectedFilmDesc = document.getElementById('selectedFilmDesc');
        this.filmModal = document.getElementById('filmModal');
        this.filmModalClose = document.getElementById('filmModalClose');
        this.filmTabs = document.getElementById('filmTabs');
        this.filmList = document.getElementById('filmList');

        // Sliders
        this.strengthSlider = document.getElementById('strengthSlider');
        this.strengthValue = document.getElementById('strengthValue');
        this.grainSlider = document.getElementById('grainSlider');
        this.grainValue = document.getElementById('grainValue');
        this.brightnessSlider = document.getElementById('brightnessSlider');
        this.brightnessValue = document.getElementById('brightnessValue');
        this.contrastSlider = document.getElementById('contrastSlider');
        this.contrastValue = document.getElementById('contrastValue');
        this.saturationSlider = document.getElementById('saturationSlider');
        this.saturationValue = document.getElementById('saturationValue');
        this.temperatureSlider = document.getElementById('temperatureSlider');
        this.temperatureValue = document.getElementById('temperatureValue');
        this.vignetteSlider = document.getElementById('vignetteSlider');
        this.vignetteValue = document.getElementById('vignetteValue');
        this.fadeSlider = document.getElementById('fadeSlider');
        this.fadeValue = document.getElementById('fadeValue');
        this.shadowsSlider = document.getElementById('shadowsSlider');
        this.shadowsValue = document.getElementById('shadowsValue');
        this.highlightsSlider = document.getElementById('highlightsSlider');
        this.highlightsValue = document.getElementById('highlightsValue');
        this.blacksSlider = document.getElementById('blacksSlider');
        this.blacksValue = document.getElementById('blacksValue');

        // Adjustments toggle
        this.adjustmentsToggle = document.getElementById('adjustmentsToggle');
        this.adjustmentsPanel = document.getElementById('adjustments');
        this.compareHint = document.getElementById('compareHint');

        // Buttons
        this.cropBtn = document.getElementById('cropBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.newImageBtn = document.getElementById('newImageBtn');

        // Crop modal
        this.cropModal = document.getElementById('cropModal');
        this.cropCanvas = document.getElementById('cropCanvas');
        this.cropCtx = this.cropCanvas.getContext('2d');
        this.cropContainer = document.getElementById('cropContainer');
        this.cropFrame = document.getElementById('cropFrame');
        this.cropCancel = document.getElementById('cropCancel');
        this.cropApply = document.getElementById('cropApply');
        this.cropReset = document.getElementById('cropReset');
        this.cropRatios = document.getElementById('cropRatios');
        this.cropOverlay = document.getElementById('cropOverlay');
        this.cropZoomIndicator = document.getElementById('cropZoomIndicator');
        this.currentCropRatio = 3/2; // Default 35mm

        // Crop state (Instagram-style: move image under fixed frame)
        this.cropImageScale = 1;
        this.cropImageX = 0;
        this.cropImageY = 0;
        this.cropMinScale = 0.1;
        this.cropFitScale = 1;
        this.cropImageWidth = 0;
        this.cropImageHeight = 0;
        this.cropFrameWidth = 0;
        this.cropFrameHeight = 0;
        this.cropRotation = 0; // 0, 90, 180, 270 degrees
        this.cropOriginalCanvas = null; // Store original unrotated image

        // Slider modal
        this.sliderModal = document.getElementById('sliderModal');
        this.sliderModalLabel = document.getElementById('sliderModalLabel');
        this.sliderModalValue = document.getElementById('sliderModalValue');
        this.sliderModalInput = document.getElementById('sliderModalInput');
        this.sliderModalDone = document.getElementById('sliderModalDone');
        this.activeSlider = null;
        this.activeValueEl = null;
        this.activeFormatter = null;

        // Download modal
        this.downloadModal = document.getElementById('downloadModal');
        this.qualityControl = document.getElementById('qualityControl');
        this.qualitySlider = document.getElementById('qualitySlider');
        this.qualityValue = document.getElementById('qualityValue');
        this.cancelDownload = document.getElementById('cancelDownload');
        this.confirmDownload = document.getElementById('confirmDownload');
        this.exportDimensions = document.getElementById('exportDimensions');
        this.exportSize = document.getElementById('exportSize');
        this.fullResolutionCheckbox = document.getElementById('fullResolution');

        // Save modal (iOS)
        this.saveModal = document.getElementById('saveModal');
        this.saveModalImg = document.getElementById('saveModalImg');
        this.saveModalClose = document.getElementById('saveModalClose');

        // Film preview
        this.filmPreviewCanvas = document.getElementById('filmPreviewCanvas');
        this.filmPreviewCtx = this.filmPreviewCanvas.getContext('2d');
        this.filmPreviewLabel = document.getElementById('filmPreviewLabel');
        this.filmPreviewCache = new Map();
        this.previewThumbnail = null;

        // Fullscreen
        this.fullscreenBtn = document.getElementById('fullscreenBtn');
        this.fullscreenExitBtn = document.getElementById('fullscreenExitBtn');
        this.isFullscreen = false;

        // Initialize preview canvas size
        this.filmPreviewCanvas.width = 200;
        this.filmPreviewCanvas.height = 140;
    }

    initEventListeners() {
        // Upload
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files[0]) this.loadImage(e.target.files[0]);
        });

        // Drag & drop
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('drag-over');
        });
        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('drag-over');
        });
        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('drag-over');
            if (e.dataTransfer.files[0]) this.loadImage(e.dataTransfer.files[0]);
        });

        // Tap canvas to toggle compare, double-tap to zoom, drag to pan
        this.lastTap = 0;
        this.isZoomed = false;
        this.isPanning = false;
        this.panStart = { x: 0, y: 0 };
        this.panOffset = { x: 50, y: 50 }; // Center (percentage)
        this.panMoved = false;
        this.touchHandled = false;
        this.lastTouchPos = { x: 0, y: 0 };

        // Touch handling - primary for mobile
        this.canvasContainer.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return;

            const touch = e.touches[0];
            this.lastTouchPos = { x: touch.clientX, y: touch.clientY };
            this.panMoved = false;

            if (this.isZoomed) {
                this.isPanning = true;
                this.panStart = { x: touch.clientX, y: touch.clientY };
            }
        }, { passive: true });

        this.canvasContainer.addEventListener('touchmove', (e) => {
            if (!this.isZoomed) return;

            const dx = e.touches[0].clientX - this.panStart.x;
            const dy = e.touches[0].clientY - this.panStart.y;

            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                this.panMoved = true;
            }

            if (this.isPanning && this.panMoved) {
                this.panOffset.x = Math.max(0, Math.min(100, this.panOffset.x - dx * 0.15));
                this.panOffset.y = Math.max(0, Math.min(100, this.panOffset.y - dy * 0.15));
                this.updatePanPosition();
                this.panStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                e.preventDefault();
            }
        }, { passive: false });

        this.canvasContainer.addEventListener('touchend', (e) => {
            this.isPanning = false;

            // If we moved, don't trigger tap actions
            if (this.panMoved) {
                this.panMoved = false;
                this.touchHandled = true;
                setTimeout(() => this.touchHandled = false, 100);
                return;
            }

            const now = Date.now();
            const timeDiff = now - this.lastTap;

            if (timeDiff < 300 && timeDiff > 0) {
                // Double tap
                if (this.isZoomed) {
                    // Exit zoom
                    this.toggleZoom({ clientX: this.lastTouchPos.x, clientY: this.lastTouchPos.y });
                } else {
                    // Enter zoom
                    this.toggleZoom({ clientX: this.lastTouchPos.x, clientY: this.lastTouchPos.y });
                }
                this.lastTap = 0;
                this.touchHandled = true;
                setTimeout(() => this.touchHandled = false, 100);
            } else {
                // Single tap - wait to see if it's a double tap
                this.lastTap = now;
                const tapTime = now;
                setTimeout(() => {
                    if (this.lastTap === tapTime) {
                        // Confirmed single tap - toggle compare
                        this.toggleCompare();
                    }
                }, 300);
            }

            this.touchHandled = true;
            setTimeout(() => this.touchHandled = false, 100);
        });

        // Click handling - for mouse/desktop
        this.canvasContainer.addEventListener('click', (e) => {
            // Skip if touch already handled this
            if (this.touchHandled) return;
            if (e.target.closest('.compare-hint')) return;
            if (this.wasPanning) {
                this.wasPanning = false;
                return;
            }

            const now = Date.now();
            const timeDiff = now - this.lastTap;

            if (timeDiff < 300 && timeDiff > 0) {
                // Double click - toggle zoom
                this.toggleZoom(e);
                this.lastTap = 0;
            } else {
                // Single click - compare (with delay to check for double)
                this.lastTap = now;
                setTimeout(() => {
                    if (this.lastTap === now) {
                        this.toggleCompare();
                    }
                }, 300);
            }
        });

        // Pan when zoomed - mouse
        this.canvasContainer.addEventListener('mousedown', (e) => {
            if (!this.isZoomed) return;
            this.isPanning = true;
            this.panStart = { x: e.clientX, y: e.clientY };
        });

        this.canvasContainer.addEventListener('mousemove', (e) => {
            if (!this.isPanning || !this.isZoomed) return;
            const dx = e.clientX - this.panStart.x;
            const dy = e.clientY - this.panStart.y;

            this.panOffset.x = Math.max(0, Math.min(100, this.panOffset.x - dx * 0.15));
            this.panOffset.y = Math.max(0, Math.min(100, this.panOffset.y - dy * 0.15));

            this.updatePanPosition();
            this.panStart = { x: e.clientX, y: e.clientY };

            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                this.wasPanning = true;
            }
        });

        this.canvasContainer.addEventListener('mouseup', () => {
            this.isPanning = false;
        });

        this.canvasContainer.addEventListener('mouseleave', () => {
            this.isPanning = false;
        });

        // Film selector
        this.selectedFilm.addEventListener('click', () => this.openFilmModal());
        this.filmModalClose.addEventListener('click', () => this.closeFilmModal(false));
        document.getElementById('filmSelectBtn').addEventListener('click', () => this.closeFilmModal(true));

        // Film tabs
        this.filmTabs.querySelectorAll('.film-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.filmTabs.querySelectorAll('.film-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentCategory = tab.dataset.category;
                this.populateFilmList();
            });
        });

        // Sliders - tap to open large slider (with default values)
        this.setupSlider(this.strengthSlider, this.strengthValue, 'Strength', v => `${v}%`, 100);
        this.setupSlider(this.grainSlider, this.grainValue, 'Grain', v => `${v}%`, 50);
        this.setupSlider(this.brightnessSlider, this.brightnessValue, 'Brightness', v => v, 0);
        this.setupSlider(this.contrastSlider, this.contrastValue, 'Contrast', v => v, 0);
        this.setupSlider(this.saturationSlider, this.saturationValue, 'Saturation', v => v, 0);
        this.setupSlider(this.temperatureSlider, this.temperatureValue, 'Temperature', v => v, 0);
        this.setupSlider(this.vignetteSlider, this.vignetteValue, 'Vignette', v => `${v}%`, 0);
        this.setupSlider(this.fadeSlider, this.fadeValue, 'Fade', v => v, 0);
        this.setupSlider(this.shadowsSlider, this.shadowsValue, 'Shadows', v => v, 0);
        this.setupSlider(this.highlightsSlider, this.highlightsValue, 'Highlights', v => v, 0);
        this.setupSlider(this.blacksSlider, this.blacksValue, 'Blacks', v => `${v}%`, 0);

        // Slider modal
        this.sliderModalInput.addEventListener('input', (e) => this.onSliderModalChange(e));
        this.sliderModalDone.addEventListener('click', () => this.closeSliderModal());
        this.sliderModal.addEventListener('click', (e) => {
            if (e.target === this.sliderModal) this.closeSliderModal();
        });

        // Double-tap on slider modal header (label/value area) to reset to default
        this.sliderModalLastTap = 0;
        const sliderModalHeader = document.querySelector('.slider-modal-header');
        sliderModalHeader.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - this.sliderModalLastTap < 300) {
                this.resetActiveSlider();
                this.sliderModalLastTap = 0;
                e.preventDefault();
            } else {
                this.sliderModalLastTap = now;
            }
        });
        sliderModalHeader.addEventListener('dblclick', () => {
            this.resetActiveSlider();
        });

        // Adjustments toggle
        this.adjustmentsToggle.addEventListener('click', () => this.toggleAdjustments());

        // Buttons
        this.cropBtn.addEventListener('click', () => this.openCropModal());
        this.resetBtn.addEventListener('click', () => this.confirmReset());
        this.downloadBtn.addEventListener('click', () => this.openDownloadModal());
        this.newImageBtn.addEventListener('click', () => this.confirmNewImage());

        // Crop modal
        this.cropCancel.addEventListener('click', () => this.closeCropModal());
        this.cropApply.addEventListener('click', () => this.applyCrop());
        this.cropReset.addEventListener('click', () => this.resetCrop());

        // Crop rotation and flip
        document.getElementById('cropRotateLeft').addEventListener('click', () => {
            this.rotateCropImage(-90);
        });
        document.getElementById('cropRotateRight').addEventListener('click', () => {
            this.rotateCropImage(90);
        });
        document.getElementById('cropFlipRatio').addEventListener('click', () => {
            this.flipCropRatio();
        });

        this.cropRatios.querySelectorAll('.crop-ratio').forEach(btn => {
            btn.addEventListener('click', () => {
                this.cropRatios.querySelectorAll('.crop-ratio').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const ratio = btn.dataset.ratio;
                if (ratio === 'free') {
                    this.currentCropRatio = null;
                } else {
                    const [w, h] = ratio.split(':').map(Number);
                    this.currentCropRatio = w / h;
                }
                this.updateCropFrame();
                this.fitImageToFrame();
            });
        });
        this.initCropDrag();

        // Download modal
        this.cancelDownload.addEventListener('click', () => this.downloadModal.hidden = true);
        this.confirmDownload.addEventListener('click', () => this.downloadImage());
        this.downloadModal.addEventListener('click', (e) => {
            if (e.target === this.downloadModal) this.downloadModal.hidden = true;
        });
        document.querySelectorAll('input[name="format"]').forEach(input => {
            input.addEventListener('change', (e) => {
                // Show quality control for JPEG and WebP, hide for PNG
                this.qualityControl.style.display = e.target.value === 'png' ? 'none' : 'block';
                this.updateExportInfo();
            });
        });
        this.qualitySlider.addEventListener('input', (e) => {
            this.qualityValue.textContent = `${e.target.value}%`;
            this.updateExportInfo();
        });
        this.fullResolutionCheckbox.addEventListener('change', () => {
            this.updateExportInfo();
        });

        // Save modal close
        this.saveModalClose.addEventListener('click', () => {
            this.saveModal.hidden = true;
            // Clean up blob URL
            if (this.saveModalImg.src.startsWith('blob:')) {
                URL.revokeObjectURL(this.saveModalImg.src);
            }
            this.saveModalImg.src = '';
        });

        // Fullscreen mode
        this.fullscreenBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.enterFullscreen();
        });
        this.fullscreenExitBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.exitFullscreen();
        });
    }

    setupSlider(slider, valueEl, label, formatter, defaultValue) {
        // Store default value on the slider element
        slider.dataset.defaultValue = defaultValue;

        // Small slider changes
        slider.addEventListener('input', (e) => {
            valueEl.textContent = formatter(e.target.value);
            this.scheduleProcess();
        });

        // Tap anywhere on chip to open large slider
        const chip = slider.closest('.adjustment-chip');

        chip.addEventListener('click', (e) => {
            // Open modal for any tap on the chip
            this.openSliderModal(slider, label, formatter, valueEl, defaultValue);
        });

        // Prevent slider from triggering chip click when dragging
        slider.addEventListener('mousedown', (e) => e.stopPropagation());
        slider.addEventListener('touchstart', (e) => e.stopPropagation());
    }

    openSliderModal(slider, label, formatter, valueEl, defaultValue) {
        this.activeSlider = slider;
        this.activeValueEl = valueEl;
        this.activeFormatter = formatter;
        this.activeDefaultValue = defaultValue;

        this.sliderModalLabel.textContent = label;
        this.sliderModalInput.min = slider.min;
        this.sliderModalInput.max = slider.max;
        this.sliderModalInput.value = slider.value;
        this.sliderModalValue.textContent = formatter(slider.value);

        // Hide controls panel to show more of the image
        document.querySelector('.controls-panel').style.display = 'none';

        this.sliderModal.hidden = false;
    }

    resetActiveSlider() {
        if (!this.activeSlider || this.activeDefaultValue === undefined) return;

        const value = this.activeDefaultValue;
        this.sliderModalInput.value = value;
        this.sliderModalValue.textContent = this.activeFormatter(value);
        this.activeSlider.value = value;
        this.activeValueEl.textContent = this.activeFormatter(value);
        this.scheduleProcess();
    }

    onSliderModalChange(e) {
        const value = e.target.value;
        this.sliderModalValue.textContent = this.activeFormatter(value);
        this.activeSlider.value = value;
        this.activeValueEl.textContent = this.activeFormatter(value);
        this.scheduleProcess();
    }

    closeSliderModal() {
        this.sliderModal.hidden = true;
        this.activeSlider = null;

        // Show controls panel again
        document.querySelector('.controls-panel').style.display = '';
    }

    selectDefaultProfile() {
        const profiles = FilmProfiles.getByCategory('color');
        if (profiles.length > 0) {
            this.currentProfile = profiles[0];
            this.updateSelectedFilmDisplay();
        }
    }

    updateSelectedFilmDisplay() {
        if (this.currentProfile) {
            this.selectedFilmName.textContent = this.currentProfile.name;
            this.selectedFilmDesc.textContent = this.currentProfile.description;
        }
    }

    openFilmModal() {
        this.filmModal.hidden = false;
        this.pendingProfile = null;

        // Set active tab to current profile's category
        if (this.currentProfile) {
            const category = this.getProfileCategory(this.currentProfile.id);
            if (category) {
                this.currentCategory = category;
                this.filmTabs.querySelectorAll('.film-tab').forEach(t => {
                    t.classList.toggle('active', t.dataset.category === category);
                });
            }
            // Show current profile preview
            this.updateFilmPreview(this.currentProfile);
        }
        this.populateFilmList();
    }

    getProfileCategory(profileId) {
        const categories = ['color', 'slide', 'bw', 'instant'];
        for (const cat of categories) {
            const profiles = FilmProfiles.getByCategory(cat);
            if (profiles.find(p => p.id === profileId)) {
                return cat;
            }
        }
        return null;
    }

    closeFilmModal(applyPending = true) {
        if (applyPending && this.pendingProfile) {
            this.selectFilm(this.pendingProfile);
        }
        this.filmModal.hidden = true;
        this.pendingProfile = null;
    }

    populateFilmList() {
        const profiles = FilmProfiles.getByCategory(this.currentCategory);
        this.filmList.innerHTML = profiles.map(p => `
            <div class="film-option ${p.id === this.currentProfile?.id ? 'selected' : ''}" data-id="${p.id}">
                <div class="film-name">${p.name}</div>
                <div class="film-description">${p.description}</div>
            </div>
        `).join('');

        this.filmList.querySelectorAll('.film-option').forEach(option => {
            option.addEventListener('click', () => {
                const profile = FilmProfiles.getProfile(option.dataset.id);
                if (profile) {
                    // Update selection highlight
                    this.filmList.querySelectorAll('.film-option').forEach(o => o.classList.remove('selected'));
                    option.classList.add('selected');

                    // Update large preview
                    this.updateFilmPreview(profile);

                    // Select after short delay to show preview
                    this.pendingProfile = profile;
                }
            });

            // Double tap to confirm quickly
            option.addEventListener('dblclick', () => {
                const profile = FilmProfiles.getProfile(option.dataset.id);
                if (profile) {
                    this.selectFilm(profile);
                }
            });
        });

        // Show current film in preview
        if (this.currentProfile) {
            this.updateFilmPreview(this.currentProfile);
        }
    }

    async updateFilmPreview(profile) {
        if (!profile) return;

        this.filmPreviewLabel.textContent = profile.name;

        if (!this.previewThumbnail || !this.previewThumbnail.data) {
            this.filmPreviewCtx.fillStyle = '#333';
            this.filmPreviewCtx.fillRect(0, 0, this.filmPreviewCanvas.width, this.filmPreviewCanvas.height);
            return;
        }

        // Set canvas size
        this.filmPreviewCanvas.width = this.previewThumbnail.width;
        this.filmPreviewCanvas.height = this.previewThumbnail.height;

        // Check cache first
        if (this.filmPreviewCache.has(profile.id)) {
            const cached = this.filmPreviewCache.get(profile.id);
            if (cached && cached.data) {
                this.filmPreviewCtx.putImageData(cached, 0, 0);
                return;
            }
        }

        // For 'original', just show the original thumbnail
        if (profile.id === 'original') {
            const originalData = new ImageData(
                new Uint8ClampedArray(this.previewThumbnail.data),
                this.previewThumbnail.width,
                this.previewThumbnail.height
            );
            this.filmPreviewCtx.putImageData(originalData, 0, 0);
            this.filmPreviewCache.set(profile.id, originalData);
            return;
        }

        // Show loading state
        this.filmPreviewCtx.fillStyle = '#222';
        this.filmPreviewCtx.fillRect(0, 0, this.filmPreviewCanvas.width, this.filmPreviewCanvas.height);

        // Load and apply real LUT for accurate preview
        try {
            const thumbnailData = new ImageData(
                new Uint8ClampedArray(this.previewThumbnail.data),
                this.previewThumbnail.width,
                this.previewThumbnail.height
            );

            // Load LUT
            let lutContent = null;
            if (profile.lutUrl) {
                lutContent = await this.processor.loadLut(profile);
            }

            if (lutContent) {
                // Parse and apply LUT
                const lut = this.parseCubeLutSimple(lutContent);
                if (lut && lut.data && lut.size > 0) {
                    this.applyLutSimple(thumbnailData.data, lut, 1.0); // Full strength
                }
            } else if (profile.customProcess === 'cinestill800t') {
                // Apply quick approximation for custom processes
                this.applyQuickFilmLook(thumbnailData, profile);
            }

            this.filmPreviewCtx.putImageData(thumbnailData, 0, 0);
            this.filmPreviewCache.set(profile.id, thumbnailData);

        } catch (e) {
            console.error('LUT preview failed:', e);
            // Fallback: show original
            const fallbackData = new ImageData(
                new Uint8ClampedArray(this.previewThumbnail.data),
                this.previewThumbnail.width,
                this.previewThumbnail.height
            );
            this.filmPreviewCtx.putImageData(fallbackData, 0, 0);
        }
    }

    async processPreviewThumbnail(imageData, profile, settings) {
        if (!imageData || !imageData.data || !profile) {
            return null;
        }

        // Load LUT if needed
        let lutContent = null;
        if (profile.lutUrl) {
            try {
                lutContent = await this.processor.loadLut(profile);
            } catch (e) {
                console.warn('Failed to load LUT for preview:', e.message);
                return null;
            }
        }

        if (!lutContent) {
            return null; // No LUT available
        }

        // Process in main thread (thumbnail is small enough)
        try {
            const lut = this.parseCubeLutSimple(lutContent);
            if (lut && lut.data && lut.size > 0) {
                this.applyLutSimple(imageData.data, lut, settings.strength / 100);
                return imageData;
            }
        } catch (e) {
            console.warn('LUT application failed:', e.message);
        }

        return null;
    }

    parseCubeLutSimple(content) {
        const lines = content.split('\n');
        let size = 0;
        const lutData = [];

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('#') || trimmed === '') continue;
            if (trimmed.startsWith('LUT_3D_SIZE')) {
                size = parseInt(trimmed.split(/\s+/)[1]);
            } else if (!trimmed.startsWith('TITLE') && !trimmed.startsWith('DOMAIN')) {
                const parts = trimmed.split(/\s+/);
                if (parts.length >= 3) {
                    const r = parseFloat(parts[0]);
                    const g = parseFloat(parts[1]);
                    const b = parseFloat(parts[2]);
                    if (!isNaN(r)) lutData.push([r, g, b]);
                }
            }
        }
        return size > 0 ? { size, data: lutData } : null;
    }

    applyLutSimple(data, lut, strength) {
        const lutData = lut.data;
        const size = lut.size;
        const maxIdx = size - 1;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i] / 255;
            const g = data[i + 1] / 255;
            const b = data[i + 2] / 255;

            const rIdx = r * maxIdx;
            const gIdx = g * maxIdx;
            const bIdx = b * maxIdx;

            const r0 = Math.floor(rIdx), g0 = Math.floor(gIdx), b0 = Math.floor(bIdx);
            const r1 = Math.min(r0 + 1, maxIdx), g1 = Math.min(g0 + 1, maxIdx), b1 = Math.min(b0 + 1, maxIdx);
            const rf = rIdx - r0, gf = gIdx - g0, bf = bIdx - b0;

            // Trilinear interpolation
            const idx000 = (b0 * size * size + g0 * size + r0);
            const idx100 = (b0 * size * size + g0 * size + r1);
            const idx010 = (b0 * size * size + g1 * size + r0);
            const idx110 = (b0 * size * size + g1 * size + r1);
            const idx001 = (b1 * size * size + g0 * size + r0);
            const idx101 = (b1 * size * size + g0 * size + r1);
            const idx011 = (b1 * size * size + g1 * size + r0);
            const idx111 = (b1 * size * size + g1 * size + r1);

            if (idx111 < lutData.length) {
                const c000 = lutData[idx000], c100 = lutData[idx100];
                const c010 = lutData[idx010], c110 = lutData[idx110];
                const c001 = lutData[idx001], c101 = lutData[idx101];
                const c011 = lutData[idx011], c111 = lutData[idx111];

                for (let c = 0; c < 3; c++) {
                    const c00 = c000[c] * (1 - rf) + c100[c] * rf;
                    const c10 = c010[c] * (1 - rf) + c110[c] * rf;
                    const c01 = c001[c] * (1 - rf) + c101[c] * rf;
                    const c11 = c011[c] * (1 - rf) + c111[c] * rf;
                    const c0 = c00 * (1 - gf) + c10 * gf;
                    const c1 = c01 * (1 - gf) + c11 * gf;
                    const newVal = (c0 * (1 - bf) + c1 * bf) * 255;
                    const origVal = data[i + c];
                    data[i + c] = Math.round(origVal + (newVal - origVal) * strength);
                }
            }
        }
    }

    applyQuickFilmLook(imageData, profile) {
        const pixels = imageData.data;
        const id = profile.id;

        // Check if film should be B&W
        const isBW = profile.adjustments?.saturation === 0 ||
                     id.includes('tmax') || id.includes('hp5') || id.includes('tri') ||
                     id.includes('delta') || id.includes('pan') || id.includes('acros') ||
                     id.includes('polaroid') || id.includes('fp4') || id.includes('400tx');

        let rMult = 1, gMult = 1, bMult = 1;
        let saturation = 1;
        let warmth = 0;
        let contrast = 1;
        let brightness = 0;
        // For B&W: different channel mixing for different looks
        let rWeight = 0.299, gWeight = 0.587, bWeight = 0.114;

        if (id === 'original') {
            // No color change for original
            return;
        } else if (isBW) {
            saturation = 0;
            // Different B&W film characteristics
            if (id.includes('tmax100')) {
                contrast = 1.1; rWeight = 0.35; gWeight = 0.55; bWeight = 0.10;
            } else if (id.includes('tmax400')) {
                contrast = 1.15; brightness = 5; rWeight = 0.30; gWeight = 0.59; bWeight = 0.11;
            } else if (id.includes('tmax3200')) {
                contrast = 1.25; brightness = 10; rWeight = 0.28; gWeight = 0.62; bWeight = 0.10;
            } else if (id.includes('hp5')) {
                contrast = 1.2; rWeight = 0.32; gWeight = 0.58; bWeight = 0.10;
            } else if (id.includes('trix') || id.includes('400tx')) {
                contrast = 1.3; rWeight = 0.33; gWeight = 0.56; bWeight = 0.11;
            } else if (id.includes('delta100')) {
                contrast = 1.05; rWeight = 0.30; gWeight = 0.59; bWeight = 0.11;
            } else if (id.includes('delta400')) {
                contrast = 1.15; rWeight = 0.31; gWeight = 0.58; bWeight = 0.11;
            } else if (id.includes('delta3200')) {
                contrast = 1.25; brightness = 8; rWeight = 0.29; gWeight = 0.60; bWeight = 0.11;
            } else if (id.includes('fp4')) {
                contrast = 1.1; rWeight = 0.32; gWeight = 0.57; bWeight = 0.11;
            } else if (id.includes('pan')) {
                contrast = 1.0; rWeight = 0.30; gWeight = 0.59; bWeight = 0.11;
            } else if (id.includes('acros')) {
                contrast = 1.15; rWeight = 0.28; gWeight = 0.62; bWeight = 0.10;
            } else if (id.includes('664')) {
                contrast = 1.1; brightness = -5; rWeight = 0.34; gWeight = 0.55; bWeight = 0.11;
            } else if (id.includes('667')) {
                contrast = 1.4; brightness = 5; rWeight = 0.30; gWeight = 0.58; bWeight = 0.12;
            } else if (id.includes('672')) {
                contrast = 1.15; rWeight = 0.32; gWeight = 0.56; bWeight = 0.12;
            }
        }
        // Color films
        else if (id.includes('portra')) {
            warmth = 10; saturation = 0.9; rMult = 1.05;
        } else if (id.includes('ektar')) {
            saturation = 1.2; rMult = 1.1; bMult = 0.95;
        } else if (id.includes('gold') || id.includes('colorplus')) {
            warmth = 15; saturation = 1.1; rMult = 1.08; gMult = 1.02;
        } else if (id.includes('superia') || id.includes('c200')) {
            saturation = 1.05; gMult = 1.05; bMult = 1.02;
        } else if (id.includes('cinestill')) {
            warmth = -10; saturation = 1.1; rMult = 1.05; bMult = 1.15;
        } else if (id.includes('fuji_400h')) {
            warmth = 5; saturation = 0.85; gMult = 1.03; contrast = 0.95;
        } else if (id.includes('fuji_160c')) {
            saturation = 0.9; gMult = 1.02; contrast = 0.98;
        } else if (id.includes('velvia')) {
            saturation = 1.4; rMult = 1.1; gMult = 1.05; contrast = 1.1;
        } else if (id.includes('provia')) {
            saturation = 1.15;
        } else if (id.includes('ektachrome')) {
            saturation = 1.2; bMult = 1.1;
        } else if (id.includes('classic_chrome')) {
            saturation = 0.85; contrast = 1.1; warmth = 5; brightness = -5;
        } else if (id.includes('astia')) {
            saturation = 0.95; contrast = 0.95; warmth = 3;
        } else if (id.includes('pro_neg_std')) {
            saturation = 0.8; contrast = 0.9;
        } else if (id.includes('pro_neg_hi')) {
            saturation = 0.75; contrast = 1.05;
        }
        // Instant films (color)
        else if (id.includes('sx70') || id.includes('px70')) {
            warmth = 20; saturation = 0.9; contrast = 0.9; brightness = 5;
        } else if (id.includes('px680') || id.includes('600')) {
            warmth = 15; saturation = 0.95; contrast = 0.95;
        } else if (id.includes('timezero') || id.includes('time_zero')) {
            warmth = 25; saturation = 0.85; contrast = 0.85; brightness = 10;
        } else if (id.includes('spectra')) {
            warmth = 10; saturation = 1.0; contrast = 1.05;
        }

        for (let i = 0; i < pixels.length; i += 4) {
            let r = pixels[i];
            let g = pixels[i + 1];
            let b = pixels[i + 2];

            // Apply warmth (color only)
            if (!isBW) {
                r += warmth;
                b -= warmth;
                r *= rMult;
                g *= gMult;
                b *= bMult;
            }

            // Apply saturation/grayscale
            if (saturation !== 1 || isBW) {
                const gray = rWeight * r + gWeight * g + bWeight * b + brightness;
                if (isBW) {
                    r = g = b = gray;
                } else {
                    r = gray + (r - gray) * saturation;
                    g = gray + (g - gray) * saturation;
                    b = gray + (b - gray) * saturation;
                }
            }

            // Apply contrast
            if (contrast !== 1) {
                r = (r - 128) * contrast + 128;
                g = (g - 128) * contrast + 128;
                b = (b - 128) * contrast + 128;
            }

            pixels[i] = Math.max(0, Math.min(255, r));
            pixels[i + 1] = Math.max(0, Math.min(255, g));
            pixels[i + 2] = Math.max(0, Math.min(255, b));
        }
    }

    selectFilm(profile) {
        this.currentProfile = profile;
        this.updateSelectedFilmDisplay();
        this.filmModal.hidden = true;
        this.pendingProfile = null;
        this.processImage();
    }

    async loadImage(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please select an image');
            return;
        }

        this.showLoading('Loading...');

        try {
            const result = await this.processor.loadImage(file);

            // Store backup of original uncropped image for reset
            this.originalBackup = {
                imageData: this.processor.cloneImageData(this.processor.originalImageData),
                previewImageData: this.processor.cloneImageData(this.processor.previewImageData),
                width: this.processor.trueOriginalWidth,
                height: this.processor.trueOriginalHeight,
                previewScale: this.processor.previewScale
            };

            this.previewCanvas.width = result.previewWidth;
            this.previewCanvas.height = result.previewHeight;
            this.originalCanvas.width = result.previewWidth;
            this.originalCanvas.height = result.previewHeight;

            this.originalCtx.putImageData(result.imageData, 0, 0);

            // Create thumbnail for film previews
            this.createPreviewThumbnail(result.imageData);

            // Clear preview cache when new image loaded
            this.filmPreviewCache.clear();

            this.uploadSection.hidden = true;
            this.editorSection.hidden = false;
            this.appHeader.hidden = false;

            if (this.currentProfile) {
                await this.processImage();
            } else {
                this.previewCtx.putImageData(result.imageData, 0, 0);
                this.hideLoading();
            }

            // Reset compare state
            this.canvasContainer.classList.remove('comparing');
            this.compareHint.textContent = 'Tap to compare';
        } catch (error) {
            console.error('Load error:', error);
            alert('Failed to load image');
            this.hideLoading();
        }
    }

    getSettings() {
        return {
            strength: parseInt(this.strengthSlider.value),
            grainIntensity: parseInt(this.grainSlider.value),
            grainSize: 1,
            brightness: parseInt(this.brightnessSlider.value),
            contrast: parseInt(this.contrastSlider.value),
            saturation: parseInt(this.saturationSlider.value),
            temperature: parseInt(this.temperatureSlider.value),
            vignette: parseInt(this.vignetteSlider.value),
            fade: parseInt(this.fadeSlider.value),
            shadows: parseInt(this.shadowsSlider.value),
            highlights: parseInt(this.highlightsSlider.value),
            blacks: parseInt(this.blacksSlider.value)
        };
    }

    getProcessKey() {
        const s = this.getSettings();
        return `${this.currentProfile?.id}-${s.strength}-${s.grainIntensity}-${s.brightness}-${s.contrast}-${s.saturation}-${s.temperature}-${s.vignette}-${s.fade}-${s.shadows}-${s.highlights}-${s.blacks}`;
    }

    scheduleProcess() {
        clearTimeout(this.processTimer);
        this.processTimer = setTimeout(() => this.processImage(), 150);
    }

    async processImage() {
        if (!this.currentProfile || !this.processor.previewImageData) {
            this.hideLoading();
            return;
        }

        const key = this.getProcessKey();
        if (key === this.lastProcessedKey) {
            this.hideLoading();
            return;
        }

        if (this.isProcessing) {
            this.scheduleProcess();
            return;
        }

        this.isProcessing = true;
        this.showLoading('Applying...');

        try {
            const settings = this.getSettings();
            this.processedPreview = await this.processor.applyProfilePreview(this.currentProfile, settings);
            if (this.processedPreview && this.processedPreview.data) {
                this.previewCtx.putImageData(this.processedPreview, 0, 0);
                this.lastProcessedKey = key;
            }
        } catch (error) {
            console.error('Process error:', error);
            // Try to show original on error
            if (this.processor.previewImageData) {
                this.previewCtx.putImageData(this.processor.previewImageData, 0, 0);
            }
        } finally {
            this.isProcessing = false;
            this.hideLoading();
        }
    }

    toggleCompare() {
        const isComparing = this.canvasContainer.classList.toggle('comparing');
        this.updateHint();
    }

    toggleZoom(e) {
        this.isZoomed = !this.isZoomed;
        this.canvasContainer.classList.toggle('zoomed', this.isZoomed);

        if (this.isZoomed) {
            // Zoom to tap position
            const rect = this.canvasContainer.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            this.panOffset = { x, y };
            this.updatePanPosition();
        } else {
            // Reset pan when unzooming
            this.panOffset = { x: 50, y: 50 };
        }

        this.updateHint();
    }

    updatePanPosition() {
        const origin = `${this.panOffset.x}% ${this.panOffset.y}%`;
        this.previewCanvas.style.transformOrigin = origin;
        this.originalCanvas.style.transformOrigin = origin;
    }

    updateHint() {
        const isComparing = this.canvasContainer.classList.contains('comparing');
        if (this.isFullscreen) {
            if (this.isZoomed) {
                this.compareHint.textContent = isComparing ? 'Original • Drag to pan' : 'Tap: compare • Double-tap: exit zoom';
            } else {
                this.compareHint.textContent = isComparing ? 'Showing original' : 'Tap: compare • Double-tap: zoom';
            }
        } else if (this.isZoomed) {
            this.compareHint.textContent = isComparing ? 'Original • Drag to pan' : 'Drag to pan • Double-tap to exit';
        } else {
            this.compareHint.textContent = isComparing ? 'Showing original' : 'Tap to compare';
        }
    }

    toggleAdjustments() {
        const isCollapsed = this.adjustmentsPanel.classList.toggle('collapsed');
        this.adjustmentsToggle.classList.toggle('active', !isCollapsed);
    }

    enterFullscreen() {
        this.isFullscreen = true;
        document.body.classList.add('fullscreen-mode');
        this.fullscreenExitBtn.hidden = false;
        this.updateHint();
    }

    exitFullscreen() {
        this.isFullscreen = false;
        document.body.classList.remove('fullscreen-mode');
        this.fullscreenExitBtn.hidden = true;

        // Also exit zoom if active
        if (this.isZoomed) {
            this.isZoomed = false;
            this.canvasContainer.classList.remove('zoomed');
            this.panOffset = { x: 50, y: 50 };
        }
        this.updateHint();
    }

    // Crop functionality (Instagram-style: move image under fixed frame)
    openCropModal() {
        if (!this.processor.originalImageData) return;

        const imgData = this.processor.originalImageData;
        const containerRect = this.cropContainer.getBoundingClientRect();

        // Draw full resolution image to crop canvas
        this.cropCanvas.width = imgData.width;
        this.cropCanvas.height = imgData.height;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = imgData.width;
        tempCanvas.height = imgData.height;
        tempCanvas.getContext('2d').putImageData(imgData, 0, 0);
        this.cropCtx.drawImage(tempCanvas, 0, 0);

        // Store original unrotated canvas for rotation operations
        this.cropOriginalCanvas = document.createElement('canvas');
        this.cropOriginalCanvas.width = imgData.width;
        this.cropOriginalCanvas.height = imgData.height;
        this.cropOriginalCanvas.getContext('2d').putImageData(imgData, 0, 0);

        // Reset rotation
        this.cropRotation = 0;

        // Store original image dimensions
        this.cropImageWidth = imgData.width;
        this.cropImageHeight = imgData.height;

        // Reset to 3:2 ratio
        this.currentCropRatio = 3 / 2;
        this.cropRatios.querySelectorAll('.crop-ratio').forEach(b => {
            b.classList.toggle('active', b.dataset.ratio === '3:2');
        });

        this.cropModal.hidden = false;

        // Initialize after modal is visible
        setTimeout(() => {
            this.updateCropFrame();
            this.fitImageToFrame();
        }, 50);
    }

    closeCropModal() {
        this.cropModal.hidden = true;
    }

    updateCropFrame() {
        const containerRect = this.cropContainer.getBoundingClientRect();
        const padding = 20;
        const maxW = containerRect.width - padding * 2;
        const maxH = containerRect.height - padding * 2;

        let frameW, frameH;

        if (this.currentCropRatio) {
            // Fixed aspect ratio
            if (this.currentCropRatio > maxW / maxH) {
                frameW = maxW;
                frameH = maxW / this.currentCropRatio;
            } else {
                frameH = maxH;
                frameW = maxH * this.currentCropRatio;
            }
        } else {
            // Free ratio - use 80% of available space
            frameW = maxW * 0.8;
            frameH = maxH * 0.8;
        }

        this.cropFrame.style.width = frameW + 'px';
        this.cropFrame.style.height = frameH + 'px';

        // Store frame dimensions
        this.cropFrameWidth = frameW;
        this.cropFrameHeight = frameH;
    }

    fitImageToFrame() {
        // Calculate scale where image fills the frame (covers it completely)
        const scaleX = this.cropFrameWidth / this.cropImageWidth;
        const scaleY = this.cropFrameHeight / this.cropImageHeight;
        this.cropFitScale = Math.max(scaleX, scaleY);

        // Allow zooming out to fit entire image in frame
        this.cropMinScale = Math.min(scaleX, scaleY) * 0.5;

        // Start at fit scale (image fills frame)
        this.cropImageScale = this.cropFitScale;
        this.cropImageX = 0;
        this.cropImageY = 0;

        this.updateCropImage();
    }

    rotateCropImage(degrees) {
        // Update rotation (keep in 0, 90, 180, 270 range)
        this.cropRotation = (this.cropRotation + degrees + 360) % 360;

        // Get the original unrotated image
        const origCanvas = this.cropOriginalCanvas;
        const origW = origCanvas.width;
        const origH = origCanvas.height;

        // Create rotated version
        const rotatedCanvas = document.createElement('canvas');
        const rotatedCtx = rotatedCanvas.getContext('2d');

        // Set dimensions based on rotation
        if (this.cropRotation === 90 || this.cropRotation === 270) {
            rotatedCanvas.width = origH;
            rotatedCanvas.height = origW;
        } else {
            rotatedCanvas.width = origW;
            rotatedCanvas.height = origH;
        }

        // Draw rotated image
        rotatedCtx.save();
        rotatedCtx.translate(rotatedCanvas.width / 2, rotatedCanvas.height / 2);
        rotatedCtx.rotate(this.cropRotation * Math.PI / 180);
        rotatedCtx.drawImage(origCanvas, -origW / 2, -origH / 2);
        rotatedCtx.restore();

        // Update crop canvas with rotated image
        this.cropCanvas.width = rotatedCanvas.width;
        this.cropCanvas.height = rotatedCanvas.height;
        this.cropCtx.drawImage(rotatedCanvas, 0, 0);

        // Update dimensions
        this.cropImageWidth = rotatedCanvas.width;
        this.cropImageHeight = rotatedCanvas.height;

        // Reset position and fit to frame
        this.cropImageX = 0;
        this.cropImageY = 0;
        this.updateCropFrame();
        this.fitImageToFrame();
    }

    flipCropRatio() {
        // Don't flip if free ratio or 1:1 (square)
        if (this.currentCropRatio === null) return;
        if (this.currentCropRatio === 1) return;

        // Flip the ratio (3:2 becomes 2:3, etc.)
        this.currentCropRatio = 1 / this.currentCropRatio;

        // Update the active button visual
        this.updateRatioButtonVisual();

        // Update frame and fit image
        this.updateCropFrame();
        this.fitImageToFrame();
    }

    updateRatioButtonVisual() {
        // Find which ratio matches the current one
        const buttons = this.cropRatios.querySelectorAll('.crop-ratio');
        let foundMatch = false;

        buttons.forEach(btn => {
            const ratio = btn.dataset.ratio;
            if (ratio === 'free') {
                btn.classList.toggle('active', this.currentCropRatio === null);
            } else if (ratio === '1:1') {
                btn.classList.toggle('active', this.currentCropRatio === 1);
            } else {
                const [w, h] = ratio.split(':').map(Number);
                const btnRatio = w / h;
                // Check if this button's ratio matches (or its inverse)
                const isMatch = Math.abs(btnRatio - this.currentCropRatio) < 0.01 ||
                               Math.abs((1/btnRatio) - this.currentCropRatio) < 0.01;
                if (isMatch && !foundMatch) {
                    btn.classList.add('active');
                    foundMatch = true;
                } else {
                    btn.classList.remove('active');
                }
            }
        });

        // If no match found (flipped ratio), remove all active states
        // The flip icon indicates the current orientation
        if (!foundMatch && this.currentCropRatio !== null && this.currentCropRatio !== 1) {
            buttons.forEach(btn => btn.classList.remove('active'));
            // Re-add active to the closest matching ratio
            buttons.forEach(btn => {
                const ratio = btn.dataset.ratio;
                if (ratio !== 'free' && ratio !== '1:1') {
                    const [w, h] = ratio.split(':').map(Number);
                    const btnRatio = w / h;
                    const invRatio = h / w;
                    if (Math.abs(invRatio - this.currentCropRatio) < 0.01) {
                        btn.classList.add('active');
                    }
                }
            });
        }
    }

    updateCropImage() {
        const transform = `translate(-50%, -50%) scale(${this.cropImageScale}) translate(${this.cropImageX}px, ${this.cropImageY}px)`;
        this.cropCanvas.style.transform = transform;
        this.cropCanvas.style.left = '50%';
        this.cropCanvas.style.top = '50%';

        // Update zoom indicator (relative to fit scale)
        const zoomPercent = (this.cropImageScale / this.cropFitScale);
        if (this.cropZoomIndicator) {
            this.cropZoomIndicator.textContent = `${zoomPercent.toFixed(2)}x`;
            // Show when zoomed in or out from fit scale
            this.cropZoomIndicator.classList.toggle('visible', Math.abs(zoomPercent - 1) > 0.02);
        }
    }

    constrainImagePosition() {
        // Calculate scaled image dimensions
        const scaledW = this.cropImageWidth * this.cropImageScale;
        const scaledH = this.cropImageHeight * this.cropImageScale;

        // If image is larger than frame, constrain to keep frame covered
        // If image is smaller than frame, constrain to keep image inside frame
        if (scaledW >= this.cropFrameWidth) {
            const maxX = (scaledW - this.cropFrameWidth) / 2 / this.cropImageScale;
            this.cropImageX = Math.max(-maxX, Math.min(maxX, this.cropImageX));
        } else {
            // Image smaller than frame - keep image inside frame bounds
            const maxX = (this.cropFrameWidth - scaledW) / 2 / this.cropImageScale;
            this.cropImageX = Math.max(-maxX, Math.min(maxX, this.cropImageX));
        }

        if (scaledH >= this.cropFrameHeight) {
            const maxY = (scaledH - this.cropFrameHeight) / 2 / this.cropImageScale;
            this.cropImageY = Math.max(-maxY, Math.min(maxY, this.cropImageY));
        } else {
            // Image smaller than frame - keep image inside frame bounds
            const maxY = (this.cropFrameHeight - scaledH) / 2 / this.cropImageScale;
            this.cropImageY = Math.max(-maxY, Math.min(maxY, this.cropImageY));
        }
    }

    resetCrop() {
        if (!this.originalBackup) return;

        // Restore original uncropped image
        this.processor.originalImageData = this.processor.cloneImageData(this.originalBackup.imageData);
        this.processor.previewImageData = this.processor.cloneImageData(this.originalBackup.previewImageData);
        this.processor.trueOriginalWidth = this.originalBackup.width;
        this.processor.trueOriginalHeight = this.originalBackup.height;
        this.processor.previewScale = this.originalBackup.previewScale;

        // Update canvas sizes
        this.previewCanvas.width = this.originalBackup.previewImageData.width;
        this.previewCanvas.height = this.originalBackup.previewImageData.height;
        this.originalCanvas.width = this.originalBackup.previewImageData.width;
        this.originalCanvas.height = this.originalBackup.previewImageData.height;

        // Draw original for compare view
        this.originalCtx.putImageData(this.originalBackup.previewImageData, 0, 0);

        // Reset rotation
        this.cropRotation = 0;

        // Close crop modal and reprocess
        this.closeCropModal();
        this.lastProcessedKey = '';
        this.processImage();
    }

    initCropDrag() {
        let isDragging = false;
        let isPinching = false;
        let isResizing = false;
        let resizeCorner = null;
        let startX, startY, startImageX, startImageY;
        let startPinchDist = 0;
        let startScale = 1;
        let startFrameW, startFrameH;

        const getPinchDistance = (touches) => {
            const dx = touches[0].clientX - touches[1].clientX;
            const dy = touches[0].clientY - touches[1].clientY;
            return Math.sqrt(dx * dx + dy * dy);
        };

        // Corner resize handlers
        const corners = this.cropFrame.querySelectorAll('.crop-frame-corner');
        corners.forEach(corner => {
            corner.style.pointerEvents = 'auto';
            corner.style.cursor = 'nwse-resize';

            const onCornerStart = (e) => {
                e.stopPropagation();
                e.preventDefault();
                isResizing = true;
                resizeCorner = corner.classList.contains('tl') ? 'tl' :
                               corner.classList.contains('tr') ? 'tr' :
                               corner.classList.contains('bl') ? 'bl' : 'br';
                startX = e.touches ? e.touches[0].clientX : e.clientX;
                startY = e.touches ? e.touches[0].clientY : e.clientY;
                startFrameW = this.cropFrameWidth;
                startFrameH = this.cropFrameHeight;
            };

            corner.addEventListener('mousedown', onCornerStart);
            corner.addEventListener('touchstart', onCornerStart, { passive: false });
        });

        const onStart = (e) => {
            if (this.cropModal.hidden || isResizing) return;

            if (e.touches && e.touches.length >= 2) {
                // Pinch to zoom
                isPinching = true;
                isDragging = false;
                startPinchDist = getPinchDistance(e.touches);
                startScale = this.cropImageScale;
                e.preventDefault();
            } else if (e.touches && e.touches.length === 1) {
                // Single finger drag
                isDragging = true;
                isPinching = false;
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                startImageX = this.cropImageX;
                startImageY = this.cropImageY;
                e.preventDefault();
            } else if (!e.touches) {
                // Mouse drag
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                startImageX = this.cropImageX;
                startImageY = this.cropImageY;
            }
        };

        const onMove = (e) => {
            if (this.cropModal.hidden) return;

            // Handle corner resize
            if (isResizing) {
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                const dx = clientX - startX;
                const dy = clientY - startY;

                // Calculate delta based on corner (diagonal movement)
                let delta;
                if (resizeCorner === 'br') {
                    delta = (dx + dy) / 2;
                } else if (resizeCorner === 'tl') {
                    delta = (-dx - dy) / 2;
                } else if (resizeCorner === 'tr') {
                    delta = (dx - dy) / 2;
                } else { // bl
                    delta = (-dx + dy) / 2;
                }

                const containerRect = this.cropContainer.getBoundingClientRect();
                const padding = 40;
                const minSize = 100;
                const maxW = containerRect.width - padding * 2;
                const maxH = containerRect.height - padding * 2;

                let newW, newH;
                if (this.currentCropRatio) {
                    // Fixed aspect ratio - calculate new size
                    newW = Math.max(minSize, startFrameW + delta * 2);
                    newH = newW / this.currentCropRatio;

                    // Constrain to container
                    if (newW > maxW) {
                        newW = maxW;
                        newH = newW / this.currentCropRatio;
                    }
                    if (newH > maxH) {
                        newH = maxH;
                        newW = newH * this.currentCropRatio;
                    }
                    if (newH < minSize) {
                        newH = minSize;
                        newW = newH * this.currentCropRatio;
                    }
                } else {
                    // Free ratio
                    newW = Math.max(minSize, Math.min(maxW, startFrameW + dx * (resizeCorner.includes('r') ? 2 : -2)));
                    newH = Math.max(minSize, Math.min(maxH, startFrameH + dy * (resizeCorner.includes('b') ? 2 : -2)));
                }

                this.cropFrame.style.width = newW + 'px';
                this.cropFrame.style.height = newH + 'px';
                this.cropFrameWidth = newW;
                this.cropFrameHeight = newH;

                // Recalculate fit scale and constrain
                const scaleX = this.cropFrameWidth / this.cropImageWidth;
                const scaleY = this.cropFrameHeight / this.cropImageHeight;
                this.cropFitScale = Math.max(scaleX, scaleY);
                this.cropMinScale = Math.min(scaleX, scaleY) * 0.5;

                this.constrainImagePosition();
                this.updateCropImage();
                e.preventDefault();
                return;
            }

            if (e.touches && e.touches.length >= 2 && !isPinching) {
                // Switch to pinch
                isPinching = true;
                isDragging = false;
                startPinchDist = getPinchDistance(e.touches);
                startScale = this.cropImageScale;
            }

            if (isPinching && e.touches && e.touches.length >= 2) {
                const currentDist = getPinchDistance(e.touches);
                const scale = currentDist / startPinchDist;

                // Allow zoom from minScale (zoomed out) to 5x fit scale (zoomed in)
                this.cropImageScale = Math.max(this.cropMinScale, Math.min(this.cropFitScale * 5, startScale * scale));
                this.constrainImagePosition();
                this.updateCropImage();
                e.preventDefault();
                return;
            }

            if (isDragging) {
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                const dx = clientX - startX;
                const dy = clientY - startY;

                this.cropImageX = startImageX + dx / this.cropImageScale;
                this.cropImageY = startImageY + dy / this.cropImageScale;
                this.constrainImagePosition();
                this.updateCropImage();
                e.preventDefault();
            }
        };

        const onEnd = (e) => {
            if (isResizing) {
                isResizing = false;
                resizeCorner = null;
                return;
            }

            if (e.touches && e.touches.length === 1 && isPinching) {
                // One finger left, switch to drag
                isPinching = false;
                isDragging = true;
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                startImageX = this.cropImageX;
                startImageY = this.cropImageY;
            } else if (!e.touches || e.touches.length === 0) {
                isDragging = false;
                isPinching = false;
            }
        };

        this.cropContainer.addEventListener('mousedown', onStart);
        this.cropContainer.addEventListener('touchstart', onStart, { passive: false });
        document.addEventListener('mousemove', onMove);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('mouseup', onEnd);
        document.addEventListener('touchend', onEnd);
    }

    applyCrop() {
        // Use the rotated crop canvas as the source (already includes rotation)
        const sourceCanvas = this.cropCanvas;
        const sourceW = this.cropImageWidth;
        const sourceH = this.cropImageHeight;

        // Frame size in source image pixels
        const frameWInImage = this.cropFrameWidth / this.cropImageScale;
        const frameHInImage = this.cropFrameHeight / this.cropImageScale;

        // Calculate where the image center is relative to frame center
        const centerX = sourceW / 2 - this.cropImageX;
        const centerY = sourceH / 2 - this.cropImageY;

        // Calculate crop rectangle in source image coordinates
        const srcX = centerX - frameWInImage / 2;
        const srcY = centerY - frameHInImage / 2;

        // Create output canvas at frame size (in image pixels)
        const outputW = Math.round(frameWInImage);
        const outputH = Math.round(frameHInImage);
        const croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = outputW;
        croppedCanvas.height = outputH;
        const croppedCtx = croppedCanvas.getContext('2d');

        // Fill with black background (for when image doesn't fill frame)
        croppedCtx.fillStyle = '#000000';
        croppedCtx.fillRect(0, 0, outputW, outputH);

        // Draw the image portion that's visible in the frame
        // Source: area of rotated image to copy
        // Dest: where to place it on the output canvas
        const srcLeft = Math.max(0, srcX);
        const srcTop = Math.max(0, srcY);
        const srcRight = Math.min(sourceW, srcX + frameWInImage);
        const srcBottom = Math.min(sourceH, srcY + frameHInImage);

        const destLeft = srcLeft - srcX;
        const destTop = srcTop - srcY;

        const copyW = srcRight - srcLeft;
        const copyH = srcBottom - srcTop;

        if (copyW > 0 && copyH > 0) {
            croppedCtx.drawImage(
                sourceCanvas,
                srcLeft, srcTop, copyW, copyH,
                destLeft, destTop, copyW, copyH
            );
        }

        const croppedData = croppedCtx.getImageData(0, 0, outputW, outputH);

        // Update processor with cropped image
        this.processor.originalImageData = croppedData;
        this.processor.trueOriginalWidth = outputW;
        this.processor.trueOriginalHeight = outputH;

        // Create new preview
        const maxPreview = 800;
        let previewW = outputW, previewH = outputH;
        if (outputW > maxPreview || outputH > maxPreview) {
            const previewScale = Math.min(maxPreview / outputW, maxPreview / outputH);
            previewW = Math.floor(outputW * previewScale);
            previewH = Math.floor(outputH * previewScale);
        }

        const previewCanvas = document.createElement('canvas');
        previewCanvas.width = previewW;
        previewCanvas.height = previewH;
        const previewCtx = previewCanvas.getContext('2d');
        previewCtx.drawImage(croppedCanvas, 0, 0, previewW, previewH);

        this.processor.previewImageData = previewCtx.getImageData(0, 0, previewW, previewH);
        this.processor.previewScale = previewW / outputW;

        // Update canvases
        this.previewCanvas.width = previewW;
        this.previewCanvas.height = previewH;
        this.originalCanvas.width = previewW;
        this.originalCanvas.height = previewH;
        this.originalCtx.putImageData(this.processor.previewImageData, 0, 0);

        // Update thumbnail for film preview
        this.createPreviewThumbnail(this.processor.previewImageData);
        this.filmPreviewCache.clear();

        // Reprocess
        this.lastProcessedKey = '';
        this.processImage();

        this.closeCropModal();
    }

    createPreviewThumbnail(imageData) {
        // Create thumbnail for film preview (wider for the preview area)
        const width = 200;
        const height = 140;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Draw original to temp canvas
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = imageData.width;
        tempCanvas.height = imageData.height;
        tempCanvas.getContext('2d').putImageData(imageData, 0, 0);

        // Calculate crop to match aspect ratio
        const targetRatio = width / height;
        const srcRatio = imageData.width / imageData.height;

        let srcX = 0, srcY = 0, srcW = imageData.width, srcH = imageData.height;

        if (srcRatio > targetRatio) {
            // Image is wider, crop sides
            srcW = imageData.height * targetRatio;
            srcX = (imageData.width - srcW) / 2;
        } else {
            // Image is taller, crop top/bottom
            srcH = imageData.width / targetRatio;
            srcY = (imageData.height - srcH) / 2;
        }

        // Draw scaled and cropped
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(tempCanvas, srcX, srcY, srcW, srcH, 0, 0, width, height);

        this.previewThumbnail = ctx.getImageData(0, 0, width, height);

        // Set canvas size for preview
        this.filmPreviewCanvas.width = width;
        this.filmPreviewCanvas.height = height;
    }

    confirmReset() {
        if (confirm('Reset all adjustments?')) {
            this.resetSettings();
        }
    }

    confirmNewImage() {
        if (confirm('Choose another photo? Current edits will be lost.')) {
            this.showUpload();
        }
    }

    openDownloadModal() {
        this.updateExportInfo();
        this.downloadModal.hidden = false;
    }

    updateExportInfo() {
        if (!this.processor.originalImageData) return;

        const fullRes = this.fullResolutionCheckbox.checked;
        const width = fullRes ? this.processor.trueOriginalWidth : this.processor.originalImageData.width;
        const height = fullRes ? this.processor.trueOriginalHeight : this.processor.originalImageData.height;

        this.exportDimensions.textContent = `${width} × ${height} px`;

        // Estimate file size (rough)
        const megapixels = (width * height) / 1000000;
        const format = document.querySelector('input[name="format"]:checked').value;
        let estimatedMB;

        if (format === 'png') {
            estimatedMB = megapixels * 2.5; // PNG rough estimate
        } else if (format === 'webp') {
            estimatedMB = megapixels * 0.4; // WebP is very efficient
        } else {
            const quality = parseInt(this.qualitySlider.value) / 100;
            estimatedMB = megapixels * 0.3 * quality * 3;
        }

        if (estimatedMB < 1) {
            this.exportSize.textContent = `~${Math.round(estimatedMB * 1000)} KB`;
        } else {
            this.exportSize.textContent = `~${estimatedMB.toFixed(1)} MB`;
        }
    }

    resetSettings() {
        this.strengthSlider.value = 100;
        this.strengthValue.textContent = '100%';
        this.grainSlider.value = 50;
        this.grainValue.textContent = '50%';
        this.brightnessSlider.value = 0;
        this.brightnessValue.textContent = '0';
        this.contrastSlider.value = 0;
        this.contrastValue.textContent = '0';
        this.saturationSlider.value = 0;
        this.saturationValue.textContent = '0';
        this.temperatureSlider.value = 0;
        this.temperatureValue.textContent = '0';
        this.vignetteSlider.value = 0;
        this.vignetteValue.textContent = '0%';
        this.fadeSlider.value = 0;
        this.fadeValue.textContent = '0';
        this.shadowsSlider.value = 0;
        this.shadowsValue.textContent = '0';
        this.highlightsSlider.value = 0;
        this.highlightsValue.textContent = '0';
        this.blacksSlider.value = 0;
        this.blacksValue.textContent = '0%';
        this.lastProcessedKey = '';
        this.processImage();
    }

    async downloadImage() {
        if (!this.currentProfile) return;

        this.showLoading('Exporting full resolution...');
        this.downloadModal.hidden = true;

        try {
            const settings = this.getSettings();
            const fullRes = await this.processor.applyProfileFull(this.currentProfile, settings);

            const format = document.querySelector('input[name="format"]:checked').value;
            const quality = parseInt(this.qualitySlider.value) / 100;

            let mimeType, extension;
            if (format === 'png') {
                mimeType = 'image/png';
                extension = 'png';
            } else if (format === 'webp') {
                mimeType = 'image/webp';
                extension = 'webp';
            } else {
                mimeType = 'image/jpeg';
                extension = 'jpg';
            }

            const filename = `${this.currentProfile.id}_${Date.now()}.${extension}`;

            const blob = await this.processor.exportImage(fullRes, format, quality);
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

            // Try Web Share API first (requires HTTPS)
            if (navigator.share && navigator.canShare) {
                try {
                    const file = new File([blob], filename, { type: mimeType });
                    if (navigator.canShare({ files: [file] })) {
                        await navigator.share({
                            files: [file],
                            title: 'Film Simulator'
                        });
                        this.hideLoading();
                        return;
                    }
                } catch (e) {
                    if (e.name === 'AbortError') {
                        this.hideLoading();
                        return;
                    }
                    // Continue to fallback
                }
            }

            // iOS fallback: show image in modal for long-press save
            if (isIOS) {
                const url = URL.createObjectURL(blob);
                this.saveModalImg.src = url;
                this.saveModal.hidden = false;
                this.hideLoading();
                return;
            }

            // Desktop/Android fallback: regular download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Export error:', error);
            alert('Export failed');
        }

        this.hideLoading();
    }

    showUpload() {
        this.editorSection.hidden = true;
        this.uploadSection.hidden = false;
        this.appHeader.hidden = true;
        this.fileInput.value = '';
        this.lastProcessedKey = '';
    }

    showLoading(text = 'Processing...') {
        this.loadingText.textContent = text;
        this.loadingOverlay.hidden = false;
    }

    hideLoading() {
        this.loadingOverlay.hidden = true;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new FilmSimulatorApp();

    // No scroll blocking - CSS handles overflow-x: hidden
});
