
import React from 'react';
import { useProjection } from '../context/ProjectionContext';

const Projector: React.FC = () => {
    const { liveItem } = useProjection();

    React.useEffect(() => {
        console.log("DEBUG: Projector received new liveItem:", liveItem);
    }, [liveItem]);

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
        padding: '8vw', boxSizing: 'border-box',
        overflow: 'hidden',
        transition: 'background 1s ease-in-out'
    };

    return (
        <div style={styles}>
            <div className="animate-fade-in" style={{
                textAlign: 'center',
                maxWidth: '90%',
                display: 'flex',
                flexDirection: 'column',
                gap: '2vh'
            }}>
                {liveItem.title && (
                    <div style={{
                        fontSize: '3.5vh',
                        marginBottom: '1vh',
                        color: 'rgba(255,255,255,0.7)',
                        fontWeight: 300,
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                    }}>
                        {liveItem.title}
                    </div>
                )}
                <div style={{
                    fontSize: liveItem.content.length > 100 ? '7vh' : '9vh',
                    lineHeight: '1.2',
                    fontWeight: '700',
                    textShadow: '0 4px 30px rgba(0,0,0,0.8), 0 2px 10px rgba(0,0,0,0.5)',
                    whiteSpace: 'pre-wrap',
                    fontFamily: "'Outfit', 'Inter', sans-serif",
                    letterSpacing: '-0.01em'
                }}>
                    {liveItem.content}
                </div>
            </div>
        </div>
    );
};

export default Projector;
