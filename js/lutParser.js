/**
 * CUBE LUT Parser and 3D LUT Interpolation
 * Parses .cube files and applies them using trilinear interpolation
 */

class LUTParser {
    constructor() {
        this.cache = new Map();
    }

    /**
     * Parse a .cube file content
     * @param {string} content - Raw .cube file content
     * @returns {Object} - Parsed LUT data
     */
    parse(content) {
        const lines = content.split('\n');
        let title = '';
        let size = 0;
        let domainMin = [0, 0, 0];
        let domainMax = [1, 1, 1];
        const data = [];

        for (const line of lines) {
            const trimmed = line.trim();

            // Skip comments and empty lines
            if (trimmed.startsWith('#') || trimmed === '') continue;

            // Parse header
            if (trimmed.startsWith('TITLE')) {
                title = trimmed.replace('TITLE', '').replace(/"/g, '').trim();
            } else if (trimmed.startsWith('LUT_3D_SIZE')) {
                size = parseInt(trimmed.split(/\s+/)[1]);
            } else if (trimmed.startsWith('DOMAIN_MIN')) {
                const parts = trimmed.split(/\s+/);
                domainMin = [parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])];
            } else if (trimmed.startsWith('DOMAIN_MAX')) {
                const parts = trimmed.split(/\s+/);
                domainMax = [parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])];
            } else {
                // Parse data line (RGB triplet)
                const parts = trimmed.split(/\s+/);
                if (parts.length >= 3) {
                    const r = parseFloat(parts[0]);
                    const g = parseFloat(parts[1]);
                    const b = parseFloat(parts[2]);
                    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
                        data.push([r, g, b]);
                    }
                }
            }
        }

        return {
            title,
            size,
            domainMin,
            domainMax,
            data
        };
    }

    /**
     * Load a LUT from URL with caching
     * @param {string} url - URL to .cube file
     * @returns {Promise<Object>} - Parsed LUT data
     */
    async load(url) {
        if (this.cache.has(url)) {
            return this.cache.get(url);
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load LUT: ${response.status}`);
        }

        const content = await response.text();
        const lut = this.parse(content);
        this.cache.set(url, lut);
        return lut;
    }

    /**
     * Apply 3D LUT to image data using trilinear interpolation
     * @param {ImageData} imageData - Source image data
     * @param {Object} lut - Parsed LUT object
     * @param {number} strength - Effect strength (0-1)
     * @returns {ImageData} - Modified image data
     */
    apply(imageData, lut, strength = 1.0) {
        const data = imageData.data;
        const lutData = lut.data;
        const size = lut.size;
        const maxIndex = size - 1;

        for (let i = 0; i < data.length; i += 4) {
            // Normalize to 0-1 range
            const r = data[i] / 255;
            const g = data[i + 1] / 255;
            const b = data[i + 2] / 255;

            // Calculate LUT coordinates
            const rIdx = r * maxIndex;
            const gIdx = g * maxIndex;
            const bIdx = b * maxIndex;

            // Get integer and fractional parts
            const r0 = Math.floor(rIdx);
            const g0 = Math.floor(gIdx);
            const b0 = Math.floor(bIdx);
            const r1 = Math.min(r0 + 1, maxIndex);
            const g1 = Math.min(g0 + 1, maxIndex);
            const b1 = Math.min(b0 + 1, maxIndex);

            const rFrac = rIdx - r0;
            const gFrac = gIdx - g0;
            const bFrac = bIdx - b0;

            // Trilinear interpolation
            // Get 8 corner values
            const c000 = lutData[b0 * size * size + g0 * size + r0];
            const c100 = lutData[b0 * size * size + g0 * size + r1];
            const c010 = lutData[b0 * size * size + g1 * size + r0];
            const c110 = lutData[b0 * size * size + g1 * size + r1];
            const c001 = lutData[b1 * size * size + g0 * size + r0];
            const c101 = lutData[b1 * size * size + g0 * size + r1];
            const c011 = lutData[b1 * size * size + g1 * size + r0];
            const c111 = lutData[b1 * size * size + g1 * size + r1];

            // Interpolate
            let newR, newG, newB;

            if (c000 && c111) {
                // Interpolate along R
                const c00 = this.lerp3(c000, c100, rFrac);
                const c01 = this.lerp3(c001, c101, rFrac);
                const c10 = this.lerp3(c010, c110, rFrac);
                const c11 = this.lerp3(c011, c111, rFrac);

                // Interpolate along G
                const c0 = this.lerp3(c00, c10, gFrac);
                const c1 = this.lerp3(c01, c11, gFrac);

                // Interpolate along B
                const result = this.lerp3(c0, c1, bFrac);

                newR = result[0];
                newG = result[1];
                newB = result[2];
            } else {
                newR = r;
                newG = g;
                newB = b;
            }

            // Blend with original based on strength
            if (strength < 1) {
                newR = r + (newR - r) * strength;
                newG = g + (newG - g) * strength;
                newB = b + (newB - b) * strength;
            }

            // Convert back to 0-255 range
            data[i] = Math.max(0, Math.min(255, Math.round(newR * 255)));
            data[i + 1] = Math.max(0, Math.min(255, Math.round(newG * 255)));
            data[i + 2] = Math.max(0, Math.min(255, Math.round(newB * 255)));
        }

        return imageData;
    }

    /**
     * Linear interpolation for RGB arrays
     */
    lerp3(a, b, t) {
        return [
            a[0] + (b[0] - a[0]) * t,
            a[1] + (b[1] - a[1]) * t,
            a[2] + (b[2] - a[2]) * t
        ];
    }
}

// Make available globally
window.LUTParser = LUTParser;
