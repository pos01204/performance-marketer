// Vercel Serverless Function for idus crawling
// HTTP 요청으로 HTML을 가져와 __NUXT_DATA__ 파싱

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Vercel Serverless Function 설정
export const config = {
  maxDuration: 30,
};

interface ProductResult {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  discountRate?: number;
  image: string;
  artistName: string;
  rating: number;
  reviewCount: number;
  url: string;
  category?: string;
}

/**
 * idus 검색 페이지 HTML 가져오기
 */
async function fetchIdusSearchPage(
  keyword: string,
  sort: string = 'popular'
): Promise<string> {
  // 정렬 옵션 매핑
  const sortMap: Record<string, string> = {
    popular: 'POPULAR',
    newest: 'NEWEST',
    price_asc: 'PRICE_ASC',
    price_desc: 'PRICE_DESC',
    rating: 'REVIEW_AVG',
  };

  const sortValue = sortMap[sort] || 'POPULAR';
  const searchUrl = `https://www.idus.com/v2/search?keyword=${encodeURIComponent(keyword)}&sort=${sortValue}`;

  console.log(`Fetching: ${searchUrl}`);

  const response = await fetch(searchUrl, {
    method: 'GET',
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.idus.com/',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch idus page: ${response.status}`);
  }

  return await response.text();
}

/**
 * Nuxt 페이로드에서 상품 데이터 추출
 */
function parseNuxtPayload(html: string): ProductResult[] {
  const products: ProductResult[] = [];

  try {
    // __NUXT_DATA__ 스크립트 찾기 (Nuxt 3 형식)
    const nuxtDataMatch = html.match(/<script id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    
    if (nuxtDataMatch) {
      console.log('Found __NUXT_DATA__ script');
      
      // Nuxt 3의 payload는 배열 형태
      const nuxtData = JSON.parse(nuxtDataMatch[1]);
      
      // 배열에서 상품 데이터 찾기
      if (Array.isArray(nuxtData)) {
        for (const item of nuxtData) {
          if (item && typeof item === 'object') {
            // products 배열 찾기
            if (item.products && Array.isArray(item.products)) {
              for (const product of item.products) {
                if (product && product.uuid) {
                  products.push(extractProductFromNuxt(product));
                }
              }
            }
            // items 배열 찾기 (다른 형식)
            if (item.items && Array.isArray(item.items)) {
              for (const product of item.items) {
                if (product && product.uuid) {
                  products.push(extractProductFromNuxt(product));
                }
              }
            }
          }
        }
      }
    }

    // __NEXT_DATA__ 스크립트 찾기 (Next.js 형식 - 이전 버전)
    if (products.length === 0) {
      const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
      
      if (nextDataMatch) {
        console.log('Found __NEXT_DATA__ script');
        const nextData = JSON.parse(nextDataMatch[1]);
        
        // dehydratedState에서 검색
        const queries = nextData?.props?.pageProps?.dehydratedState?.queries || [];
        for (const query of queries) {
          const data = query?.state?.data;
          if (data?.products && Array.isArray(data.products)) {
            for (const product of data.products) {
              products.push(extractProductFromNext(product));
            }
            break;
          }
        }

        // pageProps에서 직접 검색
        if (products.length === 0) {
          const pageProducts = nextData?.props?.pageProps?.products ||
                              nextData?.props?.pageProps?.searchResult?.products ||
                              nextData?.props?.pageProps?.initialData?.products;
          
          if (pageProducts && Array.isArray(pageProducts)) {
            for (const product of pageProducts) {
              products.push(extractProductFromNext(product));
            }
          }
        }
      }
    }

    // JSON-LD 데이터에서 추출 (최후의 수단)
    if (products.length === 0) {
      const jsonLdMatches = html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
      
      for (const match of jsonLdMatches) {
        try {
          const jsonLd = JSON.parse(match[1]);
          
          if (jsonLd['@type'] === 'ItemList' && jsonLd.itemListElement) {
            for (const item of jsonLd.itemListElement) {
              if (item.item && item.item['@type'] === 'Product') {
                const product = item.item;
                products.push({
                  id: product.sku || `product-${products.length}`,
                  title: product.name || '',
                  price: parseFloat(product.offers?.price) || 0,
                  image: Array.isArray(product.image) ? product.image[0] : product.image || '',
                  artistName: product.brand?.name || '작가',
                  rating: parseFloat(product.aggregateRating?.ratingValue) || 0,
                  reviewCount: parseInt(product.aggregateRating?.reviewCount) || 0,
                  url: product.url || '',
                });
              }
            }
          }
        } catch (e) {
          // JSON 파싱 실패 시 무시
        }
      }
    }

    // HTML에서 직접 상품 링크 추출 (최후의 수단)
    if (products.length === 0) {
      console.log('Trying direct HTML parsing');
      const productUrlPattern = /href="(\/v2\/product\/[a-f0-9-]+)"/g;
      const urlMatches = [...html.matchAll(productUrlPattern)];
      
      const seenUrls = new Set<string>();
      for (const match of urlMatches) {
        const url = match[1];
        if (!seenUrls.has(url)) {
          seenUrls.add(url);
          const id = url.split('/').pop() || `product-${products.length}`;
          products.push({
            id,
            title: `상품 ${products.length + 1}`,
            price: 0,
            image: '',
            artistName: '작가',
            rating: 0,
            reviewCount: 0,
            url: `https://www.idus.com${url}`,
          });
        }
        
        if (products.length >= 24) break;
      }
    }

  } catch (error) {
    console.error('Parse error:', error);
  }

  console.log(`Parsed ${products.length} products`);
  return products;
}

function extractProductFromNuxt(item: any): ProductResult {
  return {
    id: item.uuid || item.id || `product-${Date.now()}`,
    title: item.name || item.title || '',
    price: item.price || 0,
    originalPrice: item.originPrice || item.originalPrice,
    discountRate: item.discountRate,
    image: item.imageUrl || item.image || item.thumbnailUrl || '',
    artistName: item.artistName || item.artist?.name || '작가',
    rating: item.reviewAvg || item.rating || 0,
    reviewCount: item.reviewCount || 0,
    url: `https://www.idus.com/v2/product/${item.uuid || item.id}`,
    category: item.categoryName,
  };
}

function extractProductFromNext(item: any): ProductResult {
  return {
    id: item.uuid || item.id || `product-${Date.now()}`,
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
  };
}

/**
 * idus 내부 API 호출 시도
 */
async function tryIdusInternalApi(
  keyword: string,
  sort: string = 'popular',
  page: number = 1,
  size: number = 24
): Promise<{ products: ProductResult[], total: number } | null> {
  try {
    // idus 내부 검색 API 시도 (v2 www-api)
    const response = await fetch('https://www.idus.com/v2/www-api/search/review-unit', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Origin': 'https://www.idus.com',
        'Referer': `https://www.idus.com/v2/search?keyword=${encodeURIComponent(keyword)}`,
      },
      body: JSON.stringify({
        keyword,
        page,
        size,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Internal API response:', JSON.stringify(data).substring(0, 500));
      
      if (data.products && Array.isArray(data.products)) {
        const products = data.products.map((item: any) => extractProductFromNuxt(item));
        return {
          products,
          total: data.totalCount || products.length,
        };
      }
    }
  } catch (error) {
    console.log('Internal API failed:', error);
  }

  return null;
}

/**
 * 메인 핸들러
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { keyword, sort = 'popular', page = 1, size = 24 } = req.body;

    if (!keyword || keyword.trim().length === 0) {
      return res.status(400).json({ error: 'Keyword is required' });
    }

    console.log(`Searching idus for: "${keyword}", sort: ${sort}, page: ${page}`);

    // 방법 1: 내부 API 시도
    const apiResult = await tryIdusInternalApi(keyword.trim(), sort, page, size);
    if (apiResult && apiResult.products.length > 0) {
      console.log(`API returned ${apiResult.products.length} products`);
      return res.status(200).json({
        products: apiResult.products,
        total: apiResult.total,
        hasMore: apiResult.products.length >= size,
        keyword,
        sort,
        page,
        source: 'api',
      });
    }

    // 방법 2: HTML 페이지 파싱
    console.log('Trying HTML parsing...');
    const html = await fetchIdusSearchPage(keyword.trim(), sort);
    console.log(`Received HTML length: ${html.length}`);
    
    const products = parseNuxtPayload(html);

    if (products.length === 0) {
      // 디버깅을 위해 HTML 일부 로그
      console.log('HTML sample:', html.substring(0, 2000));
      console.log('Script tags found:', (html.match(/<script[^>]*id="__/g) || []).join(', '));
    }

    return res.status(200).json({
      products,
      total: products.length,
      hasMore: products.length >= size,
      keyword,
      sort,
      page,
      source: 'html',
    });

  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
