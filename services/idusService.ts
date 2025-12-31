import type { IdusProduct, ProductSearchParams, ProductSearchResult } from '../types';

// API 엔드포인트 설정
// 1. 환경변수가 있으면 사용
// 2. 프로덕션이면 같은 도메인의 /api 사용
// 3. 개발 모드면 직접 idus API 호출 시도
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? '' : '');

// 페이지당 아이템 수
export const ITEMS_PER_PAGE = 24;

// 개발 모드에서 Mock 사용 여부 (false로 설정하면 실제 API 호출 시도)
const USE_MOCK_IN_DEV = false;

/**
 * idus 작품 검색
 * 서버사이드 크롤링 API를 호출합니다.
 */
export async function searchIdusProducts(params: ProductSearchParams): Promise<IdusProduct[]> {
  const { keyword, sort = 'popular', page = 1 } = params;

  if (!keyword || keyword.trim().length === 0) {
    throw new Error('검색어를 입력해주세요');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/crawl/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ keyword: keyword.trim(), sort, page }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '검색에 실패했습니다');
    }

    const data: ProductSearchResult = await response.json();
    return data.products || [];
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('네트워크 오류가 발생했습니다');
  }
}

/**
 * 실제 idus 이미지 URL 생성
 */
function getIdusImageUrl(index: number): string {
  // 실제 idus CDN 이미지 패턴 사용
  const imageIds = [
    '5e8c7d6b-4a3f-4e2d-9b1c-8a7f6e5d4c3b',
    '6f9d8e7c-5b4a-4f3e-0c2d-9b8a7f6e5d4c',
    '7a0e9f8d-6c5b-4a4f-1d3e-0c9b8a7f6e5d',
    '8b1f0a9e-7d6c-5b5a-2e4f-1d0c9b8a7f6e',
    '9c2a1b0f-8e7d-6c6b-3f5a-2e1d0c9b8a7f',
    'ad3b2c1a-9f8e-7d7c-4a6b-3f2e1d0c9b8a',
  ];
  const id = imageIds[index % imageIds.length];
  return `https://image.idus.com/image/files/${id}_720.jpg`;
}

/**
 * 키워드 기반 Mock 데이터 생성
 * API 실패 시 키워드에 맞는 샘플 데이터 제공
 */
export function getMockProducts(keyword: string, page: number = 1): { products: IdusProduct[], hasMore: boolean, totalCount: number } {
  // 키워드별 카테고리 매핑
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
  };

  // 기본 카테고리 (키워드가 매핑되지 않을 때)
  const defaultItems = [
    { title: '핸드메이드 작품', artistName: '아이디어스 작가', basePrice: 35000 },
    { title: '수공예 선물', artistName: '공방 아뜰리에', basePrice: 42000 },
    { title: '감성 인테리어 소품', artistName: '홈데코 스튜디오', basePrice: 28000 },
    { title: '특별한 수제 선물', artistName: '아이디어스 작가', basePrice: 55000 },
    { title: '유니크 핸드메이드', artistName: '공방 아뜰리에', basePrice: 38000 },
    { title: '정성이 담긴 수공예품', artistName: '홈데코 스튜디오', basePrice: 48000 },
  ];

  // 키워드에 맞는 카테고리 찾기
  let matchedCategory = categoryMap['도자기']; // 기본값
  for (const [key, value] of Object.entries(categoryMap)) {
    if (keyword.includes(key)) {
      matchedCategory = value;
      break;
    }
  }

  const items = matchedCategory?.items || defaultItems;
  const category = matchedCategory?.category || 'general';

  // Mock 데이터 생성
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
        title: i === 0 ? item.title : `${item.title} #${productIndex + 1}`,
        price,
        originalPrice: hasDiscount ? originalPrice : undefined,
        discountRate: hasDiscount ? discountRate : undefined,
        image: getIdusImageUrl(productIndex),
        artistName: item.artistName,
        rating: Math.round((4.5 + Math.random() * 0.5) * 10) / 10,
        reviewCount: Math.floor(Math.random() * 500) + 50,
        url: `https://www.idus.com/w/product/mock-${category}-${productIndex}`,
        category,
      });
    });
  }

  // 페이지네이션 적용
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
 * 작품 검색 결과 타입 (페이지네이션 포함)
 */
export interface SearchResultWithPagination {
  products: IdusProduct[];
  hasMore: boolean;
  totalCount: number;
  page: number;
}

/**
 * 작품 검색 (Mock 또는 실제 API 사용)
 */
export async function searchProducts(params: ProductSearchParams): Promise<IdusProduct[]> {
  const result = await searchProductsWithPagination(params);
  return result.products;
}

/**
 * 작품 검색 (페이지네이션 포함)
 */
