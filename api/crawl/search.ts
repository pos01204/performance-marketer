// Vercel Serverless Function for idus crawling
// idus 내부 aggregator API를 활용한 검색

import type { VercelRequest, VercelResponse } from '@vercel/node';

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
 * idus aggregator API를 통한 검색
 * idus 웹사이트가 내부적으로 사용하는 API
 */
async function searchViaAggregatorApi(
  keyword: string,
  sort: string = 'popular',
  page: number = 1,
  size: number = 24
): Promise<{ products: ProductResult[], total: number } | null> {
  // 정렬 매핑
  const sortMap: Record<string, string> = {
    popular: 'POPULAR',
    newest: 'RECENT',
    price_asc: 'PRICE_ASC',
    price_desc: 'PRICE_DESC',
    rating: 'REVIEW_COUNT',
  };

  const sortValue = sortMap[sort] || 'POPULAR';

  // idus aggregator API 호출
  const apiUrl = 'https://www.idus.com/v2/api/aggregator/api/v4/products/search';
  
  const requestBody = {
    keyword: keyword,
    sort: sortValue,
    page: page,
    size: size,
    filters: {},
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Content-Type': 'application/json',
        'Origin': 'https://www.idus.com',
        'Referer': `https://www.idus.com/v2/search?keyword=${encodeURIComponent(keyword)}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
      },
      body: JSON.stringify(requestBody),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Aggregator API response keys:', Object.keys(data));
      
      // 다양한 응답 구조 지원
      const products = data.products || data.items || data.result?.products || [];
      
      if (Array.isArray(products) && products.length > 0) {
        return {
          products: products.map((item: any) => ({
            id: item.uuid || item.id || `product-${Math.random().toString(36).substr(2, 9)}`,
            title: item.name || item.title || '',
            price: item.price || item.salePrice || 0,
            originalPrice: item.originPrice || item.originalPrice,
            discountRate: item.discountRate,
            image: item.imageUrl || item.image || item.thumbnailUrl || '',
            artistName: item.artistName || item.artist?.name || '작가',
            rating: item.reviewAvg || item.rating || 0,
            reviewCount: item.reviewCount || 0,
            url: `https://www.idus.com/w/product/${item.uuid || item.id}`,
            category: item.categoryName,
          })),
          total: data.totalCount || data.total || products.length,
        };
      }
    } else {
      console.log('Aggregator API status:', response.status);
    }
  } catch (error) {
    console.error('Aggregator API error:', error);
  }

  return null;
}

/**
 * idus 검색 페이지 HTML에서 __NEXT_DATA__ 파싱
 */
