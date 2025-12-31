import { GoogleGenAI, Type } from "@google/genai";
import type { ContentFormat, Language, Platform, ImageFile, SocialContentResult } from '../types';
import { SEASONAL_EVENTS, HASHTAG_BLOCKLIST, HASHTAG_REQUIRED, HASHTAG_BY_CATEGORY } from '../constants';

// API 키 체크
const API_KEY = process.env.API_KEY || process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.warn("API_KEY 환경 변수가 설정되지 않았습니다.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || '' });

// 입력 타입
interface ContentGenerationInput {
  productUrl: string;
  images: ImageFile[];
  platforms: Platform[];
  languages: Language[];
  format: ContentFormat;
  tone: string;
  seasonalEvent: string | null;
  includeReasoning: boolean;
}

/**
 * 해시태그 필터링 함수
 * 금지된 해시태그를 제거하고 필수 해시태그를 추가합니다.
 */
function filterHashtags(hashtags: string[], language: Language, category?: string): string[] {
  const blocklist = new Set(HASHTAG_BLOCKLIST.map(h => h.toLowerCase()));
  const filtered: string[] = [];
  
  // 필수 브랜드 해시태그 추가
  const brandTags = HASHTAG_REQUIRED.brand[language] || [];
  const recommendedTags = HASHTAG_REQUIRED.recommended[language] || [];
  
  // 카테고리 해시태그 추가
  let categoryTags: string[] = [];
  if (category && HASHTAG_BY_CATEGORY[category as keyof typeof HASHTAG_BY_CATEGORY]) {
    categoryTags = HASHTAG_BY_CATEGORY[category as keyof typeof HASHTAG_BY_CATEGORY][language] || [];
  }
  
  // 필수 태그 먼저 추가
  brandTags.forEach(tag => {
    const formattedTag = tag.startsWith('#') ? tag : `#${tag}`;
    if (!filtered.includes(formattedTag)) {
      filtered.push(formattedTag);
    }
  });
  
  // AI 생성 해시태그 필터링
  for (const tag of hashtags) {
    const cleanTag = tag.replace(/^#/, '').toLowerCase();
    
    // 블랙리스트 체크
    if (blocklist.has(cleanTag)) {
      continue;
    }
    
    // 경쟁사 관련 태그 필터링 (부분 매칭)
    const competitorPatterns = ['etsy', 'minne', 'creema', 'amazon', 'ebay'];
    if (competitorPatterns.some(pattern => cleanTag.includes(pattern))) {
      continue;
    }
    
    const formattedTag = tag.startsWith('#') ? tag : `#${tag}`;
    if (!filtered.includes(formattedTag)) {
      filtered.push(formattedTag);
    }
  }
  
  // 권장 태그 추가 (최대 15개까지)
  [...recommendedTags.slice(0, 3), ...categoryTags.slice(0, 2)].forEach(tag => {
    if (filtered.length < 15) {
      const formattedTag = tag.startsWith('#') ? tag : `#${tag}`;
      if (!filtered.includes(formattedTag)) {
        filtered.push(formattedTag);
      }
    }
  });
  
  return filtered.slice(0, 15); // 최대 15개
}

/**
 * 프롬프트 생성
 */
function buildPrompt(input: ContentGenerationInput): string {
  const { productUrl, platforms, languages, tone, seasonalEvent, images, format } = input;
  
  const langMap: Record<Language, string> = {
    korean: '한국어',
    english: '영어 (미국)',
    japanese: '일본어',
  };

  const platformMap: Record<Platform, string> = {
    meta: '메타(인스타그램/페이스북)',
    x: 'X(트위터)',
  };
  
  const formatMap: Record<ContentFormat, string> = {
    feed: '일반 피드(단일 이미지)',
    carousel: '카드뉴스(슬라이드)',
    reels: '릴스/숏폼(영상 대본)'
  };

  const imageCount = images.length;

  // 시즌 컨텍스트
  let seasonalContext = "";
  if (seasonalEvent) {
    const event = SEASONAL_EVENTS.find(e => e.id === seasonalEvent);
    if (event) {
      seasonalContext = `
      **[⚡ SEASONAL KICK: ${event.label} (${event.emoji})]**
      현재는 **${event.label}** 시즌입니다. (타겟 지역: ${event.region})
      
      **작성 지침:**
      1. 이 제품을 **"이번 시즌 최고의 선물"** 또는 **"이 시즌에 꼭 필요한 아이템"**으로 포지셔닝하세요.
      2. 시즌 관련 키워드(${event.keywords.join(', ')})를 자연스럽게 녹여내세요.
      3. 고객이 "지금 안 사면 늦겠다"는 느낌을 받도록 유도하세요.
      `;
    }
  }

  // 포맷별 지침
  let formatInstructions = "";
  if (format === 'feed') {
    formatInstructions = `
    - **포맷:** 인스타그램 피드 (단일 이미지)
    - **길이 제한:** 공백 포함 **300자 이내** (엄격 준수)
    - **구조 (Mobile Optimized AIDA):**
      1. **Hook (한 줄):** 스크롤을 멈추게 하는 강력한 첫 문장
      2. **Body (핵심만):** 제품이 주는 '감정'과 '변화'를 2~3문장으로 압축
      3. **CTA (명확하게):** 프로필 링크 클릭이나 구매를 짧고 굵게 유도
    - 2문장마다 줄바꿈으로 가독성 확보
    `;
  } else if (format === 'carousel') {
    formatInstructions = `
    - **포맷:** 카드뉴스 (Carousel) - 슬라이드별 기획
    - **메인 캡션:** **200자 이내**
    - **슬라이드 텍스트:** 각 슬라이드의 'textOverlay'는 **15자 이내**
    - **구조 (Storytelling Flow):**
      - Slide 1 (Hook): 문제 제기 또는 시선 강탈
      - Slide 2~3 (Body): 공감 형성 및 해결책 제시
      - Slide 4 (CTA): 명확한 구매 유도
    `;
  } else if (format === 'reels') {
    formatInstructions = `
    - **포맷:** 릴스/숏폼 (15-30초 영상 대본)
    - **캡션:** **150자 이내**
    - **스타일:** 빠른 템포, 도파민 자극하는 비트감
    - **구조:**
      - 0-3초 (Hook): 시각적 충격 또는 ASMR로 이탈 방지
      - 3-10초 (Main): 제품의 핵심 매력 클로즈업
      - 10초+ (CTA): 만족감 표현 및 팔로우/구매 유도
    `;
  }

  // 해시태그 규칙 강조
  const hashtagRules = `
  **[해시태그 규칙 - 필수 준수]**
  1. **절대 금지:** etsy, etsyfinds, etsyseller, minne, creema, amazon 등 경쟁사 관련 태그
  2. **필수 포함 (브랜드):**
     - 한국어: #아이디어스, #핸드메이드
     - 영어: #idus, #handmade, #handcrafted
     - 일본어: #アイディアス, #ハンドメイド
  3. **권장 태그:** shopsmall, supportsmallbusiness, artisan, 작가작품, 온리원
  4. **해시태그 수:** 10-15개 권장
  `;

  return `
    당신은 **모바일 세대를 사로잡는 임팩트 지향 카피라이터**입니다.
    짧고 굵고 강렬한 문장으로 1초 안에 고객의 엄지손가락을 멈추게 합니다.

    **핵심 임무:**
    아이디어스(idus) 작품 이미지를 활용하여 **"${formatMap[format]}"** 형태의 세일즈 콘텐츠를 기획하고 카피를 작성하십시오.

    **[작업 입력 데이터]**
    - 제공된 이미지 수: 총 ${imageCount}장
    - 작품 URL: ${productUrl}
    - 톤앤매너: ${tone}

    **[핵심 규칙 1: Visual-Anchored Copywriting]**
    선택한 이미지의 시각적 요소(색감, 질감, 상황)를 카피에 직접 언급하세요.

    **[핵심 규칙 2: 현지화 (Transcreation)]**
    단순 번역 금지. 원어민이 쓴 것처럼 자연스럽게 작성하세요.

    ${seasonalContext}
    
    ${formatInstructions}

    ${hashtagRules}

    **[출력 요구사항]**
    - **언어:** ${languages.map(lang => langMap[lang]).join(', ')}
    - **플랫폼:** ${platforms.map(p => platformMap[p]).join(', ')}
    - 포맷(${format})에 맞는 구조로 작성

    **Output Format (JSON Only):**
    Use the provided schema strictly.
  `;
}

/**
 * JSON 스키마 생성
 */
function getResponseSchema(includeReasoning: boolean, format: ContentFormat) {
  // Feed Schema
  const captionBlockSchema = {
    type: Type.OBJECT,
    properties: {
      type: { type: Type.STRING, enum: ['feed'] },
      caption: { type: Type.STRING },
      hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["type", "caption", "hashtags"]
  };

  // Carousel Schema
  const carouselBlockSchema = {
    type: Type.OBJECT,
    properties: {
      type: { type: Type.STRING, enum: ['carousel'] },
      slides: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            slideNumber: { type: Type.INTEGER },
            visualDesc: { type: Type.STRING },
            textOverlay: { type: Type.STRING },
            caption: { type: Type.STRING }
          },
          required: ["slideNumber", "visualDesc", "textOverlay"]
        }
      },
      caption: { type: Type.STRING },
      hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["type", "slides", "caption", "hashtags"]
  };

  // Reels Schema
  const reelsBlockSchema = {
    type: Type.OBJECT,
    properties: {
      type: { type: Type.STRING, enum: ['reels'] },
      script: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            timestamp: { type: Type.STRING },
            visualAction: { type: Type.STRING },
            audio: { type: Type.STRING },
            caption: { type: Type.STRING }
          },
          required: ["timestamp", "visualAction", "audio", "caption"]
        }
      },
      caption: { type: Type.STRING },
      hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["type", "script", "caption", "hashtags"]
  };

  // Format에 따른 스키마 선택
  let contentSchema;
  if (format === 'carousel') contentSchema = carouselBlockSchema;
  else if (format === 'reels') contentSchema = reelsBlockSchema;
  else contentSchema = captionBlockSchema;

  const platformContentSchema = {
    type: Type.OBJECT,
    properties: {
      meta: contentSchema,
      x: contentSchema
    },
    required: ["meta", "x"]
  };

  const visualStrategySchema = {
    type: Type.OBJECT,
    properties: {
      selectedImageIndex: { type: Type.INTEGER },
      rationale: { type: Type.STRING },
      visualFocus: { type: Type.STRING }
    },
    required: ["selectedImageIndex", "rationale", "visualFocus"]
  };

  return {
    type: Type.OBJECT,
    properties: {
      marketingContent: {
        type: Type.OBJECT,
        properties: {
          korean: platformContentSchema,
          english: platformContentSchema,
          japanese: platformContentSchema,
        },
        required: ["korean", "english", "japanese"]
      },
      visualStrategy: {
        type: Type.OBJECT,
        properties: {
          korean: visualStrategySchema,
          english: visualStrategySchema,
          japanese: visualStrategySchema,
        },
        required: ["korean", "english", "japanese"]
      },
      ...(includeReasoning && { 
        reasoning: {
          type: Type.OBJECT,
          properties: {
            korean: { type: Type.STRING },
            english: { type: Type.STRING },
            japanese: { type: Type.STRING },
          }
        } 
      })
    },
    required: ["marketingContent", "visualStrategy"]
  };
}

