import type { IdusProduct, ProductSearchParams, ProductSearchResult } from '../types';

// 페이지당 아이템 수
export const ITEMS_PER_PAGE = 24;

// 공개 CORS 프록시 목록 (여러 개 준비하여 하나가 실패하면 다음 시도)
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
];

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

  // 공개 CORS 프록시를 통한 직접 크롤링 시도
  try {
    const result = await fetchIdusViaProxy(keyword.trim(), sort, page);
    if (result.products.length > 0) {
      return result;
    }
  } catch (error) {
    console.error('프록시 크롤링 실패:', error);
  }

  // 모든 방법 실패 시 Mock 데이터 반환
  console.warn('실제 검색 실패, Mock 데이터로 대체합니다.');
  const mockResult = getMockProducts(keyword, page);
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
 * CORS 프록시를 통해 idus 웹 페이지 가져오기
 */
async function fetchIdusViaProxy(
  keyword: string,
  sort: string = 'popular',
  page: number = 1
): Promise<SearchResultWithPagination> {
  // 정렬 매핑
  const sortMap: Record<string, string> = {
    'popular': 'popular',
    'newest': 'recent',
    'price_asc': 'price_asc',
    'price_desc': 'price_desc',
    'rating': 'rating',
  };

  const sortValue = sortMap[sort] || 'popular';
  const targetUrl = `https://www.idus.com/v2/search?keyword=${encodeURIComponent(keyword)}&order=${sortValue}`;

  // 여러 프록시 시도
  for (const proxyBase of CORS_PROXIES) {
    try {
      const proxyUrl = `${proxyBase}${encodeURIComponent(targetUrl)}`;
      console.log(`Trying proxy: ${proxyBase}`);

      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml',
        },
      });

      if (!response.ok) {
        console.warn(`Proxy ${proxyBase} returned ${response.status}`);
        continue;
      }

      const html = await response.text();
      
      // HTML이 너무 짧으면 에러로 판단
      if (html.length < 1000) {
        console.warn(`Proxy ${proxyBase} returned too short response`);
        continue;
      }

      const products = parseIdusSearchHtml(html);
      
      if (products.length > 0) {
        console.log(`Successfully fetched ${products.length} products via ${proxyBase}`);
        return {
          products: products.slice(0, ITEMS_PER_PAGE),
          hasMore: products.length >= ITEMS_PER_PAGE,
          totalCount: products.length,
          page,
        };
      }
    } catch (error) {
      console.warn(`Proxy ${proxyBase} failed:`, error);
      continue;
    }
  }

  throw new Error('모든 프록시 시도 실패');
}

/**
 * idus 검색 결과 HTML에서 __NEXT_DATA__ 파싱
 */