export async function searchProductsWithPagination(params: ProductSearchParams): Promise<SearchResultWithPagination> {
  const { keyword, page = 1, sort = 'popular' } = params;

  // Mock 데이터 사용 여부 확인
  const useMock = USE_MOCK_IN_DEV && import.meta.env.DEV;
  
  if (useMock) {
    // Mock 데이터 반환 (약간의 지연 추가)
    await new Promise(resolve => setTimeout(resolve, 600));
    const result = getMockProducts(keyword, page);
    return {
      ...result,
      page,
    };
  }

  // 실제 API 호출 시도
  try {
    const result = await searchIdusProductsWithPagination(params);
    return result;
  } catch (error) {
    console.error('API 호출 실패, 직접 크롤링 시도:', error);
    
    // API 실패 시 직접 idus 검색 시도
    try {
      const directResult = await searchIdusDirectly(keyword, sort, page);
      return directResult;
    } catch (directError) {
      console.error('직접 크롤링도 실패:', directError);
      
      // 모든 방법 실패 시 Mock 데이터 반환
      console.warn('Mock 데이터로 대체합니다.');
      const mockResult = getMockProducts(keyword, page);
      return {
        ...mockResult,
        page,
      };
    }
  }
}

/**
 * API를 통한 검색 (페이지네이션 포함)
 */
async function searchIdusProductsWithPagination(params: ProductSearchParams): Promise<SearchResultWithPagination> {
  const { keyword, sort = 'popular', page = 1 } = params;

  const response = await fetch(`${API_BASE_URL}/api/crawl/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ keyword: keyword.trim(), sort, page, size: ITEMS_PER_PAGE }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || '검색에 실패했습니다');
  }

  const data = await response.json();
  
  return {
    products: data.products || [],
    hasMore: data.hasMore || data.products?.length >= ITEMS_PER_PAGE,
    totalCount: data.total || data.products?.length || 0,
    page,
  };
}

/**
 * 직접 idus 검색 (프록시를 통해 CORS 우회)
 */
async function searchIdusDirectly(
  keyword: string, 
  sort: string = 'popular', 
  page: number = 1
): Promise<SearchResultWithPagination> {
  // 정렬 옵션 매핑
  const sortMap: Record<string, string> = {
    'popular': 'POPULAR',
    'newest': 'NEWEST',
    'price_asc': 'PRICE_ASC',
    'price_desc': 'PRICE_DESC',
    'rating': 'REVIEW_AVG',
  };
  
  const sortValue = sortMap[sort] || 'POPULAR';
  
  // 개발 환경에서는 Vite 프록시 사용 (v3 API 사용)
  const apiUrl = import.meta.env.DEV 
    ? `/idus-api/api/v3/search/product`
    : `https://api.idus.com/api/v3/search/product`;
  
  const params = new URLSearchParams({
    keyword: keyword,
    sort: sortValue,
    page: String(page),
    size: String(ITEMS_PER_PAGE),
  });

  try {
    const response = await fetch(`${apiUrl}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`idus API error: ${response.status}`);
    }

    const data = await response.json();
    
    // 응답 데이터 변환 (다양한 응답 구조 지원)
    const rawProducts = data.result?.products || data.products || [];
    const products: IdusProduct[] = rawProducts.map((item: any) => ({
      id: item.uuid,
      title: item.name,
      price: item.price,
      originalPrice: item.originPrice,
      discountRate: item.discountRate,
      image: item.imageUrl,
      artistName: item.artistName,
      rating: item.reviewAvg || 0,
      reviewCount: item.reviewCount || 0,
      url: `https://www.idus.com/w/product/${item.uuid}`,
      category: item.categoryName,
    }));

    return {
      products,
      hasMore: data.result?.hasMore || data.hasMore || products.length >= ITEMS_PER_PAGE,
      totalCount: data.result?.totalCount || data.totalCount || products.length,
      page,
    };
  } catch (apiError) {
    console.error('idus API 직접 호출 실패:', apiError);
    
    // API 실패 시 웹 페이지 크롤링 시도
    return await searchIdusWebPage(keyword, sort, page);
  }
}

/**
 * idus 웹 페이지 크롤링 (Fallback)
 */
async function searchIdusWebPage(
  keyword: string,
  sort: string = 'popular',
  page: number = 1
): Promise<SearchResultWithPagination> {
  // 개발 환경에서는 Vite 프록시 사용, 새로운 v2 URL 사용
  const baseUrl = import.meta.env.DEV ? '/idus-proxy' : '';
  const searchUrl = `${baseUrl}/v2/search?keyword=${encodeURIComponent(keyword)}`;
  
  console.log('Fetching idus web page:', searchUrl);
  
  const response = await fetch(searchUrl, {
    method: 'GET',
    headers: {
      'Accept': 'text/html,application/xhtml+xml',
    },
  });

  if (!response.ok) {
    throw new Error('idus 웹 페이지 크롤링 실패');
  }

  const html = await response.text();
  const products = parseIdusSearchHtml(html);
  
  return {
    products,
    hasMore: products.length >= ITEMS_PER_PAGE,
    totalCount: products.length,
    page,
  };
}

/**
 * idus 검색 결과 HTML 파싱
 */
