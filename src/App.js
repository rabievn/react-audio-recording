import {useEffect, useRef, useState} from "react";
import "./App.css";
import WaveForm from "./WaveForm";

export default function App() {
    const [analyzerData, setAnalyzerData] = useState(null);
    const audioElmRef = useRef(null);
    const [recordedUrl, setRecordedUrl] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [error, setError] = useState('');
    const mediaStream = useRef(null);
    const mediaRecorder = useRef(null);
    const chunks = useRef([]);

    const audioAnalyzer = () => {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const analyzer = audioCtx.createAnalyser();
        analyzer.fftSize = 256;

        const bufferLength = analyzer.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const source = audioCtx.createMediaElementSource(audioElmRef.current);
        source.connect(analyzer);
        source.connect(audioCtx.destination);
        source.onended = () => {
            source.disconnect();
        };

        setAnalyzerData({analyzer, bufferLength, dataArray});
    };

    const onFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setRecordedUrl(URL.createObjectURL(file));
        audioAnalyzer();
    };


    // Clean up blob URLs to avoid memory leaks
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
                if (e.data.size > 0) {
                    chunks.current.push(e.data);
                }
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
            mediaStream.current.getTracks().forEach((track) => {
                track.stop();
            });
        }
    };

    return (<div className="App">
        <h2>🎤 Audio Recorder with Custom Waveform</h2>
        <div style={{marginBottom: 20}}>
            <button onClick={startRecording} disabled={isRecording}>
                {isRecording ? 'Recording...' : 'Start Recording'}
            </button>
            <button onClick={stopRecording} disabled={!isRecording}>
                Stop Recording
            </button>
        </div>
        {error && (<div style={{color: 'red', marginBottom: 20}}>
            {error}
        </div>)}

        <h1>Audio Visualizer</h1>
        {analyzerData && <WaveForm analyzerData={analyzerData}/>}
        <div
            style={{
                height: 40, display: "flex", justifyContent: "space-around", alignItems: "center"
            }}
        >
            <input type="file" accept="audio/*" onChange={onFileChange}/>
            <audio src={recordedUrl ?? ""} controls ref={audioElmRef}/>
        </div>
    </div>);
}
