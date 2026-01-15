
import React, { useState } from 'react';

const VideoDictation: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    { startTime: 0, endTime: 5, text: "Это мой первый видеоурок." },
    { startTime: 5, endTime: 10, text: "Сегодня мы учим русский язык." }
  ];

  return (
    <div className="h-full flex flex-col md:flex-row bg-slate-900 text-white overflow-hidden">
      {/* Video Side */}
      <div className="flex-1 flex items-center justify-center bg-black relative">
        <div className="aspect-video w-full max-w-4xl bg-slate-800 flex items-center justify-center">
            <p className="text-slate-500">Video Player Placeholder (YouTube Embed)</p>
        </div>
        <div className="absolute bottom-10 left-0 right-0 px-10">
            <div className="bg-black/60 backdrop-blur-md p-6 rounded-xl border border-white/10 text-center">
                <p className="text-xl font-medium text-slate-400 italic">"Nghe và gõ lại câu thoại trong video..."</p>
            </div>
        </div>
      </div>

      {/* Input Side */}
      <div className="w-full md:w-96 bg-slate-800 p-8 flex flex-col gap-6">
        <h3 className="text-lg font-bold border-b border-white/10 pb-4">Dictation</h3>
        <div className="flex-1 overflow-y-auto space-y-4">
           {steps.map((step, i) => (
             <div key={i} className={`p-4 rounded-lg border transition-colors ${i === activeStep ? 'bg-blue-600/20 border-blue-500' : 'bg-white/5 border-transparent opacity-50'}`}>
                <div className="flex justify-between text-xs text-slate-400 mb-2">
                    <span>STEP {i + 1}</span>
                    <span>{step.startTime}s - {step.endTime}s</span>
                </div>
                <input 
                  type="text" 
                  disabled={i !== activeStep}
                  placeholder="Gõ tại đây..."
                  className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm outline-none focus:border-blue-400"
                />
             </div>
           ))}
        </div>
        <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition-colors">TIẾP THEO</button>
      </div>
    </div>
  );
};

export default VideoDictation;
