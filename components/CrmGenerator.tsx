import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Sparkles,
  ShoppingCart,
  Eye,
  UserPlus,
  Package,
  Clock,
  ChevronRight,
  Check,
  AlertCircle,
  Globe,
  Link,
  Image as ImageIcon,
  Copy,
  RefreshCw,
  Zap,
  User,
  Tag,
  Calendar,
  MessageSquare,
  X,
  Plus
} from 'lucide-react';
import { useCampaignStore } from '../store/campaignStore';
import { ImageUploader } from './ImageUploader';
import { CopyButton } from './CopyButton';
import {
  CRM_TRIGGER_OPTIONS,
  CRM_TYPE_OPTIONS,
  CRM_VARIABLE_OPTIONS,
  TARGET_REGION_OPTIONS,
} from '../constants';
import { generateCrmCopy } from '../services/crmService';
import type { IdusProduct } from '../types';

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  name: string;
  size: number;
}

interface CrmGeneratorProps {
  selectedProducts: IdusProduct[];
}

// CRM 트리거 아이콘 매핑
const triggerIcons: Record<string, React.ReactNode> = {
  cart_abandonment: <ShoppingCart className="w-5 h-5" />,
  browse_abandonment: <Eye className="w-5 h-5" />,
  welcome_series: <UserPlus className="w-5 h-5" />,
  post_purchase: <Package className="w-5 h-5" />,
  win_back: <Clock className="w-5 h-5" />,
};

