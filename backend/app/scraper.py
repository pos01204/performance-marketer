"""
idus 크롤러 - playwright-stealth 사용
봇 탐지를 우회하여 실제 상품 데이터 수집
"""

import asyncio
import json
import re
from typing import Optional, Dict, List, Any
from playwright.async_api import async_playwright, Browser, Page
from playwright_stealth import stealth_async


class IdusScraper:
    def __init__(self):
        self.browser: Optional[Browser] = None
        self.playwright = None
        
    async def initialize(self):
        """브라우저 초기화"""
        if self.browser is None:
            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.launch(
                headless=True,
                args=[
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu',
                    '--window-size=1920,1080',
                ]
            )
            print("Browser initialized successfully")
    
    async def close(self):
        """브라우저 종료"""
        if self.browser:
            await self.browser.close()
            self.browser = None
        if self.playwright:
            await self.playwright.stop()
            self.playwright = None
    
    async def _create_stealth_page(self) -> Page:
        """stealth 모드가 적용된 페이지 생성"""
        context = await self.browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            locale='ko-KR',
            timezone_id='Asia/Seoul',
        )
        page = await context.new_page()
        
        # stealth 모드 적용
        await stealth_async(page)
        
        # 불필요한 리소스만 차단 (이미지는 유지 - URL 추출 필요)
        await page.route("**/google-analytics.com/**", lambda route: route.abort())
        await page.route("**/googletagmanager.com/**", lambda route: route.abort())
        await page.route("**/facebook.com/**", lambda route: route.abort())
        
        return page
    
    async def search_products(
        self, 
        keyword: str, 
        sort: str = "popular",
        page: int = 1,
        size: int = 24
    ) -> Dict[str, Any]:
        """
        키워드로 상품 검색
        """
        await self.initialize()
        
        # 정렬 매핑
        sort_map = {
            "popular": "popular",
            "newest": "recent",
            "price_asc": "price_asc",
            "price_desc": "price_desc",
            "rating": "rating"
        }
        sort_value = sort_map.get(sort, "popular")
        
        search_url = f"https://www.idus.com/v2/search?keyword={keyword}&order={sort_value}"
        
        browser_page = await self._create_stealth_page()
        
        try:
            print(f"Navigating to: {search_url}")
            
            # 페이지 로드
            await browser_page.goto(search_url, wait_until="domcontentloaded", timeout=30000)
            
            # 상품이 로드될 때까지 대기
            await browser_page.wait_for_timeout(3000)
            
            # __NEXT_DATA__ 또는 __NUXT_DATA__에서 데이터 추출
            products = await self._extract_products_from_page(browser_page, size)
            
            if not products:
                print("No products found in page data, trying DOM extraction")
                products = await self._extract_products_from_dom(browser_page, size)
            
            print(f"Found {len(products)} products")
            
            return {
                "products": products,
                "total": len(products),
                "hasMore": len(products) >= size
            }
            
        except Exception as e:
            print(f"Search error: {e}")
            raise e
        finally:
            await browser_page.context.close()
    
    async def _extract_products_from_page(self, page: Page, size: int) -> List[Dict]:
        """페이지 데이터에서 상품 추출"""
        products = []
        
        try:
            # __NEXT_DATA__ 확인
            next_data = await page.evaluate("""
                () => {
                    const script = document.getElementById('__NEXT_DATA__');
                    if (script) {
                        try {
                            return JSON.parse(script.textContent);
                        } catch (e) {
                            return null;
                        }
                    }
                    return null;
                }
            """)
            
            if next_data:
                print("Found __NEXT_DATA__")
                products = self._parse_next_data(next_data, size)
                if products:
                    return products
            
            # __NUXT_DATA__ 확인
            nuxt_data = await page.evaluate("""
                () => {
                    const script = document.getElementById('__NUXT_DATA__');
                    if (script) {
                        try {
                            return JSON.parse(script.textContent);
                        } catch (e) {
                            return null;
                        }
                    }
                    return null;
                }
            """)
            
            if nuxt_data:
                print("Found __NUXT_DATA__")
                products = self._parse_nuxt_data(nuxt_data, size)
                
        except Exception as e:
            print(f"Error extracting page data: {e}")
        
        return products
    
    def _parse_next_data(self, data: dict, size: int) -> List[Dict]:
        """__NEXT_DATA__에서 상품 파싱"""
        products = []
        
        try:
            # dehydratedState.queries에서 찾기
            queries = data.get("props", {}).get("pageProps", {}).get("dehydratedState", {}).get("queries", [])
            
            for query in queries:
                query_data = query.get("state", {}).get("data", {})
                
                # products 배열
                if "products" in query_data and isinstance(query_data["products"], list):
                    for item in query_data["products"][:size]:
                        product = self._normalize_product(item)
                        if product:
                            products.append(product)
                    if products:
                        return products
                
                # pages 구조 (무한 스크롤)
                if "pages" in query_data and isinstance(query_data["pages"], list):
                    for page_data in query_data["pages"]:
                        if "products" in page_data:
                            for item in page_data["products"]:
                                product = self._normalize_product(item)
                                if product:
                                    products.append(product)
                                if len(products) >= size:
                                    return products
            
            # pageProps에서 직접 찾기
            page_props = data.get("props", {}).get("pageProps", {})
            
            for key in ["products", "initialData", "searchResult"]:
                if key in page_props:
                    target = page_props[key]
                    if isinstance(target, dict) and "products" in target:
                        target = target["products"]
                    if isinstance(target, list):
                        for item in target[:size]:
                            product = self._normalize_product(item)
                            if product:
                                products.append(product)
                        if products:
                            return products
                            
        except Exception as e:
            print(f"Error parsing __NEXT_DATA__: {e}")
        
        return products
    
    def _parse_nuxt_data(self, data: list, size: int) -> List[Dict]:
        """__NUXT_DATA__에서 상품 파싱"""
        products = []
        
        try:
            if isinstance(data, list):
                for item in data:
                    if isinstance(item, list):
                        for sub_item in item:
                            if isinstance(sub_item, dict) and "uuid" in sub_item:
                                product = self._normalize_product(sub_item)
                                if product:
                                    products.append(product)
                                if len(products) >= size:
                                    return products
                    elif isinstance(item, dict):
                        if "products" in item and isinstance(item["products"], list):
                            for p in item["products"][:size]:
                                product = self._normalize_product(p)
                                if product:
                                    products.append(product)
                            if products:
                                return products
        except Exception as e:
            print(f"Error parsing __NUXT_DATA__: {e}")
        
        return products
    
    def _normalize_product(self, item: dict) -> Optional[Dict]:
        """상품 데이터 정규화"""
        if not item:
            return None
        
        product_id = item.get("uuid") or item.get("id") or item.get("productId")
        title = item.get("name") or item.get("title") or item.get("productName")
        
        if not product_id and not title:
            return None
        
        return {
            "id": str(product_id or f"product-{hash(title) % 100000}"),
            "title": title or "상품명 없음",
            "price": item.get("price") or item.get("salePrice") or 0,
            "originalPrice": item.get("originPrice") or item.get("originalPrice") or item.get("listPrice"),
            "discountRate": item.get("discountRate") or item.get("discount"),
            "image": item.get("imageUrl") or item.get("image") or item.get("thumbnailUrl") or item.get("mainImage") or "",
            "artistName": item.get("artistName") or (item.get("artist", {}) or {}).get("name") or item.get("sellerName") or "작가",
            "rating": float(item.get("reviewAvg") or item.get("rating") or item.get("score") or 0),
            "reviewCount": int(item.get("reviewCount") or item.get("reviewCnt") or 0),
            "url": item.get("url") or f"https://www.idus.com/w/product/{product_id}",
            "category": item.get("categoryName") or item.get("category"),
        }
    
    async def _extract_products_from_dom(self, page: Page, size: int) -> List[Dict]:
        """DOM에서 직접 상품 추출 (fallback) - idus v2 검색 페이지 구조"""
        products = []
        
        try:
            # idus v2 검색 결과의 상품 링크 - href에 /v2/product/ 또는 /w/product/ 포함
            product_links = await page.evaluate("""
                () => {
                    const products = [];
                    // 모든 상품 링크 찾기
                    const links = document.querySelectorAll('a[href*="/v2/product/"], a[href*="/w/product/"]');
                    
                    for (const link of links) {
                        try {
                            const href = link.getAttribute('href') || '';
                            
                            // 상품 ID 추출
                            const match = href.match(/\\/(?:v2|w)\\/product\\/([a-f0-9-]+)/i);
                            if (!match) continue;
                            const productId = match[1];
                            
                            // 이미 추가된 상품인지 확인
                            if (products.some(p => p.id === productId)) continue;
                            
                            // 이미지 URL 추출
                            const img = link.querySelector('img');
                            let imageUrl = '';
                            if (img) {
                                imageUrl = img.src || img.dataset.src || img.getAttribute('data-lazy') || '';
                            }
                            
                            // 링크의 전체 텍스트에서 정보 추출
                            const fullText = link.innerText || link.textContent || '';
                            
                            // 가격 추출 (숫자,숫자 원 또는 숫자원 패턴)
                            const priceMatches = fullText.match(/([0-9,]+)\\s*원/g) || [];
                            let price = 0;
                            let originalPrice = null;
                            
                            if (priceMatches.length > 0) {
                                // 첫 번째 가격 (원가 또는 할인가)
                                const firstPrice = parseInt(priceMatches[0].replace(/[^0-9]/g, '')) || 0;
                                
                                if (priceMatches.length >= 2) {
                                    // 두 번째 가격이 있으면 첫 번째가 원가, 두 번째가 할인가
                                    originalPrice = firstPrice;
                                    price = parseInt(priceMatches[1].replace(/[^0-9]/g, '')) || firstPrice;
                                } else {
                                    price = firstPrice;
                                }
                            }
                            
                            // 평점 추출 (4.8, 5.0 등의 패턴)
                            const ratingMatch = fullText.match(/([0-5]\\.[0-9])\\s*\\(([0-9,]+)\\)/);
                            const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;
                            const reviewCount = ratingMatch ? parseInt(ratingMatch[2].replace(/,/g, '')) : 0;
                            
                            // 할인율 추출
                            const discountMatch = fullText.match(/([0-9]+)%/);
                            const discountRate = discountMatch ? parseInt(discountMatch[1]) : null;
                            
                            // 텍스트 분석하여 작가명과 상품명 분리
                            // 패턴: "작가명 상품명 가격원..."
                            const lines = fullText.split('\\n').map(l => l.trim()).filter(l => l);
                            
                            let artistName = '작가';
                            let title = '';
                            
                            // 첫 번째 줄이 작가명인 경우가 많음
                            if (lines.length >= 2) {
                                // 첫 번째 줄에 "원"이나 숫자가 많으면 작가명+상품명 혼합
                                const firstLine = lines[0];
                                if (!/[0-9,]+\\s*원/.test(firstLine) && firstLine.length < 30) {
                                    artistName = firstLine;
                                    // 두 번째 줄부터 상품명 찾기
                                    for (let i = 1; i < lines.length; i++) {
                                        if (!/[0-9,]+\\s*원/.test(lines[i]) && !lines[i].includes('%') && lines[i].length > 5) {
                                            title = lines[i];
                                            break;
                                        }
                                    }
                                } else {
                                    // 첫 줄에서 분리 시도 (예: "소소페인팅 밤하늘의 펄 물감폰케이스")
                                    const parts = firstLine.split(/\\s+/);
                                    if (parts.length >= 2) {
                                        artistName = parts[0];
                                        title = parts.slice(1).join(' ');
                                    }
                                }
                            }
                            
                            // 상품명이 비어있으면 전체 텍스트에서 추출
                            if (!title) {
                                // 가격, 평점 등 제거하고 상품명 추출
                                title = fullText
                                    .replace(/[0-9,]+\\s*원/g, '')
                                    .replace(/[0-9]+%/g, '')
                                    .replace(/[0-5]\\.[0-9]\\s*\\([0-9,]+\\)/g, '')
                                    .replace(/멤버십.*할인/g, '')
                                    .replace(/쿠폰/g, '')
                                    .replace(/후기.*/g, '')
                                    .replace(/살수록할인/g, '')
                                    .trim()
                                    .split('\\n')[0]
                                    .trim();
                                
                                // 너무 길면 자르기
                                if (title.length > 100) {
                                    title = title.substring(0, 100);
                                }
                            }
                            
                            if (!title || title.length < 2) {
                                title = `상품 ${products.length + 1}`;
                            }
                            
                            products.push({
                                id: productId,
                                title: title,
                                price: price,
                                originalPrice: originalPrice,
                                discountRate: discountRate,
                                image: imageUrl,
                                artistName: artistName,
                                rating: rating,
                                reviewCount: reviewCount,
                                url: 'https://www.idus.com/v2/product/' + productId,
                            });
                            
                        } catch (e) {
                            console.error('Error parsing product:', e);
                        }
                    }
                    
                    return products;
                }
            """)
            
            if product_links:
                print(f"DOM extraction found {len(product_links)} products")
                products = product_links[:size]
                
        except Exception as e:
            print(f"DOM extraction error: {e}")
        
        return products
    
    async def get_product_detail(self, url: str) -> Dict:
        """상품 상세 정보 가져오기"""
        await self.initialize()
        
        browser_page = await self._create_stealth_page()
        
        try:
            print(f"Getting product detail: {url}")
            
            await browser_page.goto(url, wait_until="domcontentloaded", timeout=30000)
            await browser_page.wait_for_timeout(2000)
            
            # __NEXT_DATA__ 또는 __NUXT_DATA__에서 상품 상세 데이터 추출
            product_data = await browser_page.evaluate("""
                () => {
                    // __NEXT_DATA__ 확인
                    const nextScript = document.getElementById('__NEXT_DATA__');
                    if (nextScript) {
                        try {
                            const data = JSON.parse(nextScript.textContent);
                            const product = data?.props?.pageProps?.product || 
                                           data?.props?.pageProps?.initialData?.product;
                            if (product) return product;
                        } catch (e) {}
                    }
                    
                    // JSON-LD 확인
                    const jsonLdScript = document.querySelector('script[type="application/ld+json"]');
                    if (jsonLdScript) {
                        try {
                            const data = JSON.parse(jsonLdScript.textContent);
                            if (data['@type'] === 'Product') return data;
                        } catch (e) {}
                    }
                    
                    return null;
                }
            """)
            
            if product_data:
                # JSON-LD 형식
                if "@type" in product_data:
                    return {
                        "id": product_data.get("productID") or url.split("/")[-1],
                        "title": product_data.get("name", ""),
                        "price": int(float(product_data.get("offers", {}).get("price", 0))),
                        "image": product_data.get("image", [""])[0] if isinstance(product_data.get("image"), list) else product_data.get("image", ""),
                        "artistName": product_data.get("brand", {}).get("name", "작가"),
                        "rating": float(product_data.get("aggregateRating", {}).get("ratingValue", 0)),
                        "reviewCount": int(product_data.get("aggregateRating", {}).get("reviewCount", 0)),
                        "url": url,
                        "description": product_data.get("description", ""),
                        "additionalImages": product_data.get("image", []) if isinstance(product_data.get("image"), list) else [],
                    }
                
                # idus 내부 형식
                additional_images = []
                if "images" in product_data and isinstance(product_data["images"], list):
                    for img in product_data["images"]:
                        img_url = img.get("url") or img.get("imageUrl") or (img if isinstance(img, str) else "")
                        if img_url:
                            additional_images.append(img_url)
                
                tags = []
                if "tags" in product_data and isinstance(product_data["tags"], list):
                    for tag in product_data["tags"]:
                        if isinstance(tag, str):
                            tags.append(tag)
                        elif isinstance(tag, dict) and "name" in tag:
                            tags.append(tag["name"])
                
                return {
                    "id": product_data.get("uuid") or url.split("/")[-1],
                    "title": product_data.get("name", ""),
                    "price": product_data.get("price", 0),
                    "originalPrice": product_data.get("originPrice"),
                    "discountRate": product_data.get("discountRate"),
                    "image": product_data.get("imageUrl") or (additional_images[0] if additional_images else ""),
                    "artistName": product_data.get("artistName") or product_data.get("artist", {}).get("name", "작가"),
                    "rating": float(product_data.get("reviewAvg", 0)),
                    "reviewCount": int(product_data.get("reviewCount", 0)),
                    "url": url,
                    "description": product_data.get("description", ""),
                    "additionalImages": additional_images,
                    "options": product_data.get("options", []),
                    "tags": tags,
                }
            
            # 데이터를 찾지 못한 경우 기본값 반환
            return {
                "id": url.split("/")[-1],
                "title": "상품 정보를 가져올 수 없습니다",
                "price": 0,
                "image": "",
                "artistName": "작가",
                "rating": 0,
                "reviewCount": 0,
                "url": url,
            }
            
        except Exception as e:
            print(f"Product detail error: {e}")
            raise e
        finally:
            await browser_page.context.close()
