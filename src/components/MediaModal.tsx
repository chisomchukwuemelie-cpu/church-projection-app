
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Image as ImageIcon, Video, Palette, Save } from 'lucide-react';
import { type Theme, saveTheme, deleteTheme, getAllThemes } from '../services/ThemeService';

interface MediaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRefresh: () => void;
}

const MediaModal: React.FC<MediaModalProps> = ({ isOpen, onClose, onRefresh }) => {
    const [themes, setThemes] = useState<Theme[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newTheme, setNewTheme] = useState<Partial<Theme>>({
        type: 'image',
        name: '',
        value: '',
        overlayOpacity: 0.3
    });

    useEffect(() => {
        if (isOpen) {
            setThemes(getAllThemes());
        }
    }, [isOpen]);

    const handleSave = () => {
        if (!newTheme.name || !newTheme.value) return;

        const theme: Theme = {
            id: 'user-' + Date.now(),
            type: newTheme.type as any,
            name: newTheme.name,
            value: newTheme.value,
            overlayOpacity: newTheme.overlayOpacity || 0.3
        };

        saveTheme(theme);
        setThemes(getAllThemes());
        setIsAdding(false);
        setNewTheme({ type: 'image', name: '', value: '', overlayOpacity: 0.3 });
        onRefresh();
    };

    const handleDelete = (id: string) => {
        deleteTheme(id);
        setThemes(getAllThemes());
        onRefresh();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                            <ImageIcon size={20} className="text-indigo-400" />
                        </div>
                        <h2 className="text-xl font-bold">Media & Themes</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {/* Add New Section */}
                    {!isAdding ? (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="w-full py-4 border-2 border-dashed border-slate-700 hover:border-indigo-500/50 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:text-indigo-400 transition-all mb-6"
                        >
                            <Plus size={18} /> Add Custom Media (Image/Video)
                        </button>
                    ) : (
                        <div className="bg-slate-800/50 border border-indigo-500/30 rounded-xl p-6 mb-6 animate-slide-in">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Type</label>
                                    <div className="flex gap-2">
                                        {(['image', 'video', 'color'] as const).map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setNewTheme({ ...newTheme, type })}
                                                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-2 ${newTheme.type === type ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                                            >
                                                {type === 'image' && <ImageIcon size={14} />}
                                                {type === 'video' && <Video size={14} />}
                                                {type === 'color' && <Palette size={14} />}
                                                {type.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Display Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Cross Background"
                                        value={newTheme.name}
                                        onChange={e => setNewTheme({ ...newTheme, name: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 mb-4">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">URL or Hex Value</label>
                                <input
                                    type="text"
                                    placeholder={newTheme.type === 'color' ? "#000000" : "https://example.com/media.mp4"}
                                    value={newTheme.value}
                                    onChange={e => setNewTheme({ ...newTheme, value: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button onClick={handleSave} className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors">
                                    <Save size={16} /> Save Theme
                                </button>
                                <button onClick={() => setIsAdding(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 py-2 rounded-lg font-bold transition-colors">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Library List */}
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Media Library</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {themes.map(theme => (
                            <div key={theme.id} className="group relative bg-slate-800/40 border border-white/5 rounded-xl overflow-hidden hover:border-white/20 transition-all">
                                <div
                                    className="aspect-video w-full flex items-center justify-center overflow-hidden bg-black"
                                    style={{
                                        background: theme.type === 'color' ? theme.value : undefined,
                                        backgroundImage: theme.type === 'image' ? `url("${theme.value}")` : undefined,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                    }}
                                >
                                    {theme.type === 'video' && <Video size={24} className="text-white/50" />}
                                    {theme.type === 'image' && !theme.value && <ImageIcon size={24} className="text-white/20" />}
                                </div>
                                <div className="p-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-white truncate max-w-[150px]">{theme.name}</p>
                                        <p className="text-[10px] text-slate-500 font-medium uppercase">{theme.type}</p>
                                    </div>
                                    {theme.id.startsWith('user-') && (
                                        <button
                                            onClick={() => handleDelete(theme.id)}
                                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6 border-t border-white/5 bg-slate-900/50 text-center">
                    <p className="text-[10px] text-slate-500 font-medium">Use high-quality MP4 links or direct Image URLs for best results.</p>
                </div>
            </div>
        </div>
    );
};

export default MediaModal;
