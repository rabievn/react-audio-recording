import React, {useEffect, useRef, useState} from "react";

export default function FullWave({recordedUrl}) {
    const [waveform, setWaveform] = useState([]);
    const canvasRef = useRef();

    // Whenever recordedUrl changes, decode audio and draw waveform
    useEffect(() => {
        if (!recordedUrl) return;
        fetch(recordedUrl)
            .then(res => res.arrayBuffer())
            .then(arrayBuffer => {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                return audioCtx.decodeAudioData(arrayBuffer);
            })
            .then(audioBuffer => {
                const rawData = audioBuffer.getChannelData(0);
                // Downsample for drawing
                const samples = 800;
                const blockSize = Math.floor(rawData.length / samples);
                const filtered = [];
                for (let i = 0; i < samples; i++) {
                    let sum = 0;
                    for (let j = 0; j < blockSize; j++) {
                        sum += Math.abs(rawData[i * blockSize + j]);
                    }
                    filtered.push(sum / blockSize);
                }
                setWaveform(filtered);
                drawWave(filtered);
            })
            .catch(e => {
                // Optional: handle error
                setWaveform([]);
            });
    }, [recordedUrl]);

    function drawWave(wave) {
        const canvas = canvasRef.current;
        if (!canvas || wave.length === 0) return;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#8595E5');
        gradient.addColorStop(1, '#42C5EB');
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.beginPath();
        wave.forEach((value, i) => {
            const x = (i / wave.length) * canvas.width;
            const y = canvas.height / 2 - value * (canvas.height / 2);
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();
    }

    // If you still want manual file upload:
    const handleFile = async (e) => {
        let file;
        if (recordedUrl) {
            file = e.target.files?.[0];
        } else {
            file = recordedUrl
        }
        if (!file) return;
        const arrayBuffer = await file.arrayBuffer();
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        const rawData = audioBuffer.getChannelData(0); // First channel
        // Downsample for drawing
        const samples = 800; // Change for more/less detail
        const blockSize = Math.floor(rawData.length / samples);
        const filtered = [];
        for (let i = 0; i < samples; i++) {
            let sum = 0;
            for (let j = 0; j < blockSize; j++) {
                sum += Math.abs(rawData[i * blockSize + j]);
            }
            filtered.push(sum / blockSize);
        }
        setWaveform(filtered);
        drawWave(filtered);
    };

    return (
        <div style={{margin: "24px 0"}}>
            {/* Optional file input, or remove if only using props */}
            <input type="file" accept="audio/*" onChange={handleFile}/>
            <canvas ref={canvasRef} width={275} height={80}/>
        </div>
    );
}
