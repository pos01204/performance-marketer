import React, { useState, useCallback, useEffect } from 'react';
import type { Campaign, TrendData, AppliedStrategy } from '../types';
import { InputForm } from './InputForm';
import { ResultsDisplay } from './ResultsDisplay';
import { CrmInputForm } from './CrmInputForm';
import { CrmResultsDisplay } from './CrmResultsDisplay';
import { ReviewExport } from './ReviewExport';
import { CrawlView } from './CrawlView';
import { Loader } from './Loader';
import { Toast } from './Toast';
import { SparklesLargeIcon, EditIcon, CheckIcon } from './Icons';
import { generateContent } from '../services/geminiService';
import { generateCrmCopy } from '../services/crmService';
import { analyzeKeyword } from '../services/trendService';
import { getTrendingKeywords } from '../services/crawlService';

interface CampaignWorkspaceProps {
  campaign: Campaign;
  onUpdateCampaign: (campaignId: string, updatedData: Partial<Campaign>) => void;
}

type WorkspaceTab = 'research' | 'social' | 'crm' | 'review';

export const CampaignWorkspace: React.FC<CampaignWorkspaceProps> = ({ campaign, onUpdateCampaign }) => {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('research');
  const [toastMessage, setToastMessage] = useState<string>('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [campaignName, setCampaignName] = useState(campaign.name);

  const [trends, setTrends] = useState<TrendData | null>(null);
  const [isTrendsLoading, setIsTrendsLoading] = useState(false);
  const [trendsError, setTrendsError] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleUpdate = useCallback((updatedData: Partial<Campaign>) => {
    onUpdateCampaign(campaign.id, updatedData);
  }, [campaign.id, onUpdateCampaign]);

  const handleNameSave = () => {
    if (campaignName.trim() && campaignName.trim() !== campaign.name) {
        handleUpdate({ name: campaignName.trim() });
    } else {
        setCampaignName(campaign.name);
    }
    setIsEditingName(false);
  };

  useEffect(() => {
    if (activeTab === 'research' && !trends && !isTrendsLoading) {
        const fetchTrends = async () => {
            setIsTrendsLoading(true);
            setTrendsError(null);
            try {
                const data = await getTrendingKeywords();
                setTrends(data);
            } catch (e) {
                setTrendsError("트렌드 데이터를 불러오지 못했습니다.");
            } finally {
                setIsTrendsLoading(false);
            }
        };
        fetchTrends();
    }
  }, [activeTab, trends]);

  const handleAnalyzeKeyword = async () => {
    if (!campaign.trendAnalysis.keyword) return;
    handleUpdate({ trendAnalysis: { ...campaign.trendAnalysis, isLoading: true, error: null } });
    try {
        const result = await analyzeKeyword(campaign.trendAnalysis.keyword);
        handleUpdate({ trendAnalysis: { ...campaign.trendAnalysis, result, isLoading: false } });
    } catch (e) {
        const errorMsg = e instanceof Error ? e.message : '분석 실패';
         handleUpdate({ trendAnalysis: { ...campaign.trendAnalysis, error: errorMsg, isLoading: false } });
    }
  };

  const handleResearchGenerateRequest = (url?: string) => {
      if (url) {
          handleUpdate({ sharedInfo: { ...campaign.sharedInfo, productUrl: url } });
          showToast('URL이 적용되었습니다.');
      }
      setActiveTab('social');
  };

  const handleSetAnalysisKeyword: React.Dispatch<React.SetStateAction<string>> = (action) => {
    const currentKeyword = campaign.trendAnalysis.keyword;
    const newKeyword = typeof action === 'function' ? action(currentKeyword) : action;
    handleUpdate({ trendAnalysis: { ...campaign.trendAnalysis, keyword: newKeyword } });
  };
  
  const handleApplyStrategy = (strategy: AppliedStrategy) => {
      handleUpdate({ strategy });
      showToast('전략이 채택되었습니다! 소셜 및 CRM 생성에 반영됩니다.');
  };

  const handleGenerateSocial = useCallback(async () => {
    handleUpdate({ socialContent: { ...campaign.socialContent, isLoading: true, error: null, result: null } });
    try {
      const response = await generateContent({ ...campaign.socialContent.userInput, ...campaign.sharedInfo, strategy: campaign.strategy });
      handleUpdate({ socialContent: { ...campaign.socialContent, result: response, isLoading: false } });
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : '콘텐츠 생성 실패';
      handleUpdate({ socialContent: { ...campaign.socialContent, error: errorMsg, isLoading: false } });
    }
  }, [campaign, handleUpdate]);

  const handleGenerateCrm = useCallback(async () => {
    handleUpdate({ crmContent: { ...campaign.crmContent, isLoading: true, error: null, result: null } });
    try {
      const response = await generateCrmCopy({ ...campaign.crmContent.userInput, ...campaign.sharedInfo, strategy: campaign.strategy });
      handleUpdate({ crmContent: { ...campaign.crmContent, result: response, isLoading: false } });
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'CRM 생성 실패';
      handleUpdate({ crmContent: { ...campaign.crmContent, error: errorMsg, isLoading: false } });
    }
  }, [campaign, handleUpdate]);

  const StepperNav: React.FC = () => {
      const steps = [
          { id: 'research', label: '1. 시장 분석' },
          { id: 'social', label: '2. 소셜 콘텐츠' },
          { id: 'crm', label: '3. CRM 카피' },
          { id: 'review', label: '4. 최종 검토' }
      ];

      return (
          <div className="flex items-center gap-1 bg-[#0B0F19] p-1 rounded-lg border border-white/5 mx-auto">
              {steps.map((step) => {
                  const isActive = activeTab === step.id;
                  return (
                    <button 
                        key={step.id}
                        onClick={() => setActiveTab(step.id as WorkspaceTab)}
                        className={`
                            px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap
                            ${isActive 
                                ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/5' 
                                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                            }
                        `}
                    >
                        {step.label}
                    </button>
                  )
              })}
          </div>
      )
  };

  const StrategyBanner: React.FC = () => {
      if (!campaign.strategy) return null;
      return (
          <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-lg p-3 mb-6 flex items-center justify-between border border-purple-500/20">
              <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300">
                      <SparklesLargeIcon />
                  </div>
                  <div>
                      <h4 className="text-sm font-semibold text-white">
                          타겟 시장: {campaign.strategy.selectedRegion === 'english' ? '북미 (영어권)' : '일본 (일본어권)'}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                           <span className="text-xs text-purple-300 font-mono font-bold">전략 적용됨</span>
                           <span className="w-1 h-1 rounded-full bg-purple-500"></span>
                           <span className="text-xs text-gray-400 truncate max-w-[200px]">{campaign.strategy.keywords.join(', ')}</span>
                      </div>
                  </div>
              </div>
          </div>
      )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'research':
        return (
            <div className="animate-fade-in max-w-7xl mx-auto">
                <CrawlView
                    onGenerateRequest={handleResearchGenerateRequest}
                    trends={trends}
                    isTrendsLoading={isTrendsLoading}
                    trendsError={trendsError}
                    analysisKeyword={campaign.trendAnalysis.keyword}
                    setAnalysisKeyword={handleSetAnalysisKeyword}
                    isAnalyzing={campaign.trendAnalysis.isLoading}
                    analysisResult={campaign.trendAnalysis.result}
                    analysisError={campaign.trendAnalysis.error}
                    onAnalysis={handleAnalyzeKeyword}
                    onApplyStrategy={handleApplyStrategy}
                />
            </div>
        );
      case 'social':
        return (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start animate-fade-in max-w-screen-2xl mx-auto">
            <div className="xl:col-span-4 space-y-6">
                <StrategyBanner />
                <InputForm campaign={campaign} onUpdate={handleUpdate} onGenerate={handleGenerateSocial} isLoading={campaign.socialContent.isLoading} />
            </div>
            <div className="xl:col-span-8 bg-[#121623] rounded-xl border border-white/5 min-h-[600px] flex flex-col shadow-2xl relative overflow-hidden">
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
                    <h2 className="text-sm font-semibold text-gray-300">생성된 콘텐츠 (Generated Output)</h2>
                    <div className="flex gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></span>
                        <span className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></span>
                        <span className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></span>
                    </div>
                </div>
                <div className="p-6 flex-grow">
                    {campaign.socialContent.isLoading && <Loader context="소셜 미디어 포스팅 초안 작성 중..." />}
                    {campaign.socialContent.error && <p className="text-red-400 bg-red-900/20 p-4 rounded-lg border border-red-500/50">{campaign.socialContent.error}</p>}
                    {campaign.socialContent.result ? 
                        <ResultsDisplay 
                            result={campaign.socialContent.result} 
                            setResult={(newResult) => handleUpdate({ socialContent: { ...campaign.socialContent, result: newResult }})} 
                            showToast={showToast} 
                            uploadedImages={campaign.sharedInfo.images}
                        /> : 
                        !campaign.socialContent.isLoading && (
                            <div className="h-full flex flex-col items-center justify-center text-center text-gray-600">
                                <SparklesLargeIcon />
                                <p className="mt-4 text-sm">좌측에서 설정을 완료하고 생성 버튼을 눌러주세요.</p>
                            </div>
                        )
                    }
                </div>
            </div>
          </div>
        );
      case 'crm':
        return (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start animate-fade-in max-w-screen-2xl mx-auto">
            <div className="xl:col-span-4 space-y-6">
                <StrategyBanner />
                <CrmInputForm campaign={campaign} onUpdate={handleUpdate} onGenerate={handleGenerateCrm} isLoading={campaign.crmContent.isLoading} />
            </div>
             <div className="xl:col-span-8 bg-[#121623] rounded-xl border border-white/5 min-h-[600px] flex flex-col shadow-2xl">
                 <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
                    <h2 className="text-sm font-semibold text-gray-300">생성된 CRM 카피 (Generated Copy)</h2>
                </div>
                <div className="p-6 flex-grow">
                    {campaign.crmContent.isLoading && <Loader context="전환율 최적화 카피라이팅 수행 중..." />}
                    {campaign.crmContent.error && <p className="text-red-400 bg-red-900/20 p-4 rounded-lg border border-red-500/50">{campaign.crmContent.error}</p>}
                    {campaign.crmContent.result ? <CrmResultsDisplay result={campaign.crmContent.result} showToast={showToast} /> : !campaign.crmContent.isLoading && (
                        <div className="h-full flex flex-col items-center justify-center text-center text-gray-600">
                            <SparklesLargeIcon />
                            <p className="mt-4 text-sm">좌측에서 설정을 완료하고 생성 버튼을 눌러주세요.</p>
                        </div>
                    )}
                </div>
            </div>
          </div>
        );
      case 'review':
          return (
              <div className="max-w-5xl mx-auto animate-fade-in">
                  <ReviewExport campaign={campaign} showToast={showToast} />
              </div>
          );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Workspace Header */}
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#0B0F19]/80 backdrop-blur-md sticky top-0 z-10">
           <div className="flex items-center gap-4">
                {isEditingName ? (
                    <input
                        type="text"
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                        onBlur={handleNameSave}
                        onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                        className="bg-transparent text-lg font-bold text-white border-b border-purple-500 focus:outline-none w-64"
                        autoFocus
                    />
                ) : (
                    <h2 onClick={() => setIsEditingName(true)} className="text-lg font-bold text-white cursor-pointer hover:text-gray-300 transition-colors">
                        {campaign.name}
                    </h2>
                )}
                <button onClick={() => setIsEditingName(!isEditingName)} className="text-gray-600 hover:text-white transition-colors">
                    <EditIcon />
                </button>
           </div>
           
           <div className="flex-1 flex justify-center">
                <StepperNav />
           </div>

           <div className="w-64 flex justify-end">
               {/* Optional Header Actions */}
               <span className="text-xs font-mono text-gray-600">ID: {campaign.id.substring(0,8)}</span>
           </div>
      </header>

      {/* Main Scrollable Content */}
      <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
          {renderContent()}
      </div>
      
      <Toast message={toastMessage} show={!!toastMessage} />
    </div>
  );
};