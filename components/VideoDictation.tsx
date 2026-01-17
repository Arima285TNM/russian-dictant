
import React, { useState, useEffect, useRef } from 'react';

interface VideoSegment {
  id: number;
  startTime: number;
  endTime: number;
  text: string;
}

interface VideoMetadata {
  id: string;
  youtubeId: string;
  title: string;
  thumbnail: string;
  level: 'Easy' | 'Medium' | 'Hard';
  segments: VideoSegment[];
}

const MOCK_VIDEOS: VideoMetadata[] = [
  {
    id: 'v1',
    youtubeId: '8p2u_V_E7y0', // Masha and the Bear
    title: "Masha and the Bear - First Meeting",
    thumbnail: "https://img.youtube.com/vi/8p2u_V_E7y0/maxresdefault.jpg",
    level: 'Easy',
    segments: [
      { id: 1, startTime: 0, endTime: 4, text: "Привет, мишка!" },
      { id: 2, startTime: 4, endTime: 8, text: "Давай играть вместе." }
    ]
  },
  {
    id: 'v2',
    youtubeId: 'j8V_A9W_7mI', 
    title: "Russian News - Weather Report",
    thumbnail: "https://img.youtube.com/vi/j8V_A9W_7mI/maxresdefault.jpg",
    level: 'Hard',
    segments: [
      { id: 1, startTime: 0, endTime: 5, text: "Сегодня в Москве ожидается солнечная погода." }
    ]
  },
  {
    id: 'v3',
    youtubeId: 'mHe7X6Xy8pQ',
    title: "Smeshariki - New Adventure",
    thumbnail: "https://img.youtube.com/vi/mHe7X6Xy8pQ/maxresdefault.jpg",
    level: 'Medium',
    segments: [
      { id: 1, startTime: 0, endTime: 6, text: "Куда мы идем сегодня?" }
    ]
  }
];

