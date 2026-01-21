
export type DetectedContent = {
    type: 'scripture' | 'lyrics' | 'noise' | 'quote' | 'command';
    content?: string;
    reference?: string; // For scriptures
    translation?: string; // e.g., KJV, NIV, AMP
    title?: string;     // For custom labels
    command?: 'SHOW_LOGO' | 'CLEAR_SCREEN' | 'SET_THEME';
    visual?: string; // "mountains", "blue", "stars", "particles"
};
