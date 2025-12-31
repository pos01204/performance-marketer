import { GoogleGenAI, Type } from "@google/genai";
import type { CrmTrigger, TargetRegion, ImageFile, CrmContentResult, CrmType } from '../types';
import { CRM_TRIGGER_OPTIONS, CRM_VARIABLE_OPTIONS, TARGET_REGION_OPTIONS } from "../constants";

// API 키 체크
const API_KEY = process.env.API_KEY || process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.warn("API_KEY 환경 변수가 설정되지 않았습니다.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || '' });

// 기존 CRM 입력 타입 (레거시 지원)
interface CrmGenerationInput {
  // 기본
  productUrl?: string;
  images: ImageFile[];
  landingPage: string;
  targetRegion: TargetRegion;
  crmTrigger: CrmTrigger;
  selectedVariables: string[];
  additionalInfo?: {
    discountInfo?: string;
    benefitInfo?: string;
  };
  // 확장 옵션
  crmType?: CrmType;
  exhibitionUrl?: string;
  exhibitionTitle?: string;
  artistUrl?: string;
  artistName?: string;
}

// 새로운 CRM 입력 타입 (CrmGenerator 컴포넌트용)
interface NewCrmGenerationInput {
  trigger: string;
  region: string;
  variables: string[];
  productInfo?: Array<{
    title: string;
    price: number;
    artistName: string;
    url: string;
  }> | null;
  customUrl?: string;
  additionalInfo?: Record<string, string>;
  images?: Array<{
    name: string;
    base64: string;
    mimeType: string;
    url?: string;
  }>;
  crmType: string;
}

/**
 * 옵션 레이블 찾기
 */
function getLabel(options: readonly { id: string; label: string }[], id: string): string {
  return options.find(option => option.id === id)?.label || id;
}

/**
 * 트리거별 컨텍스트
 */
function getTriggerContext(triggerId: CrmTrigger): string {
  switch (triggerId) {
    case 'welcome_series':
      return "상황: 고객이 방금 회원가입을 완료했습니다. \n목표: 첫 구매에 대한 기대감을 주고, 신규 가입 혜택 사용을 유도합니다.";
    case 'cart_abandonment':
      return "상황: 고객이 상품을 장바구니에 담았으나 결제하지 않고 앱을 종료했습니다. (발생 1시간 후) \n목표: 상품의 매력이나 재고 부족(긴급성)을 상기시켜 구매를 완료하게 합니다.";
    case 'browse_abandonment':
      return "상황: 고객이 특정 상품 상세페이지를 여러 번 조회했으나 장바구니에 담지 않았습니다. \n목표: 고객이 고민하는 이유(가격, 확신 등)를 해소하거나 관심을 다시 환기합니다.";
    case 'post_purchase':
      return "상황: 고객이 주문한 상품 배송이 완료되었습니다. \n목표: 구매 확정과 리뷰 작성을 정중하게 요청하여 포인트 혜택을 알립니다.";
    case 'win_back':
      return "상황: 기존 우수 고객이 30일 이상 방문하지 않았습니다. \n목표: '잊혀진' 관계를 회복하기 위해 특별한 혜택이나 안부 인사를 건넵니다.";
    default:
      return "상황: 일반적인 마케팅 프로모션입니다.";
  }
}

/**
 * CRM 타입별 추가 컨텍스트
 */
function getCrmTypeContext(input: CrmGenerationInput): string {
  const { crmType, exhibitionUrl, exhibitionTitle, artistUrl, artistName, productUrl } = input;

  if (crmType === 'exhibition' && exhibitionUrl) {
    return `
    **[기획전 기반 CRM]**
    - 기획전 URL: ${exhibitionUrl}
    - 기획전명: ${exhibitionTitle || '특별 기획전'}
    - 포커스: 기획전의 테마와 참여 혜택을 강조하세요.
    - 기획전 전체 상품이 아닌 "큐레이션"의 가치를 어필하세요.
    `;
  }

  if (crmType === 'artist' && artistUrl) {
    return `
    **[작가 홈 기반 CRM]**
    - 작가 홈 URL: ${artistUrl}
    - 작가명: ${artistName || '인기 작가'}
    - 포커스: 작가의 스토리와 작품 세계관을 강조하세요.
    - "이 작가의 다른 작품도 구경해보세요" 형태로 유도하세요.
    `;
  }

  // 기본: 작품 기반
  return `
  **[작품 기반 CRM]**
  - 작품 URL: ${productUrl || '선택된 작품'}
  - 포커스: 해당 작품의 구매를 직접적으로 유도하세요.
  - 작품의 독창성, 한정성, 장인정신을 강조하세요.
  `;
}

/**
 * CRM 프롬프트 생성
 */
function buildCrmPrompt(input: CrmGenerationInput): string {
  const { 
    targetRegion, 
    crmTrigger,
    selectedVariables,
    additionalInfo,
  } = input;
  
  const targetRegionLabel = getLabel(TARGET_REGION_OPTIONS, targetRegion);
  const triggerLabel = getLabel(CRM_TRIGGER_OPTIONS, crmTrigger);
  const triggerContext = getTriggerContext(crmTrigger);
  const crmTypeContext = getCrmTypeContext(input);
  
  // 변수 토큰
  const variableTokens = CRM_VARIABLE_OPTIONS.filter(v => selectedVariables.includes(v.id)).map(v => v.token);
  const variablesInstruction = variableTokens.length > 0 
    ? `**필수 포함 변수:** 다음 변수들을 자연스럽게 포함하세요: ${variableTokens.join(', ')}`
    : '변수를 포함하지 마세요.';

  const benefitText = additionalInfo?.benefitInfo ? `- 제공 혜택: ${additionalInfo.benefitInfo}` : '';
  const discountText = additionalInfo?.discountInfo ? `- 할인/쿠폰 정보: ${additionalInfo.discountInfo}` : '';

  return `
    당신은 글로벌 이커머스 플랫폼의 **Top-tier CRM Growth Hacker**입니다. 
    단순한 알림이 아니라, 고객의 심리를 꿰뚫어 클릭하지 않고는 못 배기게 만드는 **'후킹(Hooking)' 메시지**를 작성합니다.

    **[핵심 작성 기법]**
    1. **Curiosity Gap (호기심 격차):** 클릭해야만 알 수 있는 정보의 공백을 만드세요.
       - Bad: "30% 할인을 받으세요."
       - Good: "회원님만을 위한 시크릿 혜택이 도착했습니다. (3시간 뒤 만료)"
    
    2. **Loss Aversion (손실 회피):** 놓치는 고통을 자극하세요.
       - Bad: "장바구니 상품을 구매하세요."
       - Good: "장바구니에 담은 상품이 곧 품절될 수 있습니다."
    
    3. **Personalization (개인화):** 변수를 1:1 대화처럼 자연스럽게 녹이세요.

    ${crmTypeContext}

    **[캠페인 설정]**
    - **트리거:** ${triggerLabel} (${triggerContext})
    - **타겟:** ${targetRegionLabel}
    - ${variablesInstruction}
    ${benefitText}
    ${discountText}

    **[작성 가이드라인]**
    - **길이 제한 엄수:**
      - 메인 카피: 15자 이내 (한국어), 핵심 훅(Hook)을 맨 앞에
      - 서브 카피: 35자 이내 (한국어), 행동 유도(CTA)
    - **언어:** 한국어, 영어, 일본어 (단순 번역 금지, 문화적 맥락 반영)

    **[A/B 테스트 결과물]**
    - **A안 (감성형):** 감성적이고 관계 지향적인 톤
    - **B안 (긴급형):** 혜택과 긴급성 중심

    **Output Format (JSON Only):**
  `;
}

/**
 * JSON 스키마 생성
 */
function getCrmResponseSchema() {
  const crmCopySchema = {
    type: Type.OBJECT,
    properties: {
      mainCopy: { type: Type.STRING, description: "15자 이내 메인 카피" },
      subCopy: { type: Type.STRING, description: "35자 이내 서브 카피" }
    },
    required: ["mainCopy", "subCopy"]
  };

  const crmContentSchema = {
    type: Type.OBJECT,
    properties: {
      korean: { type: Type.ARRAY, items: crmCopySchema },
      english: { type: Type.ARRAY, items: crmCopySchema },
      japanese: { type: Type.ARRAY, items: crmCopySchema }
    },
    required: ["korean", "english", "japanese"]
  };

  const sendingTimeSchema = {
    type: Type.OBJECT,
    properties: {
      region: { type: Type.STRING, enum: ['North America', 'Japan'] },
      time: { type: Type.STRING },
      reason: { type: Type.STRING }
    },
    required: ["region", "time", "reason"]
  };
  
  return {
    type: Type.OBJECT,
    properties: {
      crmContent: crmContentSchema,
      sendingTime: {
        type: Type.ARRAY,
        items: sendingTimeSchema
      }
    },
    required: ["crmContent", "sendingTime"]
  };
}

/**
 * CRM 카피 생성 메인 함수 (레거시)
 */
export async function generateCrmCopyLegacy(input: CrmGenerationInput): Promise<CrmContentResult> {
  const prompt = buildCrmPrompt(input);
  const schema = getCrmResponseSchema();

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
        temperature: 0.8,
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

    const parsedResponse: CrmContentResult = JSON.parse(jsonText);
    
    return parsedResponse;
  } catch (error) {
    console.error("Error calling Gemini API for CRM copy:", error);
    throw new Error("CRM 카피 생성 중 오류가 발생했습니다. 다시 시도해주세요.");
  }
}