const VideoDictation: React.FC = () => {
  const [selectedVideo, setSelectedVideo] = useState<VideoMetadata | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSelectVideo = (video: VideoMetadata) => {
    setSelectedVideo(video);
    setActiveStep(0);
    setUserInput("");
    setIsCorrect(false);
  };

  const handlePasteUrl = () => {
    // Regex lấy YouTube ID
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = urlInput.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;

    if (videoId) {
      // Giả lập tạo metadata cho video mới
      const customVideo: VideoMetadata = {
        id: Date.now().toString(),
        youtubeId: videoId,
        title: "Custom YouTube Video",
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        level: 'Medium',
        segments: [
          { id: 1, startTime: 0, endTime: 10, text: "Gõ lại nội dung bạn nghe được..." }
        ]
      };
      setSelectedVideo(customVideo);
    } else {
      alert("URL không hợp lệ, vui lòng thử lại!");
    }
  };

  const handleInputChange = (val: string) => {
    setUserInput(val);
    const target = selectedVideo?.segments[activeStep]?.text || "";
    const cleanVal = val.toLowerCase().replace(/[.,!?;:]/g, "").trim();
    const cleanTarget = target.toLowerCase().replace(/[.,!?;:]/g, "").trim();
    
    if (cleanVal === cleanTarget) {
      setIsCorrect(true);
    } else {
      setIsCorrect(false);
    }
  };

  const nextStep = () => {
    if (selectedVideo && activeStep < selectedVideo.segments.length - 1) {
      setActiveStep(activeStep + 1);
      setUserInput("");
      setIsCorrect(false);
    }
  };

  if (selectedVideo) {
    return (
      <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden animate-in fade-in duration-500">
        {/* Header Practice Mode */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-900/50 backdrop-blur-md z-10">
          <button onClick={() => setSelectedVideo(null)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-black uppercase tracking-widest">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
            </svg>
            Quay lại
          </button>
          <div className="text-center">
            <h1 className="text-sm font-black uppercase tracking-tight line-clamp-1 max-w-xs md:max-w-lg">{selectedVideo.title}</h1>
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-0.5">CÂU {activeStep + 1} / {selectedVideo.segments.length}</p>
          </div>
          <div className="w-20"></div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Video Player Side */}
          <div className="flex-1 bg-black flex flex-col items-center justify-center p-4 relative group">
            <div className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=1&controls=1&modestbranding=1&rel=0&start=${selectedVideo.segments[activeStep].startTime}&end=${selectedVideo.segments[activeStep].endTime}&loop=1&playlist=${selectedVideo.youtubeId}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            
            <div className="mt-8 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
               <div className="px-4 py-2 bg-indigo-600/20 border border-indigo-500/30 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-400">
                 Tự động lặp lại đoạn {selectedVideo.segments[activeStep].startTime}s - {selectedVideo.segments[activeStep].endTime}s
               </div>
            </div>
          </div>

          {/* Practice Side */}
          <div className="w-full lg:w-[400px] bg-slate-900/80 backdrop-blur-xl border-l border-white/5 p-6 md:p-8 flex flex-col shadow-2xl">
            <div className="flex-1 space-y-8">
               <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Nội dung nghe được</label>
                  <div className="relative">
                    <textarea 
                      value={userInput}
                      onChange={(e) => handleInputChange(e.target.value)}
                      placeholder="Gõ nội dung câu thoại..."
                      className={`w-full bg-slate-950 border-2 rounded-2xl p-5 text-lg font-medium outline-none transition-all min-h-[160px] resize-none leading-relaxed ${
                        isCorrect ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'border-white/5 focus:border-indigo-500'
                      }`}
                    />
                    {isCorrect && (
                      <div className="absolute top-4 right-4 text-emerald-500 animate-in zoom-in duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
               </div>

               <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-xs text-slate-400 leading-relaxed italic">
                    Gợi ý: Hãy nghe kỹ từng từ. Dấu câu không quan trọng, nhưng chính tả tiếng Nga cần hoàn toàn chính xác.
                  </p>
               </div>
            </div>

            <div className="mt-8">
              <button 
                onClick={nextStep}
                disabled={!isCorrect}
                className={`w-full py-5 rounded-2xl font-black text-lg uppercase tracking-widest transition-all transform active:scale-95 flex items-center justify-center gap-3 ${
                  isCorrect 
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/20' 
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {activeStep === selectedVideo.segments.length - 1 ? 'HOÀN THÀNH' : 'CÂU TIẾP THEO'}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-slate-950 overflow-y-auto overflow-x-hidden p-6 md:p-12 animate-in fade-in duration-700">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Banner Section */}
        <div className="text-center space-y-6 pt-10">
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter">
            Luyện nghe qua <span className="text-indigo-500">Video</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium">
            Học tiếng Nga từ những video thực tế. Nghe câu thoại, gõ lại chính xác để nâng cao khả năng nghe hiểu.
          </p>

          <div className="max-w-3xl mx-auto relative pt-8 group">
            <div className="absolute inset-0 bg-indigo-500/10 blur-3xl rounded-full -z-10 group-hover:bg-indigo-500/20 transition-all duration-500"></div>
            <div className="flex gap-2 p-2 bg-slate-900 rounded-3xl border border-white/10 shadow-2xl">
              <input 
                type="text" 
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Dán link YouTube tại đây (ví dụ: https://youtube.com/watch?v=...)"
                className="flex-1 bg-transparent border-none outline-none px-6 text-white font-medium placeholder:text-slate-600"
              />
              <button 
                onClick={handlePasteUrl}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all active:scale-95"
              >
                Bắt đầu
              </button>
            </div>
          </div>
        </div>

        {/* Featured Videos */}
        <div className="space-y-8">
          <div className="flex items-center justify-between border-b border-white/5 pb-6">
            <h2 className="text-xl font-black uppercase tracking-widest text-white">Video đề xuất</h2>
            <div className="flex gap-4">
               {['Easy', 'Medium', 'Hard'].map(lvl => (
                 <span key={lvl} className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{lvl}</span>
               ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {MOCK_VIDEOS.map((video) => (
              <div 
                key={video.id}
                onClick={() => handleSelectVideo(video)}
                className="group cursor-pointer space-y-4"
              >
                <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/5 transition-all duration-300 group-hover:border-indigo-500/50 transform-gpu group-hover:scale-[1.02]">
                  <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center shadow-2xl text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 ml-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-widest text-indigo-400 border border-white/10">
                    {video.level}
                  </div>
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg group-hover:text-indigo-400 transition-colors line-clamp-1">{video.title}</h3>
                  <p className="text-slate-500 text-xs mt-1 uppercase font-black tracking-widest">YouTube • {video.segments.length} câu thoại</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-20">
           <div className="p-8 bg-white/5 rounded-3xl border border-white/5 space-y-4">
              <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center text-indigo-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                </svg>
              </div>
              <h4 className="font-bold text-white uppercase tracking-widest text-xs">A-B Looping</h4>
              <p className="text-slate-500 text-xs leading-relaxed">Video tự động lặp lại đoạn thoại ngắn để bạn có thể nghe đi nghe lại cho đến khi hiểu rõ.</p>
           </div>
           <div className="p-8 bg-white/5 rounded-3xl border border-white/5 space-y-4">
              <div className="w-10 h-10 bg-emerald-600/20 rounded-xl flex items-center justify-center text-emerald-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-bold text-white uppercase tracking-widest text-xs">Kiểm tra ngay</h4>
              <p className="text-slate-500 text-xs leading-relaxed">Nhận phản hồi tức thì khi bạn gõ đúng câu thoại. Giúp ghi nhớ mặt chữ và ngữ pháp tốt hơn.</p>
           </div>
           <div className="p-8 bg-white/5 rounded-3xl border border-white/5 space-y-4">
              <div className="w-10 h-10 bg-rose-600/20 rounded-xl flex items-center justify-center text-rose-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h4 className="font-bold text-white uppercase tracking-widest text-xs">Tự do sáng tạo</h4>
              <p className="text-slate-500 text-xs leading-relaxed">Dán bất kỳ URL YouTube nào. AI sẽ hỗ trợ bạn luyện tập với nội dung mà bạn yêu thích.</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default VideoDictation;
