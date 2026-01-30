/**
 * Advanced Film Grain Generator v2
 * Realistic analog film grain simulation with:
 * - Silver halide cluster simulation
 * - Per-channel grain for color film
 * - Luminance-dependent response
 * - Film-specific grain characteristics
 */

class GrainGenerator {
    constructor() {
        // Permutation table for noise
        this.perm = new Uint8Array(512);
        this.gradP = new Array(512);
        this.grad3 = [
            [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
            [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
            [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
        ];
        this.seed(Date.now());

        // Pre-generate grain lookup tables for performance
        this.grainLUT = null;
        this.lutSize = 256;
    }

    seed(seed) {
        if (seed > 0 && seed < 1) seed *= 65536;
        seed = Math.floor(seed);
        if (seed < 256) seed |= seed << 8;

        const p = new Uint8Array(256);
        for (let i = 0; i < 256; i++) {
            let v = (i & 1)
                ? this.permValue(i, seed) ^ ((seed >> 8) & 255)
                : this.permValue(i, seed) ^ (seed & 255);
            p[i] = v;
        }

        for (let i = 0; i < 512; i++) {
            this.perm[i] = p[i & 255];
            this.gradP[i] = this.grad3[this.perm[i] % 12];
        }
    }

    permValue(i, seed) {
        return ((i * 1664525 + 1013904223 + seed) >>> 0) & 255;
    }

    // Simplex 2D noise
    simplex2(x, y) {
        const F2 = 0.5 * (Math.sqrt(3) - 1);
        const G2 = (3 - Math.sqrt(3)) / 6;

        const s = (x + y) * F2;
        const i = Math.floor(x + s);
        const j = Math.floor(y + s);
        const t = (i + j) * G2;
        const X0 = i - t;
        const Y0 = j - t;
        const x0 = x - X0;
        const y0 = y - Y0;

        const i1 = x0 > y0 ? 1 : 0;
        const j1 = x0 > y0 ? 0 : 1;

        const x1 = x0 - i1 + G2;
        const y1 = y0 - j1 + G2;
        const x2 = x0 - 1 + 2 * G2;
        const y2 = y0 - 1 + 2 * G2;

        const ii = i & 255;
        const jj = j & 255;
        const gi0 = this.gradP[ii + this.perm[jj]];
        const gi1 = this.gradP[ii + i1 + this.perm[jj + j1]];
        const gi2 = this.gradP[ii + 1 + this.perm[jj + 1]];

        let n0, n1, n2;

        let t0 = 0.5 - x0 * x0 - y0 * y0;
        n0 = t0 < 0 ? 0 : (t0 *= t0) * t0 * (gi0[0] * x0 + gi0[1] * y0);

        let t1 = 0.5 - x1 * x1 - y1 * y1;
        n1 = t1 < 0 ? 0 : (t1 *= t1) * t1 * (gi1[0] * x1 + gi1[1] * y1);

        let t2 = 0.5 - x2 * x2 - y2 * y2;
        n2 = t2 < 0 ? 0 : (t2 *= t2) * t2 * (gi2[0] * x2 + gi2[1] * y2);

        return 70 * (n0 + n1 + n2);
    }

    /**
     * Generate Gaussian random number (Box-Muller transform)
     * Film grain follows approximately Gaussian distribution
     */
    gaussianRandom() {
        let u1 = Math.random();
        let u2 = Math.random();
        while (u1 === 0) u1 = Math.random();
        return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    }

    /**
     * Simulate silver halide grain clumping
     * Real film grain isn't uniform - silver halides cluster together
     */
    getClusterNoise(x, y, scale, clusterSize) {
        // Large-scale cluster pattern
        const cluster = this.simplex2(x * scale * 0.3, y * scale * 0.3);
        // Medium detail
        const medium = this.simplex2(x * scale * 0.8, y * scale * 0.8);
        // Fine detail
        const fine = this.simplex2(x * scale * 2, y * scale * 2);

        // Combine with weighted sum
        return cluster * 0.4 + medium * 0.35 + fine * 0.25;
    }

    /**
     * Film response curve - grain visibility varies with exposure
     * Most visible in midtones, less in deep shadows and highlights
     */
    getFilmResponse(luminance, filmType = 'negative') {
        const l = luminance / 255;

        if (filmType === 'negative') {
            // Negative film: more grain in midtones and shadows
            // Less in highlights due to shoulder curve
            const shadowResponse = Math.pow(l, 0.7);
            const highlightRolloff = 1 - Math.pow(l, 3);
            return shadowResponse * highlightRolloff * 1.2;
        } else if (filmType === 'slide') {
            // Slide film: grain more visible in shadows
            // Tighter response curve
            return Math.pow(l * (1 - l) * 4, 0.8);
        } else {
            // B&W film: fairly even grain, slightly more in midtones
            return 0.3 + Math.pow(l * (1 - l) * 4, 0.5) * 0.7;
        }
    }

    /**
     * Apply realistic film grain
     * @param {ImageData} imageData - Target image data
     * @param {number} intensity - Grain intensity (0-1)
     * @param {number} size - Grain size multiplier
     * @param {number} iso - Film ISO rating
     * @param {string} filmType - 'negative', 'slide', or 'bw'
     */
    applyRealisticGrain(imageData, intensity, size, iso = 400, filmType = 'negative') {
        if (intensity <= 0) return imageData;

        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;

        // Re-seed for unique pattern
        this.seed(Math.random() * 100000);

        // ISO affects grain characteristics
        // Higher ISO = larger grain clusters, more prominent
        const isoFactor = Math.sqrt(iso / 100);
        const clusterFactor = 0.8 + (Math.log2(iso / 100) * 0.15);

        // Scale based on size and ISO
        const baseScale = 0.012 / (size * Math.pow(isoFactor, 0.3));

        // Grain strength varies by film type
        const baseStrength = intensity * 45 * isoFactor;

        // Color film has different grain per channel (due to different emulsion layers)
        // B&W has same grain across channels
        const isColorFilm = filmType !== 'bw';

        // Process image
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;

                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];

                // Calculate luminance
                const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

                // Get film response for this luminance
                const response = this.getFilmResponse(luminance, filmType);

                // Get cluster noise for grain structure
                const clusterNoise = this.getClusterNoise(x, y, baseScale, clusterFactor);

                // Add shot noise (photon noise) - Gaussian distributed
                const shotNoise = this.gaussianRandom() * 0.3 * isoFactor;

                // Combine noise sources
                const baseNoise = (clusterNoise * 0.7 + shotNoise * 0.3);

                // Calculate final grain strength
                const grainStrength = baseStrength * response;

                if (isColorFilm) {
                    // Color film: slightly different grain per channel
                    // Blue layer typically has more grain (top layer, finer crystals)
                    // Green layer in middle
                    // Red layer at bottom (larger crystals, less grain visible)

                    // Offset noise sampling for each channel
                    const rNoise = baseNoise + this.simplex2((x + 1000) * baseScale, y * baseScale) * 0.15;
                    const gNoise = baseNoise + this.simplex2(x * baseScale, (y + 1000) * baseScale) * 0.12;
                    const bNoise = baseNoise + this.simplex2((x + 500) * baseScale, (y + 500) * baseScale) * 0.18;

                    // Apply with channel-specific multipliers
                    data[idx] = Math.max(0, Math.min(255, r + rNoise * grainStrength * 0.9));
                    data[idx + 1] = Math.max(0, Math.min(255, g + gNoise * grainStrength * 1.0));
                    data[idx + 2] = Math.max(0, Math.min(255, b + bNoise * grainStrength * 1.15));
                } else {
                    // B&W film: same grain across all channels
                    const grainOffset = baseNoise * grainStrength;

                    data[idx] = Math.max(0, Math.min(255, r + grainOffset));
                    data[idx + 1] = Math.max(0, Math.min(255, g + grainOffset));
                    data[idx + 2] = Math.max(0, Math.min(255, b + grainOffset));
                }
            }
        }

        return imageData;
    }

    /**
     * Apply film-stock specific grain characteristics
     */
    applyFilmSpecificGrain(imageData, profile, intensity, size) {
        if (intensity <= 0) return imageData;

        const iso = profile.grain?.iso || 400;

        // Determine film type from profile
        let filmType = 'negative';
        if (profile.adjustments?.saturation === 0) {
            filmType = 'bw';
        } else if (profile.id?.includes('velvia') || profile.id?.includes('provia') ||
                   profile.id?.includes('kodachrome') || profile.id?.includes('ektachrome')) {
            filmType = 'slide';
        }

        return this.applyRealisticGrain(imageData, intensity, size, iso, filmType);
    }
}

// Make available globally
window.GrainGenerator = GrainGenerator;
