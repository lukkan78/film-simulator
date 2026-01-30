/**
 * Film Profiles - Real film emulation using G'MIC CUBE LUTs
 * MIT Licensed LUTs from https://github.com/YahiaAngelo/Film-Luts
 */

const LUT_BASE_URL = 'https://raw.githubusercontent.com/YahiaAngelo/Film-Luts/main/luts';

const FilmProfiles = {
    // Color Negative Films
    color: [
        {
            id: 'original',
            name: 'Original',
            description: 'No film emulation, just adjustments',
            lutUrl: null,
            grain: { intensity: 0.15, size: 1.0, iso: 400 },
            adjustments: { brightness: 0, contrast: 0, saturation: 1.0 }
        },
        {
            id: 'portra160',
            name: 'Kodak Portra 160',
            description: 'Neutral color, fine grain',
            lutUrl: `${LUT_BASE_URL}/negative_new/kodak_portra_160.cube`,
            grain: { intensity: 0.12, size: 1.0, iso: 160 },
            adjustments: { brightness: 0, contrast: 0, saturation: 1.0 }
        },
        {
            id: 'portra400',
            name: 'Kodak Portra 400',
            description: 'Most popular portrait film',
            lutUrl: `${LUT_BASE_URL}/negative_new/kodak_portra_400.cube`,
            grain: { intensity: 0.18, size: 1.2, iso: 400 },
            adjustments: { brightness: 0, contrast: 0, saturation: 1.0 }
        },
        {
            id: 'portra800',
            name: 'Kodak Portra 800',
            description: 'Low light portrait film',
            lutUrl: `${LUT_BASE_URL}/negative_new/kodak_portra_800.cube`,
            grain: { intensity: 0.28, size: 1.4, iso: 800 },
            adjustments: { brightness: 0, contrast: 0, saturation: 1.0 }
        },
        {
            id: 'ektar100',
            name: 'Kodak Ektar 100',
            description: 'High saturation, fine grain',
            lutUrl: `${LUT_BASE_URL}/negative_color/kodak_ektar_100.cube`,
            grain: { intensity: 0.08, size: 0.8, iso: 100 },
            adjustments: { brightness: 0, contrast: 0.05, saturation: 1.1 }
        },
        {
            id: 'gold200',
            name: 'Kodak Gold 200',
            description: 'Warm, nostalgic consumer film',
            lutUrl: `${LUT_BASE_URL}/negative_color/kodak_elite_color_200.cube`,
            grain: { intensity: 0.18, size: 1.2, iso: 200 },
            adjustments: { brightness: 0, contrast: 0, saturation: 1.05 }
        },
        {
            id: 'fuji400h',
            name: 'Fuji Pro 400H',
            description: 'Pastel tones, wedding favorite',
            lutUrl: `${LUT_BASE_URL}/negative_new/fuji_400h.cube`,
            grain: { intensity: 0.15, size: 1.1, iso: 400 },
            adjustments: { brightness: 0, contrast: 0, saturation: 0.95 }
        },
        {
            id: 'fuji160c',
            name: 'Fuji Pro 160C',
            description: 'Cool tones, fine grain',
            lutUrl: `${LUT_BASE_URL}/negative_new/fuji_160c.cube`,
            grain: { intensity: 0.10, size: 0.9, iso: 160 },
            adjustments: { brightness: 0, contrast: 0, saturation: 1.0 }
        },
        {
            id: 'superia400',
            name: 'Fuji Superia 400',
            description: 'Classic consumer film',
            lutUrl: `${LUT_BASE_URL}/negative_old/fuji_superia_400.cube`,
            grain: { intensity: 0.20, size: 1.2, iso: 400 },
            adjustments: { brightness: 0, contrast: 0, saturation: 1.0 }
        },
        {
            id: 'superia800',
            name: 'Fuji Superia X-TRA 800',
            description: 'High ISO, grainy',
            lutUrl: `${LUT_BASE_URL}/negative_color/fuji_superia_x-tra_800.cube`,
            grain: { intensity: 0.30, size: 1.5, iso: 800 },
            adjustments: { brightness: 0, contrast: 0, saturation: 1.0 }
        },
        {
            id: 'agfavista',
            name: 'Agfa Vista 200',
            description: 'Punchy colors, budget film',
            lutUrl: `${LUT_BASE_URL}/negative_color/agfa_vista_200.cube`,
            grain: { intensity: 0.18, size: 1.2, iso: 200 },
            adjustments: { brightness: 0, contrast: 0, saturation: 1.05 }
        },
        {
            id: 'redscale',
            name: 'Lomography Redscale 100',
            description: 'Red/orange shifted',
            lutUrl: `${LUT_BASE_URL}/negative_color/lomography_redscale_100.cube`,
            grain: { intensity: 0.20, size: 1.2, iso: 100 },
            adjustments: { brightness: 0, contrast: 0.05, saturation: 1.1 }
        },
        {
            id: 'cinestill800t',
            name: 'Cinestill 800T',
            description: 'Tungsten, halation glow',
            lutUrl: null,
            grain: { intensity: 0.28, size: 1.5, iso: 800 },
            adjustments: { brightness: 0, contrast: 0.05, saturation: 0.95 },
            customProcess: 'cinestill800t',
            halation: {
                enabled: true,
                intensity: 0.4,
                radius: 20,
                threshold: 200,
                color: [255, 90, 50]
            },
            colorShift: {
                temperature: -25,
                tint: 8,
                shadows: { r: 5, g: 0, b: 15 },
                highlights: { r: 10, g: -5, b: -15 }
            }
        }
    ],

    // Color Slide Films & Fuji Simulations
    slide: [
        {
            id: 'classicchrome',
            name: 'Fuji Classic Chrome',
            description: 'Muted, documentary style',
            lutUrl: `${LUT_BASE_URL}/fujixtransiii/fuji_xtrans_iii_classic_chrome.cube`,
            grain: { intensity: 0.10, size: 0.9, iso: 200 },
            adjustments: { brightness: 0, contrast: 0.05, saturation: 0.9 }
        },
        {
            id: 'astia',
            name: 'Fuji Astia',
            description: 'Soft, portrait-friendly',
            lutUrl: `${LUT_BASE_URL}/fujixtransiii/fuji_xtrans_iii_astia.cube`,
            grain: { intensity: 0.08, size: 0.8, iso: 100 },
            adjustments: { brightness: 0, contrast: 0, saturation: 1.0 }
        },
        {
            id: 'pronegstd',
            name: 'Fuji Pro Neg Std',
            description: 'Soft contrast, portraits',
            lutUrl: `${LUT_BASE_URL}/fujixtransiii/fuji_xtrans_iii_pro_neg_std.cube`,
            grain: { intensity: 0.08, size: 0.8, iso: 160 },
            adjustments: { brightness: 0, contrast: -0.05, saturation: 0.95 }
        },
        {
            id: 'proneghi',
            name: 'Fuji Pro Neg Hi',
            description: 'Higher contrast portraits',
            lutUrl: `${LUT_BASE_URL}/fujixtransiii/fuji_xtrans_iii_pro_neg_hi.cube`,
            grain: { intensity: 0.08, size: 0.8, iso: 160 },
            adjustments: { brightness: 0, contrast: 0.05, saturation: 0.95 }
        },
        {
            id: 'velvia50',
            name: 'Fuji Velvia 50',
            description: 'Extreme saturation, vivid',
            lutUrl: `${LUT_BASE_URL}/fujixtransiii/fuji_xtrans_iii_velvia.cube`,
            grain: { intensity: 0.06, size: 0.7, iso: 50 },
            adjustments: { brightness: 0, contrast: 0.1, saturation: 1.2 }
        },
        {
            id: 'provia',
            name: 'Fuji Provia',
            description: 'Standard, neutral colors',
            lutUrl: `${LUT_BASE_URL}/fujixtransiii/fuji_xtrans_iii_provia.cube`,
            grain: { intensity: 0.08, size: 0.8, iso: 100 },
            adjustments: { brightness: 0, contrast: 0, saturation: 1.0 }
        },
        {
            id: 'kodachrome25',
            name: 'Kodak Kodachrome 25',
            description: 'Legendary, finest grain',
            lutUrl: `${LUT_BASE_URL}/colorslide/kodak_kodachrome_25.cube`,
            grain: { intensity: 0.05, size: 0.6, iso: 25 },
            adjustments: { brightness: 0, contrast: 0.05, saturation: 1.08 }
        },
        {
            id: 'kodachrome64',
            name: 'Kodak Kodachrome 64',
            description: 'Classic warm look',
            lutUrl: `${LUT_BASE_URL}/colorslide/kodak_kodachrome_64.cube`,
            grain: { intensity: 0.07, size: 0.75, iso: 64 },
            adjustments: { brightness: 0, contrast: 0.05, saturation: 1.05 }
        },
        {
            id: 'ektachrome100vs',
            name: 'Kodak Ektachrome 100VS',
            description: 'Vivid saturation',
            lutUrl: `${LUT_BASE_URL}/colorslide/kodak_ektachrome_100vs.cube`,
            grain: { intensity: 0.08, size: 0.85, iso: 100 },
            adjustments: { brightness: 0, contrast: 0.05, saturation: 1.15 }
        }
    ],

    // Black & White Films
    bw: [
        {
            id: 'acros',
            name: 'Fuji Acros',
            description: 'Clean, modern B&W',
            lutUrl: `${LUT_BASE_URL}/fujixtransiii/fuji_xtrans_iii_acros.cube`,
            grain: { intensity: 0.08, size: 0.8, iso: 100 },
            adjustments: { brightness: 0, contrast: 0, saturation: 0 }
        },
        {
            id: 'acrosg',
            name: 'Fuji Acros +G',
            description: 'Green filter, landscapes',
            lutUrl: `${LUT_BASE_URL}/fujixtransiii/fuji_xtrans_iii_acros+g.cube`,
            grain: { intensity: 0.08, size: 0.8, iso: 100 },
            adjustments: { brightness: 0, contrast: 0, saturation: 0 }
        },
        {
            id: 'acrosr',
            name: 'Fuji Acros +R',
            description: 'Red filter, dramatic skies',
            lutUrl: `${LUT_BASE_URL}/fujixtransiii/fuji_xtrans_iii_acros+r.cube`,
            grain: { intensity: 0.08, size: 0.8, iso: 100 },
            adjustments: { brightness: 0, contrast: 0.05, saturation: 0 }
        },
        {
            id: 'mono',
            name: 'Fuji Mono',
            description: 'Standard monochrome',
            lutUrl: `${LUT_BASE_URL}/fujixtransiii/fuji_xtrans_iii_mono.cube`,
            grain: { intensity: 0.10, size: 0.9, iso: 200 },
            adjustments: { brightness: 0, contrast: 0, saturation: 0 }
        },
        {
            id: 'trix400',
            name: 'Kodak Tri-X 400',
            description: 'Classic, high contrast',
            lutUrl: `${LUT_BASE_URL}/negative_new/kodak_tri-x_400.cube`,
            grain: { intensity: 0.35, size: 1.6, iso: 400 },
            adjustments: { brightness: 0, contrast: 0.1, saturation: 0 }
        },
        {
            id: 'tmax100',
            name: 'Kodak T-Max 100',
            description: 'Fine grain, sharp',
            lutUrl: `${LUT_BASE_URL}/bw/kodak_t-max_100.cube`,
            grain: { intensity: 0.10, size: 0.9, iso: 100 },
            adjustments: { brightness: 0, contrast: 0.05, saturation: 0 }
        },
        {
            id: 'tmax400',
            name: 'Kodak T-Max 400',
            description: 'Modern fine grain',
            lutUrl: `${LUT_BASE_URL}/bw/kodak_t-max_400.cube`,
            grain: { intensity: 0.20, size: 1.2, iso: 400 },
            adjustments: { brightness: 0, contrast: 0.05, saturation: 0 }
        },
        {
            id: 'tmax3200',
            name: 'Kodak T-Max 3200',
            description: 'High speed, grainy',
            lutUrl: `${LUT_BASE_URL}/negative_new/kodak_tmax_3200.cube`,
            grain: { intensity: 0.50, size: 2.2, iso: 3200 },
            adjustments: { brightness: 0, contrast: 0.1, saturation: 0 }
        },
        {
            id: 'hp5',
            name: 'Ilford HP5 Plus 400',
            description: 'Versatile, classic',
            lutUrl: `${LUT_BASE_URL}/negative_new/ilford_hp_5.cube`,
            grain: { intensity: 0.28, size: 1.4, iso: 400 },
            adjustments: { brightness: 0, contrast: 0, saturation: 0 }
        },
        {
            id: 'delta3200',
            name: 'Ilford Delta 3200',
            description: 'Heavy grain, moody',
            lutUrl: `${LUT_BASE_URL}/negative_old/ilford_delta_3200.cube`,
            grain: { intensity: 0.55, size: 2.4, iso: 3200 },
            adjustments: { brightness: 0, contrast: 0.1, saturation: 0 }
        },
        {
            id: 'neopan1600',
            name: 'Fuji Neopan 1600',
            description: 'High speed, dramatic',
            lutUrl: `${LUT_BASE_URL}/negative_old/fuji_neopan_1600.cube`,
            grain: { intensity: 0.45, size: 2.0, iso: 1600 },
            adjustments: { brightness: 0, contrast: 0.1, saturation: 0 }
        },
        {
            id: 'sepia',
            name: 'Fuji Sepia',
            description: 'Warm sepia toning',
            lutUrl: `${LUT_BASE_URL}/fujixtransiii/fuji_xtrans_iii_sepia.cube`,
            grain: { intensity: 0.15, size: 1.1, iso: 200 },
            adjustments: { brightness: 0, contrast: 0, saturation: 0 }
        }
    ],

    // Instant Films
    instant: [
        {
            id: 'px70warm',
            name: 'Polaroid PX-70 Warm',
            description: 'Classic warm Polaroid',
            lutUrl: `${LUT_BASE_URL}/instant_consumer/polaroid_px-70_warm.cube`,
            grain: { intensity: 0.25, size: 1.4, iso: 160 },
            adjustments: { brightness: 0, contrast: 0, saturation: 1.0 }
        },
        {
            id: 'px70cold',
            name: 'Polaroid PX-70 Cold',
            description: 'Cool tone Polaroid',
            lutUrl: `${LUT_BASE_URL}/instant_consumer/polaroid_px-70_cold.cube`,
            grain: { intensity: 0.25, size: 1.4, iso: 160 },
            adjustments: { brightness: 0, contrast: 0, saturation: 1.0 }
        },
        {
            id: 'px680warm',
            name: 'Polaroid PX-680 Warm',
            description: 'Warm vintage instant',
            lutUrl: `${LUT_BASE_URL}/instant_consumer/polaroid_px-680_warm.cube`,
            grain: { intensity: 0.28, size: 1.5, iso: 600 },
            adjustments: { brightness: 0, contrast: 0, saturation: 1.0 }
        },
        {
            id: 'px680cold',
            name: 'Polaroid PX-680 Cold',
            description: 'Cool vintage instant',
            lutUrl: `${LUT_BASE_URL}/instant_consumer/polaroid_px-680_cold.cube`,
            grain: { intensity: 0.28, size: 1.5, iso: 600 },
            adjustments: { brightness: 0, contrast: 0, saturation: 1.0 }
        },
        {
            id: 'timezero',
            name: 'Polaroid Time Zero',
            description: 'Expired film look',
            lutUrl: `${LUT_BASE_URL}/instant_consumer/polaroid_time-zero_expired.cube`,
            grain: { intensity: 0.30, size: 1.6, iso: 80 },
            adjustments: { brightness: 0, contrast: 0, saturation: 0.95 }
        },
        {
            id: 'timezerocold',
            name: 'Time Zero Cold',
            description: 'Expired cold tone',
            lutUrl: `${LUT_BASE_URL}/instant_consumer/polaroid_time-zero_expired_cold.cube`,
            grain: { intensity: 0.30, size: 1.6, iso: 80 },
            adjustments: { brightness: 0, contrast: 0, saturation: 0.95 }
        },
        {
            id: 'polaroid664',
            name: 'Polaroid 664',
            description: 'B&W pack film',
            lutUrl: `${LUT_BASE_URL}/bw/polaroid_664.cube`,
            grain: { intensity: 0.25, size: 1.5, iso: 100 },
            adjustments: { brightness: 0, contrast: 0, saturation: 0 }
        },
        {
            id: 'polaroid667',
            name: 'Polaroid 667',
            description: 'B&W high contrast',
            lutUrl: `${LUT_BASE_URL}/bw/polaroid_667.cube`,
            grain: { intensity: 0.30, size: 1.6, iso: 3000 },
            adjustments: { brightness: 0, contrast: 0.1, saturation: 0 }
        }
    ],

    getProfile(id) {
        const allProfiles = [...this.color, ...this.slide, ...this.bw, ...this.instant];
        return allProfiles.find(p => p.id === id);
    },

    getByCategory(category) {
        return this[category] || [];
    },

    getAllCategories() {
        return ['color', 'slide', 'bw', 'instant'];
    }
};

// Make available globally
window.FilmProfiles = FilmProfiles;
