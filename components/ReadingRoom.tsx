
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchLessonText } from '../services/geminiService';
import { Lesson, Question, QuizSet } from '../types';

const Word: React.FC<{ 
    text: string, 
    translation?: string, 
    isDarkMode: boolean, 
    isHighlighted: boolean,
    wordId: string,
    onWordClick: () => void 
}> = ({ text, translation, isDarkMode, isHighlighted, wordId, onWordClick }) => {
    const [show, setShow] = useState(false);
    const isWhitespace = text.trim().length === 0;
    const cleanText = text.replace(/[.,!?;:«»""\(\)\[\]]/g, '').trim();
    
    // Tự động ẩn nghĩa sau 1 giây
    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => setShow(false), 1000);
            return () => clearTimeout(timer);
        }
    }, [show]);

    if (isWhitespace) {
        return (
            <span 
                data-word-id={wordId}
                className={`inline transition-colors duration-300 ${isHighlighted ? 'bg-yellow-300' : ''}`}
            >
                {text}
            </span>
        );
    }

    const handleClick = (e: React.MouseEvent) => {
        if (!translation) return;
        e.stopPropagation();
        setShow(true);
        onWordClick();
    };

    return (
        <span 
            data-word-id={wordId}
            className={`relative inline cursor-pointer transition-all duration-300 ${isHighlighted ? 'bg-yellow-300 text-slate-900' : ''}`}
            onClick={handleClick}
        >
            <span className={`inline transition-colors ${
                translation 
                ? (isDarkMode ? 'hover:text-indigo-400 border-b border-dotted border-slate-700' : 'hover:text-indigo-600 border-b border-dotted border-slate-300') 
                : ''
            } ${show && translation ? (isDarkMode ? 'text-indigo-400 border-indigo-500' : 'text-indigo-600 border-indigo-600') : ''}`}>
                {text}
            </span>
            {show && translation && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[110] animate-in fade-in zoom-in duration-150 pointer-events-none">
                    <div className={`${isDarkMode ? 'bg-slate-900 text-indigo-300 border-indigo-500/30' : 'bg-white text-indigo-700 border-indigo-200'} text-[10px] font-bold px-3 py-1.5 rounded-lg border whitespace-nowrap shadow-xl`}>
                        {translation}
                    </div>
                    <div className={`w-2 h-2 border-r border-b rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2 ${isDarkMode ? 'bg-slate-900 border-indigo-500/30' : 'bg-white border-indigo-200'}`}></div>
                </div>
            )}
        </span>
    );
}

interface ReadingRoomProps {
    lessonId: string | null;
    onBack: () => void;
    isDarkMode: boolean;
}

