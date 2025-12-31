import type { IdusProduct, ProductSearchParams, ProductSearchResult } from '../types';

// API 엔드포인트 (Vercel/Railway 배포 시 환경에 맞게 설정)
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// 페이지당 아이템 수
export const ITEMS_PER_PAGE = 24;

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
  const { keyword, page = 1 } = params;

  // 개발 모드에서는 Mock 데이터 사용 (API가 아직 없으면)
  const useMock = import.meta.env.DEV && !import.meta.env.VITE_API_URL;
  
  if (useMock) {
    // Mock 데이터 반환 (약간의 지연 추가)
    await new Promise(resolve => setTimeout(resolve, 600));
    const result = getMockProducts(keyword, page);
    return {
      ...result,
      page,
    };
  }

  // 실제 API 호출
  const products = await searchIdusProducts(params);
  return {
    products,
    hasMore: products.length >= ITEMS_PER_PAGE,
    totalCount: products.length,
    page,
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
