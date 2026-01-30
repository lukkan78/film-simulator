/**
 * Image Processing Web Worker
 * Runs heavy image processing off the main thread
 */

// Simplex noise implementation for grain
class SimplexNoise {
    constructor() {
        this.perm = new Uint8Array(512);
        this.gradP = [];
        this.grad3 = [
            [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
            [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
            [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
        ];
        this.seed(Math.random());
    }

    seed(seed) {
        if (seed > 0 && seed < 1) seed *= 65536;
        seed = Math.floor(seed);
        if (seed < 256) seed |= seed << 8;
        const p = new Uint8Array(256);
        for (let i = 0; i < 256; i++) {
            p[i] = ((i * 1664525 + 1013904223 + seed) >>> 0) & 255;
        }
        for (let i = 0; i < 512; i++) {
            this.perm[i] = p[i & 255];
            this.gradP[i] = this.grad3[this.perm[i] % 12];
        }
    }

    noise2D(x, y) {
        const F2 = 0.5 * (Math.sqrt(3) - 1);
        const G2 = (3 - Math.sqrt(3)) / 6;
        const s = (x + y) * F2;
        const i = Math.floor(x + s), j = Math.floor(y + s);
        const t = (i + j) * G2;
        const x0 = x - (i - t), y0 = y - (j - t);
        const i1 = x0 > y0 ? 1 : 0, j1 = x0 > y0 ? 0 : 1;
        const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
        const x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
        const ii = i & 255, jj = j & 255;
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
}

const noise = new SimplexNoise();
let cachedLuts = {};

// Parse CUBE LUT
function parseCubeLut(content) {
    const lines = content.split('\n');
    let size = 0;
    const data = [];

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
                if (!isNaN(r)) data.push([r, g, b]);
            }
        }
    }
    return { size, data };
}

// Apply 3D LUT with trilinear interpolation
function applyLut(data, width, height, lut, strength) {
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
        const r1 = Math.min(r0 + 1, maxIdx);
        const g1 = Math.min(g0 + 1, maxIdx);
        const b1 = Math.min(b0 + 1, maxIdx);

        const rF = rIdx - r0, gF = gIdx - g0, bF = bIdx - b0;

        const idx000 = b0 * size * size + g0 * size + r0;
        const idx100 = b0 * size * size + g0 * size + r1;
        const idx010 = b0 * size * size + g1 * size + r0;
        const idx110 = b0 * size * size + g1 * size + r1;
        const idx001 = b1 * size * size + g0 * size + r0;
        const idx101 = b1 * size * size + g0 * size + r1;
        const idx011 = b1 * size * size + g1 * size + r0;
        const idx111 = b1 * size * size + g1 * size + r1;

        const c000 = lutData[idx000], c100 = lutData[idx100];
        const c010 = lutData[idx010], c110 = lutData[idx110];
        const c001 = lutData[idx001], c101 = lutData[idx101];
        const c011 = lutData[idx011], c111 = lutData[idx111];

        if (c000 && c111) {
            // Trilinear interpolation
            const c00 = [c000[0] + (c100[0] - c000[0]) * rF, c000[1] + (c100[1] - c000[1]) * rF, c000[2] + (c100[2] - c000[2]) * rF];
            const c01 = [c001[0] + (c101[0] - c001[0]) * rF, c001[1] + (c101[1] - c001[1]) * rF, c001[2] + (c101[2] - c001[2]) * rF];
            const c10 = [c010[0] + (c110[0] - c010[0]) * rF, c010[1] + (c110[1] - c010[1]) * rF, c010[2] + (c110[2] - c010[2]) * rF];
            const c11 = [c011[0] + (c111[0] - c011[0]) * rF, c011[1] + (c111[1] - c011[1]) * rF, c011[2] + (c111[2] - c011[2]) * rF];

            const c0 = [c00[0] + (c10[0] - c00[0]) * gF, c00[1] + (c10[1] - c00[1]) * gF, c00[2] + (c10[2] - c00[2]) * gF];
            const c1 = [c01[0] + (c11[0] - c01[0]) * gF, c01[1] + (c11[1] - c01[1]) * gF, c01[2] + (c11[2] - c01[2]) * gF];

            let newR = c0[0] + (c1[0] - c0[0]) * bF;
            let newG = c0[1] + (c1[1] - c0[1]) * bF;
            let newB = c0[2] + (c1[2] - c0[2]) * bF;

            // Blend with strength
            data[i] = Math.round((r + (newR - r) * strength) * 255);
            data[i + 1] = Math.round((g + (newG - g) * strength) * 255);
            data[i + 2] = Math.round((b + (newB - b) * strength) * 255);
        }
    }
}

