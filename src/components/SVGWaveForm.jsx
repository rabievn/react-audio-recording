import React, {useEffect, useState} from "react";

// Helper: decode audio and extract waveform samples
async function extractWaveform(url, sampleCount = 800) {
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

// SVG drawing component
export default function SVGWave({recordedUrl, width = 275, height = 80}) {
    const [wave, setWave] = useState([]);

    useEffect(() => {
        let running = true;
        if (!recordedUrl) return setWave([]);
        extractWaveform(recordedUrl).then(samples => {
            if (running) setWave(samples);
        });
        return () => {
            running = false;
        }
    }, [recordedUrl]);

    if (!wave.length) return (
        <svg width={width} height={height} style={{background: "#f4f4f4", borderRadius: 8}}>
            <text x="50%" y="50%" alignmentBaseline="middle" textAnchor="middle" fill="#ccc" fontSize="18">
                No waveform
            </text>
        </svg>
    );

    // Map wave data to points
    const max = Math.max(...wave);
    const min = Math.min(...wave);
    const points = wave.map((v, i) => {
        const x = (i / (wave.length - 1)) * width;
        // Normalize so the highest value is at the top, lowest at the bottom
        const normalized = (v - min) / (max - min || 1);
        const y = height - normalized * height;
        return `${x},${y}`;
    }).join(' ');


    return (
        <>
            <svg width={width} height={height} style={{background: "none", borderRadius: 8}}>
                <polyline
                    fill="none"
                    stroke="url(#waveGradient)"
                    strokeWidth="2"
                    points={points}
                />
                <defs>
                    <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2={height} gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#C1C1C1 "/>
                    </linearGradient>
                </defs>
                <defs>
                    <linearGradient id="waveGradientPlay" x1="0" y1="0" x2="0" y2={height}
                                    gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#8595E5"/>
                        <stop offset="100%" stopColor="#42C5EB"/>
                    </linearGradient>
                </defs>
            </svg>

        </>

    );
}
