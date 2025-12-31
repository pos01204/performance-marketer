
import React, { useState, ChangeEvent, useEffect, useMemo } from 'react';
import type { Campaign, ImageFile } from '../types';
import { LANDING_PAGE_OPTIONS, TARGET_REGION_OPTIONS, MAX_IMAGES, MAX_IMAGE_SIZE_MB, CRM_TRIGGER_EVENTS, CRM_VARIABLES } from '../constants';
import { UploadIcon, XCircleIcon, SpinnerIcon } from './Icons';

interface CrmInputFormProps {
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

export const CrmInputForm: React.FC<CrmInputFormProps> = ({ campaign, onUpdate, onGenerate, isLoading }) => {
  const { sharedInfo, crmContent } = campaign;
  const { userInput } = crmContent;

  const [errors, setErrors] = useState<{ url?: string; images?: string; info?: string }>({});

  const handleSharedInfoChange = (field: keyof typeof sharedInfo, value: any) => {
    onUpdate({ sharedInfo: { ...sharedInfo, [field]: value }});
  }

  const handleUserInput = (field: keyof typeof userInput, value: any) => {
    const newCrmContent = { ...crmContent, userInput: { ...userInput, [field]: value } };
    onUpdate({ crmContent: newCrmContent });
  }

  // Reset additional info when trigger changes
  useEffect(() => {
    handleUserInput('additionalInfo', {});
    setErrors(prev => ({ ...prev, info: undefined }));
  }, [userInput.crmTrigger]);

  const { urlLabel, imageLabel, urlPlaceholder } = useMemo(() => {
    switch (userInput.landingPage) {
      case 'artist_home':
        return { urlLabel: '작가홈 URL', imageLabel: '대표 작품 이미지', urlPlaceholder: 'https://www.idus.com/w/artist/...' };
      case 'exhibition':
        return { urlLabel: '기획전 URL', imageLabel: '기획전 대표 이미지', urlPlaceholder: 'https://www.idus.com/w/exhibition/...' };
      case 'product_detail':
      default:
        return { urlLabel: '작품 페이지 URL', imageLabel: '작품 이미지', urlPlaceholder: 'https://www.idus.com/w/product/...' };
    }
  }, [userInput.landingPage]);

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || isLoading) return;
    if (sharedInfo.images.length + files.length > MAX_IMAGES) {
      alert(`최대 ${MAX_IMAGES}개의 이미지만 업로드할 수 있습니다.`);
      return;
    }
    const newImages: ImageFile[] = [];
    for (const file of Array.from(files)) {
      const currentFile = file as File;
      if (currentFile.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        alert(`${currentFile.name} 파일의 크기가 너무 큽니다 (최대 ${MAX_IMAGE_SIZE_MB}MB).`);
        continue;
      }
      try {
        const base64 = await fileToBase64(currentFile);
        newImages.push({ name: currentFile.name, base64, mimeType: currentFile.type });
      } catch (error) {
        console.error("Error converting file to base64", error);
        alert(`${currentFile.name} 파일을 처리하는 중 오류가 발생했습니다.`);
      }
    }
    handleSharedInfoChange('images', [...sharedInfo.images, ...newImages]);
    event.target.value = ''; 
  };
  
  const removeImage = (index: number) => {
    handleSharedInfoChange('images', sharedInfo.images.filter((_, i) => i !== index));
  };

  const handleVariableToggle = (variableId: string) => {
      const current = userInput.selectedVariables;
      const updated = current.includes(variableId)
        ? current.filter(id => id !== variableId)
        : [...current, variableId];
      handleUserInput('selectedVariables', updated);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentErrors: { url?: string; images?: string; info?: string } = {};
    if (!sharedInfo.productUrl.trim()) {
      currentErrors.url = `${urlLabel}을(를) 입력해주세요.`;
    }
    if (sharedInfo.images.length === 0) {
      currentErrors.images = `하나 이상의 ${imageLabel}을(를) 업로드해주세요.`;
    }
    
    // Validate trigger specific requirements
    if ((userInput.crmTrigger === 'cart_abandonment' || userInput.crmTrigger === 'win_back') && !userInput.additionalInfo.discountInfo) {
        currentErrors.info = "고객을 유인할 혜택이나 할인 정보를 입력해주세요.";
    }

    setErrors(currentErrors);
    if (Object.keys(currentErrors).length > 0) return;
    onGenerate();
  };

  const handleInfoChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleUserInput('additionalInfo', {...userInput.additionalInfo, [e.target.name]: e.target.value});
    if (errors.info) setErrors(prev => ({ ...prev, info: undefined }));
  }

  const renderAdditionalInputs = () => {
      const trigger = CRM_TRIGGER_EVENTS.find(t => t.id === userInput.crmTrigger);
      if (!trigger) return null;

      if (userInput.crmTrigger === 'cart_abandonment' || userInput.crmTrigger === 'win_back') {
          return (
              <div className="bg-gray-700/50 p-4 rounded-lg space-y-3 border border-gray-600">
                  <h4 className="text-sm font-semibold text-purple-300">{trigger.label} 필수 정보</h4>
                  <div>
                      <label htmlFor="discountInfo" className="block text-sm text-gray-300 mb-1">제안할 혜택/할인 (필수)</label>
                      <input type="text" id="discountInfo" name="discountInfo" value={userInput.additionalInfo.discountInfo || ''} onChange={handleInfoChange} className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-sm text-gray-100 placeholder-gray-500" placeholder="예: 3,000원 쿠폰, 무료배송, 10% 할인" />
                      {errors.info && <p className="text-xs text-red-400 mt-1">{errors.info}</p>}
                  </div>
              </div>
          )
      }
      
      if (userInput.crmTrigger === 'welcome_series') {
           return (
              <div className="bg-gray-700/50 p-4 rounded-lg space-y-3 border border-gray-600">
                  <h4 className="text-sm font-semibold text-purple-300">신규 가입 혜택 정보</h4>
                  <div>
                      <label htmlFor="benefitInfo" className="block text-sm text-gray-300 mb-1">가입 축하 혜택 (선택)</label>
                      <input type="text" id="benefitInfo" name="benefitInfo" value={userInput.additionalInfo.benefitInfo || ''} onChange={handleInfoChange} className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-sm text-gray-100 placeholder-gray-500" placeholder="예: 첫 구매 100원 딜, 웰컴 쿠폰팩" />
                  </div>
              </div>
          )
      }

      return null;
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
      <fieldset disabled={isLoading} className="space-y-6">
        
        {/* Step 1: Trigger Selection */}
        <div className="border-b border-gray-700 pb-6">
            <h3 className="text-md font-semibold text-gray-200 mb-2">1. CRM 이벤트 트리거 (Trigger)</h3>
            <p className="text-xs text-gray-400 mb-4">어떤 상황의 고객에게 메시지를 보낼까요? 5대 핵심 이벤트를 지원합니다.</p>
            <div className="space-y-3">
                {CRM_TRIGGER_EVENTS.map(trigger => (
                    <label key={trigger.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${userInput.crmTrigger === trigger.id ? 'bg-purple-900/30 border-purple-500' : 'bg-gray-700 border-transparent hover:bg-gray-600'}`}>
                        <input 
                            type="radio" 
                            name="crmTrigger" 
                            value={trigger.id} 
                            checked={userInput.crmTrigger === trigger.id} 
                            onChange={(e) => handleUserInput('crmTrigger', e.target.value)}
                            className="mt-1"
                        />
                        <div>
                            <span className="block font-medium text-gray-200 text-sm">{trigger.label}</span>
                            <span className="block text-xs text-gray-400 mt-0.5">{trigger.description}</span>
                        </div>
                    </label>
                ))}
            </div>
        </div>
        
        {/* Step 2: Context & Variables */}
        <div className="border-b border-gray-700 pb-6">
            <h3 className="text-md font-semibold text-gray-200 mb-4">2. 메시지 구성 요소</h3>
            {renderAdditionalInputs()}
            
            <div className="mt-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">개인화 변수 (Variables)</label>
                <div className="grid grid-cols-2 gap-2">
                    {CRM_VARIABLES.map(variable => (
                        <button
                            key={variable.id}
                            type="button"
                            onClick={() => handleVariableToggle(variable.id)}
                            className={`flex items-center justify-between px-3 py-2 rounded-md text-sm border transition-all ${userInput.selectedVariables.includes(variable.id) ? 'bg-purple-600 text-white border-purple-500' : 'bg-gray-700 text-gray-400 border-gray-600 hover:border-gray-500'}`}
                        >
                            <span>{variable.label}</span>
                            <span className="text-xs opacity-70 ml-2">{variable.token}</span>
                        </button>
                    ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">* 선택한 변수는 AI가 문맥에 맞게 자동으로 문구에 포함시킵니다.</p>
            </div>
        </div>

        {/* Step 3: Content Info */}
        <div>
            <h3 className="text-md font-semibold text-gray-200 mb-4">3. 콘텐츠 정보 입력</h3>
            <div className="space-y-4">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="targetRegion" className="block text-sm font-medium text-gray-300 mb-1">타겟 권역</label>
                        <select id="targetRegion" value={userInput.targetRegion} onChange={(e) => handleUserInput('targetRegion', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                            {TARGET_REGION_OPTIONS.map(option => (
                                <option key={option.id} value={option.id}>{option.label}</option>
                            ))}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="landingPage" className="block text-sm font-medium text-gray-300 mb-1">랜딩 페이지</label>
                        <select id="landingPage" value={userInput.landingPage} onChange={(e) => handleUserInput('landingPage', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                        {LANDING_PAGE_OPTIONS.map(option => (
                            <option key={option.id} value={option.id}>{option.label}</option>
                        ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label htmlFor="crmProductUrl" className="block text-sm font-medium text-gray-300 mb-2">{urlLabel}</label>
                    <input type="url" id="crmProductUrl" value={sharedInfo.productUrl} onChange={(e) => { handleSharedInfoChange('productUrl', e.target.value); if (errors.url) setErrors(prev => ({ ...prev, url: undefined })); }} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder={urlPlaceholder}/>
                    {errors.url && <p className="mt-2 text-sm text-red-400">{errors.url}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{imageLabel}</label>
                    <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md ${isLoading ? 'opacity-50' : ''}`}>
                        <div className="space-y-1 text-center">
                            <UploadIcon />
                            <div className="flex text-sm text-gray-400">
                                <label htmlFor="file-upload-crm" className={`relative rounded-md font-medium text-purple-400 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-800 focus-within:ring-purple-500 px-1 ${isLoading ? 'cursor-not-allowed' : 'cursor-pointer hover:text-purple-300 bg-gray-700'}`}>
                                    <span>파일 선택</span>
                                    <input id="file-upload-crm" name="file-upload-crm" type="file" className="sr-only" multiple accept="image/png, image/jpeg, image/webp" onChange={handleImageChange} disabled={isLoading} />
                                </label>
                                <p className="pl-1">또는 드래그 앤 드롭</p>
                            </div>
                            <p className="text-xs text-gray-500">PNG, JPG, WEBP. 최대 {MAX_IMAGES}개</p>
                        </div>
                    </div>
                    {errors.images && <p className="mt-2 text-sm text-red-400">{errors.images}</p>}
                    {sharedInfo.images.length > 0 && (
                        <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                            {sharedInfo.images.map((image, index) => (
                                <div key={index} className="relative group aspect-square">
                                    <img src={`data:${image.mimeType};base64,${image.base64}`} alt={image.name} className="w-full h-full object-cover rounded-md" />
                                    <button type="button" onClick={() => removeImage(index)} className="absolute -top-2 -right-2 bg-gray-700 text-red-400 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading}>
                                        <XCircleIcon />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>

      </fieldset>
      
      <div className="pt-2">
        <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-4 rounded-md hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500"
        >
            {isLoading ? (
            <>
                <SpinnerIcon />
                <span>생성 중...</span>
            </>
            ) : (
            'CRM 카피 생성하기'
            )}
        </button>
      </div>
    </form>
  );
};
