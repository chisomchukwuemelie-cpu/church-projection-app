
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Activity } from 'lucide-react';
import { Mic, MicOff, Activity } from 'lucide-react';
// import { analyzeText, DetectedContent } from '../services/gemini';
import type { DetectedContent } from '../services/gemini'; // Import type only to avoid runtime import

interface AudioProcessorProps {
    onContentDetected: (content: DetectedContent) => void;
}

const AudioProcessor: React.FC<AudioProcessorProps> = ({ onContentDetected }) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');

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
                // console.error('Speech recognition error', event.error); // Ignore for cleanup
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

        // console.log("Analyzing:", text);
        console.log("Gemini Disabled: Would analyze", text);
        // const result = await analyzeText(text);
        // if (result) {
        //     onContentDetected(result);
        // }
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
        <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-muted)' }}>Voice Input</h3>
                {isListening && <Activity size={16} className="animate-pulse" color="#10b981" />}
            </div>

            <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', minHeight: '40px', marginBottom: '16px', fontSize: '0.9rem', color: '#cbd5e1' }}>
                {transcript || <span style={{ opacity: 0.5 }}>Silent...</span>}
            </div>

            <button
                onClick={toggleListening}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px',
                    backgroundColor: isListening ? 'rgba(239, 68, 68, 0.2)' : 'var(--primary)',
                    color: isListening ? '#fca5a5' : 'white',
                    border: isListening ? '1px solid rgba(239, 68, 68, 0.5)' : 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600
                }}
            >
                {isListening ? <><MicOff size={18} /> Stop Auto-Detect</> : <><Mic size={18} /> Start Auto-Detect</>}
            </button>
        </div>
    );
};

export default AudioProcessor;
