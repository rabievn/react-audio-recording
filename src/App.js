import './App.css';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import CustomAudioPlayer from './components/CustomAudioPlayer';
import AudioVisualizer from './components/AudioVisualizer';

export default function App() {
    const [recordedUrl, setRecordedUrl] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [error, setError] = useState('');

    const mediaStream = useRef(null);
    const mediaRecorder = useRef(null);
    const chunks = useRef([]);

    useEffect(() => {
        return () => {
            if (recordedUrl && recordedUrl.startsWith('blob:')) {
                URL.revokeObjectURL(recordedUrl);
            }
        };
    }, [recordedUrl]);

    const startRecording = async () => {
        setError('');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({audio: true});
            mediaStream.current = stream;
            mediaRecorder.current = new MediaRecorder(stream);

            chunks.current = [];
            mediaRecorder.current.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.current.push(e.data);
            };
            mediaRecorder.current.onstop = () => {
                const recordedBlob = new Blob(chunks.current, {type: 'audio/webm'});
                const url = URL.createObjectURL(recordedBlob);
                setRecordedUrl(url);
                chunks.current = [];
                setIsRecording(false);
            };

            mediaRecorder.current.start();
            setIsRecording(true);
        } catch (err) {
            setError('Microphone access denied or not available.');
            setIsRecording(false);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
            mediaRecorder.current.stop();
        }
        if (mediaStream.current) {
            mediaStream.current.getTracks().forEach((track) => track.stop());
            mediaStream.current = null;
        }
    };

    const renderSVGWave = useCallback(() => (
        <CustomAudioPlayer recordedUrl={recordedUrl} width={400} height={50}/>), [recordedUrl]);

    const renderAudioVisualizer = useCallback(() => (<AudioVisualizer
        recordedUrl={recordedUrl}
        onRecordedUrlChange={setRecordedUrl}
    />), [recordedUrl]);

    return (<div className="App dark">
        <h2 className="app__title">🎤 Audio Recorder with Custom Waveform</h2>

        <div className="app__controls">
            <button
                className="app__button"
                onClick={startRecording}
                disabled={isRecording}
            >
                {isRecording ? 'Recording...' : 'Start Recording'}
            </button>
            <button
                className="app__button"
                onClick={stopRecording}
                disabled={!isRecording}
            >
                Stop Recording
            </button>
        </div>

        {error && <div className="app__error">{error}</div>}
        {renderAudioVisualizer()}

        <h2 className="app__subtitle">SVG Full Waveform</h2>
        {renderSVGWave()}
    </div>);
}
