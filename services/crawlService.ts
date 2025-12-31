
import { GoogleGenAI, Type } from "@google/genai";
import type { TrendData } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY 환경 변수가 설정되지 않았습니다.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const buildCrawlPrompt = () => {
  return `
    You are a global trend spotter specializing in handmade goods, crafts, and design products.
    Identify 4 distinct, currently trending keywords or themes for the **North American (English)** market and 4 for the **Japanese** market.
    
    Focus on specific niches relevant to a handmade marketplace like:
    - Jewelry & Accessories
    - Home Decor & Living
    - Stationery & Art
    - Fashion items

    For each trend:
    1. **keyword**: The English or Japanese term used in that market.
    2. **koreanKeyword**: The Korean translation or equivalent term.
    3. **description**: A very brief description (under 20 characters) in Korean explaining the trend.

    Ensure the trends are current and diverse.
    Output strict JSON.
  `;
};

const getCrawlSchema = () => {
    const trendItemSchema = {
        type: Type.OBJECT,
        properties: {
            keyword: { type: Type.STRING, description: "현지 트렌드 키워드 (영어 또는 일본어)" },
            koreanKeyword: { type: Type.STRING, description: "한국어 번역/대응 키워드" },
            description: { type: Type.STRING, description: "20자 이내의 짧은 설명 (한국어)" }
        },
        required: ["keyword", "koreanKeyword", "description"]
    };

    return {
        type: Type.OBJECT,
        properties: {
            english: {
                type: Type.ARRAY,
                items: trendItemSchema,
                description: "북미(영어권) 트렌드 목록 4개"
            },
            japanese: {
                type: Type.ARRAY,
                items: trendItemSchema,
                description: "일본 트렌드 목록 4개"
            }
        },
        required: ["english", "japanese"]
    };
};

export const getTrendingKeywords = async (): Promise<TrendData> => {
  const prompt = buildCrawlPrompt();
  const schema = getCrawlSchema();

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
            temperature: 0.7,
        }
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error calling Gemini API for trending keywords:", error);
    // Fallback to static data in case of API failure to prevent UI breakage
    return {
        english: [
          { keyword: 'Cottagecore', koreanKeyword: '코티지코어', description: '전원풍의 따뜻한 감성' },
          { keyword: 'Personalized Jewelry', koreanKeyword: '각인 주얼리', description: '나만의 맞춤 액세서리' },
          { keyword: 'Sustainable', koreanKeyword: '제로웨이스트', description: '친환경/재활용 소재' },
          { keyword: 'Y2K Aesthetic', koreanKeyword: 'Y2K 감성', description: '2000년대 레트로 스타일' },
        ],
        japanese: [
          { keyword: '推し活', koreanKeyword: '최애 굿즈', description: '아이돌/캐릭터 덕질' },
          { keyword: '淡色女子', koreanKeyword: '파스텔 감성', description: '베이지/연한 색감 코디' },
          { keyword: 'スマホショルダー', koreanKeyword: '폰 스트랩', description: '핸즈프리 폰케이스' },
          { keyword: '韓国インテリア', koreanKeyword: '한국 인테리어', description: '모던하고 감성적인 소품' },
        ],
    };
  }
};
