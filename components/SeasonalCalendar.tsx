
import React, { useState } from 'react';
import { SEASONAL_EVENTS } from '../constants';
import type { SeasonalEvent } from '../constants';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from './Icons';

interface SeasonalCalendarProps {
  selectedEventId: string | null;
  onSelectEvent: (eventId: string | null) => void;
}

type RegionFilter = 'all' | 'north_america' | 'japan';

export const SeasonalCalendar: React.FC<SeasonalCalendarProps> = ({ selectedEventId, onSelectEvent }) => {
  const [displayDate, setDisplayDate] = useState(new Date());
  const [activeRegion, setActiveRegion] = useState<RegionFilter>('all');

  const year = displayDate.getFullYear();
  const month = displayDate.getMonth(); // 0-11

  // Get first day of month (0=Sunday, 1=Monday, etc.)
  const firstDay = new Date(year, month, 1).getDay();
  
  // Get days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Helper to handle month navigation
  const prevMonth = () => setDisplayDate(new Date(year, month - 1, 1));
  const nextMonth = () => setDisplayDate(new Date(year, month + 1, 1));

  // Filter events based on active region
  const getFilteredEvents = () => {
    return SEASONAL_EVENTS.filter(e => {
        if (activeRegion === 'all') return true;
        if (activeRegion === 'north_america') return e.region === 'Global' || e.region === 'North America';
        if (activeRegion === 'japan') return e.region === 'Global' || e.region === 'Japan';
        return true;
    });
  };

  const eventsInMonth = getFilteredEvents().filter(e => e.month === month + 1);

  const renderDays = () => {
    const days = [];
    
    // Empty slots for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }

    // Days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      // Find event for this day. 
      // If multiple events exist, prefer the one matching the specific region if selected, otherwise just take the first.
      const event = eventsInMonth.find(e => e.day === day);
      
      const isSelected = event && event.id === selectedEventId;
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
      
      // Dynamic styling based on region
      let badgeColor = 'bg-gray-700/50 text-white hover:bg-gray-600 border-gray-600';
      if (event) {
          if (event.region === 'North America') badgeColor = 'bg-orange-900/40 text-orange-200 border-orange-500/30 hover:bg-orange-800/40';
          else if (event.region === 'Japan') badgeColor = 'bg-blue-900/40 text-blue-200 border-blue-500/30 hover:bg-blue-800/40';
          else badgeColor = 'bg-purple-900/40 text-purple-200 border-purple-500/30 hover:bg-purple-800/40';
      }

      days.push(
        <div key={day} className="relative h-10 flex flex-col items-center justify-start pt-1">
          <button
            type="button"
            onClick={() => event ? onSelectEvent(isSelected ? null : event.id) : null}
            disabled={!event}
            className={`
              w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all
              ${isSelected ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50 scale-110 z-10 ring-2 ring-white' : ''}
              ${!isSelected && event ? `${badgeColor} border cursor-pointer` : ''}
              ${!isSelected && !event ? 'text-gray-500 cursor-default' : ''}
              ${isToday && !isSelected ? 'ring-1 ring-purple-400 text-purple-300' : ''}
            `}
          >
            {event ? <span className="text-lg leading-none transform hover:scale-125 transition-transform">{event.emoji}</span> : day}
          </button>
          {event && isSelected && (
              <div className="absolute -bottom-1 w-1 h-1 bg-purple-400 rounded-full"></div>
          )}
        </div>
      );
    }
    return days;
  };

  const selectedEventInfo = SEASONAL_EVENTS.find(e => e.id === selectedEventId);
  
  const RegionTab: React.FC<{ id: RegionFilter, label: string }> = ({ id, label }) => (
      <button
        onClick={() => setActiveRegion(id)}
        className={`flex-1 text-[10px] font-bold py-1.5 rounded transition-colors ${
            activeRegion === id 
            ? 'bg-gray-700 text-white shadow-sm' 
            : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
        }`}
      >
          {label}
      </button>
  );

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="flex items-center gap-2 text-sm font-bold text-gray-200">
          <CalendarIcon className="text-purple-400 w-4 h-4" />
          글로벌 마케팅 캘린더
        </h4>
        <div className="flex items-center gap-1 bg-gray-800 rounded-md p-0.5">
          <button type="button" onClick={prevMonth} className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"><ChevronLeftIcon /></button>
          <span className="text-xs font-mono font-bold w-16 text-center text-gray-300">{year}.{String(month + 1).padStart(2, '0')}</span>
          <button type="button" onClick={nextMonth} className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"><ChevronRightIcon /></button>
        </div>
      </div>
      
      {/* Region Tabs */}
      <div className="flex bg-gray-800/50 p-1 rounded-md mb-3 gap-1">
        <RegionTab id="all" label="🌍 전체" />
        <RegionTab id="north_america" label="🇺🇸 북미" />
        <RegionTab id="japan" label="🇯🇵 일본" />
      </div>

      {/* Grid Header */}
      <div className="grid grid-cols-7 text-center mb-2">
        {['일', '월', '화', '수', '목', '금', '토'].map(d => (
          <span key={d} className="text-[10px] text-gray-500 font-semibold">{d}</span>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-y-1 gap-x-1">
        {renderDays()}
      </div>

      {/* Selected Event Details */}
      {selectedEventInfo && (
        <div className="mt-4 bg-gradient-to-r from-purple-900/40 to-gray-800 border border-purple-500/30 rounded-lg p-3 animate-fade-in shadow-lg">
           <div className="flex justify-between items-start">
               <div className="flex gap-3">
                   <div className="text-3xl bg-gray-800 rounded-lg p-2 h-12 w-12 flex items-center justify-center border border-gray-700 shadow-inner">
                       {selectedEventInfo.emoji}
                   </div>
                   <div>
                       <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wide block mb-0.5">Seasonal Strategy Applied</span>
                       <h5 className="text-sm font-bold text-white mb-1 flex items-center gap-1.5">
                           {selectedEventInfo.label}
                           <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                               selectedEventInfo.region === 'Japan' ? 'bg-blue-900/30 text-blue-300 border-blue-500/20' :
                               selectedEventInfo.region === 'North America' ? 'bg-orange-900/30 text-orange-300 border-orange-500/20' :
                               'bg-purple-900/30 text-purple-300 border-purple-500/20'
                           }`}>
                               {selectedEventInfo.region}
                           </span>
                       </h5>
                       <p className="text-xs text-gray-400">
                           키워드: {selectedEventInfo.keywords.slice(0, 3).join(', ')}...
                       </p>
                   </div>
               </div>
               <button 
                type="button" 
                onClick={() => onSelectEvent(null)}
                className="text-gray-500 hover:text-white text-xs underline"
               >
                   해제
               </button>
           </div>
        </div>
      )}
      
      {!selectedEventInfo && (
          <p className="mt-3 text-[11px] text-gray-500 text-center">
              * 날짜에 표시된 이모지를 클릭하여 시즌 전략을 적용하세요.
          </p>
      )}
    </div>
  );
};
