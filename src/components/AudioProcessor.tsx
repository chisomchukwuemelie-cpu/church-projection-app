
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
    const lastAnalyzedText = useRef('');
    const recognitionRef = useRef<any>(null);
    const isListeningRef = useRef(false);

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
            console.log("[VOICE] Live Transcript:", currentTranscript);

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

    // Fast-Trigger logic: if no new speech for 500ms, analyze what we have
    useEffect(() => {
        if (!isListening || !transcript || isAnalyzing) return;

        const timer = setTimeout(() => {
            if (transcript !== lastAnalyzedText.current && transcript.trim().length > 5) {
                console.log("[VOICE] Fast-triggering analysis on pause...");
                handleTextAnalysis(transcript);
                setTranscript('');
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [transcript, isListening, isAnalyzing]);

    const handleTextAnalysis = async (text: string) => {
        const cleanText = text.trim();
        if (!cleanText || cleanText.length < 5 || cleanText === lastAnalyzedText.current) return;

        lastAnalyzedText.current = cleanText;
        console.log(`[VOICE] Analyzing text: "${cleanText}"`);
        setLastAILog(`Analyzing: "${cleanText.substring(0, 30)}..."`);

        setIsAnalyzing(true);
        try {
            const result = await analyzeText(cleanText);
            console.log("[VOICE] AI Result:", result);

            if (result) {
                if (result.type === 'noise') {
                    console.log("[VOICE] AI classified as NOISE - ignoring");
                    setLastAILog("AI ignored: Noise/Casual");
                } else {
                    console.log(`[VOICE] AI detected ${result.type.toUpperCase()}:`, result.reference || result.content?.substring(0, 30));
                    setLastAILog(`AI Found: ${result.type.toUpperCase()}${result.reference ? ` (${result.reference})` : ''}`);
                    onContentDetected(result);
                }
            } else {
                console.warn("[VOICE] AI returned null - possible API error or parsing failure");
                setLastAILog("AI returned null");
            }
        } catch (error: any) {
            console.error("[VOICE] Analysis Error:", error);
            setLastAILog(`AI Error: ${error.message || 'Check Key'}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

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
                setIsListening(true);
                isListeningRef.current = true;
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
