
import React, { useState, useRef, useEffect } from 'react';
import type { GeminiResponse, CaptionBlock, LanguageOutput, PlatformContent, VisualStrategy, ImageFile, ContentResult, CarouselBlock, ReelsBlock } from '../types';
import { CopyButton } from './CopyButton';
import { LANGUAGE_OPTIONS, PLATFORM_OPTIONS } from '../constants';
import { CopyIcon as CopyAllIcon, EditIcon, SaveIcon, XIcon as CancelIcon, PhotoIcon, ChevronRightIcon, ChevronLeftIcon } from './Icons';

interface ResultsDisplayProps {
  result: GeminiResponse;
  setResult: React.Dispatch<React.SetStateAction<GeminiResponse | null>>;
  showToast: (message: string) => void;
  uploadedImages: ImageFile[]; // To display the selected image
}

type LangKey = keyof LanguageOutput;
type PlatformKey = keyof PlatformContent;

const useAutosizeTextArea = (
  textAreaRef: HTMLTextAreaElement | null,
  value: string
) => {
  useEffect(() => {
    if (textAreaRef) {
      textAreaRef.style.height = "0px";
      const scrollHeight = textAreaRef.scrollHeight;
      textAreaRef.style.height = scrollHeight + "px";
    }
  }, [textAreaRef, value]);
};


