import {useRef, useEffect, useState} from 'react';
import formatTime from '../utils/formatTime';
import WaveForm from './WaveForm';

export function AudioVisualizer({recordedUrl, onRecordedUrlChange}) {
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [analyzerData, setAnalyzerData] = useState(null);
    const audioElmRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        audioElmRef.current.onloadedmetadata = () => {
            if (audioElmRef.current.duration === Infinity) {
                audioElmRef.current.currentTime = 1e101;
                audioElmRef.current.ontimeupdate = () => {
                    audioElmRef.current.ontimeupdate = null;
                    audioElmRef.current.currentTime = 0;
                    setDuration(audioElmRef.current.duration);
                };
            } else {
                setDuration(audioElmRef.current.duration);
            }
        };
        const audio = audioElmRef.current;

        if (!audio) return;
        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);

        const handleLoadedMetadata = () => setDuration(audio.duration);
        const handleEnded = () => setIsPlaying(false);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);
        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [recordedUrl]);

    const togglePlay = () => {
        const audio = audioElmRef.current;
        if (!audio) return;
        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

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
        const url = URL.createObjectURL(file);
        onRecordedUrlChange(url); // ✅ matches App
        audioAnalyzer();
    };

    return (
        <div>
            <h1 className="app__heading">Audio Visualizer</h1>
            {analyzerData && <WaveForm analyzerData={analyzerData}/>}

            <div className="record-player">
                <input
                    type="file"
                    accept="audio/*"
                    onChange={onFileChange}
                    className="audio-player__file-input"
                />
                <audio
                    src={recordedUrl ?? ''}
                    controls
                    ref={audioElmRef}
                    className="audio-player__audio"
                />
            </div>

            <div className="audio-player__controls">
                <button className="audio-player__play" onClick={togglePlay}>
                    {isPlaying ? 'Pause' : 'Play'}
                </button>
                <span className="audio-player__time">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
            </div>
        </div>
    );
}

export default AudioVisualizer;
