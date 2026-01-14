
import React from 'react';
import { useProjection } from '../context/ProjectionContext';

const Projector: React.FC = () => {
    const { liveItem } = useProjection();

    // IDLE STATE
    if (!liveItem) {
        return (
            <div style={{
                height: '100vh', width: '100vw',
                backgroundColor: 'black', color: '#666',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                cursor: 'none',
                fontFamily: 'sans-serif'
            }}>
                <h1 style={{ fontSize: '3rem', margin: 0, opacity: 0.5 }}>Lumina</h1>
                <p style={{ letterSpacing: '2px', textTransform: 'uppercase', opacity: 0.3 }}>Projection Ready</p>
            </div>
        );
    }

    // Theme Mapping
    const getBackground = (bg?: string) => {
        switch (bg) {
            case 'BG_BLUE': return 'radial-gradient(circle at center, #1e3a8a, #0f172a)';
            case 'BG_MOUNTAINS': return 'url("https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop") center/cover no-repeat';
            default: return 'black'; // Default black
        }
    };

    const styles: React.CSSProperties = {
        height: '100vh', width: '100vw',
        background: getBackground(liveItem.theme?.background),
        color: 'white',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '5vw', boxSizing: 'border-box',
        overflow: 'hidden',
        transition: 'background 1s ease-in-out'
    };

    return (
        <div style={styles}>
            <div className="animate-fade-in" style={{ textAlign: 'center', maxWidth: '80%' }}>
                {liveItem.title && (
                    <h2 style={{
                        fontSize: '3vw', marginBottom: '2vh',
                        color: 'rgba(255,255,255,0.8)', fontWeight: 300,
                        letterSpacing: '0.05em'
                    }}>
                        {liveItem.title}
                    </h2>
                )}
                <h1 style={{
                    fontSize: '5vw', lineHeight: '1.2',
                    fontWeight: '600', textShadow: '0 4px 20px rgba(0,0,0,0.5)',
                    whiteSpace: 'pre-wrap', fontFamily: 'Outfit, sans-serif'
                }}>
                    {liveItem.content}
                </h1>
            </div>
        </div>
    );
};

export default Projector;
