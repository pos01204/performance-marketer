import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History as HistoryIcon, 
  Trash2, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Copy,
  Check,
  Instagram,
  Twitter,
  MessageSquare,
  ExternalLink,
  Download,
  AlertCircle
} from 'lucide-react';
import { useCampaignStore } from '../store/campaignStore';
import { formatPrice } from '../services/idusService';
import { LANGUAGE_OPTIONS, PLATFORM_OPTIONS } from '../constants';
import type { GeneratedContent, Language, Platform } from '../types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export const History: React.FC = () => {
  const { history, removeFromHistory, clearHistory } = useCampaignStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const exportAsMarkdown = (item: GeneratedContent) => {
    let markdown = `# 콘텐츠 생성 기록\n\n`;
    markdown += `📅 생성일시: ${format(new Date(item.createdAt), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}\n\n`;
    
    // 작품 정보
    markdown += `## 📦 선택된 작품\n\n`;
    item.products.forEach((p, i) => {
      markdown += `${i + 1}. **${p.title}**\n`;
      markdown += `   - 가격: ${formatPrice(p.price)}\n`;
      markdown += `   - 작가: ${p.artistName}\n`;
      markdown += `   - URL: ${p.url}\n\n`;
    });

    // 소셜 콘텐츠
    if (item.socialResult) {
      markdown += `## 📱 소셜 콘텐츠\n\n`;
      Object.entries(item.socialResult.marketingContent || {}).forEach(([lang, platforms]) => {
        const langLabel = LANGUAGE_OPTIONS.find(l => l.id === lang)?.label || lang;
        markdown += `### ${langLabel}\n\n`;
        Object.entries(platforms || {}).forEach(([platform, content]: [string, any]) => {
          markdown += `#### ${platform.toUpperCase()}\n\n`;
          markdown += `**캡션:**\n${content.caption}\n\n`;
          markdown += `**해시태그:**\n${content.hashtags.map((h: string) => h.startsWith('#') ? h : `#${h}`).join(' ')}\n\n`;
        });
      });
    }

    // CRM
    if (item.crmResult) {
      markdown += `## 💬 CRM 카피\n\n`;
      Object.entries(item.crmResult.crmContent || {}).forEach(([lang, copies]) => {
        const langLabel = LANGUAGE_OPTIONS.find(l => l.id === lang)?.label || lang;
        markdown += `### ${langLabel}\n\n`;
        (copies || []).forEach((copy: any, i: number) => {
          markdown += `**${i === 0 ? 'A안' : 'B안'}**\n`;
          markdown += `- 메인: ${copy.mainCopy}\n`;
          markdown += `- 서브: ${copy.subCopy}\n\n`;
        });
      });
    }

    // 파일 다운로드
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `content-${format(new Date(item.createdAt), 'yyyyMMdd-HHmm')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <div className="w-24 h-24 rounded-full bg-surface-card border border-border flex items-center justify-center mb-6">
          <HistoryIcon className="w-10 h-10 text-text-muted" />
        </div>
        <h3 className="text-xl font-semibold text-text-primary mb-2">
          생성 기록이 없습니다
        </h3>
        <p className="text-text-secondary max-w-md">
          콘텐츠를 생성하면 이곳에 기록이 저장됩니다.<br />
          작품 탐색에서 콘텐츠 생성을 시작해보세요.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex-shrink-0 px-8 py-6 border-b border-border bg-surface/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <HistoryIcon className="w-6 h-6 text-brand-orange" />
              히스토리
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              총 {history.length}개의 콘텐츠 생성 기록
            </p>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            전체 삭제
          </button>
        </div>
      </div>

      {/* 기록 목록 */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-5xl mx-auto space-y-4">
          <AnimatePresence mode="popLayout">
            {history.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-surface-card rounded-xl border border-border overflow-hidden"
              >
                {/* 기록 헤더 */}
                <div 
                  className="p-4 cursor-pointer hover:bg-surface-overlay/50 transition-colors"
                  onClick={() => toggleExpand(item.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* 작품 이미지 미리보기 */}
                      <div className="flex -space-x-2">
                        {item.products.slice(0, 3).map((p, i) => (
                          <img
                            key={p.id}
                            src={p.image}
                            alt={p.title}
                            className="w-10 h-10 rounded-lg border-2 border-surface-card object-cover"
                            style={{ zIndex: 3 - i }}
                          />
                        ))}
                        {item.products.length > 3 && (
                          <div className="w-10 h-10 rounded-lg bg-surface-overlay flex items-center justify-center text-xs text-text-muted border-2 border-surface-card">
                            +{item.products.length - 3}
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <p className="font-medium text-text-primary line-clamp-1">
                          {item.products[0]?.title}
                          {item.products.length > 1 && ` 외 ${item.products.length - 1}개`}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(item.createdAt), 'MM/dd HH:mm', { locale: ko })}
                          </span>
                          {item.socialResult && (
                            <span className="flex items-center gap-1 text-pink-400">
                              <Instagram className="w-3 h-3" />
                              소셜
                            </span>
                          )}
                          {item.crmResult && (
                            <span className="flex items-center gap-1 text-blue-400">
                              <MessageSquare className="w-3 h-3" />
                              CRM
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          exportAsMarkdown(item);
                        }}
                        className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-overlay rounded-lg transition-colors"
                        title="마크다운으로 내보내기"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromHistory(item.id);
                        }}
                        className="p-2 text-text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {expandedId === item.id ? (
                        <ChevronUp className="w-5 h-5 text-text-muted" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-text-muted" />
                      )}
                    </div>
                  </div>
                </div>

                {/* 확장된 내용 */}
                <AnimatePresence>
                  {expandedId === item.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border p-4 space-y-6">
                        {/* 소셜 콘텐츠 */}
                        {item.socialResult && (
                          <div>
                            <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                              <Instagram className="w-4 h-4 text-pink-500" />
                              소셜 콘텐츠
                            </h4>
                            <div className="space-y-3">
                              {Object.entries(item.socialResult.marketingContent || {}).map(([lang, platforms]) => (
                                <div key={lang} className="space-y-2">
                                  <span className="text-xs text-text-muted uppercase tracking-wider">
                                    {LANGUAGE_OPTIONS.find(l => l.id === lang)?.flag} {LANGUAGE_OPTIONS.find(l => l.id === lang)?.label}
                                  </span>
                                  {Object.entries(platforms || {}).map(([platform, content]: [string, any]) => {
                                    const copyId = `${item.id}-${lang}-${platform}`;
                                    const fullText = `${content.caption}\n\n${content.hashtags.map((h: string) => h.startsWith('#') ? h : `#${h}`).join(' ')}`;
                                    
                                    return (
                                      <div 
                                        key={platform}
                                        className="bg-surface-overlay rounded-lg p-3"
                                      >
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-1.5">
                                            {platform === 'meta' ? (
                                              <Instagram className="w-3.5 h-3.5 text-pink-500" />
                                            ) : (
                                              <Twitter className="w-3.5 h-3.5 text-blue-400" />
                                            )}
                                            <span className="text-xs font-medium text-text-secondary">
                                              {platform.toUpperCase()}
                                            </span>
                                          </div>
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
                                        <p className="text-sm text-text-primary whitespace-pre-wrap line-clamp-3">
                                          {content.caption}
                                        </p>
                                        <p className="text-xs text-blue-400 mt-2 line-clamp-2">
                                          {content.hashtags.slice(0, 5).map((h: string) => h.startsWith('#') ? h : `#${h}`).join(' ')}
                                          {content.hashtags.length > 5 && ` +${content.hashtags.length - 5}`}
                                        </p>
                                      </div>
                                    );
                                  })}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* CRM */}
                        {item.crmResult && (
                          <div>
                            <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                              <MessageSquare className="w-4 h-4 text-blue-500" />
                              CRM 카피
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {Object.entries(item.crmResult.crmContent || {}).map(([lang, copies]) => (
                                <React.Fragment key={lang}>
                                  {(copies || []).slice(0, 2).map((copy: any, i: number) => {
                                    const copyId = `${item.id}-crm-${lang}-${i}`;
                                    const fullText = `${copy.mainCopy}\n${copy.subCopy}`;
                                    
                                    return (
                                      <div 
                                        key={copyId}
                                        className="bg-surface-overlay rounded-lg p-3"
                                      >
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs">
                                              {LANGUAGE_OPTIONS.find(l => l.id === lang)?.flag}
                                            </span>
                                            <span className="text-xs font-medium text-text-secondary">
                                              {i === 0 ? 'A안' : 'B안'}
                                            </span>
                                          </div>
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
                                        <p className="text-sm font-medium text-text-primary line-clamp-1">
                                          {copy.mainCopy}
                                        </p>
                                        <p className="text-xs text-text-secondary mt-1 line-clamp-1">
                                          {copy.subCopy}
                                        </p>
                                      </div>
                                    );
                                  })}
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* 전체 삭제 확인 모달 */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface-card rounded-2xl border border-border p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">전체 삭제</h3>
                  <p className="text-sm text-text-secondary">모든 기록이 영구 삭제됩니다</p>
                </div>
              </div>
              <p className="text-text-secondary mb-6">
                {history.length}개의 생성 기록이 모두 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 bg-surface-overlay text-text-primary rounded-lg hover:bg-surface-overlay/80 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    clearHistory();
                    setShowDeleteConfirm(false);
                  }}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  전체 삭제
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default History;
