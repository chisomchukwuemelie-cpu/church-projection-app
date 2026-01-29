
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
    // Initialize from storage if available (persists on refresh)
    const [liveItem, setLiveItemState] = useState<ProjectionItem | null>(() => {
        try {
            const stored = localStorage.getItem('LUMINA_LIVE_ITEM');
            return stored ? JSON.parse(stored) : null;
        } catch (e) { return null; }
    });

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
            const isActive = now - lastHeartbeat < 12000; // 12 seconds tolerance
            setProjectorActive(isActive);
        }, 2000);
        return () => clearInterval(checkActive);
    }, [lastHeartbeat]);

    useEffect(() => {
        const bc = new BroadcastChannel('church_channel');
        setChannel(bc);

        const handleMessage = (data: any) => {
            if (data.type === 'UPDATE_CONTENT') {
                console.log("[CTX] Received UPDATE_CONTENT via BroadcastChannel");
                setLiveItemState(data.payload);
                if (isProjectorWindow) {
                    bc.postMessage({ type: 'HEARTBEAT_REPLY' });
                    // Sync storage if receiving from another tab (optional, but keeps consistency)
                    localStorage.setItem('LUMINA_LIVE_ITEM', JSON.stringify(data.payload));
                }
            } else if (data.type === 'HEARTBEAT_REPLY') {
                setLastHeartbeat(Date.now());
            } else if (data.type === 'PING') {
                if (isProjectorWindow) bc.postMessage({ type: 'HEARTBEAT_REPLY' });
            }
        };

        bc.onmessage = (event) => handleMessage(event.data);

        // FALLBACK: LocalStorage Event Listener (Cross-tab sync)
        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'LUMINA_LIVE_ITEM' && e.newValue) {
                console.log("[CTX] Received update via LocalStorage");
                try {
                    const newItem = JSON.parse(e.newValue);
                    setLiveItemState(newItem);
                } catch (err) {
                    console.error("Parse error", err);
                }
            }
        };
        window.addEventListener('storage', handleStorage);

        // Regular ping to check connections
        const pingInterval = setInterval(() => {
            bc.postMessage({ type: 'PING' });
        }, 5000);

        return () => {
            bc.close();
            clearInterval(pingInterval);
            window.removeEventListener('storage', handleStorage);
        };
    }, [isProjectorWindow]);

    const setLiveItem = (item: ProjectionItem | null) => {
        addLog(`Pushing content: ${item?.title || 'Clear'}`);
        setLiveItemState(item);

        // 1. Primary: BroadcastChannel
        channel?.postMessage({ type: 'UPDATE_CONTENT', payload: item });

        // 2. Backup: LocalStorage (triggers 'storage' event in other tabs)
        try {
            if (item) {
                localStorage.setItem('LUMINA_LIVE_ITEM', JSON.stringify(item));
            } else {
                localStorage.removeItem('LUMINA_LIVE_ITEM');
            }
            // Manually dispatch a storage event for the current window if needed? 
            // No, storage event only fires on OTHER windows. BC handles current window updates implicitly? 
            // No, setLiveItemState handles current window.
        } catch (e) {
            console.error("Storage Error", e);
        }
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
