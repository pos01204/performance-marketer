import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Settings,
  Globe,
  Palette,
  Bell,
  Save,
  RotateCcw,
  Check,
  ChevronRight,
  Info,
  Sparkles
} from 'lucide-react';
import {
  LANGUAGE_OPTIONS,
  PLATFORM_OPTIONS,
  TONE_OPTIONS,
  CRM_TRIGGER_OPTIONS,
  CONTENT_FORMAT_OPTIONS,
  DEFAULT_SETTINGS,
} from '../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserSettings {
  defaultLanguages: string[];
  defaultPlatforms: string[];
  defaultTone: string;
  defaultTrigger: string;
  defaultFormat: string;
  autoSaveHistory: boolean;
  showHashtagSuggestions: boolean;
  enableSeasonalAlerts: boolean;
}

const STORAGE_KEY = 'idus_marketer_settings';

// 로컬 스토리지에서 설정 불러오기
const loadSettings = (): UserSettings => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  
  return {
    defaultLanguages: [...DEFAULT_SETTINGS.defaultLanguages],
    defaultPlatforms: [...DEFAULT_SETTINGS.defaultPlatforms],
    defaultTone: DEFAULT_SETTINGS.defaultTone,
    defaultTrigger: DEFAULT_SETTINGS.defaultTrigger,
    defaultFormat: DEFAULT_SETTINGS.defaultFormat,
    autoSaveHistory: true,
    showHashtagSuggestions: true,
    enableSeasonalAlerts: true,
  };
};

