// Vercel Serverless Function for idus crawling with Puppeteer Stealth
// Stealth 플러그인을 사용하여 봇 탐지 우회

import type { VercelRequest, VercelResponse } from '@vercel/node';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

// Vercel Serverless Function 설정
export const config = {
  maxDuration: 60, // 60초 타임아웃
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
  description?: string;
}

/**
 * Puppeteer Stealth 브라우저 실행
 */
async function launchStealthBrowser() {
  const executablePath = await chromium.executablePath();
  
  const browser = await puppeteer.launch({
    args: [
      ...chromium.args,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--hide-scrollbars',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
    ],
    defaultViewport: { width: 1920, height: 1080 },
    executablePath,
    headless: true,
  });

  return browser;
}

/**
 * Stealth 설정 적용
 */
async function applyStealthSettings(page: any) {
  // User Agent 설정 (실제 브라우저처럼 보이도록)
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  // WebDriver 감지 우회
  await page.evaluateOnNewDocument(() => {
    // webdriver 속성 제거
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });

    // Chrome 런타임 추가
    (window as any).chrome = {
      runtime: {},
    };

    // Permissions 오버라이드
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters: any) => (
      parameters.name === 'notifications'
        ? Promise.resolve({ state: Notification.permission } as PermissionStatus)
        : originalQuery(parameters)
    );

    // plugins 배열 추가
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });

    // languages 설정
    Object.defineProperty(navigator, 'languages', {
      get: () => ['ko-KR', 'ko', 'en-US', 'en'],
    });

    // Platform 설정
    Object.defineProperty(navigator, 'platform', {
      get: () => 'Win32',
    });

    // Hardware concurrency
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      get: () => 8,
    });
  });

  // Extra HTTP headers
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0',
  });

  // 불필요한 리소스 차단 (속도 향상)
  await page.setRequestInterception(true);
  page.on('request', (request: any) => {
    const resourceType = request.resourceType();
    const url = request.url();
    
    // 광고, 추적기, 불필요한 리소스 차단
    if (
      ['font', 'media'].includes(resourceType) ||
      url.includes('google-analytics') ||
      url.includes('googletagmanager') ||
      url.includes('facebook') ||
      url.includes('amplitude') ||
      url.includes('sentry')
    ) {
      request.abort();
    } else {
      request.continue();
    }
  });
}

/**
 * idus 검색 페이지 크롤링
 */
