
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fetchLessonText } from '../services/geminiService';
import { DialogLine } from '../types';
import { getProgress, saveLessonProgress, markLessonCompleted } from '../utils/progress';

const decodeBase64 = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [needsActivation, setNeedsActivation] = useState(true);
  const [hasStartedBefore, setHasStartedBefore] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const isPlayingRef = useRef(false);
  const lastPlayedIndexRef = useRef<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const isMounted = useRef(true);

  // Focus helper: tìm từ sai đầu tiên hoặc từ trống đầu tiên
  const focusOnTarget = useCallback((forceFirst: boolean = false) => {
    if (forceFirst) {
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
        return;
    }
    const firstIncorrectIndex = isCorrect.findIndex(correct => !correct);
    const targetIndex = firstIncorrectIndex !== -1 ? firstIncorrectIndex : 0;
    setTimeout(() => {
        inputRefs.current[targetIndex]?.focus();
    }, 100);
  }, [isCorrect]);

  useEffect(() => {
    isMounted.current = true;
    return () => { 
        isMounted.current = false;
        if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const playAudio = useCallback(async (isAuto: boolean = false) => {
    const currentLine = lines[currentIndex];
    if (!currentLine || isPlayingRef.current || !currentLine.audioData) return;

    try {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') await ctx.resume();

        isPlayingRef.current = true;
        setIsPlaying(true);

        const decodedBytes = decodeBase64(currentLine.audioData);
        const audioBuffer = await decodeAudioData(decodedBytes, ctx, 24000, 1);
        
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => {
            isPlayingRef.current = false;
            if (isMounted.current) setIsPlaying(false);
        };
        source.start(0);
        lastPlayedIndexRef.current = currentIndex;

        // Chỉ tự động focus khi người dùng chủ động bấm nghe lại
        if (!isAuto) {
            focusOnTarget();
        }

    } catch (e) {
        console.error("Audio error:", e);
        isPlayingRef.current = false;
        if (isMounted.current) setIsPlaying(false);
    }
  }, [currentIndex, lines, focusOnTarget]);

  const startLesson = () => {
    setNeedsActivation(false);
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    audioContextRef.current.resume().then(() => {
        playAudio(true);
        focusOnTarget(true); // Nhảy vào ô 1 khi bắt đầu
    });
  };

  useEffect(() => {
    const loadLesson = async () => {
      if (!lessonId) return;
      setLoading(true);
      const lesson = await fetchLessonText(lessonId);
      if (lesson && isMounted.current) {
        setLines(lesson.lines);
        const prog = getProgress();
        if (prog[lessonId]) {
            setCurrentIndex(prog[lessonId].currentIndex);
            setHasStartedBefore(true);
        }
        setLoading(false);
      }
    };
    loadLesson();
  }, [lessonId]);

  // Khởi tạo trạng thái cho câu mới
  useEffect(() => {
    if (loading || lines.length === 0 || needsActivation) return;

    const currentLine = lines[currentIndex];
    const words = currentLine.text.split(/\s+/).filter(w => w.length > 0);
    setUserInput(new Array(words.length).fill(''));
    setIsCorrect(new Array(words.length).fill(false));
    setHasVisited(new Array(words.length).fill(false));
    
    saveLessonProgress(lessonId!, currentIndex, lines.length);

    if (lastPlayedIndexRef.current !== currentIndex) {
        const timer = setTimeout(() => playAudio(true), 600);
        // Tự động focus ô đầu tiên khi sang câu mới
        focusOnTarget(true);
        return () => clearTimeout(timer);
    }
  }, [currentIndex, loading, lines, needsActivation, lessonId]);

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
          setTimeout(() => inputRefs.current[idx + 1]?.focus(), 10);
      }
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
           markLessonCompleted(lessonId!);
           onBack();
        }
      }
    } else if (e.key === 'Backspace' && userInput[idx] === '' && idx > 0) {
      e.preventDefault();
      inputRefs.current[idx - 1]?.focus();
    }
  };

  if (loading) return (
    <div className="h-full w-full flex flex-col items-center justify-center text-gray-400 bg-gray-950">
        <div className="w-10 h-10 border-4 border-gray-800 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <p className="font-bold tracking-widest text-xs uppercase animate-pulse">Đang tải dữ liệu...</p>
    </div>
  );

  if (needsActivation) return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gray-950 p-6 overflow-hidden">
        <div className="max-w-md w-full text-center space-y-8 flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-indigo-600/20 rounded-full flex items-center justify-center border border-indigo-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Sẵn sàng học tiếng Nga?</h2>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">Click nút bên dưới để bắt đầu. Trình duyệt yêu cầu tương tác để phát âm thanh.</p>
            </div>
            <button 
                onClick={startLesson}
                className="w-full max-w-sm bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-500/20 transition-all active:scale-95 text-lg uppercase tracking-widest"
            >
                {hasStartedBefore ? "Tiếp tục học" : "Bắt đầu học ngay"}
            </button>
        </div>
    </div>
  );

  const currentLine = lines[currentIndex];
  const targetWords = currentLine ? currentLine.text.split(/\s+/).filter(w => w.length > 0) : [];

  return (
    <div className="h-full w-full flex flex-col bg-gray-950 overflow-hidden relative">
      <div className="w-full pt-8 px-8 flex justify-between items-center z-20 shrink-0">
          <div className="flex-1 max-w-xs">
              <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 transition-all duration-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: `${((currentIndex + 1) / lines.length) * 100}%` }}></div>
              </div>
              <p className="text-[10px] text-gray-600 mt-2 font-black uppercase tracking-[0.25em]">CÂU {currentIndex + 1} / {lines.length}</p>
          </div>
          <button onClick={onBack} className="ml-4 text-gray-600 hover:text-white transition-colors text-xs font-black uppercase tracking-widest px-4 py-2 bg-white/5 rounded-lg border border-white/5">
              THOÁT
          </button>
      </div>

      <div className="flex-1 w-full flex flex-col items-center justify-start py-8 px-4 overflow-y-auto overflow-x-hidden">
          <div className="flex flex-col items-center w-full max-w-6xl">
            <button 
                onClick={() => playAudio(false)} 
                disabled={isPlaying}
                className={`w-24 h-24 sm:w-32 sm:h-32 bg-gray-900 border-2 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-95 disabled:opacity-80 mb-10 shrink-0 group relative ${
                    isPlaying ? 'border-indigo-500 ring-4 ring-indigo-500/20' : 'border-gray-800 hover:border-indigo-500'
                }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-12 w-12 sm:h-16 sm:w-16 transition-all ${isPlaying ? 'scale-90 text-indigo-400' : 'text-gray-500 group-hover:scale-110 group-hover:text-white'}`} viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
              </svg>
            </button>

            <div className="flex flex-wrap justify-center gap-x-3 gap-y-10 sm:gap-y-12 w-full px-2 mb-10">
            {targetWords.map((word, idx) => {
                const wordOnly = word.replace(/[.,!?;:«»""]/g, '');
                const firstPuncMatch = word.match(/^[.,!?;:«»""]+/);
                const lastPuncMatch = word.match(/[.,!?;:«»""]+$/);
                const isWordCorrect = isCorrect[idx];
                const showError = hasVisited[idx] && !isWordCorrect && (userInput[idx]?.length > 0);

                return (
                <div key={idx} className="flex flex-col items-center">
                    <div className="flex items-end relative">
                        {firstPuncMatch && <span className="text-gray-700 text-xl sm:text-3xl font-black mr-1 pb-1 sm:pb-2">{firstPuncMatch[0]}</span>}
                        <input
                        ref={el => { inputRefs.current[idx] = el; }}
                        type="text"
                        value={userInput[idx] || ''}
                        onChange={(e) => handleInputChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        onBlur={() => setHasVisited(p => { const n = [...p]; n[idx] = true; return n; })}
                        className={`w-auto min-w-[2.5rem] px-1 pb-1 sm:pb-2 text-center text-lg sm:text-3xl font-black bg-transparent border-b-4 outline-none transition-all duration-300 ${
                            isWordCorrect 
                            ? 'border-emerald-500 text-emerald-400' 
                            : showError 
                                ? 'border-red-600 text-red-500' 
                                : 'border-gray-800 focus:border-indigo-500 text-white'
                        }`}
                        style={{ width: `${Math.max(wordOnly.length, 2) + 0.5}ch` }}
                        autoCapitalize="off" autoComplete="off" autoCorrect="off" spellCheck="false"
                        />
                        {lastPuncMatch && <span className="text-gray-700 text-xl sm:text-3xl font-black ml-1 pb-1 sm:pb-2">{lastPuncMatch[0]}</span>}
                    </div>
                    {showHints && !isWordCorrect && (
                        <div className="h-6 mt-4 flex items-center justify-center animate-in fade-in duration-300">
                            <span className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-widest">
                                {wordOnly}
                            </span>
                        </div>
                    )}
                </div>
                );
            })}
            </div>
            
            <div className="mt-8 h-20 w-full flex items-center justify-center shrink-0">
                {checkAllCorrect(userInput) && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <button 
                            onClick={() => {
                                if (currentIndex < lines.length - 1) setCurrentIndex(p => p + 1);
                                else onBack();
                            }}
                            className="flex items-center gap-4 bg-emerald-600 hover:bg-emerald-500 px-8 py-3 rounded-xl shadow-[0_10px_30px_rgba(16,185,129,0.3)] transition-all text-white font-black text-xl active:scale-95"
                        >
                            TIẾP TỤC <span className="text-2xl opacity-40">⏎</span>
                        </button>
                    </div>
                )}
            </div>
          </div>
      </div>

      <div className="w-full pb-8 pt-4 flex justify-center z-20 shrink-0 bg-gray-950/90 backdrop-blur-sm">
          <button 
              onClick={() => setShowHints(!showHints)}
              className="text-[10px] text-gray-700 hover:text-indigo-400 font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 bg-white/5 px-6 py-2.5 rounded-full border border-white/5"
          >
              <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${showHints ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]' : 'bg-gray-800'}`}></div>
              {showHints ? "Ẩn đáp án" : "Hiện đáp án"}
          </button>
      </div>
    </div>
  );
};

export default DictationRoom;
