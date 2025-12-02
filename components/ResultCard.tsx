/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React from 'react';
import type { AnalysisResult } from '../geminiService';

interface ResultCardProps {
  result: AnalysisResult | null;
  loading: boolean;
}

const ResultCard: React.FC<ResultCardProps> = ({ result, loading }) => {
  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-8 p-8 bg-slate-800/50 rounded-2xl border border-slate-700 animate-pulse text-center">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-cyan-400">Analizando con Gemini...</p>
      </div>
    );
  }

  if (!result) return null;

  const isAi = result.verdict === 'AI';
  const colorClass = isAi ? 'rose' : result.verdict === 'Human' ? 'emerald' : 'yellow';

  return (
    <div className={`w-full max-w-2xl mx-auto mt-8 p-6 rounded-2xl border border-${colorClass}-500/50 bg-${colorClass}-500/5 backdrop-blur-md`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-2xl font-bold text-${colorClass}-400`}>{result.verdict === 'AI' ? 'Probablemente IA' : result.verdict === 'Human' ? 'Probablemente Humano' : 'Incierto'}</h2>
        <span className={`text-2xl font-bold text-${colorClass}-400`}>{result.confidenceScore}%</span>
      </div>
      <div className="bg-slate-900/50 p-4 rounded-xl mb-6">
        <p className="text-slate-300">{result.reasoning}</p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-slate-200 font-semibold mb-2">Indicadores</h3>
          <ul className="space-y-1">
            {result.indicators.map((ind, i) => <li key={i} className="text-sm text-slate-400">• {ind}</li>)}
          </ul>
        </div>
        {result.sources && (
          <div>
            <h3 className="text-slate-200 font-semibold mb-2">Fuentes</h3>
            <ul className="space-y-1">
              {result.sources.map((s, i) => <li key={i}><a href={s.uri} target="_blank" className="text-sm text-cyan-400 hover:underline truncate block">{s.title}</a></li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultCard;
