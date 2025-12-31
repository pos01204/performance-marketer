
import React, { useState } from 'react';
import type { TrendData, TrendAnalysisResult, AppliedStrategy, PlatformInsight, MediaRadarData } from '../types';
import { SpinnerIcon, SparklesIcon, LinkIcon, CheckIcon, DevicePhoneMobileIcon } from './Icons';
import { analyzeMediaTrends } from '../services/mediaService';

interface CrawlViewProps {
  onGenerateRequest: (url?: string) => void;
  trends: TrendData | null;
  isTrendsLoading: boolean;
  trendsError: string | null;
  analysisKeyword: string;
  setAnalysisKeyword: React.Dispatch<React.SetStateAction<string>>;
  isAnalyzing: boolean;
  analysisResult: TrendAnalysisResult | null;
  analysisError: string | null;
  onAnalysis: () => void;
  onApplyStrategy: (strategy: AppliedStrategy) => void;
}

// Visual helpers for metrics
const CompetitionBadge: React.FC<{ level: string }> = ({ level }) => {
    let colorClass = "bg-gray-700 text-gray-300";
    if (level === 'Low') colorClass = "bg-green-900/50 text-green-300 border-green-500/30";
    if (level === 'Medium') colorClass = "bg-yellow-900/50 text-yellow-300 border-yellow-500/30";
    if (level === 'High') colorClass = "bg-orange-900/50 text-orange-300 border-orange-500/30";
    if (level === 'Very High') colorClass = "bg-red-900/50 text-red-300 border-red-500/30";

    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${colorClass}`}>
            Comp: {level}
        </span>
    );
};

const ScoreGauge: React.FC<{ score: number }> = ({ score }) => {
    // Simple SVG gauge
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 10) * circumference;
    
    let color = "#a855f7"; // purple
    if (score >= 8) color = "#22c55e"; // green
    else if (score >= 5) color = "#eab308"; // yellow
    else color = "#ef4444"; // red

    return (
        <div className="relative flex items-center justify-center w-12 h-12">
            <svg className="transform -rotate-90 w-12 h-12">
                <circle cx="24" cy="24" r={radius} stroke="#374151" strokeWidth="4" fill="transparent" />
                <circle 
                    cx="24" cy="24" r={radius} 
                    stroke={color} 
                    strokeWidth="4" 
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                />
            </svg>
            <span className="absolute text-xs font-bold text-white">{score}</span>
        </div>
    );
};

// Helper to get platform colors
const getPlatformStyle = (name: string) => {
    switch(name) {
        case 'Etsy': return 'border-orange-500/50 from-orange-900/20 to-gray-800 text-orange-200';
        case 'Minne': return 'border-blue-400/50 from-blue-900/20 to-gray-800 text-blue-200';
        case 'Creema': return 'border-green-500/50 from-green-900/20 to-gray-800 text-green-200';
        default: return 'border-gray-600 from-gray-800 to-gray-800 text-gray-200';
    }
}

const ExecutiveSummary: React.FC<{ result: TrendAnalysisResult }> = ({ result }) => {
    const scores = [
        result.platformInsights.etsy.metrics.suitabilityScore,
        result.platformInsights.minne.metrics.suitabilityScore,
        result.platformInsights.creema.metrics.suitabilityScore,
    ];
    const avgScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
    
    // Find highest potential market
    const maxScore = Math.max(...scores);
    const bestPlatform = 
        maxScore === result.platformInsights.etsy.metrics.suitabilityScore ? 'Etsy (북미)' :
        maxScore === result.platformInsights.minne.metrics.suitabilityScore ? 'Minne (일본)' : 'Creema (일본)';

    return (
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 border border-purple-500/30 rounded-xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                <div className="flex-shrink-0 text-center">
                    <span className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Global Fit Score</span>
                    <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-purple-400">
                        {avgScore}
                        <span className="text-lg text-gray-500 font-medium">/10</span>
                    </div>
                </div>
                
                <div className="w-px h-16 bg-gray-700 hidden md:block"></div>
                
                <div className="flex-grow space-y-2">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <SparklesIcon />
                        종합 인사이트 (Executive Summary)
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                        현재 키워드는 <b>{bestPlatform}</b>에서 가장 높은 성공 잠재력을 보입니다. 
                        {Number(avgScore) > 7 
                            ? " 전반적인 시장 수요가 높아 즉시 진출을 권장합니다." 
                            : " 틈새 시장(Niche)을 공략하거나 차별화된 비주얼 전략이 필요합니다."}
                    </p>
                </div>
            </div>
        </div>
    )
}

const PlatformCard: React.FC<{ 
    insight: PlatformInsight; 
    onApply: () => void;
}> = ({ insight, onApply }) => {
    const styleClass = getPlatformStyle(insight.platformName);

    return (
        <div className={`flex flex-col h-full rounded-xl border bg-gradient-to-br ${styleClass} p-0 shadow-lg transition-all hover:scale-[1.01] relative overflow-hidden group`}>
            
            {/* Header Area */}
            <div className="p-5 pb-3 border-b border-white/5 flex justify-between items-center relative z-10 bg-black/20">
                <div>
                    <h3 className="text-xl font-bold tracking-tight text-white">{insight.platformName}</h3>
                    <p className="text-xs opacity-70">
                        {insight.platformName === 'Etsy' ? 'North America / Global' : 'Japan Market'}
                    </p>
                </div>
                <div className="flex flex-col items-center">
                    <ScoreGauge score={insight.metrics.suitabilityScore} />
                    <span className="text-[9px] opacity-70 mt-1 uppercase tracking-wide">Fit Score</span>
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 gap-px bg-white/5 border-b border-white/5">
                <div className="p-3 text-center border-r border-white/5">
                    <span className="block text-[10px] uppercase opacity-50 mb-0.5">Avg. Price</span>
                    <span className="block text-sm font-semibold text-white">{insight.metrics.averagePrice}</span>
                </div>
                <div className="p-3 text-center">
                    <span className="block text-[10px] uppercase opacity-50 mb-0.5">Volume</span>
                    <span className="block text-sm font-semibold text-white">{insight.metrics.searchVolume}</span>
                </div>
            </div>

            {/* Content Body */}
            <div className="p-5 space-y-5 flex-grow relative z-10">
                
                {/* Visual & Keywords */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-wider opacity-60">Mood & Keywords</span>
                        <CompetitionBadge level={insight.metrics.competition} />
                    </div>
                    <p className="text-sm leading-snug opacity-90 italic">"{insight.visualStyle}"</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {insight.trendingKeywords.slice(0, 4).map(kw => (
                            <span key={kw} className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-medium border border-white/5">{kw}</span>
                        ))}
                    </div>
                </div>

                {/* Strategy Section */}
                <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                    <div className="flex items-start gap-2 mb-1">
                        <span className="text-lg">🚀</span>
                        <span className="text-xs font-bold uppercase tracking-wider opacity-80 pt-1">Idus Action Plan</span>
                    </div>
                    <p className="text-xs leading-relaxed opacity-90 text-white">{insight.idusStrategy}</p>
                </div>
            </div>

            {/* Footer Action */}
            <div className="p-4 pt-0 mt-auto relative z-10">
                <button 
                    onClick={onApply}
                    className={`w-full py-3 rounded-lg font-bold text-sm shadow-md transition-all flex justify-center items-center gap-2
                        ${insight.platformName === 'Etsy' ? 'bg-orange-600 hover:bg-orange-500 text-white' : ''}
                        ${insight.platformName === 'Minne' ? 'bg-blue-600 hover:bg-blue-500 text-white' : ''}
                        ${insight.platformName === 'Creema' ? 'bg-green-600 hover:bg-green-500 text-white' : ''}
                    `}
                >
                    <CheckIcon /> 
                    {insight.platformName} 전략 채택하기
                </button>
            </div>
        </div>
    );
};

const MediaRadarView: React.FC<{
    keyword: string;
    isActive: boolean;
}> = ({ keyword, isActive }) => {
    const [mediaData, setMediaData] = useState<MediaRadarData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    React.useEffect(() => {
        if (isActive && keyword && !mediaData && !isLoading) {
            const fetchMedia = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const data = await analyzeMediaTrends(keyword);
                    setMediaData(data);
                } catch (e) {
                    setError("미디어 데이터를 불러오는 데 실패했습니다.");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchMedia();
        }
    }, [isActive, keyword]);

    if (!keyword) return <div className="text-center text-gray-500 py-10">먼저 키워드를 분석해주세요.</div>;
    if (isLoading) return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <SpinnerIcon />
            <p className="text-sm text-gray-400">YouTube 및 검색 트렌드를 실시간 분석 중입니다...</p>
        </div>
    );
    if (error) return <div className="text-red-400 text-center py-10">{error}</div>;
    if (!mediaData) return null;

    return (
        <div className="space-y-8 animate-fade-in">
             <div className="bg-gradient-to-r from-red-900/40 to-gray-800 border border-red-500/30 rounded-xl p-6 relative overflow-hidden">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-red-500">▶</span> YouTube 바이럴 영상 (Viral Radar)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mediaData.viralVideos.map((video, idx) => (
                        <a key={idx} href={video.url} target="_blank" rel="noopener noreferrer" className="group bg-gray-900 rounded-lg overflow-hidden border border-gray-700 hover:border-red-500/50 transition-all hover:scale-[1.02]">
                            <div className="aspect-video bg-black relative">
                                <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute top-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded font-bold backdrop-blur-sm">
                                    {video.viewCount}
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg">▶</div>
                                </div>
                            </div>
                            <div className="p-3">
                                <h4 className="text-sm font-bold text-gray-100 line-clamp-2 mb-2 group-hover:text-red-400 transition-colors">{video.title}</h4>
                                <div className="bg-gray-800 p-2 rounded text-[11px] text-gray-400 italic border border-gray-700">
                                    <span className="text-red-400 font-bold not-italic">Viral Hook: </span>
                                    {video.viralHook}
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <span>📈</span> 급상승 검색어 (Breakout Keywords)
                </h3>
                <div className="flex flex-wrap gap-4">
                    {mediaData.risingKeywords.map((item, idx) => (
                        <div key={idx} className="bg-gray-700/50 hover:bg-gray-700 px-4 py-3 rounded-lg border border-gray-600 transition-colors cursor-default">
                             <div className="flex items-center gap-2 mb-1">
                                 <span className="text-sm font-bold text-white">{item.keyword}</span>
                                 <span className="text-[10px] bg-green-900/50 text-green-300 px-1.5 py-0.5 rounded border border-green-500/30">{item.growth}</span>
                             </div>
                             <p className="text-xs text-gray-400">{item.context}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export const CrawlView: React.FC<CrawlViewProps> = ({ 
    onGenerateRequest, 
    trends,
    isTrendsLoading,
    trendsError,
    analysisKeyword,
    setAnalysisKeyword,
    isAnalyzing,
    analysisResult,
    analysisError,
    onAnalysis,
    onApplyStrategy
}) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeTab, setActiveTab] = useState<'market' | 'media'>('market');

  const handleApplyStrategy = (insight: PlatformInsight) => {
      const region = insight.platformName === 'Etsy' ? 'english' : 'japanese';
      onApplyStrategy({
          selectedRegion: region,
          keywords: insight.trendingKeywords,
          angles: [insight.idusStrategy, insight.competitorBenchmarking], 
          audience: insight.platformName === 'Etsy' ? 'North American Handmade Lovers' : 'Japanese Craft Enthusiasts'
      });
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Search Section */}
      <div className="bg-gray-800 rounded-lg p-6 shadow-md border border-gray-700">
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-white">
            <SparklesIcon />
            글로벌 핸드메이드 마켓 인텔리전스 (Market Intelligence)
        </h2>
        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
           키워드 하나만 입력하세요. <b>Etsy, Minne, Creema</b> 3대 마켓 데이터와 <b>YouTube 실시간 트렌드</b>를 분석하여<br/>
           경쟁 강도, 가격대, 그리고 지금 뜨는 바이럴 소재를 발굴해드립니다.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-grow relative">
                <input
                    type="text"
                    value={analysisKeyword}
                    onChange={(e) => setAnalysisKeyword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && onAnalysis()}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 pl-11"
                    placeholder="분석할 작품 키워드 입력 (예: 자개 폰케이스, 뜨개 가방)"
                    disabled={isAnalyzing}
                />
                <div className="absolute left-3 top-3.5 text-gray-400">
                    <SparklesIcon />
                </div>
            </div>
            <button
                onClick={onAnalysis}
                disabled={isAnalyzing || !analysisKeyword.trim()}
                className="w-full sm:w-auto min-w-[140px] flex justify-center items-center gap-2 bg-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
                {isAnalyzing ? <SpinnerIcon /> : <span>시장 데이터 분석</span>}
            </button>
        </div>
      </div>

      {/* Analysis Results */}
      <div className="min-h-[10rem]">
            {isAnalyzing && (
                <div className="flex flex-col items-center justify-center py-12 space-y-6">
                    <div className="relative w-20 h-20">
                         <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-700 rounded-full"></div>
                         <div className="absolute top-0 left-0 w-full h-full border-4 border-purple-500 rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <div className="text-center space-y-1">
                        <p className="text-lg font-bold text-white">글로벌 마켓 및 미디어 데이터를 수집 중입니다...</p>
                        <p className="text-sm text-gray-400">Google Search Grounding • YouTube Trends • Market Data</p>
                    </div>
                </div>
            )}
            
            {analysisError && (
                 <div className="bg-red-900/20 border border-red-500/50 p-6 rounded-lg text-center">
                     <p className="text-red-200 font-bold mb-1">분석 중 오류가 발생했습니다.</p>
                     <p className="text-sm text-red-300/80">{analysisError}</p>
                 </div>
            )}

            {analysisResult && !isAnalyzing && (
                <div className="animate-fade-in">
                    {/* View Tabs */}
                    <div className="flex gap-2 mb-6 border-b border-gray-700 pb-1">
                         <button 
                            onClick={() => setActiveTab('market')}
                            className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors border-b-2 ${activeTab === 'market' ? 'text-white border-purple-500 bg-gray-800' : 'text-gray-400 border-transparent hover:text-gray-200'}`}
                         >
                             📊 마켓 인텔리전스 (Platforms)
                         </button>
                         <button 
                            onClick={() => setActiveTab('media')}
                            className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${activeTab === 'media' ? 'text-white border-red-500 bg-gray-800' : 'text-gray-400 border-transparent hover:text-gray-200'}`}
                         >
                             <span>📡</span> 미디어 레이더 (YouTube/Search)
                         </button>
                    </div>

                    {activeTab === 'market' ? (
                        <div className="space-y-8 animate-fade-in">
                            <ExecutiveSummary result={analysisResult} />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {analysisResult.platformInsights && (
                                    <>
                                        <PlatformCard 
                                            insight={analysisResult.platformInsights.etsy} 
                                            onApply={() => handleApplyStrategy(analysisResult.platformInsights.etsy)}
                                        />
                                        <PlatformCard 
                                            insight={analysisResult.platformInsights.minne} 
                                            onApply={() => handleApplyStrategy(analysisResult.platformInsights.minne)}
                                        />
                                        <PlatformCard 
                                            insight={analysisResult.platformInsights.creema} 
                                            onApply={() => handleApplyStrategy(analysisResult.platformInsights.creema)}
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        <MediaRadarView keyword={analysisKeyword} isActive={activeTab === 'media'} />
                    )}

                    {/* Grounding Sources (Common) */}
                    {activeTab === 'market' && analysisResult.sources && analysisResult.sources.length > 0 && (
                        <div className="bg-gray-800 p-5 rounded-lg border border-gray-700/50 mt-8">
                            <h4 className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                                <LinkIcon />
                                <span>참조한 데이터 출처 (Reference Sources)</span>
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {analysisResult.sources.map((source, idx) => (
                                    <a key={idx} href={source.uri} target="_blank" rel="noopener noreferrer" className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded transition-colors flex items-center gap-2 max-w-[300px] truncate border border-gray-600">
                                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                        <span className="truncate">{source.title}</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
      </div>

      {/* Quick Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Trending Keywords (Static/Cached) */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
             <h3 className="text-md font-bold text-gray-200 mb-4">🌍 국가별 인기 키워드 (Hot Keywords)</h3>
             {isTrendsLoading ? (
                 <div className="py-4 text-center"><SpinnerIcon /></div>
             ) : trends ? (
                 <div className="space-y-4">
                     <div>
                         <span className="text-xs text-orange-400 font-semibold mb-2 block uppercase tracking-wider">🇺🇸 North America</span>
                         <div className="flex flex-wrap gap-2">
                             {trends.english.map(t => (
                                 <span key={t.keyword} className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded hover:bg-orange-900/50 hover:text-orange-200 cursor-default transition-colors border border-gray-600" title={t.description}>#{t.keyword}</span>
                             ))}
                         </div>
                     </div>
                     <div>
                         <span className="text-xs text-blue-400 font-semibold mb-2 block uppercase tracking-wider">🇯🇵 Japan</span>
                         <div className="flex flex-wrap gap-2">
                             {trends.japanese.map(t => (
                                 <span key={t.keyword} className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded hover:bg-blue-900/50 hover:text-blue-200 cursor-default transition-colors border border-gray-600" title={t.description}>#{t.keyword}</span>
                             ))}
                         </div>
                     </div>
                 </div>
             ) : (
                 <p className="text-xs text-gray-500">데이터 로딩 중...</p>
             )}
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 flex flex-col justify-between">
              <div>
                <h3 className="text-md font-bold text-gray-200 mb-2">⚡ 바로 가기</h3>
                <p className="text-sm text-gray-400 mb-4">
                    이미 분석된 전략이나 URL이 있다면 분석 과정을 건너뛰고 바로 콘텐츠 생성을 시작할 수 있습니다.
                </p>
              </div>
              <div className="space-y-3">
                   <div className="flex gap-2">
                       <input 
                            type="text" 
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                            placeholder="작품 URL 입력..."
                            className="flex-grow bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-gray-200 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                       />
                       <button 
                            onClick={() => onGenerateRequest(searchKeyword)}
                            className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm font-bold transition-colors"
                        >
                           이동
                       </button>
                   </div>
                   <button
                        onClick={() => onGenerateRequest()}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2.5 rounded text-sm font-bold hover:opacity-90 transition-opacity shadow-md"
                   >
                        소셜 콘텐츠 생성 탭으로 바로 가기
                   </button>
              </div>
          </div>
      </div>
    </div>
  );
};
