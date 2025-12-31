import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  ChevronRight,
  X,
  Clock,
  Sparkles,
  Bell,
  Gift,
  PartyPopper
} from 'lucide-react';
import { SEASONAL_EVENTS, type SeasonalEvent } from '../constants';

interface SeasonalEventBannerProps {
  targetRegion?: 'north_america' | 'japan' | 'all';
  onEventSelect?: (event: SeasonalEvent) => void;
  dismissible?: boolean;
}

// 이벤트까지 남은 일수 계산
function getDaysUntilEvent(event: SeasonalEvent): number {
  const now = new Date();
  const currentYear = now.getFullYear();
  
  let eventDate = new Date(currentYear, event.month - 1, event.day);
  
  // 이벤트가 이미 지났으면 내년 날짜로
  if (eventDate < now) {
    eventDate = new Date(currentYear + 1, event.month - 1, event.day);
  }
  
  const diffTime = eventDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// 다가오는 이벤트 필터링 (30일 이내)
function getUpcomingEvents(region: string, daysAhead: number = 30): (SeasonalEvent & { daysUntil: number })[] {
  return SEASONAL_EVENTS
    .map(event => ({
      ...event,
      daysUntil: getDaysUntilEvent(event),
    }))
    .filter(event => {
      // 30일 이내 이벤트만
      if (event.daysUntil > daysAhead) return false;
      
      // 지역 필터링
      if (region === 'all') return true;
      if (region === 'north_america') {
        return event.region === 'North America' || event.region === 'Global';
      }
      if (region === 'japan') {
        return event.region === 'Japan' || event.region === 'Global';
      }
      return true;
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

export const SeasonalEventBanner: React.FC<SeasonalEventBannerProps> = ({
  targetRegion = 'all',
  onEventSelect,
  dismissible = true,
}) => {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);

  // 다가오는 이벤트
  const upcomingEvents = useMemo(() => {
    return getUpcomingEvents(targetRegion, 30).filter(e => !dismissed.includes(e.id));
  }, [targetRegion, dismissed]);

  // 가장 가까운 이벤트
  const nearestEvent = upcomingEvents[0];

  // 이벤트 해제
  const handleDismiss = (eventId: string) => {
    setDismissed(prev => [...prev, eventId]);
  };

  if (upcomingEvents.length === 0) {
    return null;
  }

  // 긴급도에 따른 색상
  const getUrgencyColor = (daysUntil: number) => {
    if (daysUntil <= 3) return 'from-red-600 to-red-500';
    if (daysUntil <= 7) return 'from-orange-600 to-orange-500';
    if (daysUntil <= 14) return 'from-yellow-600 to-yellow-500';
    return 'from-brand-orange to-brand-orange-light';
  };

  return (
    <div className="mb-6">
      {/* 메인 배너 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`
          relative overflow-hidden rounded-xl border border-brand-orange/30
          bg-gradient-to-r ${getUrgencyColor(nearestEvent.daysUntil)}
        `}
      >
        <div className="absolute inset-0 bg-[url('/brand/brand%20assets/pattern01.png')] opacity-10" />
        
        <div className="relative px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* 이모지 아이콘 */}
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl">
                {nearestEvent.emoji}
              </div>

              {/* 이벤트 정보 */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold text-lg">
                    {nearestEvent.label}
                  </span>
                  {nearestEvent.daysUntil <= 7 && (
                    <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs text-white font-medium animate-pulse">
                      D-{nearestEvent.daysUntil}
                    </span>
                  )}
                </div>
                <p className="text-white/80 text-sm mt-0.5">
                  {nearestEvent.daysUntil === 0 
                    ? '오늘입니다! 🎉' 
                    : nearestEvent.daysUntil === 1
                      ? '내일입니다!'
                      : `${nearestEvent.daysUntil}일 후`
                  }
                  {' · '}
                  <span className="text-white/60">
                    {nearestEvent.region === 'Global' ? '전 세계' : nearestEvent.region}
                  </span>
                </p>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex items-center gap-2">
              {onEventSelect && (
                <button
                  onClick={() => onEventSelect(nearestEvent)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-medium transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  시즌 콘텐츠 생성
                </button>
              )}
              
              {upcomingEvents.length > 1 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  <span>+{upcomingEvents.length - 1}개</span>
                  <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                </button>
              )}

              {dismissible && (
                <button
                  onClick={() => handleDismiss(nearestEvent.id)}
                  className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* 키워드 태그 */}
          <div className="flex flex-wrap gap-2 mt-3">
            {nearestEvent.keywords.map((keyword, i) => (
              <span
                key={i}
                className="px-2 py-1 bg-white/10 rounded-full text-xs text-white/90"
              >
                #{keyword}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* 확장된 이벤트 목록 */}
      <AnimatePresence>
        {expanded && upcomingEvents.length > 1 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-2"
          >
            {upcomingEvents.slice(1).map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-4 bg-surface-card rounded-lg border border-border hover:border-border-hover transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{event.emoji}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-primary">{event.label}</span>
                      <span className="text-xs text-text-muted">
                        D-{event.daysUntil}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted">
                      {event.region === 'Global' ? '전 세계' : event.region}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {onEventSelect && (
                    <button
                      onClick={() => onEventSelect(event)}
                      className="px-3 py-1.5 bg-surface-overlay hover:bg-surface-overlay/80 rounded-lg text-sm text-text-secondary hover:text-text-primary transition-colors"
                    >
                      콘텐츠 생성
                    </button>
                  )}
                  {dismissible && (
                    <button
                      onClick={() => handleDismiss(event.id)}
                      className="p-1.5 text-text-muted hover:text-text-primary transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 시즌 이벤트 컨텍스트 생성 (AI 프롬프트용)
export function getSeasonalContext(region: string): string | null {
  const events = getUpcomingEvents(region, 14); // 2주 이내
  
  if (events.length === 0) return null;

  const nearestEvent = events[0];
  
  return `
    **[시즌 이벤트 컨텍스트]**
    - 다가오는 이벤트: ${nearestEvent.label} (D-${nearestEvent.daysUntil})
    - 지역: ${nearestEvent.region}
    - 관련 키워드: ${nearestEvent.keywords.join(', ')}
    - 콘텐츠 방향: ${nearestEvent.label}과 연관된 감성과 메시지를 자연스럽게 녹여주세요.
  `;
}

export default SeasonalEventBanner;
