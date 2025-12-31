
import React, { useState } from 'react';
import type { GeminiCrmResponse, CrmLanguageOutput, CrmCopy } from '../types';
import { CopyButton } from './CopyButton';
import { LANGUAGE_OPTIONS } from '../constants';
import { SparklesIcon, DevicePhoneMobileIcon, IdusAppIcon } from './Icons';

interface CrmResultsDisplayProps {
  result: GeminiCrmResponse;
  showToast: (message: string) => void;
}

type LangKey = keyof CrmLanguageOutput;
type ViewMode = 'card' | 'preview';

// Helper to highlight variables like {{user_name}}
const HighlightVariables: React.FC<{ text: string }> = ({ text }) => {
    const parts = text.split(/(\{\{.*?\}\})/g);
    return (
        <span>
            {parts.map((part, i) => 
                part.startsWith('{{') && part.endsWith('}}') ? (
                    <span key={i} className="text-yellow-400 font-bold mx-0.5">{part}</span>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </span>
    );
};

const CopyBlock: React.FC<{
    label: string;
    text: string;
    limit: number;
    onCopy: () => void;
}> = ({ label, text, limit, onCopy }) => {
    const length = text.length;
    const isOverLimit = length > limit;

    return (
        <div className="space-y-1">
            <div className="flex justify-between items-center px-1">
                <span className="text-xs text-gray-400 font-medium">{label}</span>
                <CopyButton textToCopy={text} onCopy={onCopy} className="hover:text-white" />
            </div>
            <div className="relative bg-gray-900/60 rounded-md border border-gray-700/50 group hover:border-purple-500/50 transition-colors">
                <div className="p-3 text-sm text-gray-200 min-h-[3rem] leading-relaxed break-keep">
                    <HighlightVariables text={text} />
                </div>
            </div>
            <div className="flex justify-end px-1">
                <span className={`text-[10px] font-medium ${isOverLimit ? 'text-red-400' : 'text-gray-500'}`}>
                    {length}/{limit}자
                </span>
            </div>
        </div>
    );
};

const CrmContentCard: React.FC<{
  title: string;
  type: 'A' | 'B';
  mainCopy: string;
  subCopy: string;
  onCopy: (message: string) => void;
}> = ({ title, type, mainCopy, subCopy, onCopy }) => {
  
  return (
    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-4 border-b border-gray-700/50 pb-3">
          <h4 className="text-base font-bold text-gray-100">{title}</h4>
          <span className={`text-xs font-bold px-2 py-0.5 rounded ${type === 'A' ? 'bg-purple-900/40 text-purple-300 border border-purple-500/20' : 'bg-blue-900/40 text-blue-300 border border-blue-500/20'}`}>
              {type}안
          </span>
      </div>
      
      <div className="space-y-4">
        <CopyBlock 
            label="메인 카피" 
            text={mainCopy} 
            limit={15} 
            onCopy={() => onCopy(`${title} 메인 카피가 복사되었습니다.`)} 
        />
        <CopyBlock 
            label="서브 카피" 
            text={subCopy} 
            limit={35} 
            onCopy={() => onCopy(`${title} 서브 카피가 복사되었습니다.`)} 
        />
      </div>
    </div>
  );
};

// --- Mockup Components ---

const IOSLockScreen: React.FC<{ mainCopy: string; subCopy: string; lang: string }> = ({ mainCopy, subCopy }) => {
    return (
        <div className="relative w-full max-w-[300px] aspect-[9/19] rounded-[40px] border-[8px] border-gray-900 bg-gray-800 shadow-2xl overflow-hidden mx-auto select-none">
            {/* Wallpaper Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-purple-900 via-indigo-900 to-blue-900 opacity-80"></div>
            
            {/* Status Bar */}
            <div className="absolute top-0 left-0 right-0 h-8 flex justify-between items-center px-6 pt-2 z-20">
                <span className="text-[10px] font-semibold text-white">9:41</span>
                <div className="flex gap-1.5">
                    <div className="w-4 h-2.5 bg-white rounded-[2px] opacity-90"></div>
                    <div className="w-0.5 h-1 bg-white opacity-90 relative top-1"></div>
                </div>
            </div>

            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-b-2xl z-20"></div>

            {/* Time & Date */}
            <div className="absolute top-16 left-0 right-0 text-center text-white/90 z-10 space-y-1">
                <div className="text-[10px] font-semibold tracking-wide">Monday, November 30</div>
                <div className="text-5xl font-bold tracking-tight">9:41</div>
            </div>

            {/* Notification Stack */}
            <div className="absolute top-44 left-3 right-3 z-10 space-y-2">
                <div className="bg-white/70 backdrop-blur-md rounded-2xl p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 bg-[#F06856] rounded-[5px] flex items-center justify-center p-0.5">
                                <IdusAppIcon />
                            </div>
                            <span className="text-[11px] font-semibold text-black/80">idus</span>
                        </div>
                        <span className="text-[10px] text-black/60">Now</span>
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-[13px] font-semibold text-black leading-tight"><HighlightVariables text={mainCopy} /></p>
                        <p className="text-[13px] text-black/90 leading-tight"><HighlightVariables text={subCopy} /></p>
                    </div>
                </div>
                {/* Fake notification behind for depth */}
                <div className="bg-white/40 backdrop-blur-sm rounded-2xl h-12 mx-2 opacity-50"></div>
            </div>

            {/* Bottom Bar */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/50 rounded-full"></div>
            
            {/* Flashlight/Camera Buttons */}
            <div className="absolute bottom-10 left-10 w-10 h-10 bg-black/40 rounded-full backdrop-blur-sm flex items-center justify-center">
                 <div className="w-5 h-5 bg-white/80 rounded-full opacity-20"></div>
            </div>
             <div className="absolute bottom-10 right-10 w-10 h-10 bg-black/40 rounded-full backdrop-blur-sm flex items-center justify-center">
                 <div className="w-5 h-5 bg-white/80 rounded-full opacity-20"></div>
            </div>
        </div>
    )
}

const AndroidNotification: React.FC<{ mainCopy: string; subCopy: string; lang: string }> = ({ mainCopy, subCopy }) => {
    return (
        <div className="relative w-full max-w-[300px] aspect-[9/19] rounded-[30px] border-[8px] border-gray-900 bg-black shadow-2xl overflow-hidden mx-auto select-none">
             {/* Wallpaper Gradient */}
             <div className="absolute inset-0 bg-gradient-to-tr from-gray-900 to-gray-800"></div>

             {/* Status Bar */}
             <div className="absolute top-0 left-0 right-0 h-6 flex justify-between items-center px-4 pt-1 z-20">
                <span className="text-[10px] font-medium text-gray-300">09:41</span>
                <div className="flex gap-1.5 items-center">
                     <span className="text-[9px] text-gray-300">5G</span>
                    <div className="w-3 h-3 bg-gray-300 rounded-sm opacity-80"></div>
                </div>
            </div>
            
            {/* Front Camera Dot */}
             <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-black rounded-full z-20 border border-gray-800"></div>

            {/* Notification Shade */}
            <div className="absolute top-8 left-2 right-2 bg-[#202124] rounded-2xl p-4 shadow-lg border border-gray-800/50 z-10">
                <div className="flex items-center justify-between mb-3 text-gray-400">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full overflow-hidden">
                             <IdusAppIcon />
                        </div>
                        <span className="text-[11px] font-medium">idus</span>
                        <span className="text-[10px]">• now</span>
                    </div>
                     <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                </div>
                <div className="pl-0">
                    <p className="text-[14px] font-bold text-gray-100 mb-1 leading-snug"><HighlightVariables text={mainCopy} /></p>
                    <p className="text-[13px] text-gray-400 leading-relaxed"><HighlightVariables text={subCopy} /></p>
                </div>
            </div>
        </div>
    )
}


export const CrmResultsDisplay: React.FC<CrmResultsDisplayProps> = ({ result, showToast }) => {
  const langMap = Object.fromEntries(LANGUAGE_OPTIONS.map(l => [l.id, l.label]));
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const availableLangs = Object.keys(result.crmContent) as LangKey[];
  
  const ViewButton: React.FC<{
    label: string;
    view: ViewMode;
    icon: React.ReactNode;
  }> = ({ label, view, icon }) => (
     <button 
        onClick={() => setViewMode(view)} 
        className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all duration-200 border ${
            viewMode === view 
            ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-900/20' 
            : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-gray-200'
        }`}>
        {icon}
        <span>{label}</span>
    </button>
  );

  const renderCardView = () => (
    <div className="space-y-10 animate-fade-in">
      {availableLangs.map((lang) => {
          const contentVersions = result.crmContent[lang];
          if (!contentVersions || contentVersions.length === 0) return null;
          
          return (
            <div key={lang}>
                <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-xl font-bold text-white">{langMap[lang]}</h3>
                    <div className="h-px bg-gray-700 flex-grow"></div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {contentVersions.map((content: CrmCopy, index: number) => (
                        <CrmContentCard
                            key={`${lang}-${index}`}
                            title={`'${langMap[lang]}' ${index === 0 ? 'A' : 'B'}안`}
                            type={index === 0 ? 'A' : 'B'}
                            mainCopy={content.mainCopy}
                            subCopy={content.subCopy}
                            onCopy={showToast}
                        />
                    ))}
                </div>
            </div>
          );
      })}
    </div>
  );

  const renderPreviewView = () => (
     <div className="space-y-12 animate-fade-in">
        {availableLangs.map((lang) => (
          <div key={lang}>
            <div className="flex items-center gap-3 mb-6">
                <h3 className="text-xl font-bold text-white">{langMap[lang]}</h3>
                <div className="h-px bg-gray-700 flex-grow"></div>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {result.crmContent[lang].map((content, index) => (
                <div key={`${lang}-${index}`} className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 flex flex-col items-center">
                  <div className="w-full flex items-center justify-between mb-6 px-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${index === 0 ? 'bg-purple-900/40 text-purple-300' : 'bg-blue-900/40 text-blue-300'}`}>
                        {index === 0 ? 'A' : 'B'}안 (Option {String.fromCharCode(65 + index)})
                      </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full">
                    <div className="flex flex-col items-center">
                      <h5 className="text-center text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">iOS Lock Screen</h5>
                      <IOSLockScreen 
                        lang={langMap[lang]}
                        mainCopy={content.mainCopy} 
                        subCopy={content.subCopy} 
                      />
                    </div>
                    <div className="flex flex-col items-center">
                      <h5 className="text-center text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">Android Notification</h5>
                      <AndroidNotification
                        lang={langMap[lang]}
                        mainCopy={content.mainCopy} 
                        subCopy={content.subCopy} 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );

  return (
    <div className="flex flex-col space-y-6 h-full">
        {/* Header with Tabs */}
        <div className="flex justify-between items-center bg-gray-800 p-2 rounded-xl border border-gray-700">
            <h3 className="text-lg font-bold text-white ml-2">생성된 CRM 카피</h3>
            <div className="flex space-x-2">
                <ViewButton label="카드 뷰" view="card" icon={<SparklesIcon />} />
                <ViewButton label="미리보기 (Real-Time)" view="preview" icon={<DevicePhoneMobileIcon />} />
            </div>
        </div>
      
        <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-8 pb-10">
            {viewMode === 'card' ? renderCardView() : renderPreviewView()}
            
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mt-8">
                <h3 className="text-lg font-bold text-purple-300 mb-4 flex items-center gap-2">
                    <span>🕒</span> AI 추천 발송 골든타임
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.sendingTime.map(suggestion => (
                        <div key={suggestion.region} className="bg-gray-700/30 rounded-lg p-5 border border-gray-600/50">
                            <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wide mb-2">{suggestion.region === 'North America' ? '🇺🇸 북미 (North America)' : '🇯🇵 일본 (Japan)'}</h4>
                            <div className="flex items-baseline gap-3 mb-2">
                                <span className="text-2xl font-bold text-white">{suggestion.time}</span>
                            </div>
                            <p className="text-sm text-gray-400 leading-relaxed bg-gray-900/30 p-3 rounded">{suggestion.reason}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};
