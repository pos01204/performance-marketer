import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Sparkles, 
  History as HistoryIcon,
  Settings,
  Package,
} from 'lucide-react';
import { useCampaignStore, useSelectedProductCount, useHistoryCount } from './store/campaignStore';
import { ProductDiscovery } from './components/ProductDiscovery';
import { ContentStudio } from './components/ContentStudio';
import { History } from './components/History';
import { SettingsModal } from './components/SettingsModal';
import { Toaster } from 'sonner';
import type { AppTab } from './types';

const TAB_ITEMS: { id: AppTab; label: string; icon: React.ReactNode; badge?: 'products' | 'history' }[] = [
  { 
    id: 'discovery', 
    label: '작품 탐색', 
    icon: <Search className="w-5 h-5" />,
    badge: 'products',
  },
  { 
    id: 'studio', 
    label: '콘텐츠 스튜디오', 
    icon: <Sparkles className="w-5 h-5" />,
    badge: 'products',
  },
  { 
    id: 'history', 
    label: '히스토리', 
    icon: <HistoryIcon className="w-5 h-5" />,
    badge: 'history',
  },
];

const App: React.FC = () => {
  const { activeTab, setActiveTab } = useCampaignStore();
  const selectedCount = useSelectedProductCount();
  const historyCount = useHistoryCount();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleTabChange = (tab: AppTab) => {
    setActiveTab(tab);
  };

  const getBadgeCount = (badge?: 'products' | 'history') => {
    if (badge === 'products') return selectedCount;
    if (badge === 'history') return historyCount;
    return 0;
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-surface font-suite overflow-hidden">
      {/* 헤더 네비게이션 */}
      <header className="flex-shrink-0 h-16 border-b border-border bg-white/80 backdrop-blur-md px-6 flex items-center justify-between z-30 shadow-soft">
        {/* 로고 */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-orange to-brand-orange-light flex items-center justify-center">
            <span className="text-white font-bold text-lg">i</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary">
              Marketing Studio
            </h1>
            <p className="text-[10px] text-text-muted tracking-wider uppercase">
              idus Global Business
            </p>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <nav className="flex items-center bg-surface rounded-xl p-1 border border-border">
          {TAB_ITEMS.map((tab) => {
            const isActive = activeTab === tab.id;
            const badgeCount = getBadgeCount(tab.badge);
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`
                  relative flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/25' 
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay'
                  }
                `}
              >
                {tab.icon}
                <span>{tab.label}</span>
                
                {/* 뱃지 */}
                {badgeCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`
                      min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full text-[11px] font-bold
                      ${isActive 
                        ? 'bg-white text-brand-orange' 
                        : 'bg-brand-orange/20 text-brand-orange'
                      }
                    `}
                  >
                    {badgeCount}
                  </motion.span>
                )}
              </button>
            );
          })}
        </nav>

        {/* 우측 영역 */}
        <div className="flex items-center gap-3">
          {selectedCount > 0 && activeTab !== 'studio' && (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => handleTabChange('studio')}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-orange to-brand-orange-light text-white text-sm font-medium rounded-lg hover:shadow-lg hover:shadow-brand-orange/25 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>콘텐츠 생성</span>
              <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">{selectedCount}</span>
            </motion.button>
          )}
          
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-overlay rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 설정 모달 */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'discovery' && (
            <motion.div
              key="discovery"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <ProductDiscovery onNavigateToStudio={() => handleTabChange('studio')} />
            </motion.div>
          )}
          
          {activeTab === 'studio' && (
            <motion.div
              key="studio"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <ContentStudio onNavigateBack={() => handleTabChange('discovery')} />
            </motion.div>
          )}
          
          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <History />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Toast 알림 */}
      <Toaster 
        theme="light"
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#FFFFFF',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            color: '#111827',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          },
        }}
      />
    </div>
  );
};

export default App;
