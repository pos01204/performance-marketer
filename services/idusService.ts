import type { IdusProduct, ProductSearchParams } from '../types';

// 페이지당 아이템 수
export const ITEMS_PER_PAGE = 24;

// Railway 백엔드 API URL (환경변수에서 가져옴)
const CRAWLER_API_URL = import.meta.env.VITE_CRAWLER_API_URL || '';

// Vercel API URL (fallback - 같은 도메인의 /api 사용)
const VERCEL_API_URL = import.meta.env.VITE_API_URL || '';

// 환경변수 확인 로그 (개발 시 도움)
console.log('환경변수 확인:', {
  CRAWLER_API_URL: CRAWLER_API_URL || '(미설정)',
  VERCEL_API_URL: VERCEL_API_URL || '(미설정, 같은 도메인 사용)',
});

/**
 * 작품 검색 결과 타입 (페이지네이션 포함)
 */
export interface SearchResultWithPagination {
  products: IdusProduct[];
  hasMore: boolean;
  totalCount: number;
  page: number;
}

/**
 * 작품 검색 (페이지네이션 포함) - 메인 함수
 */
export async function searchProductsWithPagination(params: ProductSearchParams): Promise<SearchResultWithPagination> {
  const { keyword, page = 1, sort = 'popular' } = params;

  if (!keyword || keyword.trim().length === 0) {
    throw new Error('검색어를 입력해주세요');
  }

  const trimmedKeyword = keyword.trim();

  // 1. Railway 백엔드 API 시도 (playwright-stealth 사용)
  if (CRAWLER_API_URL) {
    console.log(`Railway API 호출 시도: ${CRAWLER_API_URL}/api/search`);
    try {
      const result = await searchViaRailwayApi(trimmedKeyword, sort, page);
      if (result.products.length > 0) {
        console.log(`✅ Railway API 성공: ${result.products.length}개 상품`);
        return result;
      }
      console.log('Railway API 결과 없음');
    } catch (error) {
      console.error('❌ Railway API 호출 실패:', error);
    }
  } else {
    console.log('Railway API URL 미설정 (VITE_CRAWLER_API_URL)');
  }

  // 2. Vercel API 시도 (fallback)
  try {
    const result = await searchViaVercelApi(trimmedKeyword, sort, page);
    if (result.products.length > 0) {
      console.log(`Vercel API 성공: ${result.products.length}개 상품`);
      return result;
    }
    console.log('Vercel API 결과 없음');
  } catch (error) {
    console.error('Vercel API 호출 실패:', error);
  }

  // 3. 모든 API 실패 시 Mock 데이터
  console.log('모든 API 실패, Mock 데이터로 대체합니다.');
  const mockResult = getMockProducts(trimmedKeyword, page);
  return {
    ...mockResult,
    page,
  };
}

/**
 * 작품 검색 (간단한 버전)
 */
export async function searchProducts(params: ProductSearchParams): Promise<IdusProduct[]> {
  const result = await searchProductsWithPagination(params);
  return result.products;
}

/**
 * Railway 백엔드 API를 통한 검색 (playwright-stealth)
 */
async function searchViaRailwayApi(
  keyword: string,
  sort: string = 'popular',
  page: number = 1
): Promise<SearchResultWithPagination> {
  const response = await fetch(`${CRAWLER_API_URL}/api/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      keyword,
      sort,
      page,
      size: ITEMS_PER_PAGE,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Railway API 오류: ${response.status}`);
  }

  const data = await response.json();
  
  return {
    products: data.products || [],
    hasMore: data.hasMore || (data.products?.length >= ITEMS_PER_PAGE),
    totalCount: data.total || data.products?.length || 0,
    page,
  };
}

/**
 * Vercel Serverless API를 통한 검색 (fallback)
 */
async function searchViaVercelApi(
  keyword: string,
  sort: string = 'popular',
  page: number = 1
): Promise<SearchResultWithPagination> {
  const response = await fetch(`${VERCEL_API_URL}/api/crawl/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      keyword,
      sort,
      page,
      size: ITEMS_PER_PAGE,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Vercel API 오류: ${response.status}`);
  }

  const data = await response.json();
  
  return {
    products: data.products || [],
    hasMore: data.hasMore || (data.products?.length >= ITEMS_PER_PAGE),
    totalCount: data.total || data.products?.length || 0,
    page,
  };
}

/**
 * Mock 데이터 생성 (API 실패 시 대체용)
 */