/**
 * 콘텐츠 생성 메인 함수
 */
export async function generateContent(input: ContentGenerationInput): Promise<SocialContentResult> {
  const prompt = buildPrompt(input);
  const schema = getResponseSchema(input.includeReasoning, input.format);

  // 이미지 준비
  const imageParts = input.images.map(image => ({
    inlineData: {
      data: image.base64,
      mimeType: image.mimeType,
    },
  }));

  const textPart = { text: prompt };
  const parts = [textPart, ...imageParts];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.85,
        thinkingConfig: { thinkingBudget: 1024 } 
      }
    });

    let jsonText = response.text.trim();
    
    // JSON 파싱
    const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1];
    } else {
      const firstBrace = jsonText.indexOf('{');
      const lastBrace = jsonText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonText = jsonText.substring(firstBrace, lastBrace + 1);
      }
    }

    const parsedResponse: SocialContentResult = JSON.parse(jsonText);
    
    // 해시태그 필터링 적용
    const languages: Language[] = ['korean', 'english', 'japanese'];
    const platforms: Platform[] = ['meta', 'x'];
    
    for (const lang of languages) {
      for (const platform of platforms) {
        const content = parsedResponse.marketingContent?.[lang]?.[platform];
        if (content && content.hashtags) {
          content.hashtags = filterHashtags(content.hashtags, lang);
        }
      }
    }
    
    if (!input.includeReasoning) {
      parsedResponse.reasoning = null;
    }

    return parsedResponse;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("콘텐츠 생성 중 오류가 발생했습니다. 다시 시도해주세요.");
  }
}
