import React, { useState, ChangeEvent } from 'react';
import type { Campaign, ImageFile } from '../types';
import { PLATFORM_OPTIONS, LANGUAGE_OPTIONS, TONE_OPTIONS, MAX_IMAGES, MAX_IMAGE_SIZE_MB, CONTENT_FORMAT_OPTIONS } from '../constants';
import { UploadIcon, XCircleIcon, SpinnerIcon, ChevronDownIcon, MetaIcon, TwitterXIcon, FlagKRIcon, FlagUSIcon, FlagJPIcon } from './Icons';
import { SeasonalCalendar } from './SeasonalCalendar';

interface InputFormProps {
  campaign: Campaign;
  onUpdate: (updatedData: Partial<Campaign>) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });
};

type OpenSection = 'info' | 'details' | 'advanced' | '';

// Modern Flat Visual Tile
const VisualSelectTile: React.FC<{
    selected: boolean;
    onClick: () => void;
    icon?: React.ReactNode;
    label: string;
    subLabel?: string;
    disabled?: boolean;
}> = ({ selected, onClick, icon, label, subLabel, disabled }) => {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`
                relative flex flex-col items-center justify-center p-3 rounded-lg border transition-all duration-200 w-full h-full
                ${selected 
                    ? 'bg-white text-black border-white shadow-lg shadow-white/10 ring-1 ring-white' 
                    : 'bg-[#1A1F2E] border-white/5 text-gray-400 hover:bg-[#23293C] hover:border-white/10'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
        >
            <div className={`mb-1.5 transform transition-transform duration-200 ${selected ? 'scale-110 text-black' : 'text-gray-500'}`}>
                {icon}
            </div>
            <span className={`text-xs font-semibold ${selected ? 'text-black' : 'text-gray-400'}`}>{label}</span>
            {subLabel && <span className={`text-[9px] mt-0.5 ${selected ? 'text-gray-600' : 'opacity-50'}`}>{subLabel}</span>}
        </button>
    )
}

export const InputForm: React.FC<InputFormProps> = ({ campaign, onUpdate, onGenerate, isLoading }) => {
  const [errors, setErrors] = useState<{ url?: string; images?: string }>({});
  const [openSection, setOpenSection] = useState<OpenSection>('info');

  const { sharedInfo, socialContent } = campaign;
  const { userInput } = socialContent;

  const handleSharedInfoChange = (field: keyof typeof sharedInfo, value: any) => {
    onUpdate({ sharedInfo: { ...sharedInfo, [field]: value }});
  }

  const handleUserInput = (field: keyof typeof userInput, value: any) => {
    const newSocialContent = { ...socialContent, userInput: { ...userInput, [field]: value } };
    onUpdate({ socialContent: newSocialContent });
  }

  const handleSeasonalEventSelect = (eventId: string | null) => {
      handleUserInput('seasonalEvent', eventId);
  };

  const handleCheckboxChange = (field: 'platforms' | 'languages', value: string) => {
    const currentValues = userInput[field];
    const newValues = currentValues.includes(value as never) 
      ? currentValues.filter((item: string) => item !== value)
      : [...currentValues, value];
    handleUserInput(field, newValues);
  };

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || isLoading) return;

    if (sharedInfo.images.length + files.length > MAX_IMAGES) {
      alert(`최대 ${MAX_IMAGES}개의 이미지만 업로드 가능합니다.`);
      return;
    }

    const newImages: ImageFile[] = [];
    for (const file of Array.from(files)) {
      const currentFile = file as File;
      if (currentFile.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        alert(`${currentFile.name} 용량이 너무 큽니다.`);
        continue;
      }
      try {
        const base64 = await fileToBase64(currentFile);
        newImages.push({ name: currentFile.name, base64, mimeType: currentFile.type });
      } catch (error) {
        alert(`${currentFile.name} 처리 중 오류 발생`);
      }
    }
    handleSharedInfoChange('images', [...sharedInfo.images, ...newImages]);
    event.target.value = ''; 
  };
  
  const removeImage = (index: number) => {
    handleSharedInfoChange('images', sharedInfo.images.filter((_, i) => i !== index));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentErrors: { url?: string; images?: string } = {};
    if (!sharedInfo.productUrl.trim()) {
      currentErrors.url = 'URL을 입력해주세요';
    }
    if (sharedInfo.images.length === 0) {
      currentErrors.images = '이미지를 업로드해주세요';
    }
    setErrors(currentErrors);

    if (Object.keys(currentErrors).length > 0) {
        setOpenSection('info');
        return;
    }
    onGenerate();
  };

  const AccordionSection: React.FC<{
    sectionId: OpenSection;
    title: string;
    children: React.ReactNode;
  }> = ({ sectionId, title, children }) => (
    <div className="border-b border-white/5 last:border-0">
      <button
        type="button"
        onClick={() => setOpenSection(openSection === sectionId ? '' : sectionId)}
        className="w-full flex justify-between items-center py-4 text-left group"
      >
        <h3 className={`text-sm font-semibold transition-colors ${openSection === sectionId ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>{title}</h3>
        <ChevronDownIcon
          className={`h-4 w-4 text-gray-600 transition-transform duration-300 ${
            openSection === sectionId ? 'rotate-180 text-white' : ''
          }`}
        />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openSection === sectionId ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="pb-6 space-y-6">{children}</div>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="bg-[#121623] border border-white/5 rounded-xl shadow-lg overflow-hidden">
      <fieldset disabled={isLoading} className="p-5 space-y-2">
        <AccordionSection sectionId="info" title="1. 작품 및 리소스 (Product & Assets)">
          <div className="space-y-4">
            <div>
              <label htmlFor="productUrl" className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">작품 URL (Product URL)</label>
              <input
                type="url"
                id="productUrl"
                value={sharedInfo.productUrl}
                onChange={(e) => {
                  handleSharedInfoChange('productUrl', e.target.value);
                  if (errors.url) setErrors(prev => ({ ...prev, url: undefined }));
                }}
                className="w-full bg-[#0B0F19] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-colors"
                placeholder="https://www.idus.com/w/product/..."
              />
              {errors.url && <p className="mt-1 text-xs text-red-400">{errors.url}</p>}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">이미지 리소스 (Visual Assets)</label>
              <div className={`relative flex flex-col items-center justify-center border border-dashed rounded-lg p-6 transition-all ${isLoading ? 'border-gray-700 bg-gray-800/30' : 'border-gray-700 hover:border-gray-500 bg-[#0B0F19]'}`}>
                 <UploadIcon />
                 <p className="mt-2 text-xs font-medium text-gray-400">이미지를 드래그 앤 드롭 하세요</p>
                 <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" multiple accept="image/*" onChange={handleImageChange} disabled={isLoading} />
              </div>
              
              {errors.images && <p className="mt-1 text-xs text-red-400">{errors.images}</p>}
              
              {sharedInfo.images.length > 0 && (
                <div className="mt-3 flex gap-2 overflow-x-auto py-1 custom-scrollbar">
                  {sharedInfo.images.map((image, index) => (
                    <div key={index} className="relative group w-16 h-16 flex-shrink-0 rounded-md overflow-hidden border border-gray-700">
                      <img src={`data:${image.mimeType};base64,${image.base64}`} alt={image.name} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImage(index)} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                        <XCircleIcon />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </AccordionSection>

        <AccordionSection sectionId="details" title="2. 전략 및 설정 (Strategy & Settings)">
          
          <SeasonalCalendar selectedEventId={userInput.seasonalEvent} onSelectEvent={handleSeasonalEventSelect} />

          <div className="space-y-6">
            {/* Format Selection */}
            <div>
               <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">콘텐츠 포맷 (Content Format)</label>
               <div className="grid grid-cols-3 gap-2">
                   {CONTENT_FORMAT_OPTIONS.map(format => (
                       <VisualSelectTile
                            key={format.id}
                            selected={userInput.format === format.id}
                            onClick={() => handleUserInput('format', format.id)}
                            disabled={isLoading}
                            label={format.label.split(' ')[0]}
                            subLabel={format.label.split(' ')[1].replace(/[()]/g, '')}
                            icon={<span className="text-lg opacity-80">{format.id === 'feed' ? '🖼️' : format.id === 'carousel' ? '📑' : '🎥'}</span>}
                       />
                   ))}
               </div>
            </div>

            {/* Platform Selection */}
            <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">타겟 플랫폼 (Target Platforms)</label>
                <div className="grid grid-cols-2 gap-2">
                     {PLATFORM_OPTIONS.map(option => (
                        <VisualSelectTile 
                            key={option.id}
                            selected={userInput.platforms.includes(option.id)}
                            onClick={() => handleCheckboxChange('platforms', option.id)}
                            disabled={isLoading}
                            label={option.label.split(' ')[0]}
                            icon={option.id === 'meta' ? <MetaIcon className="w-4 h-4"/> : <TwitterXIcon className="w-4 h-4"/>}
                        />
                     ))}
                </div>
            </div>

             {/* Language Selection */}
             <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">생성 언어 (Languages)</label>
                <div className="grid grid-cols-3 gap-2">
                     {LANGUAGE_OPTIONS.map(option => (
                        <VisualSelectTile 
                            key={option.id}
                            selected={userInput.languages.includes(option.id)}
                            onClick={() => handleCheckboxChange('languages', option.id)}
                            disabled={isLoading}
                            label={option.label}
                            icon={option.id === 'korean' ? <FlagKRIcon className="w-4 h-4 rounded-sm"/> : option.id === 'english' ? <FlagUSIcon className="w-4 h-4 rounded-sm"/> : <FlagJPIcon className="w-4 h-4 rounded-sm"/>}
                        />
                     ))}
                </div>
            </div>

            {/* Tone Selection */}
            <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">브랜드 보이스 (Tone & Manner)</label>
                <div className="flex flex-wrap gap-1.5">
                    {TONE_OPTIONS.map(option => (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => handleUserInput('tone', option.id)}
                            disabled={isLoading}
                            className={`px-3 py-1.5 rounded text-xs font-medium border transition-all ${
                                userInput.tone === option.id 
                                ? 'bg-white text-black border-white shadow-sm' 
                                : 'bg-transparent text-gray-400 border-gray-700 hover:border-gray-500 hover:text-gray-200'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>
          </div>
        </AccordionSection>

        <AccordionSection sectionId="advanced" title="3. AI 고급 설정 (AI Configuration)">
           <div className="flex items-center justify-between bg-[#0B0F19] p-3 rounded-lg border border-white/5">
               <div>
                   <h4 className="text-xs font-semibold text-gray-300">AI 생각 보기 (Reasoning)</h4>
                   <p className="text-[10px] text-gray-500 mt-0.5">콘텐츠 생성 과정의 논리적 근거를 함께 출력합니다.</p>
               </div>
               <button 
                type="button" 
                onClick={() => handleUserInput('includeReasoning', !userInput.includeReasoning)} 
                className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${userInput.includeReasoning ? 'bg-purple-600' : 'bg-gray-700'}`}
               >
                   <div className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform duration-200 ${userInput.includeReasoning ? 'translate-x-4' : ''}`}></div>
               </button>
           </div>
        </AccordionSection>
      </fieldset>
      
      <div className="p-5 pt-0 mt-2">
        <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white text-black font-bold py-3.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 shadow-lg flex items-center justify-center gap-2"
        >
             {isLoading ? <SpinnerIcon className="text-black" /> : <span>✨ 콘텐츠 생성하기</span>}
        </button>
      </div>
    </form>
  );
};