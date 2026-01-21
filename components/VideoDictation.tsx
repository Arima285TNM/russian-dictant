
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
    youtubeId: '8p2u_V_E7y0',
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

interface VideoDictationProps {
  isDarkMode: boolean;
}

const VideoDictation: React.FC<VideoDictationProps> = ({ isDarkMode }) => {
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
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = urlInput.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;

    if (videoId) {
      const customVideo: VideoMetadata = {
        id: Date.now().toString(),
        youtubeId: videoId,
        title: "Video YouTube đã tải",
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        level: 'Medium',
        segments: [
          { id: 1, startTime: 0, endTime: 10, text: "Gõ nội dung bạn nghe được" }
        ]
      };
      setSelectedVideo(customVideo);
    } else {
      alert("URL không hợp lệ!");
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
      <div className={`h-full flex flex-col overflow-hidden animate-in fade-in duration-500 transition-colors duration-500 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
        <div className={`p-4 border-b flex items-center justify-between backdrop-blur-md z-10 ${isDarkMode ? 'bg-slate-900/50 border-white/5' : 'bg-white/70 border-slate-200 shadow-sm'}`}>
          <button onClick={() => setSelectedVideo(null)} className={`flex items-center gap-2 transition-colors text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
            </svg>
            Quay lại
          </button>
          <div className="text-center">
            <h1 className="text-sm font-black uppercase tracking-tight line-clamp-1 max-w-xs md:max-w-lg">{selectedVideo.title}</h1>
            <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest mt-0.5">CÂU {activeStep + 1} / {selectedVideo.segments.length}</p>
          </div>
          <div className="w-20"></div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <div className={`flex-1 flex flex-col items-center justify-center p-4 relative group ${isDarkMode ? 'bg-black' : 'bg-slate-100'}`}>
            <div className={`relative w-full max-w-4xl aspect-video rounded-3xl overflow-hidden shadow-2xl border ${isDarkMode ? 'border-white/10' : 'border-white'}`}>
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=1&controls=1&modestbranding=1&rel=0&start=${selectedVideo.segments[activeStep].startTime}&end=${selectedVideo.segments[activeStep].endTime}&loop=1&playlist=${selectedVideo.youtubeId}`}
                title="YouTube player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>

          <div className={`w-full lg:w-[420px] border-l p-8 flex flex-col shadow-2xl ${isDarkMode ? 'bg-slate-900/40 border-white/5 backdrop-blur-3xl' : 'bg-white border-slate-200'}`}>
            <div className="flex-1 space-y-8">
               <div className="space-y-4">
                  <label className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Nhập chính tả</label>
                  <div className="relative">
                    <textarea 
                      value={userInput}
                      onChange={(e) => handleInputChange(e.target.value)}
                      placeholder="Gõ nội dung bạn nghe được..."
                      className={`w-full border-2 rounded-[2rem] p-6 text-lg font-medium outline-none transition-all min-h-[200px] resize-none leading-relaxed ${
                        isCorrect 
                        ? 'border-emerald-500 bg-emerald-500/5' 
                        : (isDarkMode ? 'bg-slate-950 border-white/5 focus:border-indigo-500' : 'bg-slate-50 border-slate-100 focus:border-indigo-500')
                      }`}
                    />
                  </div>
               </div>
            </div>

            <div className="mt-8">
              <button 
                onClick={nextStep}
                disabled={!isCorrect}
                className={`w-full py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all transform active:scale-95 flex items-center justify-center gap-3 ${
                  isCorrect 
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {activeStep === selectedVideo.segments.length - 1 ? 'HOÀN THÀNH' : 'CÂU TIẾP THEO'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full w-full overflow-y-auto overflow-x-hidden p-6 md:p-12 animate-in fade-in duration-700 transition-colors duration-500 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <div className="max-w-6xl mx-auto space-y-16">
        <div className="text-center space-y-6 pt-10">
          <h1 className={`text-4xl md:text-6xl font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Luyện nghe qua <span className="text-indigo-500">Video</span>
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">
            Lựa chọn video thực tế để thử thách khả năng nghe hiểu của bạn.
          </p>

          <div className="max-w-3xl mx-auto relative pt-8">
            <div className={`flex gap-2 p-2 rounded-3xl border shadow-xl ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
              <input 
                type="text" 
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Dán link YouTube tại đây..."
                className="flex-1 bg-transparent border-none outline-none px-6 text-sm font-medium text-indigo-600 placeholder:text-slate-400"
              />
              <button 
                onClick={handlePasteUrl}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all active:scale-95 shadow-lg"
              >
                Bắt đầu
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
            {MOCK_VIDEOS.map((video) => (
              <div 
                key={video.id}
                onClick={() => handleSelectVideo(video)}
                className="group cursor-pointer space-y-4"
              >
                <div className={`relative aspect-video rounded-3xl overflow-hidden border transition-all duration-300 group-hover:scale-[1.02] shadow-lg ${isDarkMode ? 'border-white/5' : 'border-slate-200'}`}>
                  <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-widest text-indigo-400 border border-white/10">
                    {video.level}
                  </div>
                </div>
                <div>
                  <h3 className={`font-bold text-lg group-hover:text-indigo-500 transition-colors line-clamp-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{video.title}</h3>
                  <p className="text-slate-500 text-[10px] mt-1 uppercase font-black tracking-widest">{video.segments.length} PHÂN ĐOẠN</p>
                </div>
              </div>
            ))}
          </div>
      </div>
    </div>
  );
};

export default VideoDictation;
