import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ExternalLink, 
  Star, 
  User, 
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Check,
  Plus,
  Heart,
  Share2,
  Copy
} from 'lucide-react';
import { useCampaignStore } from '../store/campaignStore';
import { formatPrice } from '../services/idusService';
import type { IdusProduct } from '../types';

interface ProductQuickViewProps {
  product: IdusProduct | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductQuickView: React.FC<ProductQuickViewProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const { selectedProducts, addProduct, removeProduct, isProductSelected } = useCampaignStore();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // 이미지 배열 (실제로는 크롤링에서 여러 이미지를 가져옴)
  const images = product ? [product.image, ...(product.additionalImages || [])] : [];

  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // 이미지 인덱스 리셋
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [product?.id]);

  if (!product) return null;

  const isSelected = isProductSelected(product.id);

  const handleToggleSelect = () => {
    if (isSelected) {
      removeProduct(product.id);
    } else {
      addProduct(product);
    }
  };

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(product.url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* 배경 오버레이 */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* 모달 컨텐츠 */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-4xl max-h-[90vh] bg-surface-card rounded-2xl border border-border shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 닫기 버튼 */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 bg-surface-overlay/80 backdrop-blur-sm rounded-full text-text-muted hover:text-text-primary hover:bg-surface-overlay transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
              {/* 왼쪽: 이미지 갤러리 */}
              <div className="md:w-1/2 bg-surface-overlay/30 p-6 flex flex-col">
                {/* 메인 이미지 */}
                <div className="relative flex-1 min-h-[300px] md:min-h-[400px] rounded-xl overflow-hidden bg-surface">
                  <img
                    src={images[currentImageIndex] || product.image}
                    alt={product.title}
                    className="w-full h-full object-contain"
                  />

                  {/* 이미지 네비게이션 */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleNextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* 이미지 인디케이터 */}
                  {images.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {images.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            idx === currentImageIndex
                              ? 'bg-white w-4'
                              : 'bg-white/50 hover:bg-white/70'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* 썸네일 목록 */}
                {images.length > 1 && (
                  <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                          idx === currentImageIndex
                            ? 'border-brand-orange'
                            : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`${product.title} ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 오른쪽: 상품 정보 */}
              <div className="md:w-1/2 p-6 overflow-y-auto">
                {/* 작가 정보 */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-surface-overlay flex items-center justify-center">
                    <User className="w-4 h-4 text-text-muted" />
                  </div>
                  <span className="text-sm text-text-secondary">{product.artistName}</span>
                </div>

                {/* 작품명 */}
                <h2 className="text-xl font-bold text-text-primary mb-4 leading-tight">
                  {product.title}
                </h2>

                {/* 가격 & 평점 */}
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-2xl font-bold text-brand-orange">
                    {formatPrice(product.price)}
                  </span>
                  {product.rating && (
                    <div className="flex items-center gap-1 text-yellow-400">
                      <Star className="w-5 h-5 fill-current" />
                      <span className="font-semibold">{product.rating}</span>
                      {product.reviewCount && (
                        <span className="text-text-muted text-sm">
                          ({product.reviewCount.toLocaleString()})
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* 카테고리 태그 */}
                {product.category && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className="px-3 py-1 bg-surface-overlay rounded-full text-xs text-text-secondary">
                      {product.category}
                    </span>
                    {product.subcategory && (
                      <span className="px-3 py-1 bg-surface-overlay rounded-full text-xs text-text-secondary">
                        {product.subcategory}
                      </span>
                    )}
                  </div>
                )}

                {/* 상품 설명 */}
                {product.description && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-text-primary mb-2">상품 설명</h3>
                    <p className="text-sm text-text-secondary leading-relaxed line-clamp-4">
                      {product.description}
                    </p>
                  </div>
                )}

                {/* 구분선 */}
                <div className="border-t border-border my-6" />

                {/* 액션 버튼들 */}
                <div className="space-y-3">
                  {/* 선택 버튼 */}
                  <button
                    onClick={handleToggleSelect}
                    className={`w-full py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                      isSelected
                        ? 'bg-brand-orange text-white'
                        : 'bg-surface-overlay text-text-primary hover:bg-surface-overlay/80 border border-border'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-5 h-5" />
                        <span>선택됨 ({selectedProducts.length}/5)</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        <span>콘텐츠 생성용으로 선택</span>
                      </>
                    )}
                  </button>

                  {/* 보조 버튼들 */}
                  <div className="flex gap-2">
                    <a
                      href={product.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2.5 bg-surface-overlay rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-overlay/80 transition-colors flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>idus에서 보기</span>
                    </a>
                    <button
                      onClick={handleCopyUrl}
                      className="flex-1 py-2.5 bg-surface-overlay rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-overlay/80 transition-colors flex items-center justify-center gap-2"
                    >
                      {copiedUrl ? (
                        <>
                          <Check className="w-4 h-4 text-green-500" />
                          <span className="text-green-500">복사됨</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>URL 복사</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 선택 안내 */}
                {!isSelected && selectedProducts.length >= 5 && (
                  <p className="mt-4 text-xs text-yellow-500 text-center">
                    ⚠️ 최대 5개까지 선택 가능합니다. 기존 선택을 해제해주세요.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProductQuickView;
