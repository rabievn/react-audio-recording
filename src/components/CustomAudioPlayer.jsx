import React, {useEffect, useRef, useState} from "react";
import "../App.css";
import formatTime from '../utils/formatTime'

async function extractWaveform(url, sampleCount = 400) {
    if (!url) return [];
    const res = await fetch(url);
    const arrayBuffer = await res.arrayBuffer();

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    const raw = audioBuffer.getChannelData(0);
    const blockSize = Math.floor(raw.length / sampleCount);
    const samples = [];
    for (let i = 0; i < sampleCount; i++) {
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(raw[i * blockSize + j]);
        }
        samples.push(sum / blockSize);
    }
    return samples;
}

export default function CustomAudioPlayer({recordedUrl, width = 600, height = 120}) {
    const [wave, setWave] = useState([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef(null);

    useEffect(() => {
        let running = true;
        if (!recordedUrl) return setWave([]);
        extractWaveform(recordedUrl, width).then(samples => {
            if (running) setWave(samples);
        });
        return () => {
            running = false;
        }
    }, [recordedUrl, width]);

    useEffect(() => {
        audioRef.current.onloadedmetadata = () => {
            if (audioRef.current.duration === Infinity) {
                audioRef.current.currentTime = 1e101;
                audioRef.current.ontimeupdate = () => {
                    audioRef.current.ontimeupdate = null;
                    audioRef.current.currentTime = 0;
                    setDuration(audioRef.current.duration);
                };
            } else {
                setDuration(audioRef.current.duration);
            }
        };
        const audio = audioRef.current;

        if (!audio) return;
        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);


        const handleLoadedMetadata = () => setDuration(audio.duration);
        const handleEnded = () => setIsPlaying(false);
        audio.addEventListener("timeupdate", handleTimeUpdate);
        audio.addEventListener("loadedmetadata", handleLoadedMetadata);
        audio.addEventListener("ended", handleEnded);
        return () => {
            audio.removeEventListener("timeupdate", handleTimeUpdate);
            audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
            audio.removeEventListener("ended", handleEnded);
        };
    }, [recordedUrl]);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;
        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e) => {
        const audio = audioRef.current;
        if (!audio) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = x / width;
        const newTime = percent * duration;
        audio.currentTime = newTime;
        setCurrentTime(newTime);
    };


    // Normalized: fill full height!
    const max = Math.max(...wave);
    const min = Math.min(...wave);
    const points = wave.map((v, i) => {
        const x = (i / (wave.length - 1)) * width;
        // Normalize so the highest value is at the top, lowest at the bottom
        const normalized = (v - min) / (max - min || 1);
        const y = height - normalized * height;
        return `${x},${y}`;
    }).join(' ');

    let progress = duration ? (currentTime / duration) : 0;
    let progressCount = Math.max(2, Math.floor(wave.length * progress));
    const progressPoints = wave.slice(0, progressCount).map((v, i) => {
        const x = (i / (wave.length - 1)) * width;
        const normalized = (v - min) / (max - min || 1);
        const y = height - normalized * height;
        return `${x},${y}`;
    }).join(' ');


    return (
        <div className="audio-player" style={{maxWidth: width}}>
            <audio ref={audioRef} src={recordedUrl ?? ""} preload="auto"/>
            <div className="audio-player__waveform-container" onClick={duration ? handleSeek : undefined}>
                <svg
                    className="audio-player__waveform-svg"
                    width={width}
                    height={height}
                    style={{display: "block"}}
                >
                    <polyline
                        className="audio-player__waveform-bg"
                        fill="none"
                        stroke="url(#waveGradientBg)"
                        strokeWidth="2"
                        points={points}

                        height="100%"
                    />
                    <polyline
                        className="audio-player__waveform-progress"
                        fill="none"
                        stroke="url(#waveGradientPlay)"
                        strokeWidth="3"
                        points={progressPoints}
                        height="100%"
                    />
                    <defs>
                        <linearGradient id="waveGradientBg" x1="0" y1="0" x2="0" y2={height}
                                        gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#C1C1C1"/>
                            <stop offset="100%" stopColor="#7f8c8d"/>
                        </linearGradient>
                        <linearGradient id="waveGradientPlay" x1="0" y1="0" x2="0" y2={height}
                                        gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#8595E5"/>
                            <stop offset="100%" stopColor="#42C5EB"/>
                        </linearGradient>
                    </defs>
                </svg>
            </div>
            <div className="audio-player__controls">
                <button className="audio-player__play" onClick={togglePlay}>
                    {isPlaying ? "Pause" : "Play"}
                </button>
                <span className="audio-player__time">
                    {formatTime(currentTime)} / {formatTime(duration)}
                </span>
            </div>
        </div>
    );
}

