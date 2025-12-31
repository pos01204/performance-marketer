import React, { useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Film,
  Image as ImageIcon,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Play,
  Pause,
  Clock,
  Type,
  Music,
  Sparkles,
  Copy,
  Download,
  Eye,
  X
} from 'lucide-react';
import { CopyButton } from './CopyButton';

interface StoryboardSlide {
  id: string;
  order: number;
  imageUrl?: string;
  title: string;
  description: string;
  duration?: number; // 릴스용 (초)
  transition?: 'fade' | 'slide' | 'zoom';
  textPosition?: 'top' | 'center' | 'bottom';
}

interface VisualStoryboardProps {
  type: 'carousel' | 'reels';
  slides: StoryboardSlide[];
  onSlidesChange: (slides: StoryboardSlide[]) => void;
  productImages?: string[];
}

export const VisualStoryboard: React.FC<VisualStoryboardProps> = ({
  type,
  slides,
  onSlidesChange,
  productImages = [],
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // 슬라이드 추가
  const addSlide = () => {
    const newSlide: StoryboardSlide = {
      id: `slide-${Date.now()}`,
      order: slides.length + 1,
      title: `슬라이드 ${slides.length + 1}`,
      description: '',
      duration: type === 'reels' ? 3 : undefined,
      transition: 'slide',
      textPosition: 'bottom',
    };
    onSlidesChange([...slides, newSlide]);
  };

  // 슬라이드 삭제
  const removeSlide = (id: string) => {
    const filtered = slides.filter(s => s.id !== id);
    onSlidesChange(filtered.map((s, i) => ({ ...s, order: i + 1 })));
    if (currentSlideIndex >= filtered.length) {
      setCurrentSlideIndex(Math.max(0, filtered.length - 1));
    }
  };

  // 슬라이드 업데이트
  const updateSlide = (id: string, updates: Partial<StoryboardSlide>) => {
    onSlidesChange(slides.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  // 순서 변경
  const handleReorder = (newOrder: StoryboardSlide[]) => {
    onSlidesChange(newOrder.map((s, i) => ({ ...s, order: i + 1 })));
  };

  // 이전/다음 슬라이드
  const goToPrevSlide = () => {
    setCurrentSlideIndex(prev => Math.max(0, prev - 1));
  };

  const goToNextSlide = () => {
    setCurrentSlideIndex(prev => Math.min(slides.length - 1, prev + 1));
  };

  // 전체 스크립트 내보내기
  const exportScript = () => {
    const script = slides.map((slide, i) => 
      `[슬라이드 ${i + 1}]\n제목: ${slide.title}\n내용: ${slide.description}${slide.duration ? `\n시간: ${slide.duration}초` : ''}`
    ).join('\n\n');
    return script;
  };

  const currentSlide = slides[currentSlideIndex];

  return (
    <div className="bg-surface-card rounded-xl border border-border overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          {type === 'carousel' ? (
            <ImageIcon className="w-5 h-5 text-brand-orange" />
          ) : (
            <Film className="w-5 h-5 text-brand-orange" />
          )}
          <div>
            <h3 className="font-semibold text-text-primary">
              {type === 'carousel' ? '카드뉴스 스토리보드' : '릴스 스토리보드'}
            </h3>
            <p className="text-xs text-text-muted">
              {type === 'carousel' 
                ? '슬라이드를 드래그하여 순서를 변경하세요' 
                : '각 씬의 대본과 시간을 설정하세요'
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors
              ${isPreviewMode 
                ? 'bg-brand-orange text-white' 
                : 'bg-surface-overlay text-text-secondary hover:text-text-primary'
              }
            `}
          >
            <Eye className="w-4 h-4" />
            미리보기
          </button>
          <CopyButton text={exportScript()} label="스크립트 복사" />
        </div>
      </div>

      <div className="flex">
        {/* 왼쪽: 슬라이드 목록 */}
        <div className="w-64 border-r border-border bg-surface-overlay/30 p-4 max-h-[500px] overflow-y-auto">
          <Reorder.Group
            axis="y"
            values={slides}
            onReorder={handleReorder}
            className="space-y-2"
          >
            {slides.map((slide, index) => (
              <Reorder.Item
                key={slide.id}
                value={slide}
                className={`
                  group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all
                  ${currentSlideIndex === index
                    ? 'bg-brand-orange/10 border border-brand-orange'
                    : 'bg-surface-card border border-border hover:border-border-hover'
                  }
                `}
                onClick={() => setCurrentSlideIndex(index)}
              >
                <GripVertical className="w-4 h-4 text-text-muted cursor-grab" />
                <div className="w-10 h-10 rounded bg-surface-overlay flex items-center justify-center overflow-hidden">
                  {slide.imageUrl ? (
                    <img src={slide.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-text-muted">{index + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {slide.title || `슬라이드 ${index + 1}`}
                  </p>
                  {type === 'reels' && slide.duration && (
                    <p className="text-xs text-text-muted flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {slide.duration}초
                    </p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSlide(slide.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-300 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </Reorder.Item>
            ))}
          </Reorder.Group>

          <button
            onClick={addSlide}
            className="w-full mt-3 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-border rounded-lg text-text-muted hover:text-text-primary hover:border-brand-orange transition-colors"
          >
            <Plus className="w-4 h-4" />
            슬라이드 추가
          </button>
        </div>

        {/* 오른쪽: 슬라이드 편집 */}
        <div className="flex-1 p-6">
          {currentSlide ? (
            <div className="space-y-6">
              {/* 미리보기 영역 */}
              <div className="relative aspect-square max-w-md mx-auto bg-surface rounded-xl border border-border overflow-hidden">
                {currentSlide.imageUrl ? (
                  <img
                    src={currentSlide.imageUrl}
                    alt={currentSlide.title}
                    className="w-full h-full object-cover"
                  />
                ) : productImages[currentSlideIndex] ? (
                  <img
                    src={productImages[currentSlideIndex]}
                    alt={currentSlide.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-text-muted">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">이미지를 추가하세요</p>
                    </div>
                  </div>
                )}

                {/* 텍스트 오버레이 */}
                <div className={`
                  absolute inset-x-0 p-4
                  ${currentSlide.textPosition === 'top' ? 'top-0' : ''}
                  ${currentSlide.textPosition === 'center' ? 'top-1/2 -translate-y-1/2' : ''}
                  ${currentSlide.textPosition === 'bottom' ? 'bottom-0' : ''}
                `}>
                  <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4">
                    <h4 className="text-white font-bold text-lg">{currentSlide.title}</h4>
                    {currentSlide.description && (
                      <p className="text-white/80 text-sm mt-1">{currentSlide.description}</p>
                    )}
                  </div>
                </div>

                {/* 슬라이드 인디케이터 */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlideIndex(i)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === currentSlideIndex ? 'bg-white w-4' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>

                {/* 네비게이션 버튼 */}
                {slides.length > 1 && (
                  <>
                    <button
                      onClick={goToPrevSlide}
                      disabled={currentSlideIndex === 0}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white disabled:opacity-30 hover:bg-black/70 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={goToNextSlide}
                      disabled={currentSlideIndex === slides.length - 1}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white disabled:opacity-30 hover:bg-black/70 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {/* 편집 폼 */}
              <div className="space-y-4">
                {/* 제목 */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    <Type className="w-4 h-4 inline mr-2" />
                    제목
                  </label>
                  <input
                    type="text"
                    value={currentSlide.title}
                    onChange={(e) => updateSlide(currentSlide.id, { title: e.target.value })}
                    placeholder="슬라이드 제목"
                    className="w-full bg-surface-overlay border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-orange"
                  />
                </div>

                {/* 설명 */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    설명/대본
                  </label>
                  <textarea
                    value={currentSlide.description}
                    onChange={(e) => updateSlide(currentSlide.id, { description: e.target.value })}
                    placeholder={type === 'carousel' ? '슬라이드 설명' : '나레이션 대본'}
                    rows={3}
                    className="w-full bg-surface-overlay border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-orange resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* 텍스트 위치 */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      텍스트 위치
                    </label>
                    <div className="flex gap-2">
                      {(['top', 'center', 'bottom'] as const).map((pos) => (
                        <button
                          key={pos}
                          onClick={() => updateSlide(currentSlide.id, { textPosition: pos })}
                          className={`
                            flex-1 py-2 rounded-lg text-sm transition-colors
                            ${currentSlide.textPosition === pos
                              ? 'bg-brand-orange text-white'
                              : 'bg-surface-overlay text-text-secondary hover:text-text-primary'
                            }
                          `}
                        >
                          {pos === 'top' ? '상단' : pos === 'center' ? '중앙' : '하단'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 릴스: 시간 설정 */}
                  {type === 'reels' && (
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        <Clock className="w-4 h-4 inline mr-2" />
                        시간 (초)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={60}
                        value={currentSlide.duration || 3}
                        onChange={(e) => updateSlide(currentSlide.id, { duration: parseInt(e.target.value) || 3 })}
                        className="w-full bg-surface-overlay border border-border rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:border-brand-orange"
                      />
                    </div>
                  )}
                </div>

                {/* 이미지 선택 (제품 이미지가 있는 경우) */}
                {productImages.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      <ImageIcon className="w-4 h-4 inline mr-2" />
                      이미지 선택
                    </label>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {productImages.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => updateSlide(currentSlide.id, { imageUrl: img })}
                          className={`
                            flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all
                            ${currentSlide.imageUrl === img ? 'border-brand-orange' : 'border-transparent opacity-60 hover:opacity-100'}
                          `}
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <ImageIcon className="w-16 h-16 mx-auto mb-4 text-text-muted opacity-50" />
                <p className="text-text-muted">슬라이드를 추가하세요</p>
                <button
                  onClick={addSlide}
                  className="mt-4 px-4 py-2 bg-brand-orange text-white rounded-lg hover:bg-brand-orange-light transition-colors"
                >
                  첫 슬라이드 추가
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 릴스: 총 시간 표시 */}
      {type === 'reels' && slides.length > 0 && (
        <div className="px-5 py-3 border-t border-border bg-surface-overlay/30 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Clock className="w-4 h-4" />
            <span>총 시간: {slides.reduce((acc, s) => acc + (s.duration || 3), 0)}초</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Film className="w-4 h-4" />
            <span>{slides.length}개 씬</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualStoryboard;