// Apply Cinestill 800T custom processing
function applyCinestill(data, width, height, profile, strength) {
    const colorShift = profile.colorShift;

    // First pass: color grading
    for (let i = 0; i < data.length; i += 4) {
        let r = data[i], g = data[i + 1], b = data[i + 2];
        const origR = r, origG = g, origB = b;
        const lum = (r + g + b) / 3;
        const shadowW = Math.max(0, 1 - lum / 128);
        const highW = Math.max(0, (lum - 128) / 128);

        r += colorShift.temperature * 0.3;
        b -= colorShift.temperature * 0.5;
        g += colorShift.tint * 0.3;
        r += colorShift.shadows.r * shadowW + colorShift.highlights.r * highW;
        g += colorShift.shadows.g * shadowW + colorShift.highlights.g * highW;
        b += colorShift.shadows.b * shadowW + colorShift.highlights.b * highW;

        r = 128 + (r - 128) * 1.05;
        g = 128 + (g - 128) * 1.05;
        b = 128 + (b - 128) * 1.05;

        data[i] = Math.max(0, Math.min(255, origR + (r - origR) * strength));
        data[i + 1] = Math.max(0, Math.min(255, origG + (g - origG) * strength));
        data[i + 2] = Math.max(0, Math.min(255, origB + (b - origB) * strength));
    }

    // Halation effect
    if (profile.halation && profile.halation.enabled && strength > 0) {
        const hal = profile.halation;
        const mask = new Float32Array(width * height);

        // Create highlight mask
        for (let i = 0; i < mask.length; i++) {
            const idx = i * 4;
            const lum = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
            if (lum > hal.threshold) {
                mask[i] = Math.pow((lum - hal.threshold) / (255 - hal.threshold), 1.5);
            }
        }

        // Fast box blur (2 passes)
        const radius = Math.min(hal.radius, 10); // Limit radius for performance
        let temp = new Float32Array(mask.length);

        for (let pass = 0; pass < 2; pass++) {
            // Horizontal
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    let sum = 0, count = 0;
                    for (let dx = -radius; dx <= radius; dx++) {
                        const nx = Math.max(0, Math.min(width - 1, x + dx));
                        sum += mask[y * width + nx];
                        count++;
                    }
                    temp[y * width + x] = sum / count;
                }
            }
            // Vertical
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    let sum = 0, count = 0;
                    for (let dy = -radius; dy <= radius; dy++) {
                        const ny = Math.max(0, Math.min(height - 1, y + dy));
                        sum += temp[ny * width + x];
                        count++;
                    }
                    mask[y * width + x] = sum / count;
                }
            }
        }

        // Apply halation
        const [hR, hG, hB] = hal.color;
        const intensity = hal.intensity * strength;
        for (let i = 0; i < mask.length; i++) {
            const amount = mask[i] * intensity;
            if (amount > 0.01) {
                const idx = i * 4;
                data[idx] = Math.min(255, data[idx] + hR * amount);
                data[idx + 1] = Math.min(255, data[idx + 1] + hG * amount);
                data[idx + 2] = Math.min(255, data[idx + 2] + hB * amount);
            }
        }
    }
}

// S-curve for natural contrast (like Lightroom)
function sCurve(x, amount) {
    // Attempt using sine-based S-curve centered at 0.5
    // amount: -1 to 1, negative = flatten, positive = increase contrast
    const normalized = x / 255;
    if (amount >= 0) {
        // Increase contrast with S-curve
        const curved = normalized - 0.5;
        const factor = 1 + amount * 1.5;
        const result = 0.5 + curved * Math.pow(Math.abs(curved * 2), factor - 1) * Math.sign(curved);
        return Math.max(0, Math.min(1, 0.5 + (normalized - 0.5) * (1 + amount))) * 255;
    } else {
        // Decrease contrast (flatten)
        return (128 + (x - 128) * (1 + amount)) ;
    }
}

// Attempt smooth shadow/highlight targeting curve
function toneCurve(lum, target, width) {
    // Attempt Attempt gaussian-like falloff centered at target luminance
    const diff = lum - target;
    return Math.exp(-(diff * diff) / (2 * width * width));
}