async function searchViaHtmlParsing(
  keyword: string,
  sort: string = 'popular'
): Promise<{ products: ProductResult[], total: number } | null> {
  const sortMap: Record<string, string> = {
    popular: 'popular',
    newest: 'recent',
    price_asc: 'price_asc',
    price_desc: 'price_desc',
    rating: 'rating',
  };

  const sortValue = sortMap[sort] || 'popular';
  const searchUrl = `https://www.idus.com/v2/search?keyword=${encodeURIComponent(keyword)}&order=${sortValue}`;

  try {
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    if (!response.ok) {
      console.log('HTML fetch status:', response.status);
      return null;
    }

    const html = await response.text();
    console.log('HTML length:', html.length);

    // __NEXT_DATA__ 파싱
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    
    if (nextDataMatch) {
      const nextData = JSON.parse(nextDataMatch[1]);
      
      // dehydratedState.queries에서 상품 데이터 찾기
      const queries = nextData?.props?.pageProps?.dehydratedState?.queries || [];
      
      for (const query of queries) {
        const data = query?.state?.data;
        
        // products 배열 찾기
        if (data?.products && Array.isArray(data.products) && data.products.length > 0) {
          console.log('Found products in __NEXT_DATA__:', data.products.length);
          
          return {
            products: data.products.map((item: any) => ({
              id: item.uuid || item.id || `product-${Math.random().toString(36).substr(2, 9)}`,
              title: item.name || item.title || '',
              price: item.price || 0,
              originalPrice: item.originPrice,
              discountRate: item.discountRate,
              image: item.imageUrl || item.image || '',
              artistName: item.artistName || item.artist?.name || '작가',
              rating: item.reviewAvg || 0,
              reviewCount: item.reviewCount || 0,
              url: `https://www.idus.com/w/product/${item.uuid || item.id}`,
              category: item.categoryName,
            })),
            total: data.totalCount || data.products.length,
          };
        }

        // pages 구조 (무한 스크롤)
        if (data?.pages && Array.isArray(data.pages)) {
          const allProducts: any[] = [];
          for (const pageData of data.pages) {
            if (pageData?.products) {
              allProducts.push(...pageData.products);
            }
          }
          
          if (allProducts.length > 0) {
            console.log('Found products in pages:', allProducts.length);
            
            return {
              products: allProducts.map((item: any) => ({
                id: item.uuid || item.id || `product-${Math.random().toString(36).substr(2, 9)}`,
                title: item.name || item.title || '',
                price: item.price || 0,
                originalPrice: item.originPrice,
                discountRate: item.discountRate,
                image: item.imageUrl || item.image || '',
                artistName: item.artistName || item.artist?.name || '작가',
                rating: item.reviewAvg || 0,
                reviewCount: item.reviewCount || 0,
                url: `https://www.idus.com/w/product/${item.uuid || item.id}`,
                category: item.categoryName,
              })),
              total: allProducts.length,
            };
          }
        }
      }
    }

    // __NUXT_DATA__ 파싱 (Nuxt 3)
    const nuxtDataMatch = html.match(/<script id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (nuxtDataMatch) {
      console.log('Found __NUXT_DATA__');
      // Nuxt 3 데이터는 배열 형태로 저장됨
      try {
        const nuxtArray = JSON.parse(nuxtDataMatch[1]);
        // 상품 배열 찾기
        for (const item of nuxtArray) {
          if (Array.isArray(item) && item.length > 0 && item[0]?.uuid) {
            return {
              products: item.map((p: any) => ({
                id: p.uuid || p.id,
                title: p.name || '',
                price: p.price || 0,
                originalPrice: p.originPrice,
                discountRate: p.discountRate,
                image: p.imageUrl || '',
                artistName: p.artistName || '작가',
                rating: p.reviewAvg || 0,
                reviewCount: p.reviewCount || 0,
                url: `https://www.idus.com/w/product/${p.uuid}`,
              })),
              total: item.length,
            };
          }
        }
      } catch (e) {
        console.error('Nuxt data parse error:', e);
      }
    }

    console.log('No product data found in HTML');
  } catch (error) {
    console.error('HTML parsing error:', error);
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

    const trimmedKeyword = keyword.trim();
    console.log(`Searching: "${trimmedKeyword}", sort: ${sort}, page: ${page}`);

    // 방법 1: Aggregator API 시도
    console.log('Trying aggregator API...');
    const apiResult = await searchViaAggregatorApi(trimmedKeyword, sort, page, size);
    
    if (apiResult && apiResult.products.length > 0) {
      console.log(`Aggregator API returned ${apiResult.products.length} products`);
      return res.status(200).json({
        products: apiResult.products,
        total: apiResult.total,
        hasMore: apiResult.products.length >= size,
        keyword: trimmedKeyword,
        sort,
        page,
        source: 'aggregator-api',
      });
    }

    // 방법 2: HTML 파싱 시도
    console.log('Trying HTML parsing...');
    const htmlResult = await searchViaHtmlParsing(trimmedKeyword, sort);
    
    if (htmlResult && htmlResult.products.length > 0) {
      console.log(`HTML parsing returned ${htmlResult.products.length} products`);
      return res.status(200).json({
        products: htmlResult.products,
        total: htmlResult.total,
        hasMore: htmlResult.products.length >= size,
        keyword: trimmedKeyword,
        sort,
        page,
        source: 'html-parsing',
      });
    }

    // 모든 방법 실패
    console.log('All methods failed, returning empty result');
    return res.status(200).json({
      products: [],
      total: 0,
      hasMore: false,
      keyword: trimmedKeyword,
      sort,
      page,
      source: 'none',
      error: '검색 결과를 가져올 수 없습니다. 잠시 후 다시 시도해주세요.',
    });

  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
