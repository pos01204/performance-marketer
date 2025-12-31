// Vercel Serverless Function for idus crawling
// 배포 시: https://your-domain.vercel.app/api/crawl/search

import type { VercelRequest, VercelResponse } from '@vercel/node';

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
  description?: string;
}

interface IdusApiProduct {
  uuid: string;
  name: string;
  price: number;
  originPrice?: number;
  discountRate?: number;
  artistName: string;
  artistUuid: string;
  imageUrl: string;
  reviewCount: number;
  reviewAvg: number;
  categoryName?: string;
}

interface IdusSearchResponse {
  result: {
    products: IdusApiProduct[];
    totalCount: number;
    hasMore: boolean;
  };
}

/**
 * idus 검색 API 호출
 * idus의 내부 API를 활용하여 검색 결과를 가져옵니다.
 */
async function searchIdusApi(
  keyword: string, 
  sort: string = 'popular', 
  page: number = 1,
  size: number = 24
): Promise<{ products: ProductResult[], total: number, hasMore: boolean }> {
  
  // idus 검색 API 엔드포인트
  const baseUrl = 'https://api.idus.com/api/v2/search/product';
  
  // 정렬 옵션 매핑
  const sortMap: Record<string, string> = {
    'popular': 'POPULAR',
    'newest': 'NEWEST',
    'price_asc': 'PRICE_ASC',
    'price_desc': 'PRICE_DESC',
    'rating': 'REVIEW_AVG',
  };
  
  const sortValue = sortMap[sort] || 'POPULAR';
  
  // API 요청 파라미터
  const params = new URLSearchParams({
    keyword: keyword,
    sort: sortValue,
    page: String(page),
    size: String(size),
  });

  try {
    const response = await fetch(`${baseUrl}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Origin': 'https://www.idus.com',
        'Referer': 'https://www.idus.com/',
      },
    });

    if (!response.ok) {
      throw new Error(`idus API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // 응답 데이터 변환
    const products: ProductResult[] = (data.result?.products || []).map((item: IdusApiProduct) => ({
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
      total: data.result?.totalCount || products.length,
      hasMore: data.result?.hasMore || false,
    };

  } catch (error) {
    console.error('idus API error:', error);
    // API 호출 실패 시 웹 스크래핑 시도
    return await scrapeIdusSearch(keyword, sort, page, size);
  }
}

/**
 * idus 웹 페이지 스크래핑 (Fallback)
 * API 호출 실패 시 웹 페이지를 직접 파싱합니다.
 */
async function scrapeIdusSearch(
  keyword: string,
  sort: string = 'popular',
  page: number = 1,
  size: number = 24
): Promise<{ products: ProductResult[], total: number, hasMore: boolean }> {
  
  // 정렬 옵션 매핑 (웹 URL용)
  const sortMap: Record<string, string> = {
    'popular': 'popular',
    'newest': 'newest',
    'price_asc': 'low_price',
    'price_desc': 'high_price',
    'rating': 'review',
  };
  
  const sortValue = sortMap[sort] || 'popular';
  const searchUrl = `https://www.idus.com/w/search?keyword=${encodeURIComponent(keyword)}&sort=${sortValue}&page=${page}`;

  try {
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch idus search page: ${response.status}`);
    }

    const html = await response.text();
    
    // __NEXT_DATA__ 스크립트에서 데이터 추출
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
    
    if (nextDataMatch) {
      const nextData = JSON.parse(nextDataMatch[1]);
      const searchData = nextData?.props?.pageProps?.dehydratedState?.queries?.[0]?.state?.data;
      
      if (searchData?.products) {
        const products: ProductResult[] = searchData.products.map((item: any) => ({
          id: item.uuid || item.id,
          title: item.name || item.title,
          price: item.price,
          originalPrice: item.originPrice || item.originalPrice,
          discountRate: item.discountRate,
          image: item.imageUrl || item.image,
          artistName: item.artistName || item.artist?.name || '작가',
          rating: item.reviewAvg || item.rating || 0,
          reviewCount: item.reviewCount || 0,
          url: `https://www.idus.com/w/product/${item.uuid || item.id}`,
          category: item.categoryName,
        }));

        return {
          products,
          total: searchData.totalCount || products.length,
          hasMore: searchData.hasMore || products.length >= size,
        };
      }
    }

    // HTML 파싱 fallback (정규식 기반)
    const products = parseHtmlProducts(html);
    
    return {
      products,
      total: products.length,
      hasMore: products.length >= size,
    };

  } catch (error) {
    console.error('Scraping error:', error);
    throw new Error('idus 검색에 실패했습니다. 잠시 후 다시 시도해주세요.');
  }
}

