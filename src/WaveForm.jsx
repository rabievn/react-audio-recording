import {useRef, useEffect} from "react";

function animateBars(analyser, canvas, canvasCtx, dataArray, bufferLength) {
    analyser.getByteFrequencyData(dataArray);

    const centerY = canvas.height / 2;
    const HEIGHT = canvas.height / 2; // Max height to fill from center out

    const barWidth = Math.ceil(canvas.width / bufferLength) * 0.5;

    let x = 0;

    // Create gradient once
    const gradient = canvasCtx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#8595E5'); // Top
    gradient.addColorStop(1, '#42C5EB'); // Bottom
    canvasCtx.fillStyle = gradient;

    for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * HEIGHT;

        // Draw bar up and down from centerY
        // (x, centerY - barHeight / 2, barWidth, barHeight)
        canvasCtx.fillRect(x, centerY - barHeight / 2, barWidth, barHeight);

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
            // eslint-disable-next-line no-self-assign
            canvas.width = canvas.width;
            canvasCtx.translate(0, canvas.offsetHeight / 2 - 115);
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
            width={1000}
            height={200}
        />
    );
};

export default WaveForm;