async function crawlIdusSearch(
  keyword: string,
  sort: string = 'popular',
  page: number = 1,
  size: number = 24
): Promise<{ products: ProductResult[], total: number, hasMore: boolean }> {
  let browser = null;
  
  try {
    console.log(`Starting crawl for keyword: "${keyword}"`);
    
    browser = await launchStealthBrowser();
    const browserPage = await browser.newPage();
    
    // Stealth 설정 적용
    await applyStealthSettings(browserPage);

    // 정렬 옵션 매핑
    const sortMap: Record<string, string> = {
      popular: 'POPULAR',
      newest: 'NEWEST',
      price_asc: 'PRICE_ASC',
      price_desc: 'PRICE_DESC',
      rating: 'REVIEW_AVG',
    };

    // idus 검색 URL (v2 버전)
    const searchUrl = `https://www.idus.com/v2/search?keyword=${encodeURIComponent(keyword)}&sort=${sortMap[sort] || 'POPULAR'}`;
    
    console.log(`Navigating to: ${searchUrl}`);
    
    // 페이지 이동
    await browserPage.goto(searchUrl, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // 잠시 대기 (JS 렌더링 완료 대기)
    await browserPage.waitForTimeout(2000);

    // 상품 데이터 추출
    const products: ProductResult[] = await browserPage.evaluate(() => {
      const results: ProductResult[] = [];
      
      // 방법 1: __NEXT_DATA__에서 추출
      const nextDataScript = document.querySelector('script#__NEXT_DATA__');
      if (nextDataScript) {
        try {
          const nextData = JSON.parse(nextDataScript.textContent || '{}');
          
          // dehydratedState에서 products 찾기
          const queries = nextData?.props?.pageProps?.dehydratedState?.queries || [];
          for (const query of queries) {
            const data = query?.state?.data;
            if (data?.products && Array.isArray(data.products)) {
              for (const item of data.products) {
                results.push({
                  id: item.uuid || item.id || `product-${results.length}`,
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
              break;
            }
          }

          // pageProps에서 직접 찾기
          if (results.length === 0) {
            const pageProducts = nextData?.props?.pageProps?.products ||
                                nextData?.props?.pageProps?.searchResult?.products ||
                                nextData?.props?.pageProps?.initialData?.products;
            
            if (pageProducts && Array.isArray(pageProducts)) {
              for (const item of pageProducts) {
                results.push({
                  id: item.uuid || item.id || `product-${results.length}`,
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
            }
          }
        } catch (e) {
          console.error('Error parsing __NEXT_DATA__:', e);
        }
      }

      // 방법 2: DOM에서 직접 추출 (fallback)
      if (results.length === 0) {
        // 상품 카드 셀렉터 (idus의 실제 구조에 맞게 조정 필요)
        const productCards = document.querySelectorAll('[data-testid="product-card"], .product-card, [class*="ProductCard"], a[href*="/w/product/"]');
        
        productCards.forEach((card, index) => {
          try {
            const link = card.querySelector('a[href*="/w/product/"]') || card.closest('a[href*="/w/product/"]');
            const href = link?.getAttribute('href') || '';
            const id = href.match(/\/w\/product\/([a-f0-9-]+)/)?.[1] || `dom-${index}`;
            
            const titleEl = card.querySelector('[class*="title"], [class*="name"], h3, h4');
            const priceEl = card.querySelector('[class*="price"]');
            const imgEl = card.querySelector('img');
            const artistEl = card.querySelector('[class*="artist"], [class*="seller"]');
            const ratingEl = card.querySelector('[class*="rating"], [class*="star"]');
            const reviewEl = card.querySelector('[class*="review"]');

            if (id && (titleEl || imgEl)) {
              results.push({
                id,
                title: titleEl?.textContent?.trim() || `상품 ${index + 1}`,
                price: parseInt(priceEl?.textContent?.replace(/[^0-9]/g, '') || '0'),
                image: imgEl?.src || imgEl?.getAttribute('data-src') || '',
                artistName: artistEl?.textContent?.trim() || '작가',
                rating: parseFloat(ratingEl?.textContent || '0') || 0,
                reviewCount: parseInt(reviewEl?.textContent?.replace(/[^0-9]/g, '') || '0'),
                url: href.startsWith('http') ? href : `https://www.idus.com${href}`,
              });
            }
          } catch (e) {
            // 개별 카드 파싱 오류 무시
          }
        });
      }

      return results;
    });

    console.log(`Found ${products.length} products`);

    await browser.close();

    return {
      products: products.slice(0, size),
      total: products.length,
      hasMore: products.length >= size,
    };

  } catch (error) {
    console.error('Crawling error:', error);
    if (browser) {
      await browser.close();
    }
    throw error;
  }
}

/**
 * API 호출 방식 (Fallback)
 */
async function searchIdusApi(
  keyword: string,
  sort: string = 'popular',
  page: number = 1,
  size: number = 24
): Promise<{ products: ProductResult[], total: number, hasMore: boolean }> {
  const sortMap: Record<string, string> = {
    'popular': 'POPULAR',
    'newest': 'NEWEST',
    'price_asc': 'PRICE_ASC',
    'price_desc': 'PRICE_DESC',
    'rating': 'REVIEW_AVG',
  };

  const params = new URLSearchParams({
    keyword: keyword,
    sort: sortMap[sort] || 'POPULAR',
    page: String(page),
    size: String(size),
  });

  // v3 API 시도
  try {
    const response = await fetch(`https://api.idus.com/api/v3/search/product?${params.toString()}`, {
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

    if (response.ok) {
      const data = await response.json();
      const rawProducts = data.result?.products || data.products || [];
      
      const products: ProductResult[] = rawProducts.map((item: any) => ({
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
        total: data.result?.totalCount || data.totalCount || products.length,
        hasMore: data.result?.hasMore || data.hasMore || products.length >= size,
      };
    }
  } catch (e) {
    console.log('API v3 failed, trying crawling...');
  }

  throw new Error('API call failed');
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

    let result;

    // 먼저 API 호출 시도
    try {
      result = await searchIdusApi(keyword.trim(), sort, page, size);
      console.log('API call succeeded');
    } catch (apiError) {
      console.log('API call failed, trying Puppeteer crawling...');
      
      // API 실패 시 Puppeteer 크롤링
      try {
        result = await crawlIdusSearch(keyword.trim(), sort, page, size);
        console.log('Puppeteer crawling succeeded');
      } catch (crawlError) {
        console.error('Puppeteer crawling failed:', crawlError);
        
        // 모든 방법 실패 시 에러 반환
        return res.status(500).json({
          error: 'Failed to fetch products',
          message: 'idus 검색에 실패했습니다. 잠시 후 다시 시도해주세요.',
        });
      }
    }

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
