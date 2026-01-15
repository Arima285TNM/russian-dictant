
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
  const [isFetchingAudio, setIsFetchingAudio] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const isMounted = useRef(true);
  
  const linesRef = useRef<DialogLine[]>([]);
  const audioPromisesRef = useRef<Map<number, Promise<string>>>(new Map());
  const audioQueueRef = useRef<number[]>([]);
  const isProcessingQueueRef = useRef<boolean>(false);

  useEffect(() => {
    linesRef.current = lines;
  }, [lines]);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const playDecodedAudio = useCallback(async (audioDataB64: string) => {
     if (!audioDataB64 || !isMounted.current) return;
     try {
       if (!audioContextRef.current) {
         audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
       }
       const ctx = audioContextRef.current;
       await ctx.resume();
       const audioData = decodeBase64Audio(audioDataB64);
       const buffer = await decodeAudioData(audioData, ctx);
       
       const source = ctx.createBufferSource();
       source.buffer = buffer;
       source.connect(ctx.destination);
       source.start();
     } catch (e) {
       console.error("Error playing audio:", e);
     }
  }, []);

  const fetchAndSetAudio = useCallback(async (index: number) => {
    const line = linesRef.current[index];
    if (!line || line.audioData) return;

    if (audioPromisesRef.current.has(index)) {
        await audioPromisesRef.current.get(index);
        return;
    }

    const fetchPromise = generateRussianSpeech(line.text, line.speaker)
      .then(audioData => {
        if (isMounted.current) {
          setLines(prevLines => {
            const newLines = [...prevLines];
            if (newLines[index]) {
              newLines[index] = { ...newLines[index], audioData };
            }
            return newLines;
          });
        }
        audioPromisesRef.current.delete(index);
        return audioData;
      })
      .catch(error => {
        console.error(`Failed to fetch audio for line ${index}:`, error);
        audioPromisesRef.current.delete(index);
        throw error;
      });

    audioPromisesRef.current.set(index, fetchPromise);
    await fetchPromise;
  }, []);

  const processQueue = useCallback(async () => {
    if (isProcessingQueueRef.current || audioQueueRef.current.length === 0) {
      return;
    }
    isProcessingQueueRef.current = true;

    const indexToProcess = audioQueueRef.current.shift();

    if (indexToProcess !== undefined) {
        await fetchAndSetAudio(indexToProcess);
    }
    
    isProcessingQueueRef.current = false;
    processQueue();
  }, [fetchAndSetAudio]);

  const addToQueue = useCallback((index: number) => {
    const line = linesRef.current[index];
    if (index >= linesRef.current.length || !line || line.audioData || audioPromisesRef.current.has(index)) {
      return;
    }
    if (!audioQueueRef.current.includes(index)) {
      audioQueueRef.current.push(index);
    }
    processQueue();
  }, [processQueue]);

  useEffect(() => {
    const loadLesson = async () => {
      if (!lessonId) return;
      setLoading(true);
      setLines([]);
      setCurrentIndex(0);
      audioPromisesRef.current.clear();
      audioQueueRef.current = [];
      isProcessingQueueRef.current = false;
      const lesson = await fetchLessonText(lessonId);
      if (lesson && isMounted.current) {
        setLines(lesson.lines);
        setLoading(false);
      }
    };
    loadLesson();
  }, [lessonId]);

  const playCurrentLineAudio = useCallback(async () => {
    const line = lines[currentIndex];
    if (!line) return;

    if (line.audioData) {
      playDecodedAudio(line.audioData);
    } else {
      setIsFetchingAudio(true);
      addToQueue(currentIndex);
      try {
        const audioData = await audioPromisesRef.current.get(currentIndex);
        if (audioData) playDecodedAudio(audioData);
      } catch (e) {
        // Error is logged elsewhere
      } finally {
        if (isMounted.current) setIsFetchingAudio(false);
      }
    }
  }, [currentIndex, lines, addToQueue, playDecodedAudio]);

  useEffect(() => {
    if (loading || lines.length === 0) return;

    const currentLine = lines[currentIndex];
    const newTargetWords = currentLine.text.split(/\s+/).filter(w => w.length > 0);
    setUserInput(new Array(newTargetWords.length).fill(''));
    setIsCorrect(new Array(newTargetWords.length).fill(false));
    inputRefs.current = [];
    
    playCurrentLineAudio();
    setTimeout(() => inputRefs.current[0]?.focus(), 100);

    const PRELOAD_AHEAD = 2;
    for (let i = 1; i <= PRELOAD_AHEAD; i++) {
      addToQueue(currentIndex + i);
    }
  }, [currentIndex, loading, lines.length, playCurrentLineAudio, addToQueue]);

  useEffect(() => {
    if (lessonId && lines.length > 0 && currentIndex > 0) {
      const progress = Math.round(((currentIndex) / lines.length) * 100);
      saveProgress(lessonId, progress);
    }
  }, [currentIndex, lessonId, lines.length]);

  const cleanWord = (w: string) => w.replace(/[.,!?;:]/g, '').toLowerCase();

  const handleInputChange = (idx: number, val: string) => {
    const targetWords = lines[currentIndex]?.text.split(/\s+/).filter(w => w.length > 0) || [];
    const newUserInput = [...userInput];
    newUserInput[idx] = val;
    setUserInput(newUserInput);

    const target = cleanWord(targetWords[idx]);
    const typed = cleanWord(val);

    if (typed === target || val.trim() === target) {
      const newIsCorrect = [...isCorrect];
      newIsCorrect[idx] = true;
      setIsCorrect(newIsCorrect);
      
      if (val.endsWith(' ') || typed === target) {
         if (idx < targetWords.length - 1) {
            inputRefs.current[idx + 1]?.focus();
         }
      }
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const allCorrect = isCorrect.every(v => v);
      if (allCorrect && currentIndex < lines.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else if (allCorrect && currentIndex === lines.length - 1) {
        if(lessonId) saveProgress(lessonId, 100);
        onBack();
      }
    } else if (e.key === 'Backspace' && userInput[idx] === '' && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };
  
  const currentLine = lines[currentIndex];
  const targetWords = currentLine ? currentLine.text.split(/\s+/).filter(w => w.length > 0) : [];

  if (loading) {
    return (
        <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <div className="w-8 h-8 border-4 border-gray-600 border-t-indigo-500 rounded-full animate-spin mb-4" />
            Đang tải bài học...
        </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-gray-900">
      <div className="w-full max-w-4xl text-center">
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-full max-w-md">
            <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${((currentIndex + 1) / lines.length) * 100}%` }}></div>
            </div>
            <p className="text-sm text-gray-400 mt-2 font-medium">Câu {currentIndex + 1} / {lines.length}</p>
        </div>

        <div className="absolute top-8 right-8">
            <button onClick={onBack} className="text-gray-500 hover:text-white transition-colors text-sm font-bold">Thoát</button>
        </div>

        <div className="flex flex-col items-center justify-center h-full mt-24">
            <button 
                onClick={playCurrentLineAudio}
                disabled={isFetchingAudio}
                className="w-16 h-16 bg-gray-800 border border-gray-700 hover:border-indigo-500 text-gray-400 hover:text-white rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-wait mb-12"
            >
              {isFetchingAudio ? (
                  <div className="w-7 h-7 border-4 border-gray-600 border-t-indigo-500 rounded-full animate-spin" />
              ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                  </svg>
              )}
            </button>
            
            <p className="text-2xl font-semibold text-gray-200 mb-8">{currentLine?.speaker}</p>

            <div className="flex flex-wrap justify-center gap-x-2 gap-y-4 px-4 py-2">
            {targetWords.map((word, idx) => {
                const punctuation = word.match(/[.,!?;:]+$/);
                const wordOnly = punctuation ? word.slice(0, -punctuation[0].length) : word;
                return (
                <div key={idx} className="flex items-end">
                    <input
                    ref={el => inputRefs.current[idx] = el}
                    type="text"
                    value={userInput[idx] || ''}
                    onChange={(e) => handleInputChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    disabled={isCorrect[idx]}
                    className={`w-auto min-w-[3rem] px-1 pb-1 text-center text-xl font-medium bg-transparent border-b-2 outline-none transition-all duration-300 ${
                        isCorrect[idx] 
                        ? 'border-green-500 text-green-400' 
                        : 'border-gray-600 focus:border-indigo-500 text-white'
                    }`}
                    style={{ width: `${Math.max(wordOnly.length, 2) + 1}ch` }}
                    autoCapitalize="off"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                    />
                    {punctuation && <span className="text-gray-400 text-xl font-bold ml-0.5 pb-1">{punctuation[0]}</span>}
                </div>
                );
            })}
            </div>
        </div>

        {isCorrect.every(v => v && v !== undefined) && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-indigo-400 font-bold flex items-center justify-center gap-2 animate-pulse">
                CHÍNH XÁC! NHẤN ENTER <span className="text-2xl">⏎</span>
            </div>
        )}
      </div>
    </div>
  );
};

export default DictationRoom;