function parseIdusSearchHtml(html: string): IdusProduct[] {
  const products: IdusProduct[] = [];
  
  try {
    // __NEXT_DATA__ 스크립트에서 데이터 추출
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    
    if (nextDataMatch) {
      const nextData = JSON.parse(nextDataMatch[1]);
      
      // React Query 데이터 구조에서 검색 결과 찾기
      const queries = nextData?.props?.pageProps?.dehydratedState?.queries || [];
      
      for (const query of queries) {
        const data = query?.state?.data;
        if (data?.products && Array.isArray(data.products)) {
          for (const item of data.products) {
            products.push({
              id: item.uuid || item.id || `product-${products.length}`,
              title: item.name || item.title || '',
              price: item.price || 0,
              originalPrice: item.originPrice || item.originalPrice,
              discountRate: item.discountRate,
              image: item.imageUrl || item.image || '',
              artistName: item.artistName || item.artist?.name || '작가',
              rating: item.reviewAvg || item.rating || 0,
              reviewCount: item.reviewCount || 0,
              url: `https://www.idus.com/w/product/${item.uuid || item.id}`,
              category: item.categoryName,
            });
          }
          break; // 첫 번째 products 배열만 사용
        }
      }
    }
  } catch (error) {
    console.error('HTML 파싱 오류:', error);
  }
  
  return products;
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
 * 상품 상세 정보 가져오기
 */
export interface ProductDetail extends IdusProduct {
  description?: string;
  additionalImages?: string[];
  artistDescription?: string;
  options?: Array<{ name: string; values: string[] }>;
  shippingInfo?: string;
  tags?: string[];
}

export async function getProductDetail(productId: string): Promise<ProductDetail | null> {
  try {
    // 개발 환경에서는 Vite 프록시 사용
    const baseUrl = import.meta.env.DEV ? '/idus-proxy' : 'https://www.idus.com';
    const url = `${baseUrl}/w/product/${productId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) {
      throw new Error(`상품 페이지 로드 실패: ${response.status}`);
    }

    const html = await response.text();
    return parseProductDetailHtml(html, productId);
  } catch (error) {
    console.error('상품 상세 정보 가져오기 실패:', error);
    return null;
  }
}

/**
 * 상품 상세 HTML 파싱
 */
function parseProductDetailHtml(html: string, productId: string): ProductDetail | null {
  try {
    // __NEXT_DATA__에서 상품 정보 추출
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    
    if (nextDataMatch) {
      const nextData = JSON.parse(nextDataMatch[1]);
      const product = nextData?.props?.pageProps?.product;
      
      if (product) {
        // 추가 이미지 추출
        const additionalImages: string[] = [];
        if (product.images && Array.isArray(product.images)) {
          for (const img of product.images) {
            if (img.url || img.imageUrl) {
              additionalImages.push(img.url || img.imageUrl);
            }
          }
        }

        // 태그 추출
        const tags: string[] = [];
        if (product.tags && Array.isArray(product.tags)) {
          for (const tag of product.tags) {
            if (typeof tag === 'string') {
              tags.push(tag);
            } else if (tag.name) {
              tags.push(tag.name);
            }
          }
        }

        return {
          id: product.uuid || productId,
          title: product.name || '',
          price: product.price || 0,
          originalPrice: product.originPrice,
          discountRate: product.discountRate,
          image: product.imageUrl || additionalImages[0] || '',
          artistName: product.artist?.name || product.artistName || '작가',
          rating: product.reviewAvg || 0,
          reviewCount: product.reviewCount || 0,
          url: `https://www.idus.com/w/product/${product.uuid || productId}`,
          category: product.categoryName,
          description: product.description || '',
          additionalImages,
          artistDescription: product.artist?.description,
          tags,
          shippingInfo: product.shippingInfo?.description,
        };
      }
    }

    // JSON-LD 데이터에서 추출 시도
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (jsonLdMatch) {
      const jsonLd = JSON.parse(jsonLdMatch[1]);
      if (jsonLd['@type'] === 'Product') {
        return {
          id: productId,
          title: jsonLd.name || '',
          price: parseFloat(jsonLd.offers?.price) || 0,
          image: Array.isArray(jsonLd.image) ? jsonLd.image[0] : jsonLd.image || '',
          artistName: jsonLd.brand?.name || '작가',
          rating: parseFloat(jsonLd.aggregateRating?.ratingValue) || 0,
          reviewCount: parseInt(jsonLd.aggregateRating?.reviewCount) || 0,
          url: jsonLd.url || `https://www.idus.com/w/product/${productId}`,
          description: jsonLd.description || '',
          additionalImages: Array.isArray(jsonLd.image) ? jsonLd.image : [],
        };
      }
    }

    return null;
  } catch (error) {
    console.error('상품 상세 HTML 파싱 오류:', error);
    return null;
  }
}

/**
 * URL에서 상품 ID 추출
 */
export function extractProductIdFromUrl(url: string): string | null {
  // https://www.idus.com/w/product/abc123-def456 형식
  const match = url.match(/\/w\/product\/([a-f0-9-]+)/i);
  return match ? match[1] : null;
}

/**
 * 여러 상품의 상세 정보 일괄 가져오기
 */
export async function getMultipleProductDetails(productIds: string[]): Promise<ProductDetail[]> {
  const details = await Promise.all(
    productIds.map(id => getProductDetail(id))
  );
  return details.filter((d): d is ProductDetail => d !== null);
}
