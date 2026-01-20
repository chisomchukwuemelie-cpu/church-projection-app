
export type Theme = {
    type: 'color' | 'image' | 'video';
    value: string;
    name: string;
    overlayOpacity?: number;
};

export const THEMES: Record<string, Theme> = {
    // Colors
    'black': { type: 'color', value: '#000000', name: 'Black' },
    'blue': { type: 'color', value: 'radial-gradient(circle at center, #1e3a8a, #0f172a)', name: 'Deep Blue' },
    'red': { type: 'color', value: 'radial-gradient(circle at center, #7f1d1d, #450a0a)', name: 'Crimson' },
    'green': { type: 'color', value: 'radial-gradient(circle at center, #14532d, #052e16)', name: 'Emerald' },

    // Images
    'mountains': {
        type: 'image',
        value: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1920&auto=format&fit=crop',
        name: 'Mountains',
        overlayOpacity: 0.3
    },
    'stars': {
        type: 'image',
        value: 'https://images.unsplash.com/photo-1538370965046-79c0d6907d47?q=80&w=1920&auto=format&fit=crop',
        name: 'Starry Sky',
        overlayOpacity: 0.2
    },
    'clouds': {
        type: 'image',
        value: 'https://images.unsplash.com/photo-1534088568595-c06b2e666a6a?q=80&w=1920&auto=format&fit=crop',
        name: 'Clouds',
        overlayOpacity: 0.1
    },

    // Videos (Using reliable public hosted samples)
    'particles': {
        type: 'video',
        value: 'https://static.vecteezy.com/system/resources/previews/001/803/159/mp4/abstract-blue-liquid-background-free-video.mp4',
        name: 'Blue Particles',
        overlayOpacity: 0.4
    },
    'lights': {
        type: 'video',
        value: 'https://assets.mixkit.co/videos/preview/mixkit-bokeh-lights-overlay-background-27823-large.mp4',
        name: 'Bokeh Lights',
        overlayOpacity: 0.3
    }
};

export const getThemeByKeyword = (input: string): Theme | null => {
    const normalized = input.toLowerCase().trim();

    // Direct match
    if (THEMES[normalized]) return THEMES[normalized];

    // Partial match (e.g. "blue background" -> matches "blue")
    for (const key of Object.keys(THEMES)) {
        if (normalized.includes(key)) {
            return THEMES[key];
        }
    }

    return null;
};