/**
 * 새로운 CRM 카피 생성 함수 (CrmGenerator 컴포넌트용)
 */
export async function generateCrmCopy(input: NewCrmGenerationInput): Promise<any> {
  const { trigger, region, variables, productInfo, customUrl, additionalInfo, images, crmType } = input;

  // 권역 레이블
  const regionLabel = region === 'north_america' ? '북미 (English)' : '일본 (日本語)';
  const language = region === 'north_america' ? 'English' : '日本語';

  // 트리거 레이블
  const triggerOption = CRM_TRIGGER_OPTIONS.find(t => t.id === trigger);
  const triggerLabel = triggerOption?.label || trigger;
  const triggerDesc = triggerOption?.description || '';

  // 상품 정보 텍스트
  let productContext = '';
  if (productInfo && productInfo.length > 0) {
    productContext = productInfo.map((p, i) => 
      `${i + 1}. ${p.title} (${p.price.toLocaleString()}원) - ${p.artistName}`
    ).join('\n');
  }

  // CRM 타입별 컨텍스트
  let typeContext = '';
  if (crmType === 'exhibition') {
    typeContext = `기획전 URL: ${customUrl}\n기획전의 테마와 참여 혜택을 강조하세요.`;
  } else if (crmType === 'artist') {
    typeContext = `작가 홈 URL: ${customUrl}\n작가의 스토리와 작품 세계관을 강조하세요.`;
  } else {
    typeContext = `선택된 작품:\n${productContext}\n작품의 독창성과 한정성을 강조하세요.`;
  }

  // 변수 토큰
  const variableTokens = CRM_VARIABLE_OPTIONS.filter(v => variables.includes(v.id)).map(v => v.token);

  // 추가 정보
  const discountInfo = additionalInfo?.discount || '';
  const benefitInfo = additionalInfo?.benefit || '';

  const prompt = `
    당신은 글로벌 이커머스 플랫폼 'idus'의 **Top-tier CRM Growth Hacker**입니다.
    고객의 심리를 꿰뚫어 클릭하지 않고는 못 배기게 만드는 **'후킹(Hooking)' 메시지**를 작성합니다.

    **[CRM 타입]**
    ${typeContext}

    **[캠페인 설정]**
    - 트리거: ${triggerLabel} - ${triggerDesc}
    - 타겟 권역: ${regionLabel}
    - 개인화 변수: ${variableTokens.length > 0 ? variableTokens.join(', ') : '없음'}
    ${discountInfo ? `- 할인/혜택: ${discountInfo}` : ''}
    ${benefitInfo ? `- 가입 혜택: ${benefitInfo}` : ''}

    **[작성 가이드라인]**
    1. **Curiosity Gap**: 클릭해야만 알 수 있는 정보의 공백을 만드세요.
    2. **Loss Aversion**: 놓치는 고통을 자극하세요.
    3. **Personalization**: 변수를 1:1 대화처럼 자연스럽게 녹이세요.

    **[출력 요구사항]**
    - 언어: ${language}
    - 푸시 알림 제목: 15자 이내 (핵심 훅)
    - 푸시 알림 본문: 35자 이내 (행동 유도)
    - 인앱 메시지: 50자 이내
    - 이메일 제목: 30자 이내
    - 이메일 본문: 100자 이내
    - 권장 발송 시간: 해당 권역의 최적 시간대

    **Output Format (JSON):**
    {
      "pushTitle": "푸시 제목",
      "pushBody": "푸시 본문",
      "inAppMessage": "인앱 메시지",
      "emailSubject": "이메일 제목",
      "emailBody": "이메일 본문",
      "recommendedTime": "권장 발송 시간 (예: 오전 10시-12시)"
    }
  `;

  // 이미지 파트 준비
  const imageParts = (images || [])
    .filter(img => img.base64)
    .map(image => ({
      inlineData: {
        data: image.base64,
        mimeType: image.mimeType,
      },
    }));

  const textPart = { text: prompt };
  const parts = imageParts.length > 0 ? [textPart, ...imageParts] : [textPart];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: parts },
      config: {
        responseMimeType: "application/json",
        temperature: 0.8,
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

    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error calling Gemini API for CRM copy:", error);
    throw new Error("CRM 카피 생성 중 오류가 발생했습니다. 다시 시도해주세요.");
  }
}
