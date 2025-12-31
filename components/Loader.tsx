
import React, { useState, useEffect } from 'react';

const STEPS = [
    "시장 데이터 및 트렌드 컨텍스트 분석 중... (Analyzing Context)",
    "페르소나 동기화 및 톤앤매너 설정 중... (Syncing Persona)",
    "고객 심리 기반 카피라이팅 작성 중... (Drafting Copy)",
    "플랫폼별 최적화 및 최종 검수 중... (Polishing Output)",
];

interface LoaderProps {
    context?: string; // Optional override message
}

export const Loader: React.FC<LoaderProps> = ({ context }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (context) return; // Don't cycle if static context provided
    const interval = setInterval(() => {
      setStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 2000); // Change text every 2s
    return () => clearInterval(interval);
  }, [context]);

  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-6 animate-fade-in w-full">
      <div className="relative">
        {/* Pulsing rings */}
        <div className="absolute inset-0 bg-purple-500 rounded-full opacity-20 animate-ping duration-[3s]"></div>
        <div className="absolute inset-0 bg-pink-500 rounded-full opacity-10 animate-ping delay-75 duration-[3s]"></div>
        
        <div className="relative bg-gray-900 border border-purple-500/50 rounded-full p-4 shadow-[0_0_30px_rgba(168,85,247,0.3)] backdrop-blur-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-400 border-t-transparent"></div>
        </div>
      </div>
      
      <div className="text-center space-y-3 z-10">
        <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-white animate-pulse">
            AI 에이전트가 작업 중입니다
        </h3>
        <p className="text-sm text-gray-400 font-mono tracking-wide h-6">
            {context ? context : STEPS[step]}
        </p>
      </div>

      {/* Step Indicators */}
      {!context && (
          <div className="flex gap-1.5 mt-2">
            {STEPS.map((_, i) => (
                <div 
                    key={i} 
                    className={`h-1 rounded-full transition-all duration-700 ease-out ${i <= step ? 'w-8 bg-gradient-to-r from-purple-500 to-pink-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'w-2 bg-gray-700'}`} 
                />
            ))}
          </div>
      )}
    </div>
  );
};
