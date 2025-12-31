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
 * 개발용 Mock 데이터
 * API가 아직 없을 때 사용합니다.
 */
export function getMockProducts(keyword: string, page: number = 1): { products: IdusProduct[], hasMore: boolean, totalCount: number } {
  const baseMockProducts: IdusProduct[] = [
    {
      id: 'mock-1',
      title: '손으로 빚은 도자기 컵 - 청화백자',
      price: 45000,
      image: 'https://image.idus.com/image/files/a80eb38e82364e2a863d53d5c53c38eb_720.jpg',
      artistName: '도예공방 달',
      rating: 4.9,
      reviewCount: 128,
      url: 'https://www.idus.com/w/product/mock-1',
      category: 'ceramic',
    },
    {
      id: 'mock-2',
      title: '내추럴 가죽 반지갑 - 브라운',
      price: 68000,
      originalPrice: 85000,
      discountRate: 20,
      image: 'https://image.idus.com/image/files/b90fc49f93475f3b974e64e6d64d49fc_720.jpg',
      artistName: '가죽공방 손',
      rating: 4.8,
      reviewCount: 256,
      url: 'https://www.idus.com/w/product/mock-2',
      category: 'leather',
    },
    {
      id: 'mock-3',
      title: '소이캔들 세트 - 라벤더 & 바닐라',
      price: 32000,
      image: 'https://image.idus.com/image/files/c01gd50g04586g4c085f75f7e75e50gd_720.jpg',
      artistName: '향기공방 봄',
      rating: 5.0,
      reviewCount: 89,
      url: 'https://www.idus.com/w/product/mock-3',
      category: 'candle',
    },
    {
      id: 'mock-4',
      title: '천연 자개 이어링 - 달빛',
      price: 28000,
      image: 'https://image.idus.com/image/files/d12he61h15697h5d196g86g8f86f61he_720.jpg',
      artistName: '자개공방 별',
      rating: 4.7,
      reviewCount: 167,
      url: 'https://www.idus.com/w/product/mock-4',
      category: 'jewelry',
    },
    {
      id: 'mock-5',
      title: '손뜨개 숄더백 - 아이보리',
      price: 55000,
      image: 'https://image.idus.com/image/files/e23if72i26708i6e207h97h9g97g72if_720.jpg',
      artistName: '뜨개공방 실',
      rating: 4.9,
      reviewCount: 203,
      url: 'https://www.idus.com/w/product/mock-5',
      category: 'textile',
    },
    {
      id: 'mock-6',
      title: '감성 일러스트 엽서 세트 (10장)',
      price: 12000,
      image: 'https://image.idus.com/image/files/f34jg83j37819j7f318i08i0h08h83jg_720.jpg',
      artistName: '드로잉 스튜디오',
      rating: 4.8,
      reviewCount: 445,
      url: 'https://www.idus.com/w/product/mock-6',
      category: 'stationery',
    },
  ];

  // 더 많은 Mock 데이터 생성 (무한 스크롤 테스트용)
  const allProducts: IdusProduct[] = [];
  const totalPages = 5; // 총 5페이지 분량
  
  for (let i = 0; i < totalPages; i++) {
    baseMockProducts.forEach((product, idx) => {
      allProducts.push({
        ...product,
        id: `mock-${i * baseMockProducts.length + idx + 1}`,
        title: `${product.title} #${i * baseMockProducts.length + idx + 1}`,
        price: product.price + (i * 1000),
        reviewCount: product.reviewCount + (i * 10),
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
  
  // 개발 환경에서는 Vite 프록시 사용
  const apiUrl = import.meta.env.DEV 
    ? `/idus-api/api/v2/search/product`
    : `https://api.idus.com/api/v2/search/product`;
  
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
    
    // 응답 데이터 변환
    const products: IdusProduct[] = (data.result?.products || []).map((item: any) => ({
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
      hasMore: data.result?.hasMore || products.length >= ITEMS_PER_PAGE,
      totalCount: data.result?.totalCount || products.length,
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
  const sortMap: Record<string, string> = {
    'popular': 'popular',
    'newest': 'newest',
    'price_asc': 'low_price',
    'price_desc': 'high_price',
    'rating': 'review',
  };
  
  const sortValue = sortMap[sort] || 'popular';
  
  // 개발 환경에서는 Vite 프록시 사용
  const baseUrl = import.meta.env.DEV ? '/idus-proxy' : '';
  const searchUrl = `${baseUrl}/w/search?keyword=${encodeURIComponent(keyword)}&sort=${sortValue}&page=${page}`;
  
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
