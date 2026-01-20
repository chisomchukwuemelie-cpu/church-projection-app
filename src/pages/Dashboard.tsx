import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useProjection } from '../context/ProjectionContext';
import type { ProjectionItem } from '../context/ProjectionContext';
import AudioProcessor from '../components/AudioProcessor';
import { Monitor, Play, Type, Image as ImageIcon, Trash2, Palette, Settings, Mic, Search, Music, Book, Plus } from 'lucide-react';
import type { DetectedContent } from '../services/gemini';
import { searchBible, type BibleVerse } from '../services/BibleService';
import { getSongs, saveSong, deleteSong, type Song } from '../services/SongService';
import { THEMES, getThemeByKeyword } from '../services/ThemeService';

const Dashboard: React.FC = () => {
    const { setLiveItem, liveItem, projectorActive, systemLogs, addLog, checkConnection } = useProjection();

    // -- STATE --
    const [leftTab, setLeftTab] = useState<'STREAM' | 'BIBLE' | 'SONGS'>('STREAM');
    const [streamHistory, setStreamHistory] = useState<DetectedContent[]>([]);
    const [stagedItem, setStagedItem] = useState<ProjectionItem | null>(null);
    // THEME STATE: Now stores full object
    const [selectedTheme, setSelectedTheme] = useState<{ type: 'color' | 'image' | 'video', value: string }>({ type: 'color', value: 'black' });

    const [autoStage, setAutoStage] = useState(true);
    const [autoLive, setAutoLive] = useState(true);

    // Settings Ref for stale closure prevention (critical for Voice AI)
    const settingsRef = useRef({ autoLive, autoStage, selectedTheme });
    useEffect(() => {
        settingsRef.current = { autoLive, autoStage, selectedTheme };
    }, [autoLive, autoStage, selectedTheme]);

    // -- BIBLE STATE --
    const [bibleQuery, setBibleQuery] = useState('');
    const [bibleResults, setBibleResults] = useState<BibleVerse[]>([]);
    const [isSearchingBible, setIsSearchingBible] = useState(false);
    const [selectedTranslation, setSelectedTranslation] = useState('KJV'); // Default to KJV

    // Song State
    const [songs, setSongs] = useState<Song[]>([]);
    const [isAddingSong, setIsAddingSong] = useState(false);
    const [newSong, setNewSong] = useState({ title: '', lyrics: '' });

    const streamEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll stream
    useEffect(() => {
        streamEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [streamHistory]);

    // Load songs
    useEffect(() => {
        setSongs(getSongs());
        // Initial Ping
        checkConnection();
        // Warning about separate windows
        addLog("Sys: For projection to work, open Projector in the SAME browser context.");
    }, []);

    // -- HANDLERS --

    const promoteDetectedToStage = useCallback((detected: DetectedContent) => {
        let item: ProjectionItem = {
            type: 'text',
            content: detected.content || '',
            title: detected.translation ? `${detected.reference} (${detected.translation})` : (detected.reference || 'Text'),
            theme: settingsRef.current.selectedTheme // Direct object copy
        };

        if (detected.type === 'lyrics') {
            item.type = 'lyrics';
            item.title = 'Song Lyrics';
        } else if (detected.type === 'scripture') {
            item.type = 'scripture';
            const refTitle = detected.reference || 'Scripture';
            item.title = detected.translation ? `${refTitle} (${detected.translation})` : refTitle;
        }

        setStagedItem(item);
    }, [setStagedItem]); // Only depends on setStagedItem and settingsRef.current.selectedTheme (via ref)

    const lastProcessedRef = useRef<string | null>(null);
    const lockTimeRef = useRef<number>(0);

    const handleContentDetected = useCallback(async (detected: DetectedContent) => {
        const { autoLive: currentAutoLive, autoStage: currentAutoStage, selectedTheme: currentTheme } = settingsRef.current;

        // 0. DEDUPLICATION
        const signature = (detected.reference || (detected.content ? detected.content.substring(0, 30) : '')).toLowerCase();
        const now = Date.now();

        if (signature && signature === lastProcessedRef.current && (now - lockTimeRef.current < 2000)) {
            console.log("[DASH] Debounce: Locked for 2s", signature);
            return;
        }

        lastProcessedRef.current = signature;
        lockTimeRef.current = now;

        const translation = detected.translation || selectedTranslation; // Use detected or dashboard default
        const displayRef = detected.reference ? `${detected.reference}${translation !== 'KJV' ? ` (${translation})` : ''}` : '';

        addLog(`AI Detect: ${detected.type.toUpperCase()} ${displayRef}`);

        if (detected.type === 'noise') {
            addLog("AI Filter: Speech classified as noise/patter.");
            return;
        }

        // 1. ADD TO HISTORY (Placeholder/Incomplete)
        setStreamHistory(prev => [...prev, detected].slice(-30));

        // PROACTIVE FEEDBACK: Show "Fetching..." on the Stage immediately if Auto-Stage is ON
        if (currentAutoStage && detected.type === 'scripture' && !detected.content) {
            addLog(`Proactive Stage: Preparing ${displayRef}`);
            setStagedItem({
                type: 'scripture',
                content: `Fetching ${displayRef}...`,
                title: displayRef,
                theme: currentTheme
            });
        }

        // 2. SYSTEM COMMANDS
        if (detected.type === 'command') {
            if (detected.command === 'SHOW_LOGO') {
                addLog("Command: Showing Logo");
                setLiveItem({ type: 'logo', content: 'LOGO', title: 'Church Logo' });
            } else if (detected.command === 'CLEAR_SCREEN') {
                addLog("Command: Clearing Screen");
                setLiveItem(null);
            } else if (detected.command === 'SET_THEME' && detected.visual) {
                const matchedTheme = getThemeByKeyword(detected.visual);
                if (matchedTheme) {
                    addLog(`Theme Command: Setting theme to ${matchedTheme.name}`);
                    updateStagedTheme(matchedTheme); // Use helper to update Ref + State

                    // If Auto-Live is ON, update live item's theme too (if exists)
                    if (currentAutoLive && liveItem) {
                        setLiveItem({ ...liveItem, theme: matchedTheme });
                    }
                } else {
                    addLog(`Theme Command: Could not find theme for "${detected.visual}"`);
                }
            }
            return;
        }

        // 3. SEARCH SONGS (Autofill Lyrics)
        if (detected.type === 'lyrics' && detected.content && detected.content.length > 5) {
            import('../services/SongService').then(({ searchSongs }) => {
                const matches = searchSongs(detected.content!);
                if (matches.length > 0) {
                    const bestMatch = matches[0];
                    console.log("[DASH] Song Match:", bestMatch.title);

                    // Update detection to be the full song
                    detected.title = bestMatch.title;
                    detected.content = bestMatch.lyrics;
                    detected.type = 'lyrics'; // Keep type

                    addLog(`Song Found: ${bestMatch.title}`);

                    // Update history logic
                    setStreamHistory(prev => prev.map(item =>
                        (item.content === detected.content || item.content === signature)
                            ? { ...item, content: bestMatch.lyrics, title: bestMatch.title }
                            : item
                    ));

                    // Auto-Stage/Live logic (re-run since content changed)
                    if (currentAutoStage) {
                        promoteDetectedToStage(detected);
                    }
                    if (currentAutoLive) {
                        setLiveItem({
                            type: 'lyrics',
                            content: bestMatch.lyrics,
                            title: bestMatch.title,
                            theme: currentTheme
                        });
                    }
                }
            });
        }

        // 4. BIBLE QUOTE SEARCH
        if (detected.type === 'quote' && detected.content && !detected.reference) {
            addLog(`Searching Bible for: "${detected.content.substring(0, 20)}..."`);
            try {
                const verses = await searchBible(detected.content, translation); // Pass translation
                if (verses && verses.length > 0) {
                    detected.type = 'scripture';
                    detected.reference = verses[0].reference;
                    detected.content = verses.map(v => v.text).join(' ');
                    detected.translation = translation;

                    addLog(`Quote Match Found: ${detected.reference}`);

                    // Update UI only when content is READY
                    setStreamHistory(prev => prev.map(item =>
                        (item.type === 'quote' && item.content === lastProcessedRef.current)
                            ? { ...item, type: 'scripture', reference: detected.reference, content: detected.content, translation: translation }
                            : item
                    ));

                    if (currentAutoStage) promoteDetectedToStage(detected);
                    if (currentAutoLive) {
                        const liveTitle = detected.translation ? `${detected.reference} (${detected.translation})` : detected.reference;
                        addLog(`Live (Auto): ${liveTitle}`);
                        setLiveItem({
                            type: 'scripture', content: detected.content,
                            title: liveTitle, theme: currentTheme
                        });
                    }
                    return;
                }
            } catch (e: any) {
                addLog(`Quote Search Error: ${e.message}`);
            }
        }

        // 5. BIBLE FETCHING (Reference to Text)
        if (detected.type === 'scripture' && (!detected.content || detected.content.length < 10) && detected.reference) {
            addLog(`Fetching Bible: ${displayRef}`);
            try {
                const verses = await searchBible(detected.reference, translation); // Pass translation
                if (verses && verses.length > 0) {
                    const fullText = verses.map(v => v.text).join(' ');
                    const finalRef = detected.reference;
                    const finalTitle = translation ? `${finalRef} (${translation})` : finalRef;

                    addLog(`Success: Found ${verses.length} verses for ${finalRef}. Updating UI.`);

                    // Update History State
                    setStreamHistory(prev => prev.map(item =>
                        (item.reference === detected.reference) ? { ...item, content: fullText, translation: translation } : item
                    ));

                    // FORCE UI UPDATE: Update staged and live immediately
                    if (currentAutoStage) {
                        addLog(`Staging (Final): ${finalRef}`);
                        setStagedItem({
                            type: 'scripture',
                            content: fullText,
                            title: finalTitle,
                            theme: currentTheme
                        });
                    }

                    if (currentAutoLive) {
                        addLog(`Live (Final): ${finalRef}`);
                        setLiveItem({
                            type: 'scripture',
                            content: fullText,
                            title: finalTitle,
                            theme: currentTheme
                        });
                    }
                    return;
                } else {
                    addLog(`Bible API returned no text for ${detected.reference}`);
                    if (currentAutoStage) {
                        setStagedItem(prev => {
                            if ((prev?.title === displayRef || prev?.title === detected.reference) && prev) {
                                return { ...prev, content: 'Text not available.' };
                            }
                            return prev;
                        });
                    }
                }
            } catch (e: any) {
                addLog(`Bible Fetch Error: ${e.message}`);
                if (currentAutoStage) {
                    setStagedItem(prev => {
                        if ((prev?.title === displayRef || prev?.title === detected.reference) && prev) {
                            return { ...prev, content: 'Error fetching text.' };
                        }
                        return prev;
                    });
                }
            }
        }

        // 6. IMMEDIATE PUSH (Lyrics, or already-filled things)
        if (detected.content) {
            let title = detected.reference || 'Text';

            if (detected.type === 'lyrics') {
                title = detected.title || 'Song Lyrics'; // Use song title if found
            } else if (detected.type === 'quote') {
                title = 'Bible Quote';
            } else if (detected.type === 'scripture') {
                title = detected.translation ? `${detected.reference} (${detected.translation})` : detected.reference!;
            }

            if (currentAutoStage) promoteDetectedToStage(detected);
            if (currentAutoLive) {
                addLog(`Live (Immediate): ${title}`);
                setLiveItem({
                    type: (detected.type || 'text') as any, content: detected.content,
                    title: title, theme: currentTheme
                });
            }
        }
    }, [setLiveItem, setStreamHistory, setStagedItem, promoteDetectedToStage, addLog, selectedTranslation, liveItem]); // Added liveItem dependency

    const clearHistory = () => {
        setStreamHistory([]);
    };

    const handleBibleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bibleQuery.trim()) return;
        setIsSearchingBible(true);
        const results = await searchBible(bibleQuery, selectedTranslation); // Pass selectedTranslation
        setBibleResults(results);
        setIsSearchingBible(false);
    };

    const handleAddSong = () => {
        if (!newSong.title || !newSong.lyrics) return;
        const song: Song = {
            id: Date.now().toString(),
            ...newSong
        };
        saveSong(song);
        setSongs(getSongs());
        setIsAddingSong(false);
        setNewSong({ title: '', lyrics: '' });
    };

    const handleDeleteSong = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        deleteSong(id);
        setSongs(getSongs());
    };

    const promoteToStage = (content: string, title: string, type: ProjectionItem['type']) => {
        setStagedItem({
            type,
            content,
            title,
            theme: selectedTheme
        });
    };

    const updateStagedTheme = (theme: { type: 'color' | 'image' | 'video', value: string }) => {
        setSelectedTheme(theme);
        if (stagedItem) {
            setStagedItem({
                ...stagedItem,
                theme: theme
            });
        }
    };

    const goLive = () => {
        if (stagedItem) {
            console.log("DEBUG: Going Live with:", stagedItem.title);
            setLiveItem(stagedItem);
        } else {
            console.warn("DEBUG: goLive called but stagedItem is null");
        }
    };

    const openProjector = () => {
        window.open('/projector', 'ProjectorWindow', 'width=1280,height=720,menubar=no,toolbar=no');
    };

    return (
        <div className="dashboard-container" style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#020617', color: '#f8fafc' }}>
            {/* HEADER */}
            <header style={{
                height: '64px', borderBottom: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px',
                background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)', zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Monitor size={18} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 800, letterSpacing: '-0.02em' }}>Lumina <span style={{ color: '#6366f1' }}>Pro</span></h1>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button onClick={openProjector} className="glass-panel action-button" style={{
                        padding: '8px 20px', borderRadius: '8px', color: 'white', cursor: 'pointer',
                        display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.9rem', fontWeight: 600,
                        backgroundColor: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.3)'
                    }}>
                        <Monitor size={16} /> Open Projector
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
                        onClick={() => {
                            checkConnection();
                            addLog("Sending Heartbeat Ping...");
                            if (!projectorActive) {
                                // If offline, try to wake it up visually
                                setLiveItem({ type: 'text', content: 'SYNC SIGNAL', title: 'CONNECTION CHECK', theme: { type: 'color', value: '#3b82f6' } });
                            }
                        }}
                    >
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: projectorActive ? '#10b981' : '#ef4444', boxShadow: projectorActive ? '0 0 10px #10b981' : '0 0 10px #ef4444', transition: 'all 0.3s' }} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: projectorActive ? '#f1f5f9' : '#fca5a5' }}>
                            {projectorActive ? 'PROJECTOR ONLINE' : 'OFFLINE (CLICK TO PING)'}
                        </span>
                    </div>

                    <button className="glass-panel" style={{ padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>
                        <Settings size={18} color="#94a3b8" />
                    </button>
                    {/* DEBUG BUTTON */}
                    <button
                        onClick={() => handleContentDetected({ type: 'scripture', reference: 'Genesis 1:1', translation: 'KJV' })}
                        style={{ padding: '4px 8px', fontSize: '0.6rem', background: '#334155', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: 0.5 }}
                    >
                        TEST GEN 1:1
                    </button>
                </div>
            </header>

            {/* MAIN 3-PANE LAYOUT */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '320px 1fr 320px', overflow: 'hidden' }}>

                {/* LEFT: STREAM / BIBLE / SONGS */}
                <div style={{ borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', background: '#020617' }}>

                    {/* Tabs */}
                    <div style={{ display: 'flex', padding: '12px', gap: '4px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <button onClick={() => setLeftTab('STREAM')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: leftTab === 'STREAM' ? 'rgba(99, 102, 241, 0.2)' : 'transparent', color: leftTab === 'STREAM' ? '#818cf8' : '#64748b', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', transition: 'all 0.2s' }}>
                            <Mic size={16} /> <span style={{ fontSize: '0.65rem' }}>STREAM</span>
                        </button>
                        <button onClick={() => setLeftTab('BIBLE')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: leftTab === 'BIBLE' ? 'rgba(99, 102, 241, 0.2)' : 'transparent', color: leftTab === 'BIBLE' ? '#818cf8' : '#64748b', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', transition: 'all 0.2s' }}>
                            <Book size={16} /> <span style={{ fontSize: '0.65rem' }}>BIBLE</span>
                        </button>
                        <button onClick={() => setLeftTab('SONGS')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: leftTab === 'SONGS' ? 'rgba(99, 102, 241, 0.2)' : 'transparent', color: leftTab === 'SONGS' ? '#818cf8' : '#64748b', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', transition: 'all 0.2s' }}>
                            <Music size={16} /> <span style={{ fontSize: '0.65rem' }}>SONGS</span>
                        </button>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                        {leftTab === 'STREAM' && (
                            <>
                                <AudioProcessor onContentDetected={handleContentDetected} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0 12px 0' }}>
                                    <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.1em', margin: 0 }}>Detected Stream</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <button
                                            onClick={() => setAutoStage(!autoStage)}
                                            style={{
                                                background: autoStage ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                                                border: `1px solid ${autoStage ? '#10b981' : '#334155'}`,
                                                color: autoStage ? '#10b981' : '#475569',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                fontSize: '0.65rem',
                                                cursor: 'pointer',
                                                fontWeight: 600
                                            }}
                                        >
                                            AUTO-STAGE: {autoStage ? 'ON' : 'OFF'}
                                        </button>
                                        <button
                                            onClick={() => setAutoLive(!autoLive)}
                                            style={{
                                                background: autoLive ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                                                border: `1px solid ${autoLive ? '#ef4444' : '#334155'}`,
                                                color: autoLive ? '#ef4444' : '#475569',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                fontSize: '0.65rem',
                                                cursor: 'pointer',
                                                fontWeight: 600
                                            }}
                                        >
                                            AUTO-LIVE: {autoLive ? 'ON' : 'OFF'}
                                        </button>
                                        <button onClick={clearHistory} style={{ background: 'transparent', border: 'none', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}>
                                            <Trash2 size={12} /> Clear
                                        </button>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {streamHistory.map((item, idx) => {
                                        const title = item.reference || (item.type === 'lyrics' ? 'Song Lyrics' : 'Text');
                                        const displayTitle = item.translation ? `${title} (${item.translation})` : title;
                                        const isLive = liveItem && liveItem.content === item.content; // simplified check

                                        return (
                                            <div key={idx}
                                                onClick={() => promoteDetectedToStage(item)}
                                                className="animate-fade-in"
                                                style={{
                                                    padding: '12px', backgroundColor: isLive ? 'rgba(99, 102, 241, 0.1)' : 'rgba(30, 41, 59, 0.5)',
                                                    borderRadius: '10px', cursor: 'pointer',
                                                    border: `1px solid ${isLive ? '#6366f1' : 'rgba(255,255,255,0.05)'}`,
                                                    borderLeft: `4px solid ${item.type === 'scripture' ? '#3b82f6' : '#10b981'}`,
                                                    transition: 'all 0.2s',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            {item.type.toUpperCase()}
                                                            {isLive && <span style={{ backgroundColor: '#ef4444', color: 'white', padding: '1px 4px', borderRadius: '3px', fontSize: '0.5rem', fontWeight: 800 }}>LIVE</span>}
                                                        </span>
                                                        <span style={{ color: '#94a3b8' }}>{displayTitle}</span>
                                                    </div>
                                                    <div style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.4', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                                                        {item.content || (item.type === 'scripture' ? "Content missing. Try re-fetching..." : "...")}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
                                                    {item.type === 'scripture' && !item.content && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (item.reference) handleContentDetected({ type: 'scripture', reference: item.reference, translation: item.translation });
                                                            }}
                                                            style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid #fbbf24', color: '#fbbf24', padding: '4px', borderRadius: '4px', cursor: 'pointer' }}
                                                            title="Re-fetch"
                                                        >
                                                            <Search size={14} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setLiveItem({ type: (item.type || 'text') as any, content: item.content || '', title: displayTitle, theme: selectedTheme });
                                                        }}
                                                        disabled={!item.content}
                                                        style={{
                                                            background: isLive ? 'white' : 'rgba(99, 102, 241, 0.2)',
                                                            border: `1px solid ${isLive ? 'white' : '#6366f1'}`,
                                                            color: isLive ? '#6366f1' : '#6366f1',
                                                            padding: '4px', borderRadius: '4px', cursor: item.content ? 'pointer' : 'not-allowed',
                                                            opacity: item.content ? 1 : 0.5
                                                        }}
                                                        title="Go Live"
                                                    >
                                                        <Play size={14} fill="currentColor" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={streamEndRef} />
                                </div>
                            </>
                        )}

                        {
                            leftTab === 'BIBLE' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <form onSubmit={handleBibleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <select
                                                value={selectedTranslation}
                                                onChange={(e) => setSelectedTranslation(e.target.value)}
                                                style={{
                                                    padding: '8px', borderRadius: '6px', background: 'rgba(30, 41, 59, 0.5)',
                                                    border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '0.8rem',
                                                    cursor: 'pointer', outline: 'none'
                                                }}
                                            >
                                                <option value="KJV" style={{ color: 'black' }}>KJV</option>
                                                <option value="WEB" style={{ color: 'black' }}>WEB</option>
                                                <option value="NIV" style={{ color: 'black' }}>NIV</option>
                                                <option value="AMP" style={{ color: 'black' }}>AMP</option>
                                                <option value="MSG" style={{ color: 'black' }}>MSG</option>
                                                <option value="NKJV" style={{ color: 'black' }}>NKJV</option>
                                                <option value="ESV" style={{ color: 'black' }}>ESV</option>
                                                <option value="NLT" style={{ color: 'black' }}>NLT</option>
                                            </select>
                                            <input
                                                type="text"
                                                placeholder="John 3:16"
                                                value={bibleQuery}
                                                onChange={(e) => setBibleQuery(e.target.value)}
                                                style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '0.9rem' }}
                                            />
                                            <button type="submit" disabled={isSearchingBible} style={{ padding: '8px', borderRadius: '6px', background: '#6366f1', border: 'none', color: 'white', cursor: 'pointer' }}>
                                                <Search size={18} />
                                            </button>
                                        </div>
                                        <div style={{ fontSize: '0.65rem', color: '#64748b', fontStyle: 'italic' }}>
                                            Note: Some translations (NIV, AMP, etc.) may be limited by copyright and default to KJV if unavailable via public API.
                                        </div>
                                    </form>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {isSearchingBible && <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>Searching...</div>}
                                        {bibleResults.map((verse, idx) => (
                                            <div key={idx}
                                                onClick={() => promoteToStage(verse.text, verse.reference, 'scripture')}
                                                style={{ padding: '12px', backgroundColor: 'rgba(30, 41, 59, 0.5)', borderRadius: '10px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)', borderLeft: '4px solid #3b82f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                            >
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '6px', fontWeight: 600 }}>{verse.reference}</div>
                                                    <div style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.4' }}>{verse.text}</div>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setLiveItem({ type: 'scripture', content: verse.text, title: verse.reference, theme: selectedTheme });
                                                    }}
                                                    style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', color: '#3b82f6', padding: '4px', borderRadius: '4px', cursor: 'pointer', marginLeft: '8px' }}
                                                    title="Go Live"
                                                >
                                                    <Play size={14} fill="currentColor" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    {
                                        !isSearchingBible && bibleResults.length === 0 && bibleQuery && (
                                            <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#475569', marginTop: '20px' }}>No results found</div>
                                        )
                                    }
                                </div>
                            )}

                        {
                            leftTab === 'SONGS' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <button onClick={() => setIsAddingSong(!isAddingSong)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '8px', border: '1px dashed #334155', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}>
                                        <Plus size={16} /> Add New Song
                                    </button>

                                    {isAddingSong && (
                                        <div style={{ padding: '12px', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '10px', border: '1px solid #6366f133', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <input
                                                type="text"
                                                placeholder="Song Title"
                                                value={newSong.title}
                                                onChange={(e) => setNewSong({ ...newSong, title: e.target.value })}
                                                style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: '4px', color: 'white' }}
                                            />
                                            <textarea
                                                placeholder="Lyrics..."
                                                rows={4}
                                                value={newSong.lyrics}
                                                onChange={(e) => setNewSong({ ...newSong, lyrics: e.target.value })}
                                                style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: '4px', color: 'white', resize: 'vertical' }}
                                            />
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={handleAddSong} style={{ flex: 1, padding: '8px', background: '#6366f1', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Save</button>
                                                <button onClick={() => setIsAddingSong(false)} style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '4px', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem' }}>Cancel</button>
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {songs.map(song => (
                                            <div key={song.id}
                                                onClick={() => promoteToStage(song.lyrics, song.title, 'lyrics')}
                                                style={{
                                                    padding: '12px',
                                                    backgroundColor: 'rgba(30, 41, 59, 0.8)',
                                                    borderRadius: '10px',
                                                    cursor: 'pointer',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    borderLeft: '4px solid #10b981',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    position: 'relative',
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                <div style={{ flex: 1, zIndex: 1 }}>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9' }}>{song.title}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{song.lyrics}</div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '4px', zIndex: 2 }}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setLiveItem({ type: 'lyrics', content: song.lyrics, title: song.title, theme: selectedTheme });
                                                        }}
                                                        style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#10b981', padding: '4px', borderRadius: '4px', cursor: 'pointer' }}
                                                        title="Go Live"
                                                    >
                                                        <Play size={14} fill="currentColor" />
                                                    </button>
                                                    <button onClick={(e) => handleDeleteSong(song.id, e)} style={{ background: 'transparent', border: 'none', color: '#475569', cursor: 'pointer', padding: '4px' }}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        }
                    </div>

                    {/* SYSTEM LOG PANEL */}
                    < div className="glass-panel" style={{ marginTop: 'auto', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', maxHeight: '200px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <h3 style={{ margin: 0, fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>System Console</h3>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                            {systemLogs.length === 0 ? (
                                <div style={{ color: '#334155', fontStyle: 'italic' }}>Listening for events...</div>
                            ) : (
                                systemLogs.map((log, i) => (
                                    <div key={i} style={{ color: log.includes('Error') ? '#f87171' : (log.includes('Live') || log.includes('Push')) ? '#34d399' : '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '2px' }}>
                                        {log}
                                    </div>
                                ))
                            )}
                        </div>
                    </div >
                </div >

                {/* CENTER: STAGING (Editor) */}
                < div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#0f172a', position: 'relative' }}>
                    <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.5)' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="glass-panel" style={{ padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Type size={14} /> Text
                            </button>
                            <button className="glass-panel" style={{ padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <ImageIcon size={14} /> Media
                            </button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Palette size={16} color="#64748b" />
                            <div style={{ display: 'flex', gap: '6px' }}>
                                {Object.values(THEMES).slice(0, 5).map(theme => (
                                    <button
                                        key={theme.name}
                                        onClick={() => updateStagedTheme(theme)}
                                        style={{
                                            width: '24px', height: '24px', borderRadius: '4px',
                                            background: theme.type === 'color' ? theme.value : (theme.type === 'image' ? `url("${theme.value}") center/cover` : '#3b82f6'),
                                            border: selectedTheme.value === theme.value ? '2px solid #6366f1' : '1px solid #334155',
                                            cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}
                                        title={theme.name}
                                    >
                                        {theme.type === 'video' && <Play size={10} color="white" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)' }}>
                        {stagedItem ? (
                            <div style={{
                                width: '100%', maxWidth: '700px', aspectRatio: '16/9',
                                background: stagedItem.theme?.type === 'image' || stagedItem.theme?.type === 'video' ? 'black' : (stagedItem.theme?.value || 'black'),
                                backgroundImage: stagedItem.theme?.type === 'image' ? `url("${stagedItem.theme.value}")` : undefined,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                borderRadius: '12px', padding: '48px', display: 'flex', flexDirection: 'column',
                                justifyContent: 'center', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                                position: 'relative', overflow: 'hidden'
                            }}>
                                {stagedItem.theme?.type === 'video' && (
                                    <video src={stagedItem.theme.value} autoPlay loop muted style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, opacity: 0.6 }} />
                                )}
                                <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
                                    {stagedItem.title && <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', marginBottom: '16px', fontWeight: 300, letterSpacing: '2px' }}>{stagedItem.title.toUpperCase()}</div>}
                                    <textarea
                                        value={stagedItem.content}
                                        onChange={(e) => setStagedItem({ ...stagedItem, content: e.target.value })}
                                        style={{
                                            background: 'transparent', border: 'none', color: 'white',
                                            fontSize: '1.75rem', textAlign: 'center', width: '100%', resize: 'none',
                                            fontFamily: 'inherit', outline: 'none', lineHeight: '1.4',
                                            height: 'auto', minHeight: '100px'
                                        }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', color: '#334155' }}>
                                <div style={{ width: '200px', height: '112px', border: '2px dashed #1e293b', borderRadius: '8px' }} />
                                <div style={{ fontSize: '0.9rem' }}>Select content from the stream to stage</div>
                            </div>
                        )}
                        {
                            !projectorActive && (
                                <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(15, 23, 42, 0.9)', color: '#94a3b8', padding: '8px 16px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                                    Projector Link Offline
                                </div>
                            )
                        }
                    </div>

                    <div style={{ padding: '24px', display: 'flex', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.5)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <button
                            onClick={goLive}
                            disabled={!stagedItem}
                            style={{
                                backgroundColor: stagedItem ? '#6366f1' : '#334155',
                                color: 'white', border: 'none', padding: '14px 60px',
                                borderRadius: '12px', fontSize: '1.1rem', fontWeight: 700,
                                cursor: stagedItem ? 'pointer' : 'not-allowed',
                                boxShadow: stagedItem ? '0 10px 15px -3px rgba(99, 102, 241, 0.4)' : 'none',
                                transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', gap: '12px',
                                letterSpacing: '0.5px'
                            }}
                        >
                            GO LIVE <Play size={20} fill="currentColor" />
                        </button>
                    </div>
                </div >

                {/* RIGHT: LIVE OUTPUT */}
                < div style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', backgroundColor: '#020617', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#ef4444', letterSpacing: '0.1em', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444', boxShadow: '0 0 8px #ef4444' }} /> LIVE OUTPUT
                        </h3>
                    </div>

                    <div style={{ padding: '24px' }}>
                        <div style={{
                            aspectRatio: '16/9',
                            background: liveItem?.theme?.type === 'image' ? `url("${liveItem.theme.value}") center/cover` : (liveItem?.theme?.type === 'color' ? liveItem.theme.value : 'black'),
                            borderRadius: '8px', border: '2px solid #ef4444', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px',
                            boxShadow: '0 4px 20px rgba(239, 68, 68, 0.2)', position: 'relative'
                        }}>
                            {liveItem?.theme?.type === 'video' && <video src={liveItem.theme.value} autoPlay loop muted style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />}
                            {projectorActive && (
                                <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px' }}>
                                    <div className="animate-pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                                    <span style={{ fontSize: '0.6rem', color: '#10b981', fontWeight: 600 }}>SYNCED</span>
                                </div>
                            )}
                            {liveItem ? (
                                <div style={{ textAlign: 'center', transform: 'scale(0.4)', width: '250%' }}>
                                    <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>{liveItem.title}</div>
                                    <div style={{ fontSize: '1.4rem', fontWeight: 600, color: 'white' }}>{liveItem.content}</div>
                                </div>
                            ) : (
                                <div style={{ color: '#1e293b', fontSize: '0.8rem', fontWeight: 600 }}>BLACK</div>
                            )}
                        </div>

                        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '0.8rem' }}>
                            <div style={{ color: '#64748b', marginBottom: '4px' }}>Status</div>
                            <div style={{ color: liveItem ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: liveItem ? '#10b981' : '#94a3b8' }} />
                                {liveItem ? 'Broadcasting Signal' : 'Standby'}
                            </div>
                        </div>
                    </div>

                    <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <button onClick={() => setLiveItem(null)} className="glass-panel" style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#fca5a5', borderRadius: '10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}>
                            <Play size={20} style={{ transform: 'rotate(90deg)' }} /> <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>BLACK OUT</span>
                        </button>
                        <button onClick={() => setLiveItem({ type: 'logo', content: 'LOGO', title: 'Church Logo' })} className="glass-panel" style={{ padding: '12px', backgroundColor: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', color: '#a5b4fc', borderRadius: '10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}>
                            <ImageIcon size={20} /> <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>QUICK LOGO</span>
                        </button>
                    </div>
                </div >

            </div >
        </div >
    );
};

export default Dashboard;
