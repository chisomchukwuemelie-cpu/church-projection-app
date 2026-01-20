
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

    // Media Layer Component
    const renderBackground = () => {
        const theme = liveItem.theme;
        if (!theme) return <div style={{ position: 'absolute', inset: 0, background: 'black', zIndex: -1 }} />;

        const style: React.CSSProperties = { position: 'absolute', inset: 0, objectFit: 'cover', width: '100%', height: '100%', zIndex: -1 };

        if (theme.type === 'video') {
            return (
                <video
                    src={theme.value}
                    autoPlay loop muted playsInline
                    style={style}
                />
            );
        }
        if (theme.type === 'image') {
            return <img src={theme.value} alt="bg" style={style} />;
        }
        // Color / Gradient
        return <div style={{ ...style, background: theme.value }} />;
    };

    const overlayStyle: React.CSSProperties = {
        position: 'absolute', inset: 0,
        backgroundColor: `rgba(0,0,0,${liveItem.theme?.overlayOpacity ?? 0.3})`,
        zIndex: 0
    };

    if (liveItem.type === 'logo') {
        return (
            <div style={{ height: '100vh', background: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/logo.png" alt="Logo" style={{ maxHeight: '70vh', maxWidth: '70vw', objectFit: 'contain' }} />
            </div>
        );
    }

    return (
        <div style={{ position: 'relative', height: '100vh', width: '100vw', overflow: 'hidden', color: 'white' }}>
            {/* Layer 0: Media */}
            {renderBackground()}

            {/* Layer 1: Overlay */}
            <div style={overlayStyle} />

            {/* Layer 2: Content */}
            <div className="animate-fade-in" style={{
                position: 'relative', zIndex: 1,
                height: '100%', width: '100%',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                textAlign: 'center', padding: '5vw'
            }}>
                {liveItem.title && (
                    <div style={{
                        fontSize: '3.5vh', marginBottom: '2vh', color: 'rgba(255,255,255,0.8)',
                        fontWeight: 300, letterSpacing: '0.2em', textTransform: 'uppercase'
                    }}>
                        {liveItem.title}
                    </div>
                )}
                <div style={{
                    fontSize: liveItem.content.length > 80 ? '6vh' : '8vh',
                    lineHeight: '1.2', fontWeight: 700,
                    textShadow: '0 4px 20px rgba(0,0,0,0.8)',
                    whiteSpace: 'pre-wrap', fontFamily: "'Outfit', sans-serif"
                }}>
                    {liveItem.content}
                </div>
            </div>
        </div>
    );
};

export default Projector;
