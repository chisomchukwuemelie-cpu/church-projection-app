
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

    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event: any) => {
                let currentTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    currentTranscript += event.results[i][0].transcript;
                }
                setTranscript(currentTranscript);

                if (event.results[event.results.length - 1].isFinal) {
                    handleTextAnalysis(event.results[event.results.length - 1][0].transcript);
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                if (event.error === 'not-allowed') {
                    setIsListening(false);
                }
            };

            recognitionRef.current.onend = () => {
                if (isListening) {
                    recognitionRef.current.start();
                }
            };
        }
    }, [isListening]);

    const handleTextAnalysis = async (text: string) => {
        if (!text || text.length < 5) return;

        setIsAnalyzing(true);
        try {
            const result = await analyzeText(text);
            if (result) {
                onContentDetected(result);
            }
        } catch (error) {
            console.error("Analysis failed:", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            recognitionRef.current?.start();
            setIsListening(true);
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
                marginBottom: '16px',
                fontSize: '0.9rem',
                color: '#cbd5e1',
                border: '1px solid rgba(255,255,255,0.05)',
                fontStyle: transcript ? 'normal' : 'italic'
            }}>
                {transcript || "Waiting for speech..."}
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

