/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { useState, useRef, useEffect } from 'react';
import { AnalysisType } from './types';
// Import interface safely or redefine if needed to prevent runtime crash
import { analyzeUrl, analyzeText, analyzeImage, analyzeVideo } from './geminiService';
import type { AnalysisResult } from './geminiService';
import ResultCard from './components/ResultCard';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
  });
};

const App = () => {
  const [activeTab, setActiveTab] = useState(AnalysisType.URL);
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setResult(null);
    setError(null);
    setInputText('');
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setError("El archivo es demasiado grande (Máx 10MB).");
        return;
      }
      setSelectedFile(file);
      setError(null);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let analysisResult: AnalysisResult;
      switch (activeTab) {
        case AnalysisType.URL:
          if (!inputText.trim()) throw new Error("Ingresa un enlace válido.");
          analysisResult = await analyzeUrl(inputText);
          break;
        case AnalysisType.TEXT:
          if (!inputText.trim()) throw new Error("Ingresa texto.");
          analysisResult = await analyzeText(inputText);
          break;
        case AnalysisType.IMAGE:
          if (!selectedFile) throw new Error("Selecciona una imagen.");
          analysisResult = await analyzeImage(await fileToBase64(selectedFile), selectedFile.type);
          break;
        case AnalysisType.VIDEO:
          if (!selectedFile) throw new Error("Selecciona un video.");
          analysisResult = await analyzeVideo(await fileToBase64(selectedFile), selectedFile.type);
          break;
        default:
          throw new Error("Tipo no soportado");
      }
      setResult(analysisResult);
    } catch (err: any) {
      setError(err.message || "Error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 font-sans">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">Verificador de IA</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold">¿Realidad o Ficción?</h2>
          <p className="text-slate-400 mt-2">Detecta contenido generado por IA en segundos.</p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 inline-flex shadow-xl">
            {[
              { id: AnalysisType.URL, label: 'Enlace', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101' },
              { id: AnalysisType.IMAGE, label: 'Imagen', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14' },
              { id: AnalysisType.VIDEO, label: 'Video', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14' },
              { id: AnalysisType.TEXT, label: 'Texto', icon: 'M9 12h6m-6 4h6m2 5H7' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id ? 'bg-slate-800 text-cyan-400 border border-slate-700' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} /></svg>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-2xl mx-auto bg-slate-900/40 rounded-2xl p-6 border border-slate-800 shadow-2xl">
          {activeTab === AnalysisType.URL && (
            <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="https://..." className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500" />
          )}
          {activeTab === AnalysisType.TEXT && (
            <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Pega el texto aquí..." rows={6} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500" />
          )}
          {(activeTab === AnalysisType.IMAGE || activeTab === AnalysisType.VIDEO) && (
            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center cursor-pointer hover:bg-slate-800/30">
              <input type="file" ref={fileInputRef} className="hidden" accept={activeTab === AnalysisType.IMAGE ? "image/*" : "video/*"} onChange={handleFileChange} />
              {previewUrl ? (
                 activeTab === AnalysisType.IMAGE ? <img src={previewUrl} className="max-h-48 mx-auto rounded" /> : <video src={previewUrl} className="max-h-48 mx-auto rounded" controls />
              ) : <p className="text-slate-500">Click para subir archivo</p>}
            </div>
          )}

          <button onClick={handleAnalyze} disabled={loading} className="w-full mt-6 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50">
            {loading ? 'Analizando...' : 'Verificar Contenido'}
          </button>
          
          {error && <div className="mt-4 text-red-400 text-sm text-center">{error}</div>}
        </div>

        <ResultCard result={result} loading={loading} />
      </main>
    </div>
  );
};

export default App;
