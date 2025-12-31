import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  X, 
  ArrowRight, 
  Package, 
  Sparkles,
  SlidersHorizontal,
  LayoutGrid,
  List,
  RefreshCw
} from 'lucide-react';
import { ProductCard, ProductCardSkeleton } from './ProductCard';
import { useCampaignStore } from '../store/campaignStore';
import { searchProducts, formatPrice } from '../services/idusService';
import { SORT_OPTIONS, MAX_SELECTED_PRODUCTS } from '../constants';
import type { IdusProduct } from '../types';

interface ProductDiscoveryProps {
  onNavigateToStudio: () => void;
}

export const ProductDiscovery: React.FC<ProductDiscoveryProps> = ({ onNavigateToStudio }) => {
  const {
    searchKeyword,
    setSearchKeyword,
    searchResults,
    setSearchResults,
    isSearching,
    setIsSearching,
    searchError,
    setSearchError,
    selectedProducts,
    clearProducts,
  } = useCampaignStore();

  const [inputValue, setInputValue] = useState(searchKeyword);
  const [sortBy, setSortBy] = useState<string>('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [quickViewProduct, setQuickViewProduct] = useState<IdusProduct | null>(null);

  // 검색 실행
  const handleSearch = useCallback(async (keyword?: string) => {
    const searchTerm = keyword ?? inputValue;
    if (!searchTerm.trim()) return;

    setSearchKeyword(searchTerm);
    setIsSearching(true);
    setSearchError(null);

    try {
      const results = await searchProducts({ keyword: searchTerm, sort: sortBy as any });
      setSearchResults(results);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : '검색 중 오류가 발생했습니다');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [inputValue, sortBy, setSearchKeyword, setIsSearching, setSearchError, setSearchResults]);

  // 정렬 변경 시 재검색
  useEffect(() => {
    if (searchKeyword) {
      handleSearch(searchKeyword);
    }
  }, [sortBy]);

  // 엔터 키 처리
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 검색어 초기화
  const handleClearSearch = () => {
    setInputValue('');
    setSearchKeyword('');
    setSearchResults([]);
    setSearchError(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex-shrink-0 px-8 py-6 border-b border-border bg-surface/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                <Search className="w-6 h-6 text-brand-orange" />
                작품 탐색
              </h1>
              <p className="text-sm text-text-secondary mt-1">
                키워드로 아이디어스 작품을 검색하고 콘텐츠에 활용할 작품을 선택하세요
              </p>
            </div>
            
            {/* 선택된 작품 카운터 */}
            {selectedProducts.length > 0 && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-3"
              >
                <div className="bg-brand-orange/10 text-brand-orange px-4 py-2 rounded-lg font-medium text-sm">
                  {selectedProducts.length}/{MAX_SELECTED_PRODUCTS} 작품 선택됨
                </div>
                <button
                  onClick={clearProducts}
                  className="text-text-muted hover:text-red-400 text-sm transition-colors"
                >
                  전체 해제
                </button>
              </motion.div>
            )}
          </div>

          {/* 검색 바 */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="검색어를 입력하세요 (예: 가죽 지갑, 도자기, 캔들)"
                className="w-full bg-surface-card border border-border rounded-xl px-12 py-3.5 text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all"
              />
              {inputValue && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <button
              onClick={() => handleSearch()}
              disabled={isSearching || !inputValue.trim()}
              className="px-6 bg-brand-orange text-white font-medium rounded-xl hover:bg-brand-orange-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSearching ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              <span>검색</span>
            </button>
          </div>

          {/* 필터 & 정렬 */}
          {searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between mt-4"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-secondary">
                  <span className="font-semibold text-text-primary">{searchResults.length}</span>개 작품
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                {/* 정렬 옵션 */}
                <div className="flex items-center gap-2 bg-surface-card rounded-lg border border-border p-1">
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSortBy(option.id)}
                      className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                        sortBy === option.id
                          ? 'bg-brand-orange text-white'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {/* 뷰 모드 */}
                <div className="flex items-center gap-1 bg-surface-card rounded-lg border border-border p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'grid' ? 'bg-surface-overlay text-text-primary' : 'text-text-muted'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'list' ? 'bg-surface-overlay text-text-primary' : 'text-text-muted'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-7xl mx-auto">
          
          {/* 초기 상태 */}
          {!searchKeyword && searchResults.length === 0 && !isSearching && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-24 h-24 rounded-full bg-surface-card border border-border flex items-center justify-center mb-6">
                <Search className="w-10 h-10 text-text-muted" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                작품을 검색해보세요
              </h3>
              <p className="text-text-secondary mb-8 max-w-md">
                키워드를 입력하면 아이디어스의 작품을 검색할 수 있습니다.<br />
                원하는 작품을 선택하여 콘텐츠를 생성해보세요.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {['도자기', '가죽 지갑', '캔들', '주얼리', '뜨개질', '문구'].map((keyword) => (
                  <button
                    key={keyword}
                    onClick={() => {
                      setInputValue(keyword);
                      handleSearch(keyword);
                    }}
                    className="px-4 py-2 bg-surface-card border border-border rounded-full text-sm text-text-secondary hover:text-text-primary hover:border-brand-orange transition-all"
                  >
                    {keyword}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 로딩 상태 */}
          {isSearching && (
            <div className={`grid gap-4 ${
              viewMode === 'grid' 
                ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' 
                : 'grid-cols-1'
            }`}>
              {Array.from({ length: 10 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* 에러 상태 */}
          {searchError && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                <X className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                검색 중 오류가 발생했습니다
              </h3>
              <p className="text-text-secondary mb-6">{searchError}</p>
              <button
                onClick={() => handleSearch()}
                className="px-6 py-2 bg-brand-orange text-white rounded-lg hover:bg-brand-orange-light transition-colors"
              >
                다시 시도
              </button>
            </div>
          )}

          {/* 검색 결과 없음 */}
          {!isSearching && searchKeyword && searchResults.length === 0 && !searchError && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-24 h-24 rounded-full bg-surface-card border border-border flex items-center justify-center mb-6">
                <Package className="w-10 h-10 text-text-muted" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                '{searchKeyword}' 검색 결과가 없습니다
              </h3>
              <p className="text-text-secondary mb-6">
                다른 키워드로 검색해보세요
              </p>
            </div>
          )}

          {/* 검색 결과 */}
          {!isSearching && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`grid gap-4 ${
                viewMode === 'grid' 
                  ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' 
                  : 'grid-cols-1'
              }`}
            >
              <AnimatePresence mode="popLayout">
                {searchResults.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product}
                    onQuickView={setQuickViewProduct}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      {/* 하단 고정 바 - 선택된 작품 */}
      <AnimatePresence>
        {selectedProducts.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="flex-shrink-0 border-t border-border bg-surface-card/95 backdrop-blur-md px-8 py-4"
          >
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between gap-4">
                {/* 선택된 작품 미리보기 */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-sm text-text-secondary flex-shrink-0">
                    선택된 작품
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {selectedProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center gap-2 bg-surface-overlay rounded-lg px-3 py-1.5 flex-shrink-0"
                      >
                        <img
                          src={product.image}
                          alt={product.title}
                          className="w-8 h-8 rounded object-cover"
                        />
                        <span className="text-sm text-text-primary max-w-[120px] truncate">
                          {product.title}
                        </span>
                        <button
                          onClick={() => useCampaignStore.getState().removeProduct(product.id)}
                          className="text-text-muted hover:text-red-400 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 다음 단계 버튼 */}
                <button
                  onClick={onNavigateToStudio}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-orange to-brand-orange-light text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-brand-orange/25 transition-all flex-shrink-0"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>콘텐츠 생성하기</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductDiscovery;