// --- New: Interactive Visual Storyboard for Carousel ---
const CarouselStoryboard: React.FC<{ 
    slides: CarouselBlock['slides']; 
    images: ImageFile[];
}> = ({ slides, images }) => {
    // State to track which image is assigned to which slide
    // Default: map slide index to image index (cycle if fewer images)
    const [bgMapping, setBgMapping] = useState<number[]>(
        slides.map((_, idx) => images.length > 0 ? idx % images.length : -1)
    );

    const handleImageCycle = (slideIndex: number) => {
        if (images.length === 0) return;
        setBgMapping(prev => {
            const newMapping = [...prev];
            const currentImgIdx = newMapping[slideIndex];
            // Cycle to next image
            newMapping[slideIndex] = (currentImgIdx + 1) % images.length;
            return newMapping;
        });
    };

    return (
        <div className="space-y-4 mb-6">
             <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wide text-purple-300 uppercase flex items-center gap-2">
                    <span>📑</span> 비주얼 스토리보드 (Visual Storyboard)
                </span>
                <span className="text-[10px] text-gray-500 bg-gray-900/50 px-2 py-1 rounded border border-gray-700">
                    * 이미지를 클릭하여 배경 변경 가능
                </span>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-6 snap-x custom-scrollbar">
                {slides.map((slide, idx) => {
                    const imgIndex = bgMapping[idx];
                    const bgImage = imgIndex >= 0 ? images[imgIndex] : null;

                    return (
                        <div key={idx} className="flex-shrink-0 w-[280px] group">
                            {/* Visual Preview Card (1:1 Ratio) */}
                            <div 
                                className="relative aspect-square bg-gray-900 rounded-xl overflow-hidden border border-gray-700 shadow-lg cursor-pointer transition-all hover:ring-2 hover:ring-purple-500/50"
                                onClick={() => handleImageCycle(idx)}
                                title="클릭하여 배경 이미지 변경"
                            >
                                {/* Background Image */}
                                {bgImage ? (
                                    <img 
                                        src={`data:${bgImage.mimeType};base64,${bgImage.base64}`} 
                                        alt={`Slide ${idx + 1}`} 
                                        className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                                        <PhotoIcon />
                                    </div>
                                )}
                                
                                {/* Dark Overlay for Text Readability */}
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors"></div>

                                {/* Slide Number Badge */}
                                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/10">
                                    {idx + 1} / {slides.length}
                                </div>

                                {/* Text Content Overlay */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                                    <div className="relative">
                                        {/* Decorative quote marks */}
                                        <span className="absolute -top-4 -left-2 text-4xl text-white/20 font-serif leading-none">“</span>
                                        <p className="text-xl font-bold text-white leading-snug drop-shadow-md font-serif tracking-tight">
                                            {slide.textOverlay}
                                        </p>
                                        <span className="absolute -bottom-6 -right-2 text-4xl text-white/20 font-serif leading-none rotate-180">“</span>
                                    </div>
                                    <p className="mt-4 text-[10px] text-gray-300 font-medium uppercase tracking-widest border-t border-white/30 pt-2 opacity-80">
                                        {slide.visualDesc.substring(0, 20)}...
                                    </p>
                                </div>
                                
                                {/* Hover Hint */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <span className="bg-black/70 text-white text-[10px] px-2 py-1 rounded backdrop-blur">
                                        Click to Change Image
                                    </span>
                                </div>
                            </div>

                            {/* Caption Below */}
                            <div className="mt-3 px-1">
                                <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">
                                    <span className="text-purple-400 font-bold mr-1">Cap:</span>
                                    {slide.caption || "캡션 없음"}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {/* Pagination Dots Visualization */}
            <div className="flex justify-center gap-1.5 -mt-2">
                 {slides.map((_, idx) => (
                     <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === 0 ? 'bg-purple-500' : 'bg-gray-700'}`}></div>
                 ))}
            </div>
        </div>
    );
};

// --------------------------------------------------------


const ContentCard: React.FC<{ 
  langKey: LangKey;
  platformKey: PlatformKey;
  content: ContentResult;
  platformLabel: string;
  onCopy: (message: string) => void; 
  onUpdate: (langKey: LangKey, platformKey: PlatformKey, newContent: ContentResult) => void;
  uploadedImages: ImageFile[];
}> = ({ langKey, platformKey, content, platformLabel, onCopy, onUpdate, uploadedImages }) => {
  // Simple editing state is only supported for feed type captions for now
  const [isEditing, setIsEditing] = useState(false);
  const [editedCaption, setEditedCaption] = useState(content.caption);
  const [editedHashtags, setEditedHashtags] = useState(content.hashtags.join(' '));

  const captionTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const hashtagsTextAreaRef = useRef<HTMLTextAreaElement>(null);
  
  useAutosizeTextArea(captionTextAreaRef.current, editedCaption);
  useAutosizeTextArea(hashtagsTextAreaRef.current, editedHashtags);
  
  const hashtagsText = content.hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ');
  const fullText = `${content.caption}\n\n${hashtagsText}`;

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, textarea, input, .no-copy-trigger')) {
      return;
    }
    navigator.clipboard.writeText(fullText);
    onCopy(`'${platformLabel}' 콘텐츠가 복사되었습니다.`);
  };
  
  const handleSave = () => {
    const newHashtags = editedHashtags.split(' ').filter(h => h.trim().startsWith('#'));
    // Preserve the original structure type
    onUpdate(langKey, platformKey, { ...content, caption: editedCaption, hashtags: newHashtags });
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setEditedCaption(content.caption);
    setEditedHashtags(content.hashtags.join(' '));
    setIsEditing(false);
  };

  const renderInnerContent = () => {
      if (content.type === 'carousel') {
          return (
              <div className="no-copy-trigger">
                  <CarouselStoryboard 
                    slides={(content as CarouselBlock).slides} 
                    images={uploadedImages} 
                  />
              </div>
          )
      } else if (content.type === 'reels') {
          return (
              <div className="space-y-3 mb-4">
                  <span className="text-xs font-bold tracking-wide text-pink-300 uppercase">🎥 릴스 숏폼 대본 (Reels Script)</span>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                      {(content as ReelsBlock).script.map((scene, idx) => (
                          <div key={idx} className="flex gap-3 text-xs bg-gray-800 p-3 rounded-lg border border-gray-700">
                              <span className="font-mono text-pink-400 font-bold flex-shrink-0 pt-0.5">{scene.timestamp}</span>
                              <div className="space-y-1.5 border-l border-gray-700 pl-3">
                                  <p className="text-gray-200"><span className="text-gray-500 inline-block w-4">👁️</span> {scene.visualAction}</p>
                                  <p className="text-gray-400"><span className="text-gray-500 inline-block w-4">🔊</span> {scene.audio}</p>
                                  <p className="text-gray-300 italic"><span className="text-gray-500 inline-block w-4">💬</span> "{scene.caption}"</p>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )
      }
      return null; // Feed type has no extra inner structure
  };

  return (
    <div 
      className={`bg-gray-700/30 rounded-xl p-5 space-y-4 transition-all group border border-gray-700/50 hover:border-purple-500/50 hover:shadow-lg ${!isEditing ? 'cursor-pointer hover:bg-gray-700/50' : ''}`}
      onClick={handleCardClick}
      title={!isEditing ? "클릭하여 캡션과 해시태그 전체 복사" : ""}
    >
      <div className="flex justify-between items-center">
        <h4 className="text-base font-bold text-gray-100 flex items-center gap-2">
             {platformKey === 'meta' ? <span className="text-blue-400"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM15.36 17.57C14.6 17.72 13.9 17.46 13.43 17.06C12.96 16.66 12.68 15.93 12.68 15.93C12.68 15.93 12.4 16.66 11.93 17.06C11.46 17.46 10.76 17.72 10 17.57C8.89 17.34 8.24 16.21 8.5 15.08C8.75 14.07 10.04 11.66 11.39 9.39C11.53 9.15 11.75 9 12 9C12.25 9 12.47 9.15 12.61 9.39C13.96 11.66 15.25 14.07 15.5 15.08C15.76 16.21 15.11 17.34 14 17.57H15.36Z" /></svg></span> 
             : <span className="text-white"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231h.001Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z" /></svg></span>
             }
            {platformLabel}
        </h4>
        {isEditing ? (
            <div className="flex items-center gap-2">
                <button onClick={handleSave} className="p-1.5 text-green-400 hover:bg-gray-600 rounded-md"><SaveIcon /></button>
                <button onClick={handleCancel} className="p-1.5 text-red-400 hover:bg-gray-600 rounded-md"><CancelIcon /></button>
            </div>
        ) : (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="p-1.5 text-gray-400 hover:bg-gray-600 rounded-md"><EditIcon /></button>
                <CopyButton textToCopy={content.caption} onCopy={() => onCopy('캡션이 복사되었습니다.')} />
                <CopyButton textToCopy={hashtagsText} onCopy={() => onCopy('해시태그가 복사되었습니다.')} />
            </div>
        )}
      </div>

      {/* Render specialized format content (Carousel Slides / Reels Script) */}
      {!isEditing && renderInnerContent()}

      {isEditing ? (
        <div className="space-y-3">
            <textarea 
                ref={captionTextAreaRef}
                value={editedCaption} 
                onChange={(e) => setEditedCaption(e.target.value)}
                className="w-full bg-gray-900/80 rounded-md p-3 text-sm text-gray-200 focus:ring-1 focus:ring-purple-500 focus:outline-none resize-none overflow-hidden leading-relaxed"
                rows={1}
            />
            <textarea
                ref={hashtagsTextAreaRef}
                value={editedHashtags}
                onChange={(e) => setEditedHashtags(e.target.value)}
                className="w-full bg-gray-900/80 rounded-md p-3 text-sm text-blue-300/80 focus:ring-1 focus:ring-purple-500 focus:outline-none resize-none overflow-hidden"
                rows={1}
            />
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-200 whitespace-pre-wrap leading-loose tracking-wide border-l-2 border-purple-500/30 pl-4">{content.caption}</p>
          <p className="text-sm text-blue-300/90 whitespace-pre-wrap break-all leading-relaxed font-medium">{hashtagsText}</p>
        </div>
      )}
    </div>
  );
};

const VisualChoiceCard: React.FC<{ strategy: VisualStrategy; images: ImageFile[] }> = ({ strategy, images }) => {
    const selectedImage = images?.[strategy.selectedImageIndex];
    
    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 border border-purple-500/50 rounded-xl p-0.5 shadow-lg mt-6 group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
            <div className="bg-gray-900/95 rounded-[10px] p-5 flex flex-col sm:flex-row gap-6 items-start backdrop-blur-sm">
                 {selectedImage ? (
                     <div className="relative flex-shrink-0 w-full sm:w-36 aspect-square rounded-lg overflow-hidden border border-gray-700 bg-black shadow-lg">
                        <img 
                            src={`data:${selectedImage.mimeType};base64,${selectedImage.base64}`} 
                            alt="Selected Visual" 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-600 to-pink-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-bl-lg shadow-sm z-10 tracking-wide">
                            AI BEST PICK
                        </div>
                    </div>
                ) : (
                    <div className="w-full sm:w-36 aspect-square bg-gray-800 rounded-lg flex flex-col items-center justify-center text-gray-500 border border-gray-700 border-dashed">
                        <PhotoIcon />
                        <span className="text-xs mt-1">이미지 없음</span>
                    </div>
                )}
               
                <div className="flex-grow space-y-4">
                    <h4 className="text-md font-bold text-white flex items-center gap-2">
                        <span className="bg-purple-900/50 p-1.5 rounded-full text-purple-300"><PhotoIcon /></span>
                        AI 선정 베스트 컷 (Best Visual Pick)
                    </h4>
                    
                    <div className="grid gap-3">
                         <div className="bg-gray-800/50 p-3.5 rounded-lg border border-gray-700/50">
                            <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1.5">선정 이유 (Rationale)</span>
                            <p className="text-sm text-gray-200 leading-relaxed">{strategy.rationale}</p>
                        </div>
                         <div>
                             <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1.5">카피 연결 포인트 (Focus Point)</span>
                            <div className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-purple-900/30 text-purple-200 border border-purple-500/20">
                                ✨ {strategy.visualFocus}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result, setResult, showToast, uploadedImages }) => {
  type ViewKey = 'content' | 'reasoning' | 'json';
  
  const [activeView, setActiveView] = useState<ViewKey>('content');

  const langMap = Object.fromEntries(LANGUAGE_OPTIONS.map(l => [l.id, l.label]));
  const platformMap = Object.fromEntries(PLATFORM_OPTIONS.map(p => [p.id, p.label]));
  
  const availableLangs = Object.keys(result.marketingContent) as LangKey[];

  const handleCopyAll = () => {
    let fullText = `아이디어스 온드미디어 포스팅 콘텐츠\n================================\n\n`;

    for (const lang of availableLangs) {
        fullText += `--- ${langMap[lang]} ---\n\n`;
        const platforms = result.marketingContent[lang];
        if (platforms) {
            for (const platform of Object.keys(platforms) as PlatformKey[]) {
                const content = platforms[platform];
                fullText += `[${platformMap[platform]}]\n`;
                if(content.type === 'carousel') fullText += `[카드뉴스 기획안]\n`;
                if(content.type === 'reels') fullText += `[릴스 대본]\n`;
                fullText += `캡션:\n${content.caption}\n\n`;
                const hashtagsText = content.hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ');
                fullText += `해시태그:\n${hashtagsText}\n\n`;
            }
        }
        if (result.visualStrategy && result.visualStrategy[lang]) {
             fullText += `[Visual Guide]\n선택 이미지: Index ${result.visualStrategy[lang].selectedImageIndex}\n이유: ${result.visualStrategy[lang].rationale}\n\n`;
        }
    }
    navigator.clipboard.writeText(fullText);
    showToast('모든 콘텐츠가 클립보드에 복사되었습니다.');
  };

  const handleUpdateContent = (langKey: LangKey, platformKey: PlatformKey, newContent: ContentResult) => {
    if (!result) return;
    
    const newResult = JSON.parse(JSON.stringify(result));
    newResult.marketingContent[langKey][platformKey] = newContent;
    setResult(newResult);
    showToast('콘텐츠가 성공적으로 수정되었습니다.');
  };
  
  const ViewButton: React.FC<{
    label: string;
    view: ViewKey;
  }> = ({ label, view }) => (
     <button 
        onClick={() => setActiveView(view)} 
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeView === view ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}>
        {label}
    </button>
  );

  const renderContent = () => {
    if (activeView === 'json') {
        const jsonString = JSON.stringify(result, null, 2);
        return (
             <div className="bg-gray-900/50 rounded-lg p-4 relative">
                 <CopyButton textToCopy={jsonString} onCopy={() => showToast('JSON 원본이 복사되었습니다.')} className="absolute top-3 right-3" />
                <pre className="text-xs text-gray-300 overflow-x-auto">
                    <code>{jsonString}</code>
                </pre>
            </div>
        )
    }
     if (activeView === 'reasoning') {
         if (!result.reasoning) return <p className="text-gray-400">AI의 생성 근거가 요청되지 않았습니다.</p>;
        return (
             <div className="space-y-4">
                {Object.entries(result.reasoning).map(([lang, reason]) => (
                    <div key={lang}>
                        <h3 className="font-semibold text-purple-300 mb-2">{langMap[lang as LangKey]}</h3>
                        <p className="text-sm text-gray-300 bg-gray-700/50 p-3 rounded-md whitespace-pre-wrap">{reason}</p>
                    </div>
                ))}
            </div>
        )
    }

    return (
      <div className="space-y-12">
        {availableLangs.map((lang) => {
          const platforms = result.marketingContent[lang];
          if (!platforms) return null;
          return (
            <div key={lang} className="border-b border-gray-700 pb-12 last:border-0 last:pb-0">
              <div className="flex items-center gap-4 mb-6">
                  <h3 className="text-2xl font-bold text-white tracking-tight">{langMap[lang]}</h3>
                  <div className="h-px bg-gray-700 flex-grow"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {(Object.keys(platforms) as PlatformKey[]).map((platform) => (
                  <ContentCard
                    key={`${lang}-${platform}`}
                    langKey={lang}
                    platformKey={platform}
                    content={platforms[platform]}
                    platformLabel={platformMap[platform]}
                    onCopy={showToast}
                    onUpdate={handleUpdateContent}
                    uploadedImages={uploadedImages}
                  />
                ))}
              </div>

              {/* Display Visual Strategy with Thumbnail */}
              {result.visualStrategy && result.visualStrategy[lang] && (
                  <VisualChoiceCard 
                    strategy={result.visualStrategy[lang]} 
                    images={uploadedImages}
                  />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4 h-full">
        <div className="flex justify-between items-center border-b border-gray-700 pb-3">
            <div className="flex space-x-2 p-1 bg-gray-900/50 rounded-lg">
                <ViewButton label="콘텐츠 + 비주얼 픽" view="content" />
                {result.reasoning && <ViewButton label="AI의 생성 근거" view="reasoning" />}
                <ViewButton label="JSON 원본" view="json" />
            </div>
            {activeView === 'content' && (
              <button onClick={handleCopyAll} className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md bg-purple-600/50 text-purple-200 hover:bg-purple-600 transition-colors shadow-sm">
                <CopyAllIcon />
                <span>전체 복사</span>
              </button>
            )}
        </div>
       
        <div className="flex-grow overflow-y-auto pr-2 -mr-2">
            {renderContent()}
        </div>
    </div>
  );
};
