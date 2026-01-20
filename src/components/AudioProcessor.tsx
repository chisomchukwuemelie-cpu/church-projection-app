
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Activity } from 'lucide-react';
import { analyzeText } from '../services/gemini';
import type { DetectedContent } from '../services/gemini';

interface AudioProcessorProps {
    onContentDetected: (content: DetectedContent) => void;
}

const AudioProcessor: React.FC<AudioProcessorProps> = ({ onContentDetected }) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const [lastAILog, setLastAILog] = useState<string>("Ready for voice...");
    const recognitionRef = useRef<any>(null);
    const isListeningRef = useRef(false);
    const lastAnalysisTime = useRef(0);
    const lastResultText = useRef('');
    const lastRollingMatchRef = useRef('');

    const handleTextAnalysis = async (text: string) => {
        const now = Date.now();
        const cleanText = text.trim().toLowerCase();

        // 1. DEDUPLICATION: Strict check to prevent double-processing
        if (!cleanText || cleanText.length < 4) return;
        if (cleanText === lastResultText.current && (now - lastAnalysisTime.current < 2000)) {
            return;
        }

        lastAnalysisTime.current = now;
        lastResultText.current = cleanText;
        setTranscript('');

        console.log(`[VOICE] Gemini Analyzing: "${cleanText}"`);
        setLastAILog(`AI Checking: "${cleanText.substring(0, 30)}..."`);

        setIsAnalyzing(true);
        try {
            const result = await analyzeText(cleanText);
            if (result) {
                if (result.type === 'noise') {
                    setLastAILog(`AI ignored: Noise ("${cleanText.substring(0, 15)}")`);
                } else {
                    onContentDetected(result);
                    setTranscript('');
                    setLastAILog(`AI Found: ${result.type.toUpperCase()} (${result.reference || ''})`);
                }
            } else {
                setLastAILog("AI returned null");
            }
        } catch (error: any) {
            setLastAILog(`AI Error`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    useEffect(() => {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            setLastAILog("Browser not supported (Use Chrome)");
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => console.log("[VOICE] Engine Started");
        recognition.onresult = (event: any) => {
            let currentTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                currentTranscript += event.results[i][0].transcript;
            }
            setTranscript(currentTranscript);

            if (event.results[event.results.length - 1].isFinal) {
                handleTextAnalysis(event.results[event.results.length - 1][0].transcript);
            }
        };

        recognition.onerror = (event: any) => {
            console.error("[VOICE] Error:", event.error);
            setLastAILog(`Error: ${event.error}`);
            if (event.error === 'not-allowed') {
                setIsListening(false);
                isListeningRef.current = false;
            }
        };

        recognition.onend = () => {
            console.log("[VOICE] Engine Stopped");
            if (isListeningRef.current) {
                console.log("[VOICE] Auto-Restarting...");
                try { recognition.start(); } catch (e) { }
            }
        };

        recognitionRef.current = recognition;

        return () => {
            isListeningRef.current = false;
            recognition.stop();
        };
    }, []);

    // PEWBEAM + PAUSE UNIFIED TRIGGER
    useEffect(() => {
        if (!isListening || isAnalyzing) return;

        const lowerTranscript = transcript.toLowerCase().trim();
        if (lowerTranscript.length < 4) return;

        // A. SYSTEM COMMANDS
        if (lowerTranscript.includes("show") && lowerTranscript.includes("logo")) {
            onContentDetected({ type: 'command', command: 'SHOW_LOGO' });
            setTranscript('');
            return;
        }

        // B. CATCH-ALL ROLLING MATCH
        const bibleBooks = ['genesis', 'exodus', 'leviticus', 'numbers', 'deuteronomy', 'joshua', 'judges', 'ruth', 'samuel', 'kings', 'chronicles', 'ezra', 'nehemiah', 'esther', 'job', 'psalm', 'proverbs', 'ecclesiastes', 'song', 'isaiah', 'jeremiah', 'lamentations', 'ezekiel', 'daniel', 'hosea', 'joel', 'amos', 'obadiah', 'jonah', 'micah', 'nahum', 'habakkuk', 'zephaniah', 'haggai', 'zechariah', 'malachi', 'matthew', 'mark', 'luke', 'john', 'acts', 'romans', 'corinthians', 'galatians', 'ephesians', 'philippians', 'colossians', 'thessalonians', 'timothy', 'titus', 'philemon', 'hebrews', 'james', 'peter', 'jude', 'revelation'];

        const triggerKeywords = ['chapter', 'verse', 'bible', 'scripture', 'read', 'open to', 'look at'];
        const bookFound = bibleBooks.find(b => lowerTranscript.includes(b));
        const keywordFound = triggerKeywords.find(k => lowerTranscript.includes(k));

        if (bookFound || keywordFound) {
            // Use REF for lastRollingMatch to avoid stale closures and race conditions
            if (lowerTranscript !== lastRollingMatchRef.current) {
                const timer = setTimeout(() => {
                    // One final check: only trigger if the transcript hasn't changed much in the last 400ms
                    // This "Settling" logic prevents spamming AI during mid-sentence.
                    handleTextAnalysis(transcript);
                    lastRollingMatchRef.current = lowerTranscript;
                }, 600);
                return () => clearTimeout(timer);
            }
        }

        // C. FALLBACK PAUSE TRIGGER
        const timer = setTimeout(() => {
            if (transcript.length > 5) {
                handleTextAnalysis(transcript);
                setTranscript('');
            }
        }, 1500);

        return () => clearTimeout(timer);
    }, [transcript, isListening, isAnalyzing]);

    const toggleListening = () => {
        if (isListening) {
            isListeningRef.current = false;
            recognitionRef.current?.stop();
            setIsListening(false);
            setLastAILog("Mic Off");
        } else {
            try {
                isListeningRef.current = true;
                recognitionRef.current?.start();
                setIsListening(true);
                setLastAILog("Listening...");
            } catch (e) {
                console.warn("Toggle Error:", e);
            }
        }
    };

    return (
        <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', border: isListening ? '1px solid var(--primary)' : '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-muted)' }}>Voice AI Control</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {isAnalyzing && <div className="animate-pulse" style={{ fontSize: '0.7rem', color: 'var(--primary)' }}>AI Processing...</div>}
                    {isListening && <Activity size={16} className="animate-pulse" color="#10b981" />}
                </div>
            </div>

            <div style={{
                backgroundColor: 'rgba(0,0,0,0.3)',
                padding: '12px',
                borderRadius: '8px',
                minHeight: '60px',
                marginBottom: '10px',
                fontSize: '0.9rem',
                color: '#cbd5e1',
                border: '1px solid rgba(255,255,255,0.05)',
                fontStyle: transcript ? 'normal' : 'italic',
                overflow: 'hidden'
            }}>
                {transcript || "Waiting for speech..."}
            </div>

            <div style={{ fontSize: '0.65rem', color: isAnalyzing ? '#818cf8' : '#64748b', marginBottom: '12px', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isListening ? '#10b981' : '#ef4444' }} />
                AI Status: {lastAILog}
            </div>

            <button
                onClick={toggleListening}
                className="action-button"
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px',
                    backgroundColor: isListening ? 'rgba(239, 68, 68, 0.2)' : 'var(--primary)',
                    color: isListening ? '#fca5a5' : 'white',
                    border: isListening ? '1px solid rgba(239, 68, 68, 0.5)' : 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    transition: 'all 0.3s ease'
                }}
            >
                {isListening ? <><MicOff size={18} /> Stop Listening</> : <><Mic size={18} /> Start Listening</>}
            </button>
        </div>
    );
};

export default AudioProcessor;
