import React from 'react';
import { motion } from 'framer-motion';
import { Check, Plus, Star, ExternalLink } from 'lucide-react';
import type { IdusProduct } from '../types';
import { formatPrice } from '../services/idusService';
import { useCampaignStore } from '../store/campaignStore';
import { MAX_SELECTED_PRODUCTS } from '../constants';

interface ProductCardProps {
  product: IdusProduct;
  onQuickView?: (product: IdusProduct) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickView }) => {
  const { selectedProducts, addProduct, removeProduct, isProductSelected } = useCampaignStore();
  const isSelected = isProductSelected(product.id);
  const canSelect = selectedProducts.length < MAX_SELECTED_PRODUCTS || isSelected;

  const handleToggleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSelected) {
      removeProduct(product.id);
    } else if (canSelect) {
      addProduct(product);
    }
  };

  const handleCardClick = () => {
    if (onQuickView) {
      onQuickView(product);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={handleCardClick}
      className={`
        group relative bg-white rounded-xl overflow-hidden cursor-pointer
        border transition-all duration-200 shadow-soft
        ${isSelected 
          ? 'border-brand-orange ring-2 ring-brand-orange/30 shadow-lg shadow-brand-orange/10' 
          : 'border-gray-200 hover:border-gray-300 hover:shadow-medium'
        }
      `}
    >
      {/* 이미지 영역 */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/brand/brand assets/선물.png';
          }}
        />
        
        {/* 선택됨 오버레이 */}
        {isSelected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-brand-orange/20 flex items-center justify-center"
          >
            <div className="w-12 h-12 rounded-full bg-brand-orange flex items-center justify-center">
              <Check className="w-6 h-6 text-white" strokeWidth={3} />
            </div>
          </motion.div>
        )}

        {/* 할인율 뱃지 */}
        {product.discountRate && product.discountRate > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            {product.discountRate}% OFF
          </div>
        )}

        {/* 호버 액션 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-3 left-3 right-3 flex gap-2">
            <button
              onClick={handleToggleSelect}
              disabled={!canSelect && !isSelected}
              className={`
                flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium
                transition-all duration-200
                ${isSelected 
                  ? 'bg-white text-brand-orange' 
                  : canSelect
                    ? 'bg-brand-orange text-white hover:bg-brand-orange-light'
                    : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                }
              `}
            >
              {isSelected ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>선택됨</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>선택</span>
                </>
              )}
            </button>
            
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-white" />
            </a>
          </div>
        </div>
      </div>

      {/* 정보 영역 */}
      <div className="p-4 space-y-2">
        {/* 작품명 */}
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug min-h-[2.5rem]">
          {product.title}
        </h3>

        {/* 작가명 */}
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <span className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-[10px]">
            👤
          </span>
          {product.artistName}
        </p>

        {/* 가격 */}
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-brand-orange">
            {formatPrice(product.price)}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-xs text-gray-400 line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        {/* 평점 */}
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
          <span className="font-medium">{product.rating.toFixed(1)}</span>
          <span className="text-gray-400">({product.reviewCount.toLocaleString()})</span>
        </div>
      </div>

      {/* 선택 표시 (우측 상단) */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-brand-orange flex items-center justify-center">
          <Check className="w-4 h-4 text-white" strokeWidth={3} />
        </div>
      )}
    </motion.div>
  );
};

// 스켈레톤 로딩 카드
export const ProductCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl overflow-hidden border border-gray-200 animate-pulse shadow-soft">
    <div className="aspect-square skeleton" />
    <div className="p-4 space-y-3">
      <div className="h-4 skeleton rounded w-3/4" />
      <div className="h-3 skeleton rounded w-1/2" />
      <div className="h-5 skeleton rounded w-1/3" />
      <div className="h-3 skeleton rounded w-1/4" />
    </div>
  </div>
);

export default ProductCard;