export function getMockProducts(keyword: string, page: number = 1): { products: IdusProduct[], hasMore: boolean, totalCount: number } {
  const categoryMap: Record<string, { category: string, items: Array<{ title: string, artistName: string, basePrice: number }> }> = {
    '도자기': {
      category: 'ceramic',
      items: [
        { title: '손으로 빚은 도자기 컵 - 청화백자', artistName: '도예공방 달', basePrice: 45000 },
        { title: '분청사기 찻잔 세트', artistName: '흙과 불', basePrice: 78000 },
        { title: '백자 화병 - 달항아리', artistName: '청송도예', basePrice: 120000 },
        { title: '도자기 접시 4P 세트', artistName: '도예공방 달', basePrice: 56000 },
        { title: '핸드메이드 머그컵 - 유약', artistName: '흙과 불', basePrice: 32000 },
        { title: '도자기 향꽂이', artistName: '청송도예', basePrice: 18000 },
      ],
    },
    '가죽': {
      category: 'leather',
      items: [
        { title: '내추럴 가죽 반지갑 - 브라운', artistName: '가죽공방 손', basePrice: 68000 },
        { title: '미니 카드지갑 - 블랙', artistName: '레더크래프트', basePrice: 35000 },
        { title: '가죽 키링 - 이니셜 각인', artistName: '가죽공방 손', basePrice: 15000 },
        { title: '핸드스티치 장지갑', artistName: '레더크래프트', basePrice: 98000 },
        { title: '가죽 에어팟 케이스', artistName: '가죽공방 손', basePrice: 28000 },
        { title: '미니 크로스백 - 탄', artistName: '레더크래프트', basePrice: 145000 },
      ],
    },
    '캔들': {
      category: 'candle',
      items: [
        { title: '소이캔들 세트 - 라벤더 & 바닐라', artistName: '향기공방 봄', basePrice: 32000 },
        { title: '우드윅 캔들 - 시더우드', artistName: '캔들스튜디오', basePrice: 28000 },
        { title: '미니 캔들 5종 세트', artistName: '향기공방 봄', basePrice: 25000 },
        { title: '대용량 필라캔들 - 화이트머스크', artistName: '캔들스튜디오', basePrice: 45000 },
        { title: '플라워 캔들 - 피오니', artistName: '향기공방 봄', basePrice: 38000 },
        { title: '디퓨저 세트 - 프레시 린넨', artistName: '캔들스튜디오', basePrice: 42000 },
      ],
    },
    '주얼리': {
      category: 'jewelry',
      items: [
        { title: '천연 자개 이어링 - 달빛', artistName: '자개공방 별', basePrice: 28000 },
        { title: '진주 드롭 귀걸이', artistName: '주얼리 아뜰리에', basePrice: 45000 },
        { title: '미니멀 실버 반지', artistName: '자개공방 별', basePrice: 35000 },
        { title: '원석 목걸이 - 라브라도라이트', artistName: '주얼리 아뜰리에', basePrice: 58000 },
        { title: '볼드 체인 팔찌', artistName: '자개공방 별', basePrice: 42000 },
        { title: '탄생석 펜던트', artistName: '주얼리 아뜰리에', basePrice: 65000 },
      ],
    },
    '폰케이스': {
      category: 'phone',
      items: [
        { title: '레더 폰케이스 - 내추럴 탄', artistName: '케이스공방', basePrice: 35000 },
        { title: '플라워 프레스 폰케이스', artistName: '플라워케이스', basePrice: 28000 },
        { title: '미니멀 클리어 케이스', artistName: '케이스공방', basePrice: 18000 },
        { title: '자수 폰케이스 - 꽃자수', artistName: '플라워케이스', basePrice: 32000 },
        { title: '우드 폰케이스 - 월넛', artistName: '케이스공방', basePrice: 42000 },
        { title: '레진아트 폰케이스', artistName: '플라워케이스', basePrice: 38000 },
      ],
    },
    '지갑': {
      category: 'wallet',
      items: [
        { title: '미니 카드지갑 - 브라운', artistName: '가죽공방 손', basePrice: 28000 },
        { title: '장지갑 - 클래식 블랙', artistName: '레더크래프트', basePrice: 88000 },
        { title: '반지갑 - 내추럴 탄', artistName: '가죽공방 손', basePrice: 58000 },
        { title: '코인 파우치', artistName: '레더크래프트', basePrice: 22000 },
        { title: '여권지갑 - 네이비', artistName: '가죽공방 손', basePrice: 45000 },
        { title: '키링 카드케이스', artistName: '레더크래프트', basePrice: 25000 },
      ],
    },
    '액세서리': {
      category: 'accessory',
      items: [
        { title: '핸드메이드 헤어핀 세트', artistName: '소품공방', basePrice: 15000 },
        { title: '자수 브로치 - 꽃', artistName: '바늘과실', basePrice: 22000 },
        { title: '우드 귀걸이', artistName: '소품공방', basePrice: 18000 },
        { title: '비즈 팔찌', artistName: '바늘과실', basePrice: 28000 },
        { title: '레진 반지', artistName: '소품공방', basePrice: 25000 },
        { title: '자개 브로치', artistName: '바늘과실', basePrice: 35000 },
      ],
    },
  };

  const defaultItems = [
    { title: '핸드메이드 작품', artistName: '아이디어스 작가', basePrice: 35000 },
    { title: '수공예 선물', artistName: '공방 아뜰리에', basePrice: 42000 },
    { title: '감성 인테리어 소품', artistName: '홈데코 스튜디오', basePrice: 28000 },
    { title: '특별한 수제 선물', artistName: '아이디어스 작가', basePrice: 55000 },
    { title: '유니크 핸드메이드', artistName: '공방 아뜰리에', basePrice: 38000 },
    { title: '정성이 담긴 수공예품', artistName: '홈데코 스튜디오', basePrice: 48000 },
  ];

  let matchedCategory = null;
  for (const [key, value] of Object.entries(categoryMap)) {
    if (keyword.includes(key)) {
      matchedCategory = value;
      break;
    }
  }

  const items = matchedCategory?.items || defaultItems;
  const category = matchedCategory?.category || 'general';

  const allProducts: IdusProduct[] = [];
  const totalPages = 3;

  for (let i = 0; i < totalPages; i++) {
    items.forEach((item, idx) => {
      const productIndex = i * items.length + idx;
      const priceVariation = Math.floor(Math.random() * 10000) - 5000;
      const hasDiscount = Math.random() > 0.7;
      const discountRate = hasDiscount ? Math.floor(Math.random() * 20) + 10 : 0;
      const originalPrice = item.basePrice + priceVariation;
      const price = hasDiscount ? Math.floor(originalPrice * (1 - discountRate / 100)) : originalPrice;

      allProducts.push({
        id: `mock-${category}-${productIndex}`,
        title: i === 0 ? `${keyword} - ${item.title}` : `${keyword} - ${item.title} #${productIndex + 1}`,
        price,
        originalPrice: hasDiscount ? originalPrice : undefined,
        discountRate: hasDiscount ? discountRate : undefined,
        image: `https://picsum.photos/seed/${category}${productIndex}/400/400`,
        artistName: item.artistName,
        rating: Math.round((4.5 + Math.random() * 0.5) * 10) / 10,
        reviewCount: Math.floor(Math.random() * 500) + 50,
        url: `https://www.idus.com/w/product/mock-${category}-${productIndex}`,
        category,
      });
    });
  }

  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedProducts = allProducts.slice(startIndex, endIndex);

  return {
    products: paginatedProducts,
    hasMore: endIndex < allProducts.length,
    totalCount: allProducts.length,
  };
}

