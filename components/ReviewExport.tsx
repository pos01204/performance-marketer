
import React from 'react';
import type { Campaign, LanguageOutput, CrmLanguageOutput } from '../types';
import { CopyButton } from './CopyButton';
import { CopyIcon as CopyAllIcon, CheckIcon } from './Icons';

interface ReviewExportProps {
  campaign: Campaign;
  showToast: (message: string) => void;
}

export const ReviewExport: React.FC<ReviewExportProps> = ({ campaign, showToast }) => {
  const { name, strategy, socialContent, crmContent, sharedInfo } = campaign;

  const generateMarkdownReport = () => {
    let md = `# [Campaign] ${name}\n\n`;
    md += `**생성일:** ${new Date(campaign.createdAt).toLocaleString()}\n`;
    md += `**작품 URL:** ${sharedInfo.productUrl}\n\n`;

    if (strategy) {
      md += `## 1. 캠페인 전략 (Strategy)\n`;
      md += `- **타겟 시장:** ${strategy.selectedRegion === 'english' ? '북미(영어권)' : '일본어권'}\n`;
      md += `- **타겟 오디언스:** ${strategy.audience}\n`;
      md += `- **핵심 키워드:** ${strategy.keywords.join(', ')}\n`;
      md += `- **소구 포인트:**\n${strategy.angles.map(a => `  - ${a}`).join('\n')}\n\n`;
    }

    if (socialContent.result) {
      md += `## 2. 소셜 미디어 콘텐츠 (Social Media)\n`;
      const content = socialContent.result.marketingContent;
      const visuals = socialContent.result.visualStrategy;
      const langs = Object.keys(content) as Array<keyof LanguageOutput>;
      
      langs.forEach(lang => {
        md += `### ${lang.toUpperCase()}\n`;
        const platforms = content[lang];
        md += `**Meta (Instagram/Facebook)**\n${platforms.meta.caption}\n${platforms.meta.hashtags.map(h => h.startsWith('#')?h:'#'+h).join(' ')}\n\n`;
        md += `**X (Twitter)**\n${platforms.x.caption}\n${platforms.x.hashtags.map(h => h.startsWith('#')?h:'#'+h).join(' ')}\n\n`;
        
        if (visuals && visuals[lang]) {
             md += `**🎨 AI 선정 베스트 컷 (Visual Strategy)**\n`;
             md += `- 선정 이미지: Index ${visuals[lang].selectedImageIndex} (${sharedInfo.images[visuals[lang].selectedImageIndex]?.name || 'Unknown'})\n`;
             md += `- 선정 이유: ${visuals[lang].rationale}\n`;
             md += `- 카피 연결 포인트: ${visuals[lang].visualFocus}\n\n`;
        }
      });
    }

    if (crmContent.result) {
      md += `## 3. CRM 카피 (Push Notification)\n`;
      md += `- **목표:** ${crmContent.userInput.crmTrigger}\n`;
      const content = crmContent.result.crmContent;
      const langs = Object.keys(content) as Array<keyof CrmLanguageOutput>;

      langs.forEach(lang => {
        md += `### ${lang.toUpperCase()}\n`;
        content[lang].forEach((ver, idx) => {
             md += `**Option ${String.fromCharCode(65+idx)}**\n- Main: ${ver.mainCopy}\n- Sub: ${ver.subCopy}\n\n`;
        });
      });
      
      md += `### 추천 발송 시간\n`;
      crmContent.result.sendingTime.forEach(st => {
          md += `- ${st.region}: ${st.time} (${st.reason})\n`;
      });
    }

    return md;
  };

  const handleCopyAll = () => {
    const md = generateMarkdownReport();
    navigator.clipboard.writeText(md);
    showToast('전체 캠페인 내용이 마크다운 형식으로 복사되었습니다.');
  };

  const SectionCard: React.FC<{ title: string; children: React.ReactNode; isEmpty?: boolean }> = ({ title, children, isEmpty }) => (
    <div className={`rounded-lg p-6 border ${isEmpty ? 'bg-gray-800/50 border-gray-700 border-dashed' : 'bg-gray-800 border-gray-700 shadow-md'}`}>
      <h3 className="text-lg font-bold text-gray-200 mb-4 flex items-center gap-2">
        {isEmpty ? <span className="w-2 h-2 rounded-full bg-gray-500"/> : <CheckIcon />}
        {title}
      </h3>
      {isEmpty ? (
          <p className="text-gray-500 text-sm">아직 생성된 내용이 없습니다. 이전 탭에서 내용을 생성해주세요.</p>
      ) : (
          <div className="space-y-4">{children}</div>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-purple-900/60 to-gray-800 rounded-xl p-8 border border-purple-500/30 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">캠페인 최종 검토 및 내보내기</h2>
        <p className="text-gray-300 max-w-2xl mx-auto">
            생성된 모든 전략과 콘텐츠를 검토하고, 팀 공유나 결과 보고를 위해 클립보드로 복사하세요.
        </p>
        <button
            onClick={handleCopyAll}
            className="inline-flex items-center gap-2 bg-white text-purple-900 font-bold py-3 px-6 rounded-full hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
        >
            <CopyAllIcon />
            <span>전체 내용 복사하기 (Markdown)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
          {/* 1. Strategy Section */}
          <SectionCard title="1. 캠페인 전략 (Strategy)" isEmpty={!strategy}>
            {strategy && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-gray-700/50 p-3 rounded">
                        <span className="text-gray-400 block text-xs mb-1">타겟 시장</span>
                        <span className="text-white font-medium">{strategy.selectedRegion === 'english' ? '북미 (English)' : '일본 (Japanese)'}</span>
                    </div>
                    <div className="bg-gray-700/50 p-3 rounded">
                        <span className="text-gray-400 block text-xs mb-1">타겟 오디언스</span>
                        <span className="text-white">{strategy.audience}</span>
                    </div>
                     <div className="bg-gray-700/50 p-3 rounded md:col-span-2">
                        <span className="text-gray-400 block text-xs mb-1">핵심 키워드</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {strategy.keywords.map(k => <span key={k} className="bg-purple-900/50 text-purple-200 px-2 py-0.5 rounded text-xs">{k}</span>)}
                        </div>
                    </div>
                </div>
            )}
          </SectionCard>

          {/* 2. Social Content Section */}
          <SectionCard title="2. 소셜 콘텐츠 (Social Media & Visuals)" isEmpty={!socialContent.result}>
             {socialContent.result && (
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                     {(['korean', 'english', 'japanese'] as const).map(lang => (
                         <div key={lang} className="bg-gray-700/30 p-4 rounded border border-gray-600/50">
                             <h4 className="font-bold text-purple-300 mb-3 uppercase text-sm border-b border-gray-600 pb-2">{lang}</h4>
                             <div className="space-y-4">
                                 <div>
                                     <p className="text-xs text-gray-400 mb-1">Meta</p>
                                     <p className="text-sm text-gray-200 line-clamp-3">{socialContent.result?.marketingContent[lang].meta.caption}</p>
                                 </div>
                                 {socialContent.result?.visualStrategy && socialContent.result.visualStrategy[lang] && (
                                     <div className="bg-gray-800 p-2 rounded text-xs">
                                         <p className="text-purple-400 font-semibold mb-1">📸 AI 선정 베스트 컷</p>
                                         <p className="text-gray-300 mb-1">#{socialContent.result.visualStrategy[lang].selectedImageIndex}번 이미지 (Index)</p>
                                         <p className="text-gray-400 italic">"{socialContent.result.visualStrategy[lang].rationale}"</p>
                                     </div>
                                 )}
                             </div>
                         </div>
                     ))}
                 </div>
             )}
          </SectionCard>

          {/* 3. CRM Content Section */}
          <SectionCard title="3. CRM 카피 (Push Notification)" isEmpty={!crmContent.result}>
              {crmContent.result && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                     {(['korean', 'english', 'japanese'] as const).map(lang => (
                         <div key={lang} className="bg-gray-700/30 p-4 rounded border border-gray-600/50">
                             <h4 className="font-bold text-purple-300 mb-3 uppercase text-sm border-b border-gray-600 pb-2">{lang}</h4>
                             <div className="space-y-3">
                                 {crmContent.result?.crmContent[lang].map((opt, idx) => (
                                     <div key={idx} className="bg-gray-800 p-2 rounded">
                                         <p className="text-xs text-purple-400 font-semibold mb-1">Option {String.fromCharCode(65+idx)}</p>
                                         <p className="text-sm text-white font-medium mb-1">{opt.mainCopy}</p>
                                         <p className="text-xs text-gray-400">{opt.subCopy}</p>
                                     </div>
                                 ))}
                             </div>
                         </div>
                     ))}
                  </div>
              )}
          </SectionCard>
      </div>
    </div>
  );
};
