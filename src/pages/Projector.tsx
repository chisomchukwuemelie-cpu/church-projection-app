import React, { useEffect } from 'react';
import { useProjection } from '../context/ProjectionContext';

const Projector: React.FC = () => {
    const { liveItem } = useProjection();

    useEffect(() => {
        console.log("DEBUG: Projector Live Update:", liveItem);
    }, [liveItem]);

    // IDLE STATE (No Live Item)
    if (!liveItem) {
        return (
            <div className="h-screen w-screen bg-black flex flex-col items-center justify-center transition-all duration-1000 ease-in-out">
                <div className="flex flex-col items-center animate-pulse-slow opacity-80">
                    {/* Assuming logo is usable on black, adding filter if needed */}
                    <img
                        src="/logo.png"
                        alt="Logo"
                        className="h-32 w-auto mb-6 object-contain opacity-60"
                    />
                    <h1 className="text-3xl text-slate-500 font-light tracking-[0.3em] uppercase">
                        Welcome
                    </h1>
                </div>
            </div>
        );
    }

    // THEME RENDERING
    const renderBackground = () => {
        const theme = liveItem.theme;
        const commonClasses = "absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out -z-10";

        if (!theme || theme.type === 'color') {
            return (
                <div
                    className={commonClasses}
                    style={{ backgroundColor: theme?.value || 'black' }}
                />
            );
        }

        if (theme.type === 'video') {
            return (
                <video
                    key={theme.value} // Key forces reload on new video
                    src={theme.value}
                    autoPlay loop muted playsInline
                    className={commonClasses}
                />
            );
        }

        if (theme.type === 'image') {
            return (
                <img
                    key={theme.value} // Fade would require double-buffer, this is simple switch
                    src={theme.value}
                    alt="bg"
                    className={commonClasses}
                />
            );
        }
        return <div className="absolute inset-0 bg-black -z-10" />;
    };

    // LOGO OVERRIDE (For "SHOW_LOGO" command)
    if (liveItem.type === 'logo') {
        return (
            <div className="h-screen w-screen bg-black flex items-center justify-center animate-fade-in">
                <img
                    src="/logo.png"
                    alt="Logo"
                    className="max-h-[80vh] max-w-[80vw] object-contain drop-shadow-2xl"
                />
            </div>
        );
    }

    // MAIN CONTENT PROJECTION
    const isScripture = liveItem.type === 'scripture';

    return (
        <div className="relative h-screen w-screen overflow-hidden text-white selection:bg-indigo-500/30">
            {/* Background Layer */}
            {renderBackground()}

            {/* Overlay Layer */}
            <div
                className="absolute inset-0 bg-black transition-opacity duration-700 z-0"
                style={{ opacity: liveItem.theme?.overlayOpacity ?? 0.3 }}
            />

            {/* Content Layer */}
            <div className="relative z-10 h-full w-full flex flex-col items-center justify-center text-center p-[5vw] transition-all duration-500">

                {/* Title / Reference */}
                {liveItem.title && (
                    <div className={`
                        mb-[4vh] text-indigo-100/80 font-light tracking-[0.2em] uppercase
                        transition-all duration-500 transform
                        ${isScripture ? 'text-[4vh]' : 'text-[3vh]'}
                    `}>
                        {liveItem.title}
                    </div>
                )}

                {/* Main Text Body */}
                <div className={`
                    font-bold leading-tight drop-shadow-xl whitespace-pre-wrap
                    transition-all duration-500 ease-out
                    ${liveItem.content.length > 150 ? 'text-[5vh]' : liveItem.content.length > 80 ? 'text-[6vh]' : 'text-[8vh]'}
                `}>
                    {liveItem.content}
                </div>

            </div>
        </div>
    );
};

export default Projector;