const ReadingRoom: React.FC<ReadingRoomProps> = ({ lessonId, onBack, isDarkMode }) => {
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [loading, setLoading] = useState(true);
    const [showQuestions, setShowQuestions] = useState(true);
    const [answers, setAnswers] = useState<Record<string, string>>({}); 
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [score, setScore] = useState({ correct: 0, total: 0 });
    const [showResultsOverlay, setShowResultsOverlay] = useState(false);
    const [highlights, setHighlights] = useState<Set<string>>(new Set());
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);

    useEffect(() => {
        if (lessonId) {
            const saved = localStorage.getItem(`highlights_${lessonId}`);
            if (saved) {
                setHighlights(new Set(JSON.parse(saved)));
            }
        }
    }, [lessonId]);

    useEffect(() => {
        if (lessonId && highlights.size >= 0) {
            localStorage.setItem(`highlights_${lessonId}`, JSON.stringify(Array.from(highlights)));
        }
    }, [highlights, lessonId]);

    useEffect(() => {
        const load = async () => {
            if (!lessonId) return;
            setLoading(true);
            const data = await fetchLessonText(lessonId);
            setLesson(data);
            setLoading(false);
        };
        load();
    }, [lessonId]);

    const handleAnswerSelect = (quizIdx: number, qIdx: number, option: string) => {
        if (isSubmitted) return;
        setAnswers(prev => ({ ...prev, [`${quizIdx}-${qIdx}`]: option }));
    };

    const handleSubmit = () => {
        if (!lesson) return;
        let correctCount = 0;
        let totalCount = 0;
        lesson.quizzes?.forEach((qSet, quizIdx) => {
            qSet.questions.forEach((q, qIdx) => {
                totalCount++;
                if (answers[`${quizIdx}-${qIdx}`] === q.answer) {
                    correctCount++;
                }
            });
        });
        setScore({ correct: correctCount, total: totalCount });
        setIsSubmitted(true);
        setShowResultsOverlay(true);
    };

    const handleReset = () => {
        setIsSubmitted(false);
        setAnswers({});
        setScore({ correct: 0, total: 0 });
        setShowResultsOverlay(false);
    };

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0) {
            e.preventDefault();
            setContextMenu({ x: e.pageX, y: e.pageY });
        } else {
            setContextMenu(null);
        }
    }, []);

    const applyHighlight = () => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const container = document.getElementById('reading-container');
        if (!container) return;

        const newHighlights = new Set(highlights);
        const wordElements = container.querySelectorAll('[data-word-id]');
        
        wordElements.forEach((el) => {
            if (selection.containsNode(el, true)) {
                const id = el.getAttribute('data-word-id');
                if (id) newHighlights.add(id);
            }
        });

        setHighlights(newHighlights);
        setContextMenu(null);
        selection.removeAllRanges();
    };

    const clearHighlights = () => {
        setHighlights(new Set());
        setContextMenu(null);
    };

    useEffect(() => {
        const handleClickOutside = () => setContextMenu(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const splitIntoParagraphs = (text: string) => {
        if (!text) return [];
        let paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0);
        if (paragraphs.length <= 1) {
            const sentences = text.match(/[^.!?]+[.!?]+\s*/g) || [text];
            const grouped = [];
            for (let i = 0; i < sentences.length; i += 4) {
                grouped.push(sentences.slice(i, i + 4).join("").trim());
            }
            return grouped;
        }
        return paragraphs;
    };

    if (loading) return (
        <div className={`h-full w-full flex flex-col items-center justify-center ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
            <div className={`w-12 h-12 border-4 rounded-full animate-spin mb-4 ${isDarkMode ? 'border-slate-800 border-t-indigo-500' : 'border-slate-200 border-t-indigo-600'}`} />
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Đang chuẩn bị...</p>
        </div>
    );

    if (!lesson) return null;

    const paragraphs = splitIntoParagraphs(lesson.fullText || "");
    const totalQuestionsCount = lesson.quizzes?.reduce((acc, qSet) => acc + qSet.questions.length, 0) || 0;
    const answeredCount = Object.keys(answers).length;
    const progressPercent = (answeredCount / totalQuestionsCount) * 100;

    return (
        <div className={`h-full w-full flex flex-col transition-colors duration-500 relative ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
            
            {/* Custom Context Menu */}
            {contextMenu && (
                <div 
                    className={`fixed z-[300] shadow-2xl rounded-xl border p-1 animate-in fade-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={e => e.stopPropagation()}
                >
                    <button 
                        onClick={applyHighlight}
                        className={`flex items-center gap-3 px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-colors w-full text-left ${isDarkMode ? 'hover:bg-indigo-600/20 text-indigo-400' : 'hover:bg-indigo-50 text-indigo-600'}`}
                    >
                        <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                        Bôi vàng
                    </button>
                    <button 
                        onClick={clearHighlights}
                        className={`flex items-center gap-3 px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-colors w-full text-left ${isDarkMode ? 'hover:bg-white/5 text-slate-500' : 'hover:bg-slate-50 text-slate-500'}`}
                    >
                        <span className="w-3 h-3 rounded-full border border-slate-400"></span>
                        Xóa tất cả
                    </button>
                </div>
            )}

            {/* Overlay kết quả */}
            {showResultsOverlay && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className={`${isDarkMode ? 'bg-slate-900 border-indigo-500/30' : 'bg-white border-slate-200'} border p-10 rounded-[2.5rem] max-w-sm w-full shadow-2xl animate-in zoom-in duration-500 flex flex-col items-center text-center`}>
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-black mb-6 shadow-xl ${score.correct === score.total ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-indigo-600 shadow-indigo-600/30'}`}>
                            {score.correct}/{score.total}
                        </div>
                        <h3 className={`text-2xl font-black mb-2 tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            {score.correct === score.total ? 'Tuyệt vời!' : 'Hoàn thành bài tập'}
                        </h3>
                        <p className={`mb-8 font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            Bạn đã trả lời đúng {score.correct} câu hỏi. Hãy xem lại các câu sai để ghi nhớ nhé.
                        </p>
                        <button
                            onClick={() => setShowResultsOverlay(false)}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl transition-all active:scale-95 uppercase tracking-widest"
                        >
                            Xem chi tiết
                        </button>
                    </div>
                </div>
            )}

            <header className={`h-14 border-b flex items-center justify-between px-6 backdrop-blur-md shrink-0 z-50 ${isDarkMode ? 'bg-slate-900/40 border-white/5' : 'bg-white/70 border-slate-200'}`}>
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className={`transition-colors p-2 -ml-2 ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h2 className={`text-[11px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Đọc hiểu</h2>
                        <p className={`text-[9px] font-bold uppercase mt-0.5 tracking-tighter ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>BÀI {lessonId?.split('/').pop()}</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setShowQuestions(!showQuestions)}
                        className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.1em] transition-all shadow-lg ${showQuestions ? 'bg-indigo-600 text-white shadow-indigo-600/20' : (isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600')}`}
                    >
                        {showQuestions ? "Ẩn câu hỏi" : "Hiện câu hỏi"}
                    </button>
                    <div className="w-12"></div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                <div 
                    id="reading-container"
                    onContextMenu={handleContextMenu}
                    className="flex-1 overflow-y-auto p-6 md:p-12 scrollbar-hide transition-all duration-500"
                >
                    <div className={`max-w-[850px] mx-auto p-10 md:p-16 rounded-[2.5rem] border shadow-2xl transition-colors duration-500 ${isDarkMode ? 'bg-slate-900/20 border-white/5' : 'bg-white border-slate-100'}`}>
                        <div className={`mb-12 flex flex-wrap items-center justify-between gap-4 border-b pb-6 ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
                            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border border-indigo-100 text-indigo-600'}`}>Văn bản</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic opacity-60">Chuột phải vùng bôi đen để bôi vàng</span>
                        </div>
                        
                        <div className={`text-xl md:text-2xl font-medium leading-[2.1] tracking-wide text-justify selection:bg-indigo-500/30 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                            {paragraphs.map((pText, pIdx) => (
                                <p key={pIdx} className="mb-10 block clear-both">
                                    {pText.split(/(\s+)/).map((part, idx) => {
                                        const clean = part.toLowerCase().replace(/[.,!?;:«»""\(\)\[\]]/g, '').trim();
                                        const wordId = `${pIdx}-${idx}`;
                                        return (
                                            <Word 
                                                key={idx} 
                                                wordId={wordId}
                                                text={part} 
                                                translation={lesson.wordMeanings?.[clean]} 
                                                isDarkMode={isDarkMode}
                                                isHighlighted={highlights.has(wordId)}
                                                onWordClick={() => {}} 
                                            />
                                        );
                                    })}
                                </p>
                            ))}
                        </div>
                    </div>
                </div>

                {showQuestions && (
                    <div className={`w-full md:w-[520px] overflow-y-auto p-6 md:p-10 scrollbar-hide animate-in slide-in-from-right duration-500 border-l shadow-[-20px_0_50px_rgba(0,0,0,0.1)] transition-colors duration-500 ${isDarkMode ? 'bg-slate-900/40 border-white/5 backdrop-blur-3xl' : 'bg-slate-50/80 border-slate-200 backdrop-blur-md'}`}>
                        <div className="space-y-10">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className={`text-lg font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Câu hỏi</h3>
                                    <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${isDarkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                        {answeredCount}/{totalQuestionsCount}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    <div className={`h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200 shadow-inner'}`}>
                                        <div 
                                            className="h-full bg-indigo-600 transition-all duration-500 shadow-[0_0_10px_rgba(79,70,229,0.4)]" 
                                            style={{ width: `${progressPercent}%` }} 
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-20 pb-20">
                                {(() => {
                                    let globalQIndex = 0;
                                    return lesson.quizzes?.map((qSet, quizIdx) => (
                                        <div key={quizIdx} className="space-y-12">
                                            {qSet.questions.map((q, qIdx) => {
                                                const currentGlobalIndex = ++globalQIndex;
                                                const answerKey = `${quizIdx}-${qIdx}`;
                                                const selectedOption = answers[answerKey];
                                                
                                                return (
                                                    <div key={qIdx} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                                        <div className="flex gap-4">
                                                            <span className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center text-[12px] font-black shadow-inner border transition-all ${isDarkMode ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20' : 'bg-white text-indigo-600 border-indigo-100 shadow-sm'}`}>
                                                                {currentGlobalIndex}
                                                            </span>
                                                            <p className={`text-[14px] font-bold leading-relaxed mt-1 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{q.question}</p>
                                                        </div>
                                                        
                                                        <div className="space-y-3 pl-12">
                                                            {q.options.map((option, optIdx) => {
                                                                const isSelected = selectedOption === option;
                                                                const isCorrect = option === q.answer;
                                                                let classes = "w-full text-left p-4 rounded-2xl text-[13px] font-medium border transition-all duration-300 relative overflow-hidden ";
                                                                
                                                                if (isSubmitted) {
                                                                    if (isCorrect) {
                                                                        classes += isDarkMode 
                                                                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-bold" 
                                                                            : "bg-emerald-50 border-emerald-500 text-emerald-700 font-bold";
                                                                    } else if (isSelected) {
                                                                        classes += isDarkMode 
                                                                            ? "bg-rose-500/20 border-rose-500/40 text-rose-400" 
                                                                            : "bg-rose-50 border-rose-500 text-rose-700";
                                                                    } else {
                                                                        classes += isDarkMode 
                                                                            ? "bg-slate-950/40 border-white/5 text-slate-600 opacity-40" 
                                                                            : "bg-white border-slate-100 text-slate-400 opacity-40";
                                                                    }
                                                                } else {
                                                                    classes += isSelected 
                                                                        ? "bg-indigo-600/20 border-indigo-500/60 text-indigo-600 ring-2 ring-indigo-500/10 font-bold" 
                                                                        : (isDarkMode ? "bg-slate-950 border-white/5 text-slate-400 hover:border-indigo-500/30 hover:bg-slate-900" : "bg-white border-slate-200 text-slate-600 hover:border-indigo-500/50 hover:bg-slate-50 shadow-sm shadow-slate-100");
                                                                }

                                                                return (
                                                                    <button
                                                                        key={optIdx}
                                                                        onClick={() => handleAnswerSelect(quizIdx, qIdx, option)}
                                                                        className={classes}
                                                                    >
                                                                        <span className="flex items-center gap-3 relative z-10">
                                                                            <span className={`w-3 h-3 rounded-full border-2 transition-all ${
                                                                                isSubmitted && isCorrect ? 'bg-emerald-500 border-emerald-400 scale-125' :
                                                                                isSubmitted && isSelected ? 'bg-rose-500 border-rose-400 scale-125' :
                                                                                isSelected ? 'bg-indigo-600 border-indigo-500 scale-125' : 
                                                                                (isDarkMode ? 'border-slate-800' : 'border-slate-200')
                                                                            }`} />
                                                                            {option}
                                                                        </span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                        {isSubmitted && q.explanation && (
                                                            <div className="pl-12 mt-4 animate-in fade-in duration-700">
                                                                <div className={`p-4 border-l-4 rounded-r-2xl ${isDarkMode ? 'bg-white/5 border-indigo-500/30 text-slate-400' : 'bg-slate-100 border-indigo-500/40 text-slate-600 shadow-inner'}`}>
                                                                    <p className="text-[11px] italic leading-relaxed">
                                                                        <span className="font-black text-indigo-500 uppercase tracking-widest text-[9px] block mb-1">Giải thích:</span>
                                                                        {q.explanation}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ));
                                })()}

                                <div className="pt-8 border-t border-white/5">
                                    {!isSubmitted ? (
                                        <button 
                                            onClick={handleSubmit}
                                            disabled={totalQuestionsCount > 0 && answeredCount < totalQuestionsCount}
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 disabled:grayscale text-white font-black py-5 rounded-2xl transition-all active:scale-95 uppercase tracking-widest shadow-2xl shadow-indigo-600/30"
                                        >
                                            Nộp bài ({answeredCount}/{totalQuestionsCount})
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={handleReset}
                                            className={`w-full font-black py-5 rounded-2xl border transition-all text-[11px] uppercase tracking-widest ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-white border-white/10' : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-200 shadow-sm'}`}
                                        >
                                            Làm lại
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ReadingRoom;