export const CrmGenerator: React.FC<CrmGeneratorProps> = ({ selectedProducts }) => {
  // 상태 관리
  const [crmType, setCrmType] = useState<string>('product');
  const [selectedTrigger, setSelectedTrigger] = useState<string>('cart_abandonment');
  const [selectedRegion, setSelectedRegion] = useState<string>('north_america');
  const [selectedVariables, setSelectedVariables] = useState<string[]>(['user_name', 'product_name']);
  const [customUrl, setCustomUrl] = useState('');
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [additionalInfo, setAdditionalInfo] = useState<Record<string, string>>({});
  
  // 생성 상태
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResults, setGeneratedResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 트리거에 따른 추가 입력 필드 결정
  const requiresDiscount = selectedTrigger === 'cart_abandonment' || selectedTrigger === 'win_back';
  const requiresBenefit = selectedTrigger === 'welcome_series';

  // 변수 토글
  const handleVariableToggle = (variableId: string) => {
    setSelectedVariables(prev =>
      prev.includes(variableId)
        ? prev.filter(id => id !== variableId)
        : [...prev, variableId]
    );
  };

  // CRM 생성
  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setGeneratedResults([]);

    try {
      // 이미지 데이터 준비
      const imageData = uploadedImages.length > 0
        ? await Promise.all(uploadedImages.map(async (img) => {
            const base64 = await fileToBase64(img.file);
            return {
              name: img.name,
              base64,
              mimeType: img.file.type,
            };
          }))
        : selectedProducts.slice(0, 3).map((p) => ({
            name: p.title,
            base64: '', // 실제로는 이미지 URL에서 가져와야 함
            mimeType: 'image/jpeg',
            url: p.image,
          }));

      // 제품 정보 결합
      const productInfo = selectedProducts.length > 0
        ? selectedProducts.map(p => ({
            title: p.title,
            price: p.price,
            artistName: p.artistName,
            url: p.url,
          }))
        : null;

      // CRM 생성 요청
      const result = await generateCrmCopy({
        trigger: selectedTrigger,
        region: selectedRegion,
        variables: selectedVariables,
        productInfo,
        customUrl: crmType !== 'product' ? customUrl : undefined,
        additionalInfo,
        images: imageData,
        crmType,
      });

      setGeneratedResults([result]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'CRM 생성 중 오류가 발생했습니다');
    } finally {
      setIsGenerating(false);
    }
  };

  // 파일을 Base64로 변환
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  // 생성 가능 여부 확인
  const canGenerate = useMemo(() => {
    if (crmType === 'product') {
      return selectedProducts.length > 0;
    }
    return customUrl.trim().length > 0 && uploadedImages.length > 0;
  }, [crmType, selectedProducts.length, customUrl, uploadedImages.length]);

  return (
    <div className="space-y-6">
      {/* CRM 타입 선택 */}
      <div className="bg-surface-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-brand-orange" />
          CRM 유형 선택
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {CRM_TYPE_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => setCrmType(option.id)}
              className={`
                relative p-4 rounded-lg border-2 text-left transition-all
                ${crmType === option.id
                  ? 'border-brand-orange bg-brand-orange/5'
                  : 'border-border hover:border-border-hover bg-surface-overlay/30'
                }
              `}
            >
              {option.badge && (
                <span className={`
                  absolute top-2 right-2 px-2 py-0.5 text-xs rounded-full
                  ${option.badge === '기본' ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 text-purple-400'}
                `}>
                  {option.badge}
                </span>
              )}
              <div className="font-medium text-text-primary">{option.label}</div>
              <div className="text-xs text-text-muted mt-1">{option.description}</div>
              {crmType === option.id && (
                <div className="absolute bottom-2 right-2">
                  <Check className="w-4 h-4 text-brand-orange" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 기획전/작가홈 URL 입력 (확장 모드) */}
      {crmType !== 'product' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-surface-card rounded-xl border border-border p-5"
        >
          <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Link className="w-4 h-4 text-brand-orange" />
            {crmType === 'exhibition' ? '기획전 URL' : '작가 홈 URL'}
          </h3>
          <input
            type="url"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder={
              crmType === 'exhibition'
                ? 'https://www.idus.com/w/exhibition/...'
                : 'https://www.idus.com/w/artist/...'
            }
            className="w-full bg-surface-overlay border border-border rounded-lg px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
          />

          <div className="mt-4">
            <h4 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              대표 이미지 업로드
            </h4>
            <ImageUploader
              images={uploadedImages}
              onImagesChange={setUploadedImages}
              maxImages={5}
            />
          </div>
        </motion.div>
      )}

      {/* 선택된 작품 표시 (작품 기반 모드) */}
      {crmType === 'product' && selectedProducts.length > 0 && (
        <div className="bg-surface-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">
            선택된 작품 ({selectedProducts.length}개)
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {selectedProducts.map((product) => (
              <div
                key={product.id}
                className="flex-shrink-0 w-24 text-center"
              >
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-24 h-24 rounded-lg object-cover border border-border"
                />
                <p className="text-xs text-text-secondary mt-2 truncate">
                  {product.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 트리거 선택 */}
      <div className="bg-surface-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-brand-orange" />
          CRM 트리거 이벤트
        </h3>
        <div className="space-y-2">
          {CRM_TRIGGER_OPTIONS.map((trigger) => (
            <button
              key={trigger.id}
              onClick={() => setSelectedTrigger(trigger.id)}
              className={`
                w-full flex items-center gap-4 p-4 rounded-lg border transition-all text-left
                ${selectedTrigger === trigger.id
                  ? 'border-brand-orange bg-brand-orange/5'
                  : 'border-border hover:border-border-hover bg-surface-overlay/30'
                }
              `}
            >
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center
                ${selectedTrigger === trigger.id ? 'bg-brand-orange/20 text-brand-orange' : 'bg-surface-overlay text-text-muted'}
              `}>
                {triggerIcons[trigger.id]}
              </div>
              <div className="flex-1">
                <div className="font-medium text-text-primary">{trigger.label}</div>
                <div className="text-xs text-text-muted mt-0.5">{trigger.description}</div>
              </div>
              {selectedTrigger === trigger.id && (
                <Check className="w-5 h-5 text-brand-orange" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 추가 정보 입력 (트리거별) */}
      {(requiresDiscount || requiresBenefit) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-card rounded-xl border border-purple-500/30 p-5"
        >
          <h3 className="text-sm font-semibold text-purple-400 mb-4 flex items-center gap-2">
            <Tag className="w-4 h-4" />
            {requiresDiscount ? '할인/혜택 정보 (필수)' : '가입 혜택 정보 (선택)'}
          </h3>
          <input
            type="text"
            value={additionalInfo.discount || additionalInfo.benefit || ''}
            onChange={(e) => setAdditionalInfo(prev => ({
              ...prev,
              [requiresDiscount ? 'discount' : 'benefit']: e.target.value
            }))}
            placeholder={
              requiresDiscount
                ? '예: 3,000원 쿠폰, 무료배송, 10% 할인'
                : '예: 첫 구매 100원 딜, 웰컴 쿠폰팩'
            }
            className="w-full bg-surface-overlay border border-border rounded-lg px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
          />
        </motion.div>
      )}

      {/* 타겟 권역 */}
      <div className="bg-surface-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Globe className="w-4 h-4 text-brand-orange" />
          타겟 권역
        </h3>
        <div className="flex gap-3">
          {TARGET_REGION_OPTIONS.map((region) => (
            <button
              key={region.id}
              onClick={() => setSelectedRegion(region.id)}
              className={`
                flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-all
                ${selectedRegion === region.id
                  ? 'border-brand-orange bg-brand-orange/5 text-text-primary'
                  : 'border-border hover:border-border-hover text-text-secondary'
                }
              `}
            >
              <span className="text-xl">{region.flag}</span>
              <span className="font-medium">{region.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 개인화 변수 */}
      <div className="bg-surface-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-brand-orange" />
          개인화 변수
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {CRM_VARIABLE_OPTIONS.map((variable) => (
            <button
              key={variable.id}
              onClick={() => handleVariableToggle(variable.id)}
              className={`
                flex items-center justify-between px-4 py-3 rounded-lg border transition-all
                ${selectedVariables.includes(variable.id)
                  ? 'border-brand-orange bg-brand-orange/10 text-text-primary'
                  : 'border-border hover:border-border-hover text-text-secondary'
                }
              `}
            >
              <span>{variable.label}</span>
              <code className="text-xs bg-surface-overlay px-2 py-0.5 rounded text-text-muted">
                {variable.token}
              </code>
            </button>
          ))}
        </div>
        <p className="text-xs text-text-muted mt-3">
          * 선택한 변수는 AI가 문맥에 맞게 자동으로 문구에 포함시킵니다.
        </p>
      </div>

      {/* 생성 버튼 */}
      <button
        onClick={handleGenerate}
        disabled={!canGenerate || isGenerating}
        className={`
          w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-3
          ${canGenerate && !isGenerating
            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:shadow-purple-500/25'
            : 'bg-surface-overlay text-text-muted cursor-not-allowed'
          }
        `}
      >
        {isGenerating ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>CRM 카피 생성 중...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            <span>CRM 카피 생성하기</span>
          </>
        )}
      </button>

      {/* 에러 표시 */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto hover:text-red-300"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* 생성 결과 */}
      {generatedResults.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            생성된 CRM 카피
          </h3>
          
          {generatedResults.map((result, index) => (
            <div
              key={index}
              className="bg-surface-card rounded-xl border border-border overflow-hidden"
            >
              {/* 푸시 알림 */}
              {result.pushTitle && (
                <div className="p-5 border-b border-border">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-text-secondary">📱 푸시 알림</h4>
                    <CopyButton text={`${result.pushTitle}\n${result.pushBody}`} />
                  </div>
                  <div className="bg-surface-overlay rounded-lg p-4">
                    <p className="font-semibold text-text-primary">{result.pushTitle}</p>
                    <p className="text-text-secondary mt-1">{result.pushBody}</p>
                  </div>
                </div>
              )}

              {/* 인앱 메시지 */}
              {result.inAppMessage && (
                <div className="p-5 border-b border-border">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-text-secondary">💬 인앱 메시지</h4>
                    <CopyButton text={result.inAppMessage} />
                  </div>
                  <div className="bg-surface-overlay rounded-lg p-4">
                    <p className="text-text-primary whitespace-pre-line">{result.inAppMessage}</p>
                  </div>
                </div>
              )}

              {/* 이메일 */}
              {result.emailSubject && (
                <div className="p-5 border-b border-border">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-text-secondary">✉️ 이메일</h4>
                    <CopyButton text={`제목: ${result.emailSubject}\n\n${result.emailBody}`} />
                  </div>
                  <div className="bg-surface-overlay rounded-lg p-4 space-y-3">
                    <div>
                      <span className="text-xs text-text-muted">제목</span>
                      <p className="font-semibold text-text-primary">{result.emailSubject}</p>
                    </div>
                    <div>
                      <span className="text-xs text-text-muted">본문</span>
                      <p className="text-text-secondary whitespace-pre-line">{result.emailBody}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 권장 발송 시간 */}
              {result.recommendedTime && (
                <div className="p-5 bg-surface-overlay/50">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-brand-orange" />
                    <span className="text-text-muted">권장 발송 시간:</span>
                    <span className="text-text-primary font-medium">{result.recommendedTime}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </motion.div>
      )}

      {/* 안내 메시지 */}
      {!canGenerate && crmType === 'product' && (
        <div className="text-center py-8 text-text-muted">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>작품 탐색에서 작품을 먼저 선택해주세요</p>
        </div>
      )}
    </div>
  );
};

export default CrmGenerator;
