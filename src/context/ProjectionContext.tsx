
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ProjectionItem = {
    type: 'scripture' | 'lyrics' | 'text' | 'image' | 'video';
    content: string; // The main text or URL
    title?: string;  // e.g. "John 3:16" or "Song Title"
    theme?: {
        background?: string; // e.g. "blue", "mountains", "https://..."
        font?: string;
    };
};

type ProjectionContextType = {
    liveItem: ProjectionItem | null;
    setLiveItem: (item: ProjectionItem | null) => void;
    isProjectorWindow: boolean;
};

const ProjectionContext = createContext<ProjectionContextType | undefined>(undefined);

export const ProjectionProvider = ({ children }: { children: ReactNode }) => {
    const [liveItem, setLiveItemState] = useState<ProjectionItem | null>(null);
    const [channel, setChannel] = useState<BroadcastChannel | null>(null);
    const isProjectorWindow = window.location.pathname === '/projector';

    useEffect(() => {
        const bc = new BroadcastChannel('church_channel');
        setChannel(bc);

        bc.onmessage = (event) => {
            if (event.data.type === 'UPDATE_CONTENT') {
                setLiveItemState(event.data.payload);
            }
        };

        return () => {
            bc.close();
        };
    }, []);

    const setLiveItem = (item: ProjectionItem | null) => {
        setLiveItemState(item);
        channel?.postMessage({ type: 'UPDATE_CONTENT', payload: item });
    };

    return (
        <ProjectionContext.Provider value={{ liveItem, setLiveItem, isProjectorWindow }}>
            {children}
        </ProjectionContext.Provider>
    );
};

export const useProjection = () => {
    const context = useContext(ProjectionContext);
    if (!context) {
        throw new Error('useProjection must be used within a ProjectionProvider');
    }
    return context;
};
