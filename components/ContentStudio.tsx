import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Copy, 
  Check, 
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Loader2,
  Instagram,
  Twitter,
  MessageSquare,
  RefreshCw,
  ExternalLink,
  Settings2
} from 'lucide-react';
import { useCampaignStore } from '../store/campaignStore';
import { generateContent } from '../services/geminiService';
import { generateCrmCopy } from '../services/crmService';
import { formatPrice } from '../services/idusService';
import {
  PLATFORM_OPTIONS,
  LANGUAGE_OPTIONS,
  CONTENT_FORMAT_OPTIONS,
  TONE_OPTIONS,
  CRM_TYPE_OPTIONS,
  CRM_TRIGGER_OPTIONS,
  CRM_VARIABLE_OPTIONS,
  TARGET_REGION_OPTIONS,
  SEASONAL_EVENTS,
} from '../constants';
import type { 
  Platform, 
  Language, 
  ContentFormat, 
  CrmType, 
  CrmTrigger,
  TargetRegion,
  SocialContentResult,
  CrmContentResult,
  IdusProduct
} from '../types';

interface ContentStudioProps {
  onNavigateBack: () => void;
}

export const ContentStudio: React.FC<ContentStudioProps> = ({ onNavigateBack }) => {
  const { 
    selectedProducts, 
    isGenerating, 
    setIsGenerating,
    generationError,
    setGenerationError,
    addToHistory,
    settings 
  } = useCampaignStore();

  // 소셜 콘텐츠 설정
  const [platforms, setPlatforms] = useState<Platform[]>([...settings.defaultPlatforms]);
  const [languages, setLanguages] = useState<Language[]>([...settings.defaultLanguages]);
  const [format, setFormat] = useState<ContentFormat>(settings.defaultFormat);
  const [tone, setTone] = useState(settings.defaultTone);
  const [seasonalEvent, setSeasonalEvent] = useState<string | null>(null);
  const [includeReasoning, setIncludeReasoning] = useState(false);

  // CRM 설정
  const [crmType, setCrmType] = useState<CrmType>('product');
  const [crmTrigger, setCrmTrigger] = useState<CrmTrigger>(settings.defaultTrigger);
  const [targetRegions, setTargetRegions] = useState<TargetRegion[]>(['north_america', 'japan']);
  const [crmVariables, setCrmVariables] = useState<string[]>(['user_name', 'product_name']);
  const [additionalBenefit, setAdditionalBenefit] = useState('');

  // 확장 CRM 설정
  const [exhibitionUrl, setExhibitionUrl] = useState('');
  const [exhibitionTitle, setExhibitionTitle] = useState('');
  const [artistUrl, setArtistUrl] = useState('');
  const [artistName, setArtistName] = useState('');

  // 결과
  const [socialResult, setSocialResult] = useState<SocialContentResult | null>(null);
  const [crmResult, setCrmResult] = useState<CrmContentResult | null>(null);
  const [activeResultTab, setActiveResultTab] = useState<'social' | 'crm'>('social');
  const [activeLanguage, setActiveLanguage] = useState<Language>('korean');

  // UI 상태
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 복사 기능
  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 콘텐츠 생성
  const handleGenerate = useCallback(async () => {
    if (selectedProducts.length === 0) return;

    setIsGenerating(true);
    setGenerationError(null);
    setSocialResult(null);
    setCrmResult(null);

    try {
      // 소셜 콘텐츠 생성
      const socialResponse = await generateContent({
        productUrl: selectedProducts[0].url,
        images: [], // 이미지는 별도 처리
        platforms,
        languages,
        format,
        tone,
        seasonalEvent,
        includeReasoning,
      });
      setSocialResult(socialResponse);

      // CRM 콘텐츠 생성
      const crmResponse = await generateCrmCopy({
        productUrl: selectedProducts[0].url,
        images: [],
        landingPage: 'product_detail',
        targetRegion: targetRegions[0],
        crmTrigger,
        selectedVariables: crmVariables,
        additionalInfo: additionalBenefit ? { discountInfo: additionalBenefit } : {},
      });
      setCrmResult(crmResponse);

      // 히스토리에 추가
      addToHistory({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        type: 'both',
        products: selectedProducts,
        socialInput: {
          products: selectedProducts,
          platforms,
          languages,
          format,
          tone,
          seasonalEvent,
          includeReasoning,
        },
        socialResult: socialResponse,
        crmInput: {
          crmType,
          products: selectedProducts,
          trigger: crmTrigger,
          targetRegions,
          variables: crmVariables,
          additionalBenefit,
        },
        crmResult: crmResponse,
      });

    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : '콘텐츠 생성 중 오류가 발생했습니다');
    } finally {
      setIsGenerating(false);
    }
  }, [selectedProducts, platforms, languages, format, tone, seasonalEvent, includeReasoning, crmType, crmTrigger, targetRegions, crmVariables, additionalBenefit]);

  // 토글 핸들러
  const togglePlatform = (id: Platform) => {
    setPlatforms(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleLanguage = (id: Language) => {
    setLanguages(prev => 
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    );
  };

  const toggleRegion = (id: TargetRegion) => {
    setTargetRegions(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const toggleVariable = (id: string) => {
    setCrmVariables(prev => 
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  if (selectedProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <div className="w-24 h-24 rounded-full bg-surface-card border border-border flex items-center justify-center mb-6">
          <Sparkles className="w-10 h-10 text-text-muted" />
        </div>
        <h3 className="text-xl font-semibold text-text-primary mb-2">
          선택된 작품이 없습니다
        </h3>
        <p className="text-text-secondary mb-6">
          먼저 작품 탐색에서 콘텐츠를 생성할 작품을 선택해주세요
        </p>
        <button
          onClick={onNavigateBack}
          className="flex items-center gap-2 px-6 py-3 bg-brand-orange text-white font-medium rounded-xl hover:bg-brand-orange-light transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>작품 탐색으로 이동</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* 왼쪽: 설정 패널 */}
      <div className="w-[420px] flex-shrink-0 border-r border-border bg-surface overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* 선택된 작품 */}
          <div className="bg-surface-card rounded-xl border border-border p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange text-xs font-bold">
                {selectedProducts.length}
              </span>
              선택된 작품
            </h3>
            <div className="space-y-2">
              {selectedProducts.map((product) => (
                <div 
                  key={product.id}
                  className="flex items-center gap-3 p-2 bg-surface-overlay rounded-lg"
                >
                  <img 
                    src={product.image} 
                    alt={product.title}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">{product.title}</p>
                    <p className="text-xs text-brand-orange">{formatPrice(product.price)}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={onNavigateBack}
              className="mt-3 text-sm text-text-muted hover:text-brand-orange transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              작품 변경
            </button>
          </div>

          {/* 소셜 콘텐츠 설정 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Instagram className="w-4 h-4 text-pink-500" />
              소셜 콘텐츠 설정
            </h3>

            {/* 플랫폼 */}
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider font-medium mb-2 block">
                플랫폼
              </label>
              <div className="flex gap-2">
                {PLATFORM_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => togglePlatform(opt.id as Platform)}
                    className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium border transition-all ${
                      platforms.includes(opt.id as Platform)
                        ? 'bg-brand-orange text-white border-brand-orange'
                        : 'bg-surface-card text-text-secondary border-border hover:border-brand-orange'
                    }`}
                  >
                    {opt.id === 'meta' ? '📸' : '🐦'} {opt.id === 'meta' ? 'Meta' : 'X'}
                  </button>
                ))}
              </div>
            </div>

            {/* 언어 */}
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider font-medium mb-2 block">
                언어
              </label>
              <div className="flex gap-2">
                {LANGUAGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => toggleLanguage(opt.id as Language)}
                    className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium border transition-all ${
                      languages.includes(opt.id as Language)
                        ? 'bg-brand-orange text-white border-brand-orange'
                        : 'bg-surface-card text-text-secondary border-border hover:border-brand-orange'
                    }`}
                  >
                    {opt.flag} {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 포맷 */}
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider font-medium mb-2 block">
                콘텐츠 포맷
              </label>
              <div className="grid grid-cols-3 gap-2">
                {CONTENT_FORMAT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setFormat(opt.id as ContentFormat)}
                    className={`py-3 px-2 rounded-lg text-sm border transition-all text-center ${
                      format === opt.id
                        ? 'bg-brand-orange text-white border-brand-orange'
                        : 'bg-surface-card text-text-secondary border-border hover:border-brand-orange'
                    }`}
                  >
                    <span className="text-lg block mb-1">{opt.icon}</span>
                    <span className="text-xs">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 톤앤매너 */}
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider font-medium mb-2 block">
                톤앤매너
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full bg-surface-card border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-orange"
              >
                {TONE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.emoji} {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 시즌 이벤트 */}
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider font-medium mb-2 block">
                시즌 이벤트 (선택)
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSeasonalEvent(null)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    !seasonalEvent
                      ? 'bg-brand-orange text-white border-brand-orange'
                      : 'bg-surface-card text-text-secondary border-border'
                  }`}
                >
                  없음
                </button>
                {SEASONAL_EVENTS.slice(0, 6).map((event) => (
                  <button
                    key={event.id}
                    onClick={() => setSeasonalEvent(event.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      seasonalEvent === event.id
                        ? 'bg-brand-orange text-white border-brand-orange'
                        : 'bg-surface-card text-text-secondary border-border'
                    }`}
                  >
                    {event.emoji} {event.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 구분선 */}
          <div className="border-t border-border" />

          {/* CRM 설정 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              CRM 카피 설정
            </h3>

            {/* CRM 타입 */}
            <div className="space-y-2">
              {CRM_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setCrmType(opt.id as CrmType)}
                  className={`w-full p-3 rounded-lg border text-left transition-all ${
                    crmType === opt.id
                      ? 'bg-brand-orange/10 border-brand-orange'
                      : 'bg-surface-card border-border hover:border-brand-orange/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${
                      crmType === opt.id ? 'text-brand-orange' : 'text-text-primary'
                    }`}>
                      {opt.label}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      opt.badge === '기본' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {opt.badge}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted">{opt.description}</p>
                </button>
              ))}
            </div>

            {/* 트리거 이벤트 */}
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider font-medium mb-2 block">
                트리거 이벤트
              </label>
              <select
                value={crmTrigger}
                onChange={(e) => setCrmTrigger(e.target.value as CrmTrigger)}
                className="w-full bg-surface-card border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-orange"
              >
                {CRM_TRIGGER_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 타겟 권역 */}
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider font-medium mb-2 block">
                타겟 권역
              </label>
              <div className="flex gap-2">
                {TARGET_REGION_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => toggleRegion(opt.id as TargetRegion)}
                    className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium border transition-all ${
                      targetRegions.includes(opt.id as TargetRegion)
                        ? 'bg-brand-orange text-white border-brand-orange'
                        : 'bg-surface-card text-text-secondary border-border hover:border-brand-orange'
                    }`}
                  >
                    {opt.flag} {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 개인화 변수 */}
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider font-medium mb-2 block">
                개인화 변수
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CRM_VARIABLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => toggleVariable(opt.id)}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all text-left ${
                      crmVariables.includes(opt.id)
                        ? 'bg-brand-orange text-white border-brand-orange'
                        : 'bg-surface-card text-text-secondary border-border hover:border-brand-orange'
                    }`}
                  >
                    {opt.label}
                    <span className="block text-[10px] opacity-70 mt-0.5">{opt.token}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 추가 혜택 */}
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider font-medium mb-2 block">
                추가 혜택 정보 (선택)
              </label>
              <input
                type="text"
                value={additionalBenefit}
                onChange={(e) => setAdditionalBenefit(e.target.value)}
                placeholder="예: 3,000원 쿠폰, 무료배송"
                className="w-full bg-surface-card border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-orange"
              />
            </div>
          </div>

          {/* 생성 버튼 */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || platforms.length === 0 || languages.length === 0}
            className="w-full py-4 bg-gradient-to-r from-brand-orange to-brand-orange-light text-white font-bold rounded-xl hover:shadow-lg hover:shadow-brand-orange/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>생성 중...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>콘텐츠 생성하기</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 오른쪽: 결과 패널 */}
      <div className="flex-1 overflow-y-auto bg-surface-raised">
        <div className="p-6">
          {/* 결과 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-text-primary">생성된 콘텐츠</h2>
            {(socialResult || crmResult) && (
              <div className="flex items-center gap-2 bg-surface-card rounded-lg border border-border p-1">
                <button
                  onClick={() => setActiveResultTab('social')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeResultTab === 'social'
                      ? 'bg-brand-orange text-white'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  📱 소셜 콘텐츠
                </button>
                <button
                  onClick={() => setActiveResultTab('crm')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeResultTab === 'crm'
                      ? 'bg-brand-orange text-white'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  💬 CRM 카피
                </button>
              </div>
            )}
          </div>

          {/* 에러 메시지 */}
          {generationError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
              <p className="text-red-400 text-sm">{generationError}</p>
            </div>
          )}

          {/* 로딩 상태 */}
          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-surface-overlay rounded-full" />
                <div className="absolute top-0 left-0 w-20 h-20 border-4 border-brand-orange rounded-full border-t-transparent animate-spin" />
              </div>
              <p className="mt-6 text-text-secondary">AI가 콘텐츠를 생성하고 있습니다...</p>
              <p className="text-sm text-text-muted mt-2">약 10-20초 소요됩니다</p>
            </div>
          )}

          {/* 빈 상태 */}
          {!isGenerating && !socialResult && !crmResult && !generationError && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-24 h-24 rounded-full bg-surface-card border border-border flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-text-muted" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                콘텐츠를 생성해보세요
              </h3>
              <p className="text-text-secondary max-w-md">
                왼쪽에서 설정을 완료하고 생성 버튼을 클릭하면<br />
                AI가 소셜 콘텐츠와 CRM 카피를 생성합니다.
              </p>
            </div>
          )}

          {/* 소셜 콘텐츠 결과 */}
          {!isGenerating && socialResult && activeResultTab === 'social' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* 언어 탭 */}
              <div className="flex gap-2">
                {languages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setActiveLanguage(lang)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeLanguage === lang
                        ? 'bg-brand-orange text-white'
                        : 'bg-surface-card text-text-secondary border border-border hover:border-brand-orange'
                    }`}
                  >
                    {LANGUAGE_OPTIONS.find(l => l.id === lang)?.flag} {LANGUAGE_OPTIONS.find(l => l.id === lang)?.label}
                  </button>
                ))}
              </div>

              {/* 플랫폼별 결과 */}
              {platforms.map((platform) => {
                const content = socialResult.marketingContent?.[activeLanguage]?.[platform];
                if (!content) return null;

                const fullText = `${content.caption}\n\n${content.hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ')}`;
                const copyId = `${platform}-${activeLanguage}`;

                return (
                  <div key={platform} className="bg-surface-card rounded-xl border border-border overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-border bg-surface-overlay/50">
                      <div className="flex items-center gap-2">
                        {platform === 'meta' ? (
                          <Instagram className="w-5 h-5 text-pink-500" />
                        ) : (
                          <Twitter className="w-5 h-5 text-blue-400" />
                        )}
                        <span className="font-medium text-text-primary">
                          {platform === 'meta' ? 'Meta (Instagram)' : 'X (Twitter)'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopy(fullText, copyId)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-card border border-border rounded-lg text-sm text-text-secondary hover:text-text-primary hover:border-brand-orange transition-all"
                      >
                        {copiedId === copyId ? (
                          <>
                            <Check className="w-4 h-4 text-green-500" />
                            <span className="text-green-500">복사됨</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>복사</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-4 space-y-4">
                      <div>
                        <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
                          {content.caption}
                        </p>
                      </div>
                      <div className="pt-3 border-t border-border">
                        <p className="text-sm text-blue-400 leading-relaxed">
                          {content.hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ')}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* CRM 결과 */}
          {!isGenerating && crmResult && activeResultTab === 'crm' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* 언어 탭 */}
              <div className="flex gap-2">
                {['korean', 'english', 'japanese'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setActiveLanguage(lang as Language)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeLanguage === lang
                        ? 'bg-brand-orange text-white'
                        : 'bg-surface-card text-text-secondary border border-border hover:border-brand-orange'
                    }`}
                  >
                    {LANGUAGE_OPTIONS.find(l => l.id === lang)?.flag} {LANGUAGE_OPTIONS.find(l => l.id === lang)?.label}
                  </button>
                ))}
              </div>

              {/* CRM 카피 결과 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {crmResult.crmContent?.[activeLanguage]?.map((copy, idx) => {
                  const copyId = `crm-${activeLanguage}-${idx}`;
                  const fullText = `${copy.mainCopy}\n${copy.subCopy}`;

                  return (
                    <div 
                      key={idx}
                      className="bg-surface-card rounded-xl border border-border p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-brand-orange bg-brand-orange/10 px-2 py-1 rounded">
                          {idx === 0 ? 'A안 - 감성형' : 'B안 - 긴급형'}
                        </span>
                        <button
                          onClick={() => handleCopy(fullText, copyId)}
                          className="text-text-muted hover:text-text-primary transition-colors"
                        >
                          {copiedId === copyId ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      
                      {/* 푸시 미리보기 */}
                      <div className="bg-surface-overlay rounded-lg p-3 space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-text-muted">
                          <span>🔔 아이디어스</span>
                          <span>지금</span>
                        </div>
                        <p className="text-sm font-medium text-text-primary">{copy.mainCopy}</p>
                        <p className="text-xs text-text-secondary">{copy.subCopy}</p>
                      </div>
                      
                      <div className="mt-3 text-[10px] text-text-muted">
                        메인: {copy.mainCopy.length}자 | 서브: {copy.subCopy.length}자
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 발송 시간 추천 */}
              {crmResult.sendingTime && crmResult.sendingTime.length > 0 && (
                <div className="bg-surface-card rounded-xl border border-border p-4">
                  <h4 className="text-sm font-semibold text-text-primary mb-3">📅 추천 발송 시간</h4>
                  <div className="space-y-2">
                    {crmResult.sendingTime.map((st, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-sm">
                        <span className="text-text-muted w-20">{st.region}</span>
                        <span className="font-medium text-text-primary">{st.time}</span>
                        <span className="text-text-secondary text-xs">({st.reason})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentStudio;
