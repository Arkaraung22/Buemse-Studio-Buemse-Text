import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AppState } from '../types';
import { formatDuration } from '../utils';

interface AudioRecorderProps {
  appState: AppState;
  onRecordingComplete: (blob: Blob) => void;
  setAppState: (state: AppState) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ appState, onRecordingComplete, setAppState }) => {
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(blob);
        stopVisualizer();
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setAppState(AppState.RECORDING);
      
      // Start Timer
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Setup Visualizer
      setupVisualizer(stream);

    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone. Please allow permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setAppState(AppState.PROCESSING);
    }
  };

  const setupVisualizer = (stream: MediaStream) => {
    if (!canvasRef.current) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;
    
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;

    const source = audioContext.createMediaStreamSource(stream);
    sourceRef.current = source;
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      if (!ctx || !analyser) return;

      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = '#f9fafb'; // Match bg-gray-50
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;
        
        // Gradient color for bars
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#0d9488'); // teal-600
        gradient.addColorStop(1, '#2dd4bf'); // teal-400

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();
  };

  const stopVisualizer = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopVisualizer();
    };
  }, []);

  const isRecording = appState === AppState.RECORDING;
  const isProcessing = appState === AppState.PROCESSING;

  return (
    <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-md mx-auto">
      <div className="relative w-full h-32 bg-gray-100 rounded-xl overflow-hidden shadow-inner border border-gray-200">
        <canvas 
          ref={canvasRef} 
          width="400" 
          height="128"
          className="w-full h-full object-cover"
        />
        {!isRecording && !isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
            Visualizer will appear here
          </div>
        )}
      </div>

      <div className="text-3xl font-mono font-bold text-gray-700 tracking-wider">
        {formatDuration(recordingTime)}
      </div>

      <div className="flex gap-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={isProcessing}
            className={`
              flex items-center justify-center w-20 h-20 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105
              ${isProcessing 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-500/30'
              }
            `}
            aria-label="Start Recording"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="flex items-center justify-center w-20 h-20 rounded-full bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/30 transition-all duration-300 transform hover:scale-105"
            aria-label="Stop Recording"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      <div className="text-gray-500 text-sm font-medium">
        {isRecording ? 'Listening...' : isProcessing ? 'Processing audio...' : 'Tap mic to start'}
      </div>
    </div>
  );
};

export default AudioRecorder;
