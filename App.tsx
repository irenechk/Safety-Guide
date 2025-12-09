import React, { useState, useEffect } from 'react';
import { getSafetyAdvice } from './services/geminiService';
import { SafetyAdvice, AppState, Coordinates } from './types';
import AdviceDisplay from './components/AdviceDisplay';
import EmergencyPanel from './components/EmergencyPanel';

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [advice, setAdvice] = useState<SafetyAdvice | null>(null);
  const [currentScenario, setCurrentScenario] = useState('');
  const [location, setLocation] = useState<Coordinates | null>(null);

  useEffect(() => {
    // Attempt to get location quietly on load
    requestLocation();
  }, []);

  const requestLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.warn("Location permission denied or unavailable", error);
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setAppState(AppState.LOADING_ADVICE);
    setCurrentScenario(input);
    
    try {
      const data = await getSafetyAdvice(input);
      setAdvice(data);
      setAppState(AppState.SHOWING_ADVICE);
    } catch (error) {
      console.error(error);
      setAppState(AppState.IDLE); // Simple error handling reset
      alert("We couldn't generate advice right now. Please try again.");
    }
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setAdvice(null);
    setInput('');
  };

  return (
    <div className="min-h-screen bg-[#f0fdf4] flex flex-col font-[Outfit]">
      
      {/* Header */}
      <header className="px-6 py-5 bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold text-xl">
            G
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">GuardianMate</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow px-4 pt-8 pb-32">
        {appState === AppState.IDLE && (
          <div className="max-w-xl mx-auto mt-8 sm:mt-16 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 text-center mb-4 leading-tight">
              Where are you right now?
            </h2>
            <p className="text-slate-600 text-center mb-8 text-lg">
              Enter your location or situation, and I'll give you calm, practical safety advice.
            </p>
            
            <form onSubmit={handleSubmit} className="relative shadow-xl rounded-2xl bg-white p-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g., 'Walking alone at night', 'Subway station', 'First date'"
                className="w-full px-5 py-4 text-lg outline-none text-slate-800 rounded-xl bg-transparent placeholder:text-slate-400"
                autoFocus
              />
              <button 
                type="submit"
                disabled={!input.trim()}
                className="absolute right-3 top-3 bottom-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 rounded-xl font-semibold transition-colors flex items-center gap-2"
              >
                Go
              </button>
            </form>

            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {['Walking home', 'Taking a taxi', 'Concert venue', 'Parking garage'].map(tag => (
                <button
                  key={tag}
                  onClick={() => { setInput(tag); }}
                  className="px-4 py-2 rounded-full bg-white border border-emerald-100 text-slate-600 text-sm hover:bg-emerald-50 hover:text-emerald-700 transition-colors shadow-sm"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {appState === AppState.LOADING_ADVICE && (
          <div className="max-w-xl mx-auto mt-20 text-center animate-pulse">
            <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="text-xl font-semibold text-slate-700">Thinking...</h3>
            <p className="text-slate-500 mt-2">Formulating the best safety advice for you.</p>
          </div>
        )}

        {appState === AppState.SHOWING_ADVICE && advice && (
          <AdviceDisplay 
            advice={advice} 
            scenario={currentScenario} 
            onBack={handleReset} 
          />
        )}
      </main>

      {/* Persistent Emergency Action Panel */}
      <EmergencyPanel 
        currentLocation={location} 
        onRequestLocation={requestLocation} 
      />

    </div>
  );
};

export default App;