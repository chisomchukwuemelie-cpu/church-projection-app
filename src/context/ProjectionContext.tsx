
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';

export type ProjectionItem = {
    type: 'scripture' | 'lyrics' | 'text' | 'image' | 'video' | 'logo';
    content: string; // The main text or URL
    title?: string;  // e.g. "John 3:16" or "Song Title"
    theme?: {
        type: 'color' | 'image' | 'video';
        value: string; // Hex, URL, or CSS gradient
        overlayOpacity?: number; // 0-1
    };
};

type ProjectionContextType = {
    liveItem: ProjectionItem | null;
    setLiveItem: (item: ProjectionItem | null) => void;
    isProjectorWindow: boolean;
    projectorActive: boolean;
    systemLogs: string[];
    addLog: (msg: string) => void;
    checkConnection: () => void;
};

const ProjectionContext = createContext<ProjectionContextType | undefined>(undefined);

export const ProjectionProvider = ({ children }: { children: ReactNode }) => {
    const [liveItem, setLiveItemState] = useState<ProjectionItem | null>(null);
    const [projectorActive, setProjectorActive] = useState(false);
    const [systemLogs, setSystemLogs] = useState<string[]>([]);
    const [channel, setChannel] = useState<BroadcastChannel | null>(null);
    const isProjectorWindow = window.location.pathname === '/projector';

    const [lastHeartbeat, setLastHeartbeat] = useState<number>(0);

    const addLog = useCallback((msg: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setSystemLogs(prev => [`[${timestamp}] ${msg}`, ...prev].slice(0, 10));
    }, []);

    // Monitor heartbeat to decide if projector is active
    useEffect(() => {
        const checkActive = setInterval(() => {
            const now = Date.now();
            const isActive = now - lastHeartbeat < 12000; // 12 seconds tolerance (pings are every 5s)
            setProjectorActive(isActive);
        }, 2000);

        return () => clearInterval(checkActive);
    }, [lastHeartbeat]);

    useEffect(() => {
        const bc = new BroadcastChannel('church_channel');
        setChannel(bc);

        bc.onmessage = (event) => {
            if (event.data.type === 'UPDATE_CONTENT') {
                setLiveItemState(event.data.payload);
                if (isProjectorWindow) {
                    bc.postMessage({ type: 'HEARTBEAT_REPLY' });
                }
            } else if (event.data.type === 'HEARTBEAT_REPLY') {
                setLastHeartbeat(Date.now());
            } else if (event.data.type === 'PING') {
                if (isProjectorWindow) bc.postMessage({ type: 'HEARTBEAT_REPLY' });
            }
        };

        // Regular ping to check connections
        const pingInterval = setInterval(() => {
            bc.postMessage({ type: 'PING' });
        }, 5000);

        return () => {
            bc.close();
            clearInterval(pingInterval);
        };
    }, [isProjectorWindow]);

    const setLiveItem = (item: ProjectionItem | null) => {
        addLog(`Pushing content: ${item?.title || 'Clear'}`);
        setLiveItemState(item);
        channel?.postMessage({ type: 'UPDATE_CONTENT', payload: item });
    };

    const checkConnection = () => {
        addLog("Manual connection check...");
        channel?.postMessage({ type: 'PING' });
    };

    return (
        <ProjectionContext.Provider value={{ liveItem, setLiveItem, isProjectorWindow, projectorActive, systemLogs, addLog, checkConnection }}>
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