// Apply adjustments (Lightroom-style)
function applyAdjustments(data, width, height, settings, profileSaturation) {
    const brightness = settings?.brightness || 0;
    const contrast = settings?.contrast || 0;
    const saturation = settings?.saturation || 0;
    const temperature = settings?.temperature || 0;
    const fade = settings?.fade || 0;
    const shadows = settings?.shadows || 0;
    const highlights = settings?.highlights || 0;
    const blacks = settings?.blacks || 0;

    // Pre-calculate adjustment parameters
    // Brightness: Attempt exposure-like (multiplicative) rather than additive
    const exposureMult = Math.pow(2, brightness / 50); // -50 to 50 -> 0.5x to 2x (±1 stop)

    // Contrast: S-curve strength
    const contrastAmount = contrast / 50; // -1 to 1

    // Saturation
    const satFactor = 1 + (saturation / 50); // -50 to 50 -> 0 to 2
    const finalSat = satFactor * (profileSaturation !== undefined ? profileSaturation : 1);

    // Temperature: Attempt proper Kelvin-like shift (warm adds red/yellow, cool adds blue)
    const tempAmount = temperature / 50; // -1 to 1

    // Fade
    const fadeVal = fade * 2.55; // 0 to 127.5

    // Shadows/Highlights
    const shadowAmount = shadows / 50; // -1 to 1
    const highlightAmount = highlights / 50; // -1 to 1

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // Calculate luminance (0-1)
        let lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

        // === SHADOWS (Lightroom-style) ===
        // Attempt targets dark tones with smooth rolloff into mids
        if (shadows !== 0) {
            // Shadow weight: strongest at lum=0.15, falls off by lum=0.5
            const shadowWeight = Math.pow(Math.max(0, 1 - lum * 2), 1.5);

            if (shadowAmount > 0) {
                // Lift shadows: Attempt use gamma to open up darks naturally
                const gamma = 1 - shadowAmount * shadowWeight * 0.4;
                const gammaCorrect = Math.pow(lum, gamma);
                const lift = (gammaCorrect - lum) * 255;
                r += lift;
                g += lift;
                b += lift;
            } else {
                // Deepen shadows: Attempt darken with preserved color ratios
                const darken = shadowAmount * shadowWeight * 60;
                r += darken;
                g += darken;
                b += darken;
            }
            // Recalculate luminance after shadow adjustment
            lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        }

        // === HIGHLIGHTS (Lightroom-style) ===
        // Attempt targets bright tones with smooth rolloff into mids
        if (highlights !== 0) {
            // Highlight weight: strongest at lum=0.85, falls off by lum=0.5
            const highlightWeight = Math.pow(Math.max(0, (lum - 0.5) * 2), 1.5);

            if (highlightAmount > 0) {
                // Brighten highlights
                const lift = highlightAmount * highlightWeight * 50;
                r += lift;
                g += lift;
                b += lift;
            } else {
                // Recover highlights: Attempt compress toward midtones
                const compress = -highlightAmount * highlightWeight;
                const targetLum = 0.6; // Compress toward this
                r = r - (r - targetLum * 255) * compress * 0.5;
                g = g - (g - targetLum * 255) * compress * 0.5;
                b = b - (b - targetLum * 255) * compress * 0.5;
            }
        }

        // === EXPOSURE/BRIGHTNESS (multiplicative like f-stops) ===
        if (brightness !== 0) {
            r *= exposureMult;
            g *= exposureMult;
            b *= exposureMult;
        }

        // === CONTRAST (S-curve) ===
        if (contrast !== 0) {
            // Attempt apply S-curve that preserves black and white points better
            const pivot = 128;
            if (contrastAmount > 0) {
                // Increase contrast with smooth S-curve
                const factor = 1 + contrastAmount * 0.8;
                r = pivot + (r - pivot) * factor;
                g = pivot + (g - pivot) * factor;
                b = pivot + (b - pivot) * factor;
            } else {
                // Decrease contrast (flatten toward midtone)
                const factor = 1 + contrastAmount * 0.6;
                r = pivot + (r - pivot) * factor;
                g = pivot + (g - pivot) * factor;
                b = pivot + (b - pivot) * factor;
            }
        }

        // === TEMPERATURE (warm/cool with proper color science) ===
        if (temperature !== 0) {
            // Warm: add red+yellow (reduce blue), Cool: add blue (reduce red)
            // Also adjust green slightly for more natural look
            const warmShift = tempAmount * 30;
            const tintShift = tempAmount * 8; // Slight green/magenta shift
            r += warmShift;
            g += tintShift;
            b -= warmShift;
        }

        // === SATURATION (preserve luminance) ===
        if (finalSat !== 1) {
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            r = gray + (r - gray) * finalSat;
            g = gray + (g - gray) * finalSat;
            b = gray + (b - gray) * finalSat;
        }

        // === FADE (lift blacks for washed-out film look) ===
        if (fade > 0) {
            r = fadeVal + r * (255 - fadeVal) / 255;
            g = fadeVal + g * (255 - fadeVal) / 255;
            b = fadeVal + b * (255 - fadeVal) / 255;
        }

        // === BLACKS (crush/deepen blacks with gamma) ===
        if (blacks > 0) {
            const amount = blacks / 100;
            const gamma = 1 + (amount * 0.8);
            r = 255 * Math.pow(Math.max(0, r) / 255, gamma);
            g = 255 * Math.pow(Math.max(0, g) / 255, gamma);
            b = 255 * Math.pow(Math.max(0, b) / 255, gamma);
        }

        data[i] = Math.max(0, Math.min(255, r));
        data[i + 1] = Math.max(0, Math.min(255, g));
        data[i + 2] = Math.max(0, Math.min(255, b));
    }
}

