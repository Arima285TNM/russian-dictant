
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fetchLessonText, generateRussianSpeech } from '../services/geminiService';
import { DialogLine } from '../types';
import { saveProgress } from '../utils/progress';

const decodeBase64Audio = (base64: string) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const decodeAudioData = async (data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> => {
  const dataInt16 = new Int16Array(data.buffer);
  const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
};

interface DictationRoomProps {
  lessonId: string | null;
  onBack: () => void;
}

const DictationRoom: React.FC<DictationRoomProps> = ({ lessonId, onBack }) => {
  const [lines, setLines] = useState<DialogLine[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userInput, setUserInput] = useState<string[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean[]>([]);
  const [hasVisited, setHasVisited] = useState<boolean[]>([]);
  const [isFetchingAudio, setIsFetchingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showHints, setShowHints] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const isMounted = useRef(true);
  const lastAutoPlayedIndex = useRef<number>(-1);
  const linesRef = useRef<DialogLine[]>([]);
  const preloadQueue = useRef<Set<number>>(new Set());

  useEffect(() => {
    linesRef.current = lines;
  }, [lines]);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const playDecodedAudio = useCallback(async (audioDataB64: string) => {
     if (!audioDataB64 || !isMounted.current || isPlaying) return;
     setIsPlaying(true);
     try {
       if (!audioContextRef.current) {
         audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
       }
       const ctx = audioContextRef.current;
       if (ctx.state === 'suspended') await ctx.resume();
       const audioData = decodeBase64Audio(audioDataB64);
       const buffer = await decodeAudioData(audioData, ctx);
       const source = ctx.createBufferSource();
       source.buffer = buffer;
       source.connect(ctx.destination);
       source.onended = () => setIsPlaying(false);
       source.start();
     } catch (e) {
       console.error("Error playing audio:", e);
       setIsPlaying(false);
     }
  }, [isPlaying]);

  const preloadAudio = useCallback(async (index: number) => {
    if (index >= linesRef.current.length || preloadQueue.current.has(index)) return;
    const line = linesRef.current[index];
    if (line && line.audioData) return;

    preloadQueue.current.add(index);
    try {
      await new Promise(r => setTimeout(r, 800)); 
      const audioData = await generateRussianSpeech(line.text, line.speaker);
      if (isMounted.current) {
        setLines(prev => {
          const newLines = [...prev];
          if (newLines[index]) newLines[index] = { ...newLines[index], audioData };
          return newLines;
        });
      }
    } catch (e) {
      console.error(`Preload failed for line ${index}`, e);
    } finally {
      preloadQueue.current.delete(index);
    }
  }, []);

  const fetchAndPlayAudio = useCallback(async (index: number, isAuto: boolean = false) => {
    if (isPlaying) return;
    if (isAuto && lastAutoPlayedIndex.current === index) return;
    
    const line = linesRef.current[index];
    if (!line) return;

    if (line.audioData) {
      playDecodedAudio(line.audioData);
      if (isAuto) lastAutoPlayedIndex.current = index;
      return;
    }

    setIsFetchingAudio(true);
    try {
      const audioData = await generateRussianSpeech(line.text, line.speaker);
      if (isMounted.current) {
        setLines(prev => {
          const newLines = [...prev];
          if (newLines[index]) newLines[index] = { ...newLines[index], audioData };
          return newLines;
        });
        playDecodedAudio(audioData);
        if (isAuto) lastAutoPlayedIndex.current = index;
      }
    } catch (e) {
      console.error("Fetch and play failed", e);
    } finally {
      if (isMounted.current) setIsFetchingAudio(false);
    }
  }, [playDecodedAudio, isPlaying]);

  useEffect(() => {
    const loadLesson = async () => {
      if (!lessonId) return;
      setLoading(true);
      lastAutoPlayedIndex.current = -1;
      const lesson = await fetchLessonText(lessonId);
      if (lesson && isMounted.current) {
        setLines(lesson.lines);
        setLoading(false);
        setCurrentIndex(0);
      }
    };
    loadLesson();
  }, [lessonId]);

  useEffect(() => {
    if (loading || lines.length === 0) return;

    const currentLine = lines[currentIndex];
    const words = currentLine.text.split(/\s+/).filter(w => w.length > 0);
    setUserInput(new Array(words.length).fill(''));
    setIsCorrect(new Array(words.length).fill(false));
    setHasVisited(new Array(words.length).fill(false));
    
    fetchAndPlayAudio(currentIndex, true);
    preloadAudio(currentIndex + 1);
    preloadAudio(currentIndex + 2);

    setTimeout(() => {
        inputRefs.current[0]?.focus();
        setHasVisited(prev => { const n = [...prev]; n[0] = true; return n; });
    }, 150);
  }, [currentIndex, loading, lines.length, fetchAndPlayAudio, preloadAudio]);

  const cleanWord = (w: string) => w.replace(/[.,!?;:«»""]/g, '').toLowerCase().trim();

  const handleInputChange = (idx: number, val: string) => {
    const currentLine = lines[currentIndex];
    const targetWords = currentLine?.text.split(/\s+/).filter(w => w.length > 0) || [];
    const newUserInput = [...userInput];
    newUserInput[idx] = val;
    setUserInput(newUserInput);

    const targetClean = cleanWord(targetWords[idx]);
    const typedRaw = val;
    const typedClean = cleanWord(val);

    if (typedClean === targetClean) {
      const newIsCorrect = [...isCorrect];
      newIsCorrect[idx] = true;
      setIsCorrect(newIsCorrect);
      
      if (idx < targetWords.length - 1 && typedRaw.endsWith(' ')) {
          setTimeout(() => {
              inputRefs.current[idx + 1]?.focus();
              setHasVisited(prev => { const n = [...prev]; n[idx+1] = true; return n; });
          }, 10);
      }
    } else if (isCorrect[idx]) {
        const newIsCorrect = [...isCorrect];
        newIsCorrect[idx] = false;
        setIsCorrect(newIsCorrect);
    }
  };

  const checkAllCorrect = (currentInputs: string[]) => {
    if (lines.length === 0) return false;
    const targets = lines[currentIndex].text.split(/\s+/).filter(w => w.length > 0);
    return targets.every((t, i) => cleanWord(currentInputs[i] || '') === cleanWord(t));
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (checkAllCorrect(userInput)) {
        if (currentIndex < lines.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
           saveProgress(lessonId!, 100);
           onBack();
        }
      }
    } else if (e.key === 'Backspace' && userInput[idx] === '' && idx > 0) {
      e.preventDefault();
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handleBlur = (idx: number) => {
      setHasVisited(prev => {
          const n = [...prev];
          n[idx] = true;
          return n;
      });
  };

  if (loading) return (
    <div className="h-full w-full flex flex-col items-center justify-center text-gray-400 bg-gray-900">
        <div className="w-8 h-8 border-4 border-gray-600 border-t-indigo-500 rounded-full animate-spin mb-4" />
        Đang tải hội thoại...
    </div>
  );

  const currentLine = lines[currentIndex];
  const targetWords = currentLine ? currentLine.text.split(/\s+/).filter(w => w.length > 0) : [];

  return (
    <div className="h-full w-full flex flex-col bg-gray-950 overflow-hidden relative">
      {/* Header cố định */}
      <div className="w-full pt-8 px-8 flex justify-between items-center z-20 shrink-0">
          <div className="flex-1 max-w-xs">
              <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 transition-all duration-300 shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: `${((currentIndex + 1) / lines.length) * 100}%` }}></div>
              </div>
              <p className="text-[10px] text-gray-600 mt-2 font-black uppercase tracking-[0.25em]">CÂU {currentIndex + 1} / {lines.length}</p>
          </div>
          <button onClick={onBack} className="ml-4 text-gray-600 hover:text-white transition-colors text-xs font-black uppercase tracking-widest flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/5">
              THOÁT
          </button>
      </div>

      {/* Main Content: Scrollable area for words */}
      <div className="flex-1 w-full flex flex-col items-center justify-start py-10 px-4 overflow-y-auto scroll-smooth">
          <div className="flex flex-col items-center w-full max-w-6xl">
            <button 
                onClick={() => fetchAndPlayAudio(currentIndex, false)} 
                disabled={isFetchingAudio || isPlaying}
                className={`w-28 h-28 sm:w-32 sm:h-32 bg-gray-900 border-2 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-95 disabled:opacity-80 mb-12 shrink-0 group relative ${
                    isPlaying ? 'border-indigo-500 ring-4 ring-indigo-500/20 cursor-default' : 'border-gray-800 hover:border-indigo-500'
                }`}
            >
              {isFetchingAudio ? (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-gray-700 border-t-indigo-500 rounded-full animate-spin" />
              ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-12 w-12 sm:h-16 sm:w-16 transition-all ${isPlaying ? 'scale-90 text-indigo-400' : 'text-gray-500 group-hover:scale-110 group-hover:text-white'}`} viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                  </svg>
              )}
              <div className="absolute -bottom-4 bg-indigo-600 text-[9px] font-black px-2.5 py-1 rounded text-white opacity-0 group-hover:opacity-100 transition-all tracking-widest translate-y-2 group-hover:translate-y-0">
                {isPlaying ? 'ĐANG PHÁT' : 'PHÁT LẠI'}
              </div>
            </button>

            <div className="flex flex-wrap justify-center gap-x-3 gap-y-10 sm:gap-y-14 w-full">
            {targetWords.map((word, idx) => {
                const puncMatch = word.match(/[.,!?;:«»""]+/);
                const firstPunc = word.match(/^[.,!?;:«»""]+/);
                const lastPunc = word.match(/[.,!?;:«»""]+$/);
                
                let wordOnly = word;
                if (firstPunc) wordOnly = wordOnly.slice(firstPunc[0].length);
                if (lastPunc) wordOnly = wordOnly.slice(0, -lastPunc[0].length);
                
                const isWordCorrect = isCorrect[idx];
                const showError = hasVisited[idx] && !isWordCorrect && (userInput[idx]?.length > 0);

                return (
                <div key={idx} className="flex flex-col items-center">
                    <div className="flex items-end relative">
                        {firstPunc && <span className="text-gray-700 text-2xl sm:text-3xl font-black mr-1 pb-2">{firstPunc[0]}</span>}
                        <input
                        ref={el => inputRefs.current[idx] = el}
                        type="text"
                        value={userInput[idx] || ''}
                        onChange={(e) => handleInputChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        onBlur={() => handleBlur(idx)}
                        onFocus={() => { setHasVisited(prev => { const n = [...prev]; n[idx] = true; return n; }); }}
                        className={`w-auto min-w-[3rem] px-1 pb-1 sm:pb-2 text-center text-xl sm:text-3xl font-black bg-transparent border-b-4 outline-none transition-all duration-300 ${
                            isWordCorrect 
                            ? 'border-emerald-500 text-emerald-400' 
                            : showError 
                                ? 'border-red-600 text-red-500 shadow-[0_4px_0_rgba(220,38,38,0.2)]' 
                                : 'border-gray-800 focus:border-indigo-500 text-white'
                        }`}
                        style={{ width: `${Math.max(wordOnly.length, 2) + 0.5}ch` }}
                        autoCapitalize="off"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck="false"
                        />
                        {lastPunc && <span className="text-gray-700 text-2xl sm:text-3xl font-black ml-1 pb-2">{lastPunc[0]}</span>}
                    </div>
                    
                    <div className="h-6 mt-4 flex items-center justify-center">
                        {showHints && !isWordCorrect && (
                            <span className="text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-widest animate-in fade-in slide-in-from-top-1 duration-300">
                                {wordOnly}
                            </span>
                        )}
                    </div>
                </div>
                );
            })}
            </div>
            
            {/* Nút Tiếp Tục xuất hiện ngay dưới nội dung khi đúng */}
            <div className="mt-12 h-24 w-full flex items-center justify-center shrink-0">
                {checkAllCorrect(userInput) && (
                    <div 
                        className="flex flex-col items-center gap-4 animate-in scale-in-95 fade-in duration-300 cursor-pointer group" 
                        onClick={() => {
                            if (currentIndex < lines.length - 1) setCurrentIndex(p => p + 1);
                            else onBack();
                        }}
                    >
                        <div className="flex items-center gap-4 bg-indigo-600 hover:bg-indigo-500 px-8 py-4 rounded-xl shadow-[0_20px_50px_rgba(79,70,229,0.3)] transition-all text-white font-black text-xl active:scale-95">
                            TIẾP TỤC <span className="text-2xl opacity-40">⏎</span>
                        </div>
                        <span className="text-[10px] uppercase font-black tracking-[0.5em] text-indigo-400/50">Hoặc nhấn Enter</span>
                    </div>
                )}
            </div>
          </div>
      </div>

      {/* Footer cố định */}
      <div className="w-full pb-8 pt-4 flex justify-center z-20 shrink-0 bg-gray-950/80 backdrop-blur-sm">
          <button 
              onClick={() => setShowHints(!showHints)}
              className="text-[10px] text-gray-700 hover:text-indigo-400 font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/5"
          >
              <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${showHints ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]' : 'bg-gray-800'}`}></div>
              {showHints ? "Ẩn đáp án" : "Hiện đáp án"}
          </button>
      </div>
    </div>
  );
};

export default DictationRoom;
