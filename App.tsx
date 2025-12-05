import React, { useState } from 'react';
import AudioRecorder from './components/AudioRecorder';
import EssayDisplay from './components/EssayDisplay';
import { transcribeAndTranslateToBurmese } from './services/geminiService';
import { AppState } from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [resultText, setResultText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRecordingComplete = async (audioBlob: Blob) => {
    setAppState(AppState.PROCESSING);
    setErrorMessage(null);

    try {
      const text = await transcribeAndTranslateToBurmese(audioBlob);
      setResultText(text);
      setAppState(AppState.COMPLETED);
    } catch (error) {
      console.error(error);
      setErrorMessage("Sorry, we encountered an error processing your audio. Please try again.");
      setAppState(AppState.ERROR);
    }
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setResultText('');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl mb-4 tracking-tight">
          <span className="block text-teal-600">Burmese</span> 
          Voice Essay
        </h1>
        <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
          Record your thoughts in any language and get a formal Burmese essay draft instantly.
        </p>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-3xl">
        {(appState === AppState.IDLE || appState === AppState.RECORDING || appState === AppState.PROCESSING || appState === AppState.ERROR) && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <AudioRecorder 
              appState={appState}
              setAppState={setAppState}
              onRecordingComplete={handleRecordingComplete}
            />
             {appState === AppState.PROCESSING && (
              <div className="mt-8 flex justify-center">
                <div className="flex items-center space-x-2 text-teal-600 animate-pulse">
                  <svg className="animate-spin h-5 w-5 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="font-medium">Generating Burmese Text...</span>
                </div>
              </div>
            )}
             {errorMessage && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-center">
                {errorMessage}
                <div className="mt-2">
                   <button onClick={handleReset} className="text-sm font-bold underline hover:text-red-800">Try Again</button>
                </div>
              </div>
            )}
          </div>
        )}

        {appState === AppState.COMPLETED && (
          <EssayDisplay text={resultText} onReset={handleReset} />
        )}
      </div>

      {/* Footer Instructions */}
      <div className="mt-16 text-center text-gray-400 text-sm">
        <p>Uses Google Gemini 2.5 Flash for audio transcription and translation.</p>
        <p className="mt-1">Speak clearly for best results.</p>
      </div>
    </div>
  );
};

export default App;
