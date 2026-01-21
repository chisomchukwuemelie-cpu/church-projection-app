import React, { useState, useEffect } from 'react';
import { X, Save, Key, Book, Monitor, Trash2 } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentTranslation: string;
    onSaveTranslation: (translation: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentTranslation, onSaveTranslation }) => {
    const [apiKey, setApiKey] = useState('');
    const [translation, setTranslation] = useState(currentTranslation);
    const [autoStart, setAutoStart] = useState(false);
    const [showKey, setShowKey] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Load from localStorage on open
            const storedKey = localStorage.getItem('VITE_GEMINI_API_KEY') || import.meta.env.VITE_GEMINI_API_KEY || '';
            setApiKey(storedKey);

            const storedAuto = localStorage.getItem('LUMINA_AUTO_START') === 'true';
            setAutoStart(storedAuto);

            setTranslation(currentTranslation);
        }
    }, [isOpen, currentTranslation]);

    const handleSave = () => {
        // Save API Key
        // Note: In a real prod app, we might want to be careful about storing keys in localStorage, 
        // but for a local desktop app this is a common convenience pattern.
        if (apiKey !== import.meta.env.VITE_GEMINI_API_KEY) {
            localStorage.setItem('VITE_GEMINI_API_KEY', apiKey);
            // We might need to reload the page or update the service context to pick this up dynamically
            // For now, we'll just save it.
        }

        // Save Translation preference (if handled by parent, this calls the cb)
        onSaveTranslation(translation);
        localStorage.setItem('LUMINA_DEFAULT_TRANSLATION', translation);

        // Save Auto Start
        localStorage.setItem('LUMINA_AUTO_START', autoStart.toString());

        onClose();
        // Optional: Trigger a reload if API key changed significantly?
        if (apiKey && apiKey !== localStorage.getItem('VITE_GEMINI_API_KEY_OLD')) {
            localStorage.setItem('VITE_GEMINI_API_KEY_OLD', apiKey);
            window.location.reload();
        }
    };

    const handleClearStorage = () => {
        if (confirm('Are you sure you want to reset all app settings? This will clear songs and history.')) {
            localStorage.clear();
            window.location.reload();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-scale-up">

                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-800/50">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Monitor className="text-indigo-500" size={20} />
                        System Settings
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-6">

                    {/* API KEY SECTION */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider flex items-center gap-1">
                            <Key size={12} /> Gemini API Key
                        </label>
                        <div className="relative">
                            <input
                                type={showKey ? "text" : "password"}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Enter your Google Gemini API Key"
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                            <button
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer"
                            >
                                {showKey ? "HIDE" : "SHOW"}
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-500">
                            Required for AI detection. Get one at <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline">makersuite.google.com</a>
                        </p>
                    </div>

                    {/* TRANSLATION SECTION */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider flex items-center gap-1">
                            <Book size={12} /> Default Translation
                        </label>
                        <select
                            value={translation}
                            onChange={(e) => setTranslation(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                            <option value="KJV">King James Version (KJV)</option>
                            <option value="NIV">New International Version (NIV)</option>
                            <option value="ESV">English Standard Version (ESV)</option>
                            <option value="NKJV">New King James Version (NKJV)</option>
                            <option value="NLT">New Living Translation (NLT)</option>
                            <option value="AMP">Amplified Bible (AMP)</option>
                            <option value="MSG">The Message (MSG)</option>
                            <option value="WEB">World English Bible (WEB)</option>
                        </select>
                    </div>

                    {/* DANGER ZONE */}
                    <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-400">Auto-open Projector on launch</span>
                            <div
                                onClick={() => setAutoStart(!autoStart)}
                                className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${autoStart ? 'bg-indigo-500' : 'bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${autoStart ? 'left-6' : 'left-1'}`} />
                            </div>
                        </div>

                        <button
                            onClick={handleClearStorage}
                            className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors mt-2"
                        >
                            <Trash2 size={12} /> Reset App (Clear Cache & Songs)
                        </button>
                    </div>

                </div>

                <div className="p-4 bg-slate-950 border-t border-white/5 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-slate-400 text-sm hover:text-white hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all"
                    >
                        <Save size={16} /> Save Changes
                    </button>
                </div>

            </div>
        </div>
    );
};

export default SettingsModal;