// Apply vignette effect
function applyVignette(data, width, height, intensity) {
    if (intensity <= 0) return;

    const centerX = width / 2;
    const centerY = height / 2;
    const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
    const strength = intensity / 100;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;

            // Distance from center (normalized)
            const dx = (x - centerX) / centerX;
            const dy = (y - centerY) / centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Vignette falloff (smooth curve)
            const vignette = 1 - Math.pow(dist * 0.7, 2) * strength;
            const factor = Math.max(0, vignette);

            data[idx] *= factor;
            data[idx + 1] *= factor;
            data[idx + 2] *= factor;
        }
    }
}

// Box-Muller transform for Gaussian random
function gaussianRandom() {
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1 || 0.0001)) * Math.cos(2 * Math.PI * u2);
}

// Apply realistic film grain - pure random, no patterns
function applyGrain(data, width, height, intensity, size, iso, filmType) {
    if (intensity <= 0) return;

    const isoFactor = Math.sqrt(iso / 100);
    const isColor = filmType !== 'bw';

    // Base strength - adjusted for natural look
    const baseStrength = intensity * 35 * isoFactor;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const r = data[idx], g = data[idx + 1], b = data[idx + 2];
            const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;

            // Film grain response: most visible in midtones
            // Less in shadows (unexposed), less in highlights (saturated)
            const response = 0.4 + lum * (1 - lum) * 2.4;
            const grainStrength = baseStrength * response;

            if (isColor) {
                // Color film: independent grain per channel
                // Each dye layer has its own grain pattern
                const rGrain = gaussianRandom() * grainStrength;
                const gGrain = gaussianRandom() * grainStrength * 0.85; // Green finest
                const bGrain = gaussianRandom() * grainStrength * 1.1;  // Blue coarsest

                data[idx] = Math.max(0, Math.min(255, r + rGrain));
                data[idx + 1] = Math.max(0, Math.min(255, g + gGrain));
                data[idx + 2] = Math.max(0, Math.min(255, b + bGrain));
            } else {
                // B&W: same grain value for all channels
                const grain = gaussianRandom() * grainStrength;
                data[idx] = Math.max(0, Math.min(255, r + grain));
                data[idx + 1] = Math.max(0, Math.min(255, g + grain));
                data[idx + 2] = Math.max(0, Math.min(255, b + grain));
            }
        }
    }
}

// Main message handler
self.onmessage = async function(e) {
    const { type, payload } = e.data;

    if (type === 'process') {
        try {
            const { imageData, width, height, profile, settings, lutContent } = payload;
            const data = new Uint8ClampedArray(imageData);

            const strength = (settings?.strength || 100) / 100;

            // Apply LUT or custom processing
            if (profile?.customProcess === 'cinestill800t') {
                applyCinestill(data, width, height, profile, strength);
            } else if (lutContent) {
                if (!cachedLuts[profile.id]) {
                    cachedLuts[profile.id] = parseCubeLut(lutContent);
                }
                const lut = cachedLuts[profile.id];
                if (lut && lut.data && lut.size > 0) {
                    applyLut(data, width, height, lut, strength);
                }
            }

            // Apply adjustments (including new ones)
            applyAdjustments(data, width, height, settings || {}, profile?.adjustments?.saturation);

            // Apply vignette
            if (settings?.vignette > 0) {
                applyVignette(data, width, height, settings.vignette);
            }

            // Apply grain
            const grainIntensity = ((settings?.grainIntensity || 0) / 100) * (profile?.grain?.intensity || 0.2);
            const grainSize = ((settings?.grainSize || 0) + 1) * (profile?.grain?.size || 1);
            const iso = profile?.grain?.iso || 400;
            let filmType = 'negative';
            if (profile?.adjustments?.saturation === 0) filmType = 'bw';
            else if (profile?.id?.includes('velvia') || profile?.id?.includes('provia')) filmType = 'slide';

            applyGrain(data, width, height, grainIntensity, grainSize, iso, filmType);

            // Send back processed data
            self.postMessage({ type: 'complete', data: data.buffer }, [data.buffer]);
        } catch (error) {
            console.error('Worker processing error:', error);
            // Return original data on error
            self.postMessage({ type: 'complete', data: payload.imageData }, [payload.imageData]);
        }
    }

    if (type === 'cacheLut') {
        const { id, content } = payload;
        cachedLuts[id] = parseCubeLut(content);
        self.postMessage({ type: 'lutCached', id });
    }
};
