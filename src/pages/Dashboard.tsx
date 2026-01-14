import React, { useState, useEffect, useRef } from 'react';
import { useProjection } from '../context/ProjectionContext';
import type { ProjectionItem } from '../context/ProjectionContext';
import AudioProcessor from '../components/AudioProcessor';
import { Monitor, Play, Type, Image as ImageIcon, XCircle, Trash2, Palette, Settings, Mic } from 'lucide-react';
import type { DetectedContent } from '../services/gemini';

const Dashboard: React.FC = () => {
    const { setLiveItem, liveItem } = useProjection();

    // -- STATE --
    const [streamHistory, setStreamHistory] = useState<DetectedContent[]>([]);
    const [stagedItem, setStagedItem] = useState<ProjectionItem | null>(null);
    const [selectedTheme, setSelectedTheme] = useState<'NONE' | 'BG_BLUE' | 'BG_MOUNTAINS'>('NONE');

    const streamEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll stream
    useEffect(() => {
        streamEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [streamHistory]);

    // -- HANDLERS --

    const handleContentDetected = (detected: DetectedContent) => {
        setStreamHistory(prev => [...prev, detected].slice(-30));
    };

    const clearHistory = () => {
        setStreamHistory([]);
    };

    const promoteToStage = (detected: DetectedContent) => {
        let item: ProjectionItem = {
            type: 'text',
            content: detected.content || '',
            title: detected.reference || 'Text',
            theme: { background: selectedTheme }
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

    const updateStagedTheme = (theme: 'NONE' | 'BG_BLUE' | 'BG_MOUNTAINS') => {
        setSelectedTheme(theme);
        if (stagedItem) {
            setStagedItem({
                ...stagedItem,
                theme: { background: theme }
            });
        }
    };

    const goLive = () => {
        if (stagedItem) {
            setLiveItem(stagedItem);
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

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={openProjector} className="glass-panel action-button" style={{
                        padding: '8px 20px', borderRadius: '8px', color: 'white', cursor: 'pointer',
                        display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.9rem', fontWeight: 600,
                        backgroundColor: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.3)'
                    }}>
                        <Monitor size={16} /> Open Projector
                    </button>
                    <button className="glass-panel" style={{ padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>
                        <Settings size={18} color="#94a3b8" />
                    </button>
                </div>
            </header>

            {/* MAIN 3-PANE LAYOUT */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '320px 1fr 320px', overflow: 'hidden' }}>

                {/* LEFT: STREAM */}
                <div style={{ borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', background: '#020617' }}>
                    <div style={{ padding: '20px' }}>
                        <AudioProcessor onContentDetected={handleContentDetected} />
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px 20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.1em', margin: 0 }}>Detected Stream</h3>
                            <button onClick={clearHistory} style={{ background: 'transparent', border: 'none', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}>
                                <Trash2 size={12} /> Clear
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {streamHistory.map((item, idx) => (
                                <div key={idx}
                                    onClick={() => promoteToStage(item)}
                                    className="animate-fade-in"
                                    style={{
                                        padding: '12px', backgroundColor: 'rgba(30, 41, 59, 0.5)', borderRadius: '10px', cursor: 'pointer',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        borderLeft: `4px solid ${item.type === 'scripture' ? '#3b82f6' : '#10b981'}`,
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                                        <span>{item.type.toUpperCase()}</span>
                                        <span style={{ color: '#94a3b8' }}>{item.reference}</span>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.4', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                                        {item.content}
                                    </div>
                                </div>
                            ))}
                            <div ref={streamEndRef} />
                            {streamHistory.length === 0 && (
                                <div style={{ color: '#334155', textAlign: 'center', marginTop: '60px', padding: '20px' }}>
                                    <Mic size={32} style={{ marginBottom: '12px', opacity: 0.2 }} />
                                    <div style={{ fontSize: '0.85rem' }}>Start listening to see content here.</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* CENTER: STAGING (Editor) */}
                <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#0f172a', position: 'relative' }}>
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
                                <button onClick={() => updateStagedTheme('NONE')} style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'black', border: selectedTheme === 'NONE' ? '2px solid #6366f1' : '1px solid #334155', cursor: 'pointer' }} title="Black" />
                                <button onClick={() => updateStagedTheme('BG_BLUE')} style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'radial-gradient(circle, #1e3a8a, #0f172a)', border: selectedTheme === 'BG_BLUE' ? '2px solid #6366f1' : '1px solid #334155', cursor: 'pointer' }} title="Deep Blue" />
                                <button onClick={() => updateStagedTheme('BG_MOUNTAINS')} style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'url("https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=200&auto=format&fit=crop") center/cover', border: selectedTheme === 'BG_MOUNTAINS' ? '2px solid #6366f1' : '1px solid #334155', cursor: 'pointer' }} title="Mountains" />
                            </div>
                        </div>
                    </div>

                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)' }}>
                        {stagedItem ? (
                            <div style={{
                                width: '100%', maxWidth: '700px', aspectRatio: '16/9',
                                background: stagedItem.theme?.background === 'BG_BLUE' ? 'radial-gradient(circle at center, #1e3a8a, #0f172a)' :
                                    stagedItem.theme?.background === 'BG_MOUNTAINS' ? 'url("https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop") center/cover' : 'black',
                                borderRadius: '12px', padding: '48px', display: 'flex', flexDirection: 'column',
                                justifyContent: 'center', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                            }}>
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
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', color: '#334155' }}>
                                <div style={{ width: '200px', height: '112px', border: '2px dashed #1e293b', borderRadius: '8px' }} />
                                <div style={{ fontSize: '0.9rem' }}>Select content from the stream to stage</div>
                            </div>
                        )}
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
                </div>

                {/* RIGHT: LIVE OUTPUT */}
                <div style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', backgroundColor: '#020617', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#ef4444', letterSpacing: '0.1em', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444', boxShadow: '0 0 8px #ef4444' }} /> LIVE OUTPUT
                        </h3>
                    </div>

                    <div style={{ padding: '24px' }}>
                        <div style={{
                            aspectRatio: '16/9',
                            background: liveItem?.theme?.background === 'BG_BLUE' ? 'radial-gradient(circle at center, #1e3a8a, #0f172a)' :
                                liveItem?.theme?.background === 'BG_MOUNTAINS' ? 'url("https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=200&auto=format&fit=crop") center/cover' : 'black',
                            borderRadius: '8px', border: '2px solid #ef4444', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px',
                            boxShadow: '0 4px 20px rgba(239, 68, 68, 0.2)'
                        }}>
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
                            <XCircle size={20} /> <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Clear Live</span>
                        </button>
                        <button onClick={() => alert("Logo feature coming soon")} className="glass-panel" style={{ padding: '12px', color: '#94a3b8', borderRadius: '10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}>
                            <ImageIcon size={20} /> <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Quick Logo</span>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;

