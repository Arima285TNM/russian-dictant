
import React, { useState, useEffect, useRef } from 'react';
import { fetchLessonText } from '../services/geminiService';
import { DialogLine } from '../types';
import { getProgress, saveLessonProgress } from '../utils/progress';
import { GoogleGenAI, Modality } from "@google/genai";

const WordTooltip: React.FC<{ word: string, meaning?: string, isDarkMode: boolean }> = ({ word, meaning, isDarkMode }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div 
      className="relative inline-block group"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <span className={`cursor-help transition-colors border-b border-dotted ${isDarkMode ? 'hover:text-indigo-400 border-slate-700' : 'hover:text-indigo-600 border-slate-300'}`}>{word}</span>
      {isVisible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[100] animate-in fade-in zoom-in duration-150">
          <div className={`${isDarkMode ? 'bg-slate-900 text-indigo-300 border-indigo-500/30' : 'bg-white text-indigo-700 border-indigo-200'} text-[10px] font-bold px-3 py-1.5 rounded-lg border whitespace-nowrap shadow-xl max-w-xs text-center`}>
            {meaning || "..."}
          </div>
          <div className={`w-2 h-2 border-r border-b rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2 ${isDarkMode ? 'bg-slate-900 border-indigo-500/30' : 'bg-white border-indigo-200'}`}></div>
        </div>
      )}
    </div>
  );
};

const decodeBase64 = (base64: string) => {
  try {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    return new Uint8Array();
  }
};

async function decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}

interface DictationRoomProps {
  lessonId: string | null;
  onBack: () => void;
  isDarkMode: boolean;
}

