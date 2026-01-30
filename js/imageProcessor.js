/**
 * Image Processor - Optimized with Web Workers
 * Uses background thread for heavy processing
 */

class ImageProcessor {
    constructor() {
        this.originalImageData = null;
        this.previewImageData = null;
        this.previewScale = 1;
        this.workingCanvas = document.createElement('canvas');
        this.workingCtx = this.workingCanvas.getContext('2d', { willReadFrequently: true });

        // Web Worker for processing
        this.worker = new Worker('/js/imageWorker.js');
        this.workerReady = true;
        this.pendingResolve = null;

        // LUT cache
        this.lutCache = new Map();

        // Worker message handler
        this.worker.onmessage = (e) => {
            if (e.data.type === 'complete' && this.pendingResolve) {
                const data = new Uint8ClampedArray(e.data.data);
                this.pendingResolve(data);
                this.pendingResolve = null;
                this.workerReady = true;
            }
        };

        // Worker error handler
        this.worker.onerror = (e) => {
            console.error('Worker error:', e);
            if (this.pendingReject) {
                this.pendingReject(new Error('Worker processing failed'));
            }
            this.pendingResolve = null;
            this.pendingReject = null;
            this.workerReady = true;
        };
    }

    /**
     * Load image and create preview version
     */
    async loadImage(file) {
        // Store original file for EXIF extraction
        this.originalFile = file;

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                // Store true original dimensions
                this.trueOriginalWidth = img.width;
                this.trueOriginalHeight = img.height;

                let width = img.width;
                let height = img.height;

                // Keep original resolution (no max limit)
                this.workingCanvas.width = width;
                this.workingCanvas.height = height;
                this.workingCtx.drawImage(img, 0, 0, width, height);
                this.originalImageData = this.workingCtx.getImageData(0, 0, width, height);

                // Create preview (max 800px for fast processing)
                const maxPreview = 800;
                if (width > maxPreview || height > maxPreview) {
                    this.previewScale = Math.min(maxPreview / width, maxPreview / height);
                    const pWidth = Math.floor(width * this.previewScale);
                    const pHeight = Math.floor(height * this.previewScale);

                    this.workingCanvas.width = pWidth;
                    this.workingCanvas.height = pHeight;
                    this.workingCtx.drawImage(img, 0, 0, pWidth, pHeight);
                    this.previewImageData = this.workingCtx.getImageData(0, 0, pWidth, pHeight);
                } else {
                    this.previewScale = 1;
                    this.previewImageData = this.cloneImageData(this.originalImageData);
                }

                resolve({
                    width,
                    height,
                    previewWidth: this.previewImageData.width,
                    previewHeight: this.previewImageData.height,
                    imageData: this.cloneImageData(this.previewImageData)
                });

                URL.revokeObjectURL(img.src);
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
        });
    }

    cloneImageData(imageData) {
        return new ImageData(
            new Uint8ClampedArray(imageData.data),
            imageData.width,
            imageData.height
        );
    }

    /**
     * Load LUT file
     */
    async loadLut(profile) {
        if (!profile.lutUrl) return null;
        if (this.lutCache.has(profile.id)) {
            return this.lutCache.get(profile.id);
        }

        try {
            const response = await fetch(profile.lutUrl);
            const content = await response.text();
            this.lutCache.set(profile.id, content);
            return content;
        } catch (error) {
            console.error('Failed to load LUT:', error);
            return null;
        }
    }

    /**
     * Apply profile using Web Worker (preview quality)
     */
    async applyProfilePreview(profile, settings) {
        return this.processWithWorker(this.previewImageData, profile, settings);
    }

    /**
     * Apply profile at full resolution (for export)
     */
    async applyProfileFull(profile, settings) {
        return this.processWithWorker(this.originalImageData, profile, settings);
    }

    /**
     * Process image using Web Worker
     */
    async processWithWorker(sourceImageData, profile, settings) {
        if (!sourceImageData || !sourceImageData.data) {
            throw new Error('No image loaded');
        }

        // Wait for worker to be ready (with timeout)
        let waitCount = 0;
        while (!this.workerReady && waitCount < 500) {
            await new Promise(r => setTimeout(r, 10));
            waitCount++;
        }

        if (!this.workerReady) {
            console.warn('Worker timeout, resetting');
            this.workerReady = true;
        }

        this.workerReady = false;

        // Load LUT if needed
        let lutContent = null;
        if (profile && profile.lutUrl) {
            lutContent = await this.loadLut(profile);
        }

        // Clone data for worker
        const dataClone = new Uint8ClampedArray(sourceImageData.data);

        return new Promise((resolve, reject) => {
            // Timeout after 30 seconds
            const timeout = setTimeout(() => {
                console.warn('Worker processing timeout');
                this.workerReady = true;
                this.pendingResolve = null;
                this.pendingReject = null;
                reject(new Error('Processing timeout'));
            }, 30000);

            this.pendingResolve = (processedData) => {
                clearTimeout(timeout);
                resolve(new ImageData(processedData, sourceImageData.width, sourceImageData.height));
            };

            this.pendingReject = (error) => {
                clearTimeout(timeout);
                reject(error);
            };

            this.worker.postMessage({
                type: 'process',
                payload: {
                    imageData: dataClone.buffer,
                    width: sourceImageData.width,
                    height: sourceImageData.height,
                    profile: profile,
                    settings: settings,
                    lutContent: lutContent
                }
            }, [dataClone.buffer]);
        });
    }

    /**
     * Quick preview without worker (for slider dragging)
     */
    getQuickPreview(profile, settings) {
        if (!this.previewImageData) return null;

        const data = this.cloneImageData(this.previewImageData);
        const pixels = data.data;

        // Simple brightness/contrast only for quick feedback
        const brightness = settings.brightness * 2.55;
        const contrast = (settings.contrast + 50) / 50;

        for (let i = 0; i < pixels.length; i += 4) {
            let r = pixels[i] + brightness;
            let g = pixels[i + 1] + brightness;
            let b = pixels[i + 2] + brightness;

            r = (r - 128) * contrast + 128;
            g = (g - 128) * contrast + 128;
            b = (b - 128) * contrast + 128;

            pixels[i] = Math.max(0, Math.min(255, r));
            pixels[i + 1] = Math.max(0, Math.min(255, g));
            pixels[i + 2] = Math.max(0, Math.min(255, b));
        }

        return data;
    }

    getOriginal() {
        return this.originalImageData ? this.cloneImageData(this.originalImageData) : null;
    }

    getPreview() {
        return this.previewImageData ? this.cloneImageData(this.previewImageData) : null;
    }

    /**
     * Apply profile to small thumbnail (for film preview)
     */
    async applyProfileToThumbnail(thumbnailData, profile, settings) {
        return this.processWithWorker(thumbnailData, profile, settings);
    }

    async exportImage(imageData, format = 'jpeg', quality = 1.0) {
        this.workingCanvas.width = imageData.width;
        this.workingCanvas.height = imageData.height;
        this.workingCtx.putImageData(imageData, 0, 0);

        return new Promise((resolve) => {
            let mimeType = 'image/jpeg';
            if (format === 'png') mimeType = 'image/png';
            else if (format === 'webp') mimeType = 'image/webp';

            // PNG doesn't use quality, JPEG and WebP do
            const useQuality = format !== 'png' ? quality : undefined;
            this.workingCanvas.toBlob(resolve, mimeType, useQuality);
        });
    }

    /**
     * Get original dimensions
     */
    getOriginalDimensions() {
        return {
            width: this.trueOriginalWidth || this.originalImageData?.width || 0,
            height: this.trueOriginalHeight || this.originalImageData?.height || 0
        };
    }
}

window.ImageProcessor = ImageProcessor;