/**
 * HTML에서 상품 정보 파싱
 */
function parseHtmlProducts(html: string): ProductResult[] {
  const products: ProductResult[] = [];
  
  // 상품 카드 패턴 매칭 (여러 패턴 시도)
  const productPatterns = [
    // JSON-LD 데이터
    /<script type="application\/ld\+json">(.*?)<\/script>/gs,
    // data-product 속성
    /data-product="([^"]+)"/g,
    // 상품 링크 + 정보 패턴
    /href="\/w\/product\/([a-f0-9-]+)"[^>]*>.*?<img[^>]*src="([^"]+)"[^>]*>.*?<span[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)/gs,
  ];

  // JSON-LD 데이터 파싱 시도
  const jsonLdMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
  if (jsonLdMatches) {
    for (const match of jsonLdMatches) {
      try {
        const jsonContent = match.replace(/<script type="application\/ld\+json">/, '').replace(/<\/script>/, '');
        const data = JSON.parse(jsonContent);
        
        if (data['@type'] === 'Product' || (Array.isArray(data) && data[0]?.['@type'] === 'Product')) {
          const items = Array.isArray(data) ? data : [data];
          for (const item of items) {
            if (item['@type'] === 'Product') {
              products.push({
                id: item.sku || `product-${products.length}`,
                title: item.name,
                price: parseFloat(item.offers?.price) || 0,
                image: item.image?.[0] || item.image,
                artistName: item.brand?.name || '작가',
                rating: parseFloat(item.aggregateRating?.ratingValue) || 0,
                reviewCount: parseInt(item.aggregateRating?.reviewCount) || 0,
                url: item.url || '',
              });
            }
          }
        }
      } catch (e) {
        // JSON 파싱 실패 시 무시
      }
    }
  }

  return products;
}

/**
 * 상품 상세 정보 가져오기
 */
async function getProductDetail(productId: string): Promise<ProductResult | null> {
  try {
    const url = `https://www.idus.com/w/product/${productId}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
    });

    if (!response.ok) return null;

    const html = await response.text();
    
    // __NEXT_DATA__에서 상품 정보 추출
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
    
    if (nextDataMatch) {
      const nextData = JSON.parse(nextDataMatch[1]);
      const product = nextData?.props?.pageProps?.product;
      
      if (product) {
        return {
          id: product.uuid,
          title: product.name,
          price: product.price,
          originalPrice: product.originPrice,
          discountRate: product.discountRate,
          image: product.imageUrl || product.images?.[0]?.url,
          artistName: product.artist?.name || product.artistName,
          rating: product.reviewAvg || 0,
          reviewCount: product.reviewCount || 0,
          url: url,
          category: product.categoryName,
          description: product.description,
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Product detail error:', error);
    return null;
  }
}

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

    // idus 검색 실행
    const result = await searchIdusApi(keyword.trim(), sort, page, size);

    return res.status(200).json({
      products: result.products,
      total: result.total,
      hasMore: result.hasMore,
      keyword,
      sort,
      page,
    });

  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// 상품 상세 API (별도 엔드포인트로 분리 가능)
export async function getDetail(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  const product = await getProductDetail(id);
  
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  return res.status(200).json({ product });
}
