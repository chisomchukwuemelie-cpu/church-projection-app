
export type Theme = {
    id: string;
    type: 'color' | 'image' | 'video';
    value: string;
    name: string;
    overlayOpacity?: number;
};

const DEFAULT_THEMES: Record<string, Theme> = {
    // Colors
    'black': { id: 'black', type: 'color', value: '#000000', name: 'Black' },
    'blue': { id: 'blue', type: 'color', value: 'radial-gradient(circle at center, #1e3a8a, #0f172a)', name: 'Deep Blue' },
    'red': { id: 'red', type: 'color', value: 'radial-gradient(circle at center, #7f1d1d, #450a0a)', name: 'Crimson' },
    'green': { id: 'green', type: 'color', value: 'radial-gradient(circle at center, #14532d, #052e16)', name: 'Emerald' },

    // Images
    'mountains': {
        id: 'mountains',
        type: 'image',
        value: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1920&auto=format&fit=crop',
        name: 'Mountains',
        overlayOpacity: 0.3
    },
    'stars': {
        id: 'stars',
        type: 'image',
        value: 'https://images.unsplash.com/photo-1538370965046-79c0d6907d47?q=80&w=1920&auto=format&fit=crop',
        name: 'Starry Sky',
        overlayOpacity: 0.2
    },

    // Videos
    'particles': {
        id: 'particles',
        type: 'video',
        value: 'https://static.vecteezy.com/system/resources/previews/001/803/159/mp4/abstract-blue-liquid-background-free-video.mp4',
        name: 'Blue Particles',
        overlayOpacity: 0.4
    },
    'lights': {
        id: 'lights',
        type: 'video',
        value: 'https://assets.mixkit.co/videos/preview/mixkit-bokeh-lights-overlay-background-27823-large.mp4',
        name: 'Bokeh Lights',
        overlayOpacity: 0.3
    }
};

const STORAGE_KEY = 'LUMINA_USER_THEMES';

export const getUserThemes = (): Theme[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
};

export const getAllThemes = (): Theme[] => {
    return [...Object.values(DEFAULT_THEMES), ...getUserThemes()];
};

export const saveTheme = (theme: Theme) => {
    const current = getUserThemes();
    const existingIndex = current.findIndex(t => t.id === theme.id);

    if (existingIndex >= 0) {
        current[existingIndex] = theme;
    } else {
        current.push(theme);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
};

export const deleteTheme = (id: string) => {
    const current = getUserThemes().filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
};

export const getThemeByKeyword = (input: string): Theme | null => {
    const normalized = input.toLowerCase().trim();
    const all = getAllThemes();

    // Direct match
    const direct = all.find(t => t.id.toLowerCase() === normalized || t.name.toLowerCase() === normalized);
    if (direct) return direct;

    // Partial match
    for (const theme of all) {
        if (normalized.includes(theme.id.toLowerCase()) || normalized.includes(theme.name.toLowerCase())) {
            return theme;
        }
    }

    return null;
};

// Backwards compatibility for the constant (read-only snapshots)
export const THEMES = DEFAULT_THEMES;
