
import React, { useState } from 'react';
import { useProjection } from '../context/ProjectionContext';
import type { ProjectionItem } from '../context/ProjectionContext';
import AudioProcessor from '../components/AudioProcessor';
import { Monitor, Play, Type, Image as ImageIcon, Video, XCircle } from 'lucide-react';
import type { DetectedContent } from '../services/gemini';

const Dashboard: React.FC = () => {
    console.log("DEBUG: Dashboard component rendering");
    const { setLiveItem, liveItem } = useProjection();

    // -- STATE --
    const [streamHistory, setStreamHistory] = useState<DetectedContent[]>([]);
    const [stagedItem, setStagedItem] = useState<ProjectionItem | null>(null);

    // -- HANDLERS --

    // 1. Handle incoming AI detection
    const handleContentDetected = (detected: DetectedContent) => {
        // Add to stream history
        setStreamHistory(prev => [detected, ...prev].slice(0, 20)); // Keep last 20

        // Auto-Stage Logic? Or Auto-Live?
        // For now, let's just add to stream.

    };



    // 2. Promotion (Stream -> Stage)
    const promoteToStage = (detected: DetectedContent) => {
        let item: ProjectionItem = {
            type: 'text',
            content: detected.content || '',
            title: detected.reference || 'Text'
        };

        if (detected.type === 'lyrics') {
            item.type = 'lyrics';
            item.title = 'Song Lyrics';
        } else if (detected.type === 'scripture') {
            item.type = 'scripture';
            item.title = detected.reference || 'Scripture';
        }

        setStagedItem(item);
    };

    // 3. Go Live (Stage -> Live)
    const goLive = () => {
        if (stagedItem) {
            setLiveItem(stagedItem);
        }
    };

    const openProjector = () => {
        window.open('/projector', 'ProjectorWindow', 'width=1280,height=720,menubar=no,toolbar=no');
    };

    return (
        <div className="dashboard-container" style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* HEADER */}
            <header style={{
                height: '60px', borderBottom: '1px solid var(--glass-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px',
                backgroundColor: 'var(--bg-card)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h1 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 800, color: 'var(--primary)' }}>Lumina Pro</h1>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', borderLeft: '1px solid #334155', paddingLeft: '10px' }}>EasyWorship Mode</span>
                </div>
                <button onClick={openProjector} className="glass-panel" style={{ padding: '8px 16px', borderRadius: '6px', color: 'white', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Monitor size={16} /> Open Projector Output
                </button>
            </header>

            {/* MAIN 3-PANE LAYOUT */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '300px 1fr 300px', backgroundColor: '#020617' }}>

                {/* LEFT: STREAM (History / Inputs) */}
                <div style={{ borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid #1e293b' }}>
                        <AudioProcessor onContentDetected={handleContentDetected} />
                        {/* <div>AudioProcessor Disabled</div> */}
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                        <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '1px', marginTop: 0 }}>Detected Stream</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {streamHistory.map((item, idx) => (
                                <div key={idx}
                                    onClick={() => promoteToStage(item)}
                                    className="animate-fade-in"
                                    style={{
                                        padding: '12px', backgroundColor: '#1e293b', borderRadius: '8px', cursor: 'pointer',
                                        borderLeft: `3px solid ${item.type === 'scripture' ? '#3b82f6' : '#10b981'}`
                                    }}
                                >
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>{item.type.toUpperCase()}</span>
                                        <span>{item.reference}</span>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap', maxHeight: '60px', overflow: 'hidden' }}>
                                        {item.content}
                                    </div>
                                </div>
                            ))}
                            {streamHistory.length === 0 && <div style={{ color: '#475569', textAlign: 'center', marginTop: '40px' }}>No content detected yet.<br />Speak into the mic.</div>}
                        </div>
                    </div>
                </div>

                {/* CENTER: STAGING (Editor) */}
                <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#0f172a' }}>
                    <div style={{ padding: '10px', backgroundColor: '#1e293b', display: 'flex', gap: '10px' }}>
                        <button className="glass-panel" style={{ padding: '8px', borderRadius: '4px', cursor: 'pointer' }}><Type size={16} /></button>
                        <button className="glass-panel" style={{ padding: '8px', borderRadius: '4px', cursor: 'pointer' }}><ImageIcon size={16} /></button>
                        <button className="glass-panel" style={{ padding: '8px', borderRadius: '4px', cursor: 'pointer' }}><Video size={16} /></button>
                    </div>

                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                        {stagedItem ? (
                            <div style={{ width: '100%', maxWidth: '600px', aspectRatio: '16/9', backgroundColor: 'black', borderRadius: '8px', padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center', border: '2px solid #334155' }}>
                                {stagedItem.title && <h3 style={{ color: '#94a3b8' }}>{stagedItem.title}</h3>}
                                <textarea
                                    value={stagedItem.content}
                                    onChange={(e) => setStagedItem({ ...stagedItem, content: e.target.value })}
                                    style={{
                                        background: 'transparent', border: 'none', color: 'white',
                                        fontSize: '1.5rem', textAlign: 'center', width: '100%', resize: 'none',
                                        fontFamily: 'inherit', outline: 'none'
                                    }}
                                />
                            </div>
                        ) : (
                            <div style={{ color: '#334155' }}>Select an item from the stream to stage</div>
                        )}
                    </div>

                    <div style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
                        <button
                            onClick={goLive}
                            disabled={!stagedItem}
                            style={{
                                backgroundColor: stagedItem ? '#10b981' : '#334155',
                                color: 'white', border: 'none', padding: '16px 48px',
                                borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold',
                                cursor: stagedItem ? 'pointer' : 'not-allowed',
                                boxShadow: stagedItem ? '0 0 20px rgba(16, 185, 129, 0.4)' : 'none',
                                transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', gap: '12px'
                            }}
                        >
                            GO LIVE <Play fill="currentColor" />
                        </button>
                    </div>
                </div>

                {/* RIGHT: LIVE (Output) */}
                <div style={{ borderLeft: '1px solid #1e293b', backgroundColor: '#020617', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid #1e293b' }}>
                        <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#ef4444', letterSpacing: '1px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} /> LIVE OUTPUT
                        </h3>
                    </div>

                    <div style={{ padding: '20px' }}>
                        <div style={{ aspectRatio: '16/9', backgroundColor: 'black', borderRadius: '4px', border: '2px solid #ef4444', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
                            {liveItem ? (
                                <div style={{ textAlign: 'center', transform: 'scale(0.5)' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{liveItem.title}</div>
                                    <div style={{ fontSize: '1.2rem' }}>{liveItem.content}</div>
                                </div>
                            ) : (
                                <span style={{ color: '#333' }}>BLACK</span>
                            )}
                        </div>
                    </div>

                    <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <button onClick={() => setLiveItem(null)} style={{ padding: '12px', backgroundColor: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '6px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <XCircle size={20} /> <span style={{ fontSize: '0.8rem' }}>Clear</span>
                        </button>
                        <button onClick={() => alert("Logo feature coming soon")} style={{ padding: '12px', backgroundColor: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '6px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <ImageIcon size={20} /> <span style={{ fontSize: '0.8rem' }}>Logo</span>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