function parseIdusSearchHtml(html: string): IdusProduct[] {
  const products: IdusProduct[] = [];

  try {
    // 방법 1: __NEXT_DATA__ 스크립트에서 데이터 추출
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);

    if (nextDataMatch && nextDataMatch[1]) {
      try {
        const nextData = JSON.parse(nextDataMatch[1]);
        
        // dehydratedState.queries 에서 상품 데이터 찾기
        const queries = nextData?.props?.pageProps?.dehydratedState?.queries || [];
        
        for (const query of queries) {
          const data = query?.state?.data;
          
          // products 배열 찾기
          if (data?.products && Array.isArray(data.products)) {
            for (const item of data.products) {
              const product = extractProductFromItem(item);
              if (product) {
                products.push(product);
              }
            }
            if (products.length > 0) break;
          }
          
          // pages 구조 (무한 스크롤용)
          if (data?.pages && Array.isArray(data.pages)) {
            for (const pageData of data.pages) {
              if (pageData?.products && Array.isArray(pageData.products)) {
                for (const item of pageData.products) {
                  const product = extractProductFromItem(item);
                  if (product) {
                    products.push(product);
                  }
                }
              }
            }
            if (products.length > 0) break;
          }
        }
        
        // pageProps에서 직접 찾기
        if (products.length === 0) {
          const pageProps = nextData?.props?.pageProps;
          if (pageProps?.products && Array.isArray(pageProps.products)) {
            for (const item of pageProps.products) {
              const product = extractProductFromItem(item);
              if (product) {
                products.push(product);
              }
            }
          }
          
          // initialData에서 찾기
          if (pageProps?.initialData?.products) {
            for (const item of pageProps.initialData.products) {
              const product = extractProductFromItem(item);
              if (product) {
                products.push(product);
              }
            }
          }
        }
      } catch (jsonError) {
        console.error('JSON 파싱 오류:', jsonError);
      }
    }

    // 방법 2: JSON-LD 스크립트에서 찾기
    if (products.length === 0) {
      const jsonLdMatches = html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
      for (const match of jsonLdMatches) {
        try {
          const jsonLd = JSON.parse(match[1]);
          if (jsonLd['@type'] === 'ItemList' && jsonLd.itemListElement) {
            for (const item of jsonLd.itemListElement) {
              if (item.item || item['@type'] === 'Product') {
                const productData = item.item || item;
                products.push({
                  id: productData.productID || `product-${products.length}`,
                  title: productData.name || '',
                  price: parseFloat(productData.offers?.price) || 0,
                  image: Array.isArray(productData.image) ? productData.image[0] : productData.image || '',
                  artistName: productData.brand?.name || '작가',
                  rating: parseFloat(productData.aggregateRating?.ratingValue) || 0,
                  reviewCount: parseInt(productData.aggregateRating?.reviewCount) || 0,
                  url: productData.url || '',
                });
              }
            }
          }
        } catch (e) {
          continue;
        }
      }
    }

  } catch (error) {
    console.error('HTML 파싱 오류:', error);
  }

  return products;
}

/**
 * 상품 아이템에서 IdusProduct 객체 추출
 */
function extractProductFromItem(item: any): IdusProduct | null {
  if (!item) return null;

  const id = item.uuid || item.id || item.productId;
  const title = item.name || item.title || item.productName;

  if (!id && !title) return null;

  return {
    id: id || `product-${Math.random().toString(36).substr(2, 9)}`,
    title: title || '상품명 없음',
    price: item.price || item.salePrice || 0,
    originalPrice: item.originPrice || item.originalPrice || item.listPrice,
    discountRate: item.discountRate || item.discount,
    image: item.imageUrl || item.image || item.thumbnailUrl || item.mainImage || '',
    artistName: item.artistName || item.artist?.name || item.sellerName || '작가',
    rating: item.reviewAvg || item.rating || item.score || 0,
    reviewCount: item.reviewCount || item.reviewCnt || 0,
    url: item.url || `https://www.idus.com/w/product/${id}`,
    category: item.categoryName || item.category,
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
 * 상품 상세 정보 가져오기 (CORS 프록시 사용)
 */
export async function getProductDetail(productId: string): Promise<ProductDetail | null> {
  const targetUrl = `https://www.idus.com/w/product/${productId}`;

  for (const proxyBase of CORS_PROXIES) {
    try {
      const proxyUrl = `${proxyBase}${encodeURIComponent(targetUrl)}`;
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html',
        },
      });

      if (!response.ok) continue;

      const html = await response.text();
      const detail = parseProductDetailHtml(html, productId);
      
      if (detail) {
        return detail;
      }
    } catch (error) {
      console.warn(`Product detail fetch failed with proxy ${proxyBase}:`, error);
      continue;
    }
  }

  return null;
}

/**
 * 상품 상세 HTML 파싱
 */
function parseProductDetailHtml(html: string, productId: string): ProductDetail | null {
  try {
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);

    if (nextDataMatch) {
      const nextData = JSON.parse(nextDataMatch[1]);
      const product = nextData?.props?.pageProps?.product || 
                      nextData?.props?.pageProps?.initialData?.product;

      if (product) {
        const additionalImages: string[] = [];
        if (product.images && Array.isArray(product.images)) {
          for (const img of product.images) {
            const imgUrl = img.url || img.imageUrl || img;
            if (typeof imgUrl === 'string') {
              additionalImages.push(imgUrl);
            }
          }
        }

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

    // JSON-LD fallback
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
          url: `https://www.idus.com/w/product/${productId}`,
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