const DictationRoom: React.FC<DictationRoomProps> = ({ lessonId, onBack, isDarkMode }) => {
  const [lines, setLines] = useState<DialogLine[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userInput, setUserInput] = useState<string[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [needsActivation, setNeedsActivation] = useState(true);

  const audioContextRef = useRef<AudioContext | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const loadLesson = async () => {
      if (!lessonId) return;
      setLoading(true);
      try {
        const lesson = await fetchLessonText(lessonId);
        if (lesson && lesson.lines && lesson.lines.length > 0) {
          setLines(lesson.lines);
          const prog = getProgress();
          if (prog[lessonId]) {
            setCurrentIndex(Math.min(prog[lessonId].currentIndex, lesson.lines.length - 1));
          } else {
            setCurrentIndex(0);
          }
        } else {
          onBack();
        }
      } catch (err) {
        onBack();
      } finally {
        setLoading(false);
      }
    };
    loadLesson();
    return () => {
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
    };
  }, [lessonId]);

  useEffect(() => {
    if (loading || !lines || lines.length === 0 || !lines[currentIndex] || needsActivation) return;
    
    const words = lines[currentIndex].text.split(/\s+/).filter(w => w.length > 0);
    setUserInput(new Array(words.length).fill(''));
    setIsCorrect(new Array(words.length).fill(false));
    
    if (lessonId) {
        saveLessonProgress(lessonId, currentIndex, lines.length);
    }
    
    playAudio();
  }, [currentIndex, lines, needsActivation, loading]);

  const playAudio = async () => {
    if (!lines || lines.length === 0 || !lines[currentIndex] || isPlaying) return;
    const line = lines[currentIndex];

    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') await ctx.resume();

    setIsPlaying(true);

    try {
        let audioBuffer: AudioBuffer;
        if (line.audioData) {
            const bytes = decodeBase64(line.audioData);
            audioBuffer = await decodeAudioData(bytes, ctx);
        } else {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
              model: "gemini-2.5-flash-preview-tts",
              contents: [{ parts: [{ text: `Say clearly: ${line.text}` }] }],
              config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
              },
            });
            const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (!base64) throw new Error("TTS failed");
            audioBuffer = await decodeAudioData(decodeBase64(base64), ctx);
        }

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => setIsPlaying(false);
        source.start(0);
    } catch (e) {
        console.error("Audio error:", e);
        setIsPlaying(false);
    }
  };

  const handleInputChange = (idx: number, val: string) => {
    if (!lines || !lines[currentIndex]) return;
    const targetWords = lines[currentIndex].text.split(/\s+/).filter(w => w.length > 0);
    const newUserInput = [...userInput];
    newUserInput[idx] = val;
    setUserInput(newUserInput);

    const cleanRegex = /[.,!?;:«»""\(\)\[\]]/g;
    const targetClean = targetWords[idx].replace(cleanRegex, '').toLowerCase().trim();
    const typedClean = val.replace(cleanRegex, '').toLowerCase().trim();

    if (typedClean === targetClean) {
      const newIsCorrect = [...isCorrect];
      newIsCorrect[idx] = true;
      setIsCorrect(newIsCorrect);
      if (val.endsWith(' ')) {
          inputRefs.current[idx + 1]?.focus();
      }
    }
  };

  if (loading) return (
    <div className={`h-full w-full flex flex-col items-center justify-center transition-colors duration-500 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className={`w-12 h-12 border-4 rounded-full animate-spin mb-4 ${isDarkMode ? 'border-slate-800 border-t-indigo-500' : 'border-slate-200 border-t-indigo-600'}`}></div>
      <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Đang chuẩn bị...</p>
    </div>
  );

  if (needsActivation) return (
    <div className={`h-full w-full flex flex-col items-center justify-center transition-colors duration-500 p-6 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <div className="mb-12 text-center animate-in fade-in zoom-in duration-700">
            <h2 className={`text-4xl md:text-5xl font-black mb-4 uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Luyện Nghe Chép</h2>
            <p className="text-slate-500 font-medium max-w-sm mx-auto">Hãy nghe thật kỹ và gõ lại chính xác từng từ bạn nghe thấy.</p>
        </div>
        <button 
            onClick={() => setNeedsActivation(false)} 
            className="bg-indigo-600 hover:bg-indigo-500 transition-all px-14 py-7 rounded-[2.5rem] text-white font-black uppercase tracking-widest text-2xl shadow-2xl active:scale-95 group relative overflow-hidden"
        >
            Bắt đầu bài học
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </button>
        <button onClick={onBack} className="mt-12 text-slate-500 hover:text-indigo-600 transition-colors text-xs font-black uppercase tracking-[0.2em] px-4 py-2 border border-transparent hover:border-slate-200 rounded-xl">Quay lại thư viện</button>
    </div>
  );

  if (!lines || lines.length === 0 || !lines[currentIndex]) return null;

  const currentLineWords = lines[currentIndex].text.split(/\s+/).filter(w => w.length > 0);

  return (
    <div className={`h-full w-full flex flex-col transition-colors duration-500 overflow-hidden relative ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <div className="pt-8 px-8 flex justify-between items-center shrink-0">
          <div className="flex-1 max-w-xs">
              <div className={`h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-900' : 'bg-slate-200'}`}>
                  <div className="h-full bg-indigo-600 shadow-[0_0_15px_rgba(99,102,241,0.6)] transition-all duration-700" style={{ width: `${((currentIndex + 1) / lines.length) * 100}%` }}></div>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 font-black uppercase tracking-widest">Tiến độ bài học: {currentIndex + 1} / {lines.length}</p>
          </div>
          <button onClick={onBack} className={`text-xs font-black uppercase tracking-widest px-6 py-2.5 rounded-xl border transition-all active:scale-95 ${isDarkMode ? 'text-slate-400 hover:text-white bg-white/5 border-white/5' : 'text-slate-500 hover:text-slate-900 bg-white border-slate-200 shadow-sm'}`}>Thoát</button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center py-8 px-4 overflow-y-auto scrollbar-hide">
          <div className="relative">
              <button 
                onClick={playAudio} 
                disabled={isPlaying} 
                className={`w-40 h-40 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-2xl ${isDarkMode ? 'bg-slate-900 border-2 border-slate-800' : 'bg-white border-2 border-slate-100'} ${isPlaying ? 'border-indigo-500' : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-20 w-20 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                </svg>
              </button>
              {isPlaying && (
                <div className="absolute -inset-4 border-2 border-indigo-500/20 rounded-full animate-ping"></div>
              )}
          </div>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-16 mt-20 w-full max-w-5xl animate-in fade-in slide-in-from-bottom-8" key={currentIndex}>
            {currentLineWords.map((word, idx) => {
                const cleanWord = word.toLowerCase().replace(/[.,!?;:«»""\(\)\[\]]/g, '').trim();
                return (
                    <div key={idx} className="flex flex-col items-center group/word">
                        <input
                            ref={el => { inputRefs.current[idx] = el; }}
                            value={userInput[idx] || ''}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck="false"
                            onChange={(e) => handleInputChange(idx, e.target.value)}
                            className={`min-w-[2.5rem] px-2 pb-4 text-center text-3xl font-black bg-transparent border-b-4 outline-none transition-all ${isCorrect[idx] ? 'border-emerald-500 text-emerald-500' : (isDarkMode ? 'border-slate-800 text-white focus:border-indigo-500' : 'border-slate-200 text-slate-900 focus:border-indigo-600')}`}
                            style={{ width: `${Math.max(word.length, 2)}ch` }}
                        />
                        {(showHints || isCorrect[idx]) && (
                            <div className="mt-4 text-[11px] font-black text-slate-500 uppercase tracking-widest opacity-80 group-hover/word:opacity-100 transition-opacity">
                                <WordTooltip word={word} meaning={lines[currentIndex].wordMeanings?.[cleanWord]} isDarkMode={isDarkMode} />
                            </div>
                        )}
                    </div>
                );
            })}
          </div>
          
          {isCorrect.length > 0 && isCorrect.every(v => v) && (
              <button 
                onClick={() => currentIndex < lines.length - 1 ? setCurrentIndex(p => p + 1) : onBack()} 
                className="mt-20 bg-emerald-600 hover:bg-emerald-500 px-16 py-6 rounded-2xl text-white font-black text-xl uppercase shadow-2xl animate-in zoom-in duration-300 transform-gpu active:scale-95 flex items-center gap-4"
              >
                {currentIndex < lines.length - 1 ? "Câu tiếp theo" : "Hoàn thành bài tập"}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 5l7 7-7 7" /></svg>
              </button>
          )}
      </div>

      <div className="pb-10 flex justify-center shrink-0">
          <button 
            onClick={() => setShowHints(!showHints)} 
            className={`text-[10px] font-black uppercase tracking-widest px-10 py-3.5 rounded-full border transition-all active:scale-95 ${showHints ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : (isDarkMode ? 'bg-white/5 border-white/10 text-slate-500 hover:text-indigo-400' : 'bg-white border-slate-200 text-slate-500 hover:text-indigo-600 shadow-sm')}`}
          >
            {showHints ? "Ẩn đáp án" : "Xem đáp án"}
          </button>
      </div>
    </div>
  );
};

export default DictationRoom;
