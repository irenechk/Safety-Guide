import React from 'react';
import { SafetyAdvice } from '../types';

interface AdviceDisplayProps {
  advice: SafetyAdvice;
  scenario: string;
  onBack: () => void;
}

const AdviceDisplay: React.FC<AdviceDisplayProps> = ({ advice, scenario, onBack }) => {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-fade-in pb-24">
      <div className="flex items-center justify-between mb-4">
         <button 
          onClick={onBack}
          className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 transition-colors"
        >
          ← Back to Search
        </button>
        <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full truncate max-w-[150px]">
          {scenario}
        </span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
        <div className="bg-emerald-50 p-6 border-b border-emerald-100">
          <h2 className="text-2xl font-semibold text-emerald-900">Safety Tips</h2>
          <p className="text-emerald-700 mt-1">Simple ways to stay secure right now.</p>
        </div>
        <div className="p-6">
          <ul className="space-y-3">
            {advice.tips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="bg-emerald-100 text-emerald-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold mt-0.5">✓</span>
                <span className="text-slate-700 leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
          <h3 className="text-lg font-semibold text-orange-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            What to Avoid
          </h3>
          <ul className="space-y-2">
            {advice.avoid.map((item, idx) => (
              <li key={idx} className="text-slate-600 text-sm pl-4 border-l-2 border-orange-200">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Helpful Reminders
          </h3>
          <ul className="space-y-2">
            {advice.reminders.map((item, idx) => (
              <li key={idx} className="text-slate-600 text-sm pl-4 border-l-2 border-blue-200">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-xl font-semibold text-slate-800 mb-4">Step-by-Step Guide</h3>
        <div className="space-y-4">
          {advice.steps.map((step, idx) => (
            <div key={idx} className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm">
                {idx + 1}
              </div>
              <p className="text-slate-700 mt-1">{step}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-800 text-slate-100 rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-white mb-3">If things go wrong...</h3>
        <ul className="space-y-2">
          {advice.emergencyGuide.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm opacity-90">
              <span className="text-rose-400 mt-0.5">•</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AdviceDisplay;