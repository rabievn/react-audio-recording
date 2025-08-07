import {useRef, useEffect} from "react";

function animateBars(analyser, canvas, canvasCtx, dataArray, bufferLength) {
    analyser.getByteFrequencyData(dataArray);

    const HEIGHT = canvas.height;
    const barWidth = Math.ceil(canvas.width / bufferLength);

    let x = 0;

    // Create gradient once
    const gradient = canvasCtx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#8595E5'); // Top
    gradient.addColorStop(1, '#42C5EB'); // Bottom
    canvasCtx.fillStyle = gradient;

    for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * HEIGHT;
        // Place bar so it is always vertically centered, filling from top to bottom as data increases
        const y = (HEIGHT - barHeight) / 2;
        canvasCtx.fillRect(x, y, barWidth, barHeight);

        x += barWidth;
    }
}


const WaveForm = ({analyzerData}) => {
    const canvasRef = useRef(null);
    const {dataArray, analyzer, bufferLength} = analyzerData;

    const draw = (dataArray, analyzer, bufferLength) => {
        const canvas = canvasRef.current;
        if (!canvas || !analyzer) return;
        const canvasCtx = canvas.getContext("2d");

        const animate = () => {
            requestAnimationFrame(animate);
            // Clear canvas
            canvas.width = canvas.width;
            // No translate needed!
            animateBars(analyzer, canvas, canvasCtx, dataArray, bufferLength);
        };

        animate();
    };

    useEffect(() => {
        draw(dataArray, analyzer, bufferLength);
    }, [dataArray, analyzer, bufferLength]);

    return (
        <canvas
            ref={canvasRef}
            width={275}
            height={80}
        />
    );
};

export default WaveForm;