/**
 * 가격 포맷팅
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(price).replace('₩', '₩ ');
}

/**
 * 할인율 계산
 */
export function calculateDiscountRate(originalPrice: number, price: number): number {
  if (!originalPrice || originalPrice <= price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

/**
 * 상품 상세 정보 타입
 */
export interface ProductDetail extends IdusProduct {
  description?: string;
  additionalImages?: string[];
  artistDescription?: string;
  options?: Array<{ name: string; values: string[] }>;
  shippingInfo?: string;
  tags?: string[];
}

/**
 * 상품 상세 정보 가져오기
 */
export async function getProductDetail(url: string): Promise<ProductDetail | null> {
  // Railway API로 상세 정보 가져오기
  if (CRAWLER_API_URL) {
    try {
      const response = await fetch(`${CRAWLER_API_URL}/api/product/detail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (response.ok) {
        const data = await response.json();
        return data as ProductDetail;
      }
    } catch (error) {
      console.error('상품 상세 정보 가져오기 실패:', error);
    }
  }
  
  return null;
}

/**
 * URL에서 상품 ID 추출
 */
export function extractProductIdFromUrl(url: string): string | null {
  const match = url.match(/\/w\/product\/([a-f0-9-]+)/i);
  return match ? match[1] : null;
}

/**
 * 여러 상품의 상세 정보 일괄 가져오기
 */
export async function getMultipleProductDetails(urls: string[]): Promise<ProductDetail[]> {
  const details = await Promise.all(
    urls.map(url => getProductDetail(url))
  );
  return details.filter((d): d is ProductDetail => d !== null);
}