// 설정 저장
const saveSettings = (settings: UserSettings) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<UserSettings>(loadSettings);
  const [activeTab, setActiveTab] = useState<'content' | 'crm' | 'general'>('content');
  const [hasChanges, setHasChanges] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // 설정 변경 감지
  useEffect(() => {
    const original = loadSettings();
    const changed = JSON.stringify(settings) !== JSON.stringify(original);
    setHasChanges(changed);
  }, [settings]);

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

  // 언어 토글
  const toggleLanguage = (langId: string) => {
    setSettings(prev => ({
      ...prev,
      defaultLanguages: prev.defaultLanguages.includes(langId)
        ? prev.defaultLanguages.filter(id => id !== langId)
        : [...prev.defaultLanguages, langId],
    }));
  };

  // 플랫폼 토글
  const togglePlatform = (platformId: string) => {
    setSettings(prev => ({
      ...prev,
      defaultPlatforms: prev.defaultPlatforms.includes(platformId)
        ? prev.defaultPlatforms.filter(id => id !== platformId)
        : [...prev.defaultPlatforms, platformId],
    }));
  };

  // 저장
  const handleSave = () => {
    saveSettings(settings);
    setHasChanges(false);
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 2000);
  };

  // 초기화
  const handleReset = () => {
    const defaultSettings: UserSettings = {
      defaultLanguages: [...DEFAULT_SETTINGS.defaultLanguages],
      defaultPlatforms: [...DEFAULT_SETTINGS.defaultPlatforms],
      defaultTone: DEFAULT_SETTINGS.defaultTone,
      defaultTrigger: DEFAULT_SETTINGS.defaultTrigger,
      defaultFormat: DEFAULT_SETTINGS.defaultFormat,
      autoSaveHistory: true,
      showHashtagSuggestions: true,
      enableSeasonalAlerts: true,
    };
    setSettings(defaultSettings);
  };

  const tabs = [
    { id: 'content', label: '콘텐츠 생성', icon: Sparkles },
    { id: 'crm', label: 'CRM', icon: Bell },
    { id: 'general', label: '일반', icon: Settings },
  ];

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
          {/* 배경 */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* 모달 */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl max-h-[85vh] bg-surface-card rounded-2xl border border-border shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-orange/10 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-brand-orange" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">설정</h2>
                  <p className="text-xs text-text-muted">기본값 및 환경 설정</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-overlay rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 탭 */}
            <div className="flex border-b border-border">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors
                    ${activeTab === tab.id
                      ? 'text-brand-orange border-b-2 border-brand-orange bg-brand-orange/5'
                      : 'text-text-muted hover:text-text-primary hover:bg-surface-overlay/50'
                    }
                  `}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 컨텐츠 */}
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-200px)]">
              {/* 콘텐츠 생성 탭 */}
              {activeTab === 'content' && (
                <div className="space-y-6">
                  {/* 기본 언어 */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-3">
                      기본 생성 언어
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {LANGUAGE_OPTIONS.map((lang) => (
                        <button
                          key={lang.id}
                          onClick={() => toggleLanguage(lang.id)}
                          className={`
                            flex items-center gap-2 px-4 py-3 rounded-lg border transition-all
                            ${settings.defaultLanguages.includes(lang.id)
                              ? 'border-brand-orange bg-brand-orange/10 text-text-primary'
                              : 'border-border hover:border-border-hover text-text-secondary'
                            }
                          `}
                        >
                          <span className="text-lg">{lang.flag}</span>
                          <span className="text-sm">{lang.label}</span>
                          {settings.defaultLanguages.includes(lang.id) && (
                            <Check className="w-4 h-4 text-brand-orange ml-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 기본 플랫폼 */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-3">
                      기본 플랫폼
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {PLATFORM_OPTIONS.map((platform) => (
                        <button
                          key={platform.id}
                          onClick={() => togglePlatform(platform.id)}
                          className={`
                            flex items-center gap-3 px-4 py-3 rounded-lg border transition-all
                            ${settings.defaultPlatforms.includes(platform.id)
                              ? 'border-brand-orange bg-brand-orange/10 text-text-primary'
                              : 'border-border hover:border-border-hover text-text-secondary'
                            }
                          `}
                        >
                          <span className="text-sm">{platform.label}</span>
                          {settings.defaultPlatforms.includes(platform.id) && (
                            <Check className="w-4 h-4 text-brand-orange ml-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 기본 톤앤매너 */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-3">
                      기본 톤앤매너
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {TONE_OPTIONS.map((tone) => (
                        <button
                          key={tone.id}
                          onClick={() => setSettings(prev => ({ ...prev, defaultTone: tone.id }))}
                          className={`
                            flex items-center gap-3 px-4 py-3 rounded-lg border transition-all text-left
                            ${settings.defaultTone === tone.id
                              ? 'border-brand-orange bg-brand-orange/10 text-text-primary'
                              : 'border-border hover:border-border-hover text-text-secondary'
                            }
                          `}
                        >
                          <span className="text-lg">{tone.emoji}</span>
                          <span className="text-sm">{tone.label}</span>
                          {settings.defaultTone === tone.id && (
                            <Check className="w-4 h-4 text-brand-orange ml-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 기본 포맷 */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-3">
                      기본 콘텐츠 포맷
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {CONTENT_FORMAT_OPTIONS.map((format) => (
                        <button
                          key={format.id}
                          onClick={() => setSettings(prev => ({ ...prev, defaultFormat: format.id }))}
                          className={`
                            flex flex-col items-center gap-2 px-4 py-4 rounded-lg border transition-all
                            ${settings.defaultFormat === format.id
                              ? 'border-brand-orange bg-brand-orange/10 text-text-primary'
                              : 'border-border hover:border-border-hover text-text-secondary'
                            }
                          `}
                        >
                          <span className="text-2xl">{format.icon}</span>
                          <span className="text-sm font-medium">{format.label}</span>
                          <span className="text-xs text-text-muted">{format.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* CRM 탭 */}
              {activeTab === 'crm' && (
                <div className="space-y-6">
                  {/* 기본 트리거 */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-3">
                      기본 CRM 트리거
                    </label>
                    <div className="space-y-2">
                      {CRM_TRIGGER_OPTIONS.map((trigger) => (
                        <button
                          key={trigger.id}
                          onClick={() => setSettings(prev => ({ ...prev, defaultTrigger: trigger.id }))}
                          className={`
                            w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all text-left
                            ${settings.defaultTrigger === trigger.id
                              ? 'border-brand-orange bg-brand-orange/10'
                              : 'border-border hover:border-border-hover'
                            }
                          `}
                        >
                          <div className="flex-1">
                            <div className="text-sm font-medium text-text-primary">{trigger.label}</div>
                            <div className="text-xs text-text-muted">{trigger.description}</div>
                          </div>
                          {settings.defaultTrigger === trigger.id && (
                            <Check className="w-4 h-4 text-brand-orange" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 일반 탭 */}
              {activeTab === 'general' && (
                <div className="space-y-4">
                  {/* 토글 옵션들 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-surface-overlay rounded-lg">
                      <div>
                        <div className="text-sm font-medium text-text-primary">히스토리 자동 저장</div>
                        <div className="text-xs text-text-muted">생성된 콘텐츠를 자동으로 저장합니다</div>
                      </div>
                      <button
                        onClick={() => setSettings(prev => ({ ...prev, autoSaveHistory: !prev.autoSaveHistory }))}
                        className={`
                          w-12 h-6 rounded-full transition-colors relative
                          ${settings.autoSaveHistory ? 'bg-brand-orange' : 'bg-surface'}
                        `}
                      >
                        <div
                          className={`
                            absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
                            ${settings.autoSaveHistory ? 'translate-x-7' : 'translate-x-1'}
                          `}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-surface-overlay rounded-lg">
                      <div>
                        <div className="text-sm font-medium text-text-primary">해시태그 추천</div>
                        <div className="text-xs text-text-muted">카테고리별 해시태그를 자동으로 추천합니다</div>
                      </div>
                      <button
                        onClick={() => setSettings(prev => ({ ...prev, showHashtagSuggestions: !prev.showHashtagSuggestions }))}
                        className={`
                          w-12 h-6 rounded-full transition-colors relative
                          ${settings.showHashtagSuggestions ? 'bg-brand-orange' : 'bg-surface'}
                        `}
                      >
                        <div
                          className={`
                            absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
                            ${settings.showHashtagSuggestions ? 'translate-x-7' : 'translate-x-1'}
                          `}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-surface-overlay rounded-lg">
                      <div>
                        <div className="text-sm font-medium text-text-primary">시즌 이벤트 알림</div>
                        <div className="text-xs text-text-muted">다가오는 시즌 이벤트를 알려줍니다</div>
                      </div>
                      <button
                        onClick={() => setSettings(prev => ({ ...prev, enableSeasonalAlerts: !prev.enableSeasonalAlerts }))}
                        className={`
                          w-12 h-6 rounded-full transition-colors relative
                          ${settings.enableSeasonalAlerts ? 'bg-brand-orange' : 'bg-surface'}
                        `}
                      >
                        <div
                          className={`
                            absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
                            ${settings.enableSeasonalAlerts ? 'translate-x-7' : 'translate-x-1'}
                          `}
                        />
                      </button>
                    </div>
                  </div>

                  {/* 정보 */}
                  <div className="mt-6 p-4 bg-surface-overlay/50 rounded-lg border border-border">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-text-muted flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-text-secondary">
                          설정은 브라우저 로컬 스토리지에 저장됩니다.
                          브라우저 데이터를 삭제하면 설정이 초기화될 수 있습니다.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 푸터 */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-surface-overlay/30">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 text-sm text-text-muted hover:text-text-primary transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                기본값으로 초기화
              </button>

              <div className="flex items-center gap-3">
                {showSaveSuccess && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-green-500 text-sm"
                  >
                    <Check className="w-4 h-4" />
                    저장되었습니다
                  </motion.div>
                )}
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  disabled={!hasChanges}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${hasChanges
                      ? 'bg-brand-orange text-white hover:bg-brand-orange-light'
                      : 'bg-surface-overlay text-text-muted cursor-not-allowed'
                    }
                  `}
                >
                  <Save className="w-4 h-4" />
                  저장
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// 설정 불러오기 유틸리티 (다른 컴포넌트에서 사용)
export const getSettings = loadSettings;
export const updateSettings = saveSettings;

export default SettingsModal;
