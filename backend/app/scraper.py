"""
idus 크롤러 - playwright-stealth 사용
봇 탐지를 우회하여 실제 상품 데이터 수집
"""

import asyncio
import json
import re
import aiohttp
from typing import Optional, Dict, List, Any, Tuple
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
        키워드로 상품 검색 - API 우선, 실패 시 브라우저 크롤링
        """
        # 1. 먼저 idus API 직접 호출 시도
        try:
            api_result = await self._search_via_api(keyword, sort, page, size)
            if api_result and len(api_result.get("products", [])) > 0:
                print(f"API method succeeded: {len(api_result['products'])} products")
                return api_result
        except Exception as e:
            print(f"API method failed: {e}")
        
        # 2. API 실패 시 브라우저 크롤링
        print("Falling back to browser crawling...")
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
            await browser_page.wait_for_timeout(2000)
            
            # 스크롤하여 lazy loading 이미지 트리거
            await browser_page.evaluate("""
                async () => {
                    // 부드럽게 스크롤하여 이미지 로드 트리거
                    for (let i = 0; i < 3; i++) {
                        window.scrollBy(0, window.innerHeight);
                        await new Promise(r => setTimeout(r, 500));
                    }
                    // 다시 위로
                    window.scrollTo(0, 0);
                    await new Promise(r => setTimeout(r, 500));
                }
            """)
            
            # 이미지 로드 대기
            await browser_page.wait_for_timeout(2000)
            
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

    async def _search_via_api(
        self, 
        keyword: str, 
        sort: str = "popular",
        page: int = 1,
        size: int = 24
    ) -> Dict[str, Any]:
        """
        idus 내부 API를 직접 호출하여 상품 검색
        실제 idus가 사용하는 /v2/www-api/search/products/v2 API 사용
        """
        # 정렬 매핑 (API용)
        sort_map = {
            "popular": "POPULAR",
            "newest": "RECENT",
            "price_asc": "PRICE_ASC",
            "price_desc": "PRICE_DESC",
            "rating": "REVIEW_RATING"
        }
        sort_value = sort_map.get(sort, "POPULAR")
        
        # idus 실제 검색 API 엔드포인트 (무한 스크롤용)
        api_url = "https://www.idus.com/v2/www-api/search/products/v2"
        
        headers = {
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
            "Content-Type": "application/json",
            "Origin": "https://www.idus.com",
            "Referer": f"https://www.idus.com/v2/search?keyword={keyword}",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"',
        }
        
        # 실제 idus API 페이로드 형식
        payload = {
            "keyword": keyword,
            "page": page,
            "size": size,
            "sort": sort_value,
            "filters": {}  # 필터 옵션
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(api_url, headers=headers, json=payload, timeout=aiohttp.ClientTimeout(total=30)) as response:
                print(f"Search API response status: {response.status}")
                
                if response.status == 200:
                    data = await response.json()
                    products = []
                    
                    # 다양한 응답 구조 처리
                    raw_products = (
                        data.get("products") or 
                        data.get("data", {}).get("products") or 
                        data.get("result", {}).get("products") or
                        data.get("items") or
                        []
                    )
                    
                    total_count = (
                        data.get("totalCount") or 
                        data.get("total") or 
                        data.get("data", {}).get("totalCount") or
                        len(raw_products)
                    )
                    
                    print(f"Raw products count: {len(raw_products)}, Total: {total_count}")
                    
                    # 응답 구조 로깅 (디버깅용)
                    if raw_products and len(raw_products) > 0:
                        sample = raw_products[0]
                        print(f"Sample product keys: {list(sample.keys()) if isinstance(sample, dict) else 'not a dict'}")
                        if isinstance(sample, dict):
                            # 이미지 관련 필드 확인
                            img_fields = [k for k in sample.keys() if 'image' in k.lower() or 'img' in k.lower() or 'thumb' in k.lower()]
                            print(f"Image-related fields: {img_fields}")
                            for field in img_fields:
                                print(f"  {field}: {sample.get(field)}")
                    
                    for item in raw_products:
                        product = self._normalize_api_product(item)
                        if product:
                            products.append(product)
                    
                    # 첫 번째 상품의 이미지 URL 로그
                    if products:
                        print(f"✅ Sample product: {products[0].get('title', 'NO TITLE')[:30]}")
                        print(f"   Image URL: {products[0].get('image', 'NO IMAGE')}")
                    
                    return {
                        "products": products,
                        "total": total_count,
                        "hasMore": len(raw_products) >= size
                    }
                else:
                    text = await response.text()
                    print(f"API error response: {text[:500]}")
                    raise Exception(f"API returned {response.status}")

    def _normalize_api_product(self, item: dict) -> Optional[Dict]:
        """API 응답의 상품 데이터 정규화"""
        if not item:
            return None
        
        product_id = item.get("uuid") or item.get("id") or item.get("productId") or item.get("productUuid")
        title = item.get("name") or item.get("title") or item.get("productName")
        
        if not product_id and not title:
            return None
        
        # 이미지 URL 추출 (다양한 필드명 지원)
        image_url = ""
        
        # 1. 직접 URL 필드 확인 (우선순위 순)
        image_url_fields = [
            "imageUrl", "image", "thumbnailUrl", "mainImage", "mainImageUrl",
            "thumbUrl", "thumbnail", "productImage", "productImageUrl",
            "representImage", "representImageUrl", "coverImage", "coverImageUrl"
        ]
        
        for field in image_url_fields:
            val = item.get(field)
            if val and isinstance(val, str) and len(val) > 10:
                image_url = val
                break
        
        # 2. 이미지 ID 필드에서 URL 생성
        if not image_url:
            image_id_fields = ["imageId", "mainImageId", "thumbnailImageId", "representImageId"]
            for field in image_id_fields:
                image_id = item.get(field)
                if image_id and isinstance(image_id, str) and len(image_id) > 10:
                    image_url = f"https://image.idus.com/image/files/{image_id}_400.jpg"
                    break
        
        # 3. 중첩 객체에서 이미지 찾기
        if not image_url:
            for key in ["mainImage", "thumbnail", "image", "images"]:
                nested = item.get(key)
                if isinstance(nested, dict):
                    image_url = nested.get("url") or nested.get("imageUrl") or ""
                    if image_url:
                        break
                elif isinstance(nested, list) and len(nested) > 0:
                    first_img = nested[0]
                    if isinstance(first_img, str):
                        image_url = first_img
                    elif isinstance(first_img, dict):
                        image_url = first_img.get("url") or first_img.get("imageUrl") or ""
                    if image_url:
                        break
        
        # URL 정규화
        if image_url:
            if image_url.startswith("//"):
                image_url = "https:" + image_url
            elif image_url.startswith("/"):
                image_url = "https://www.idus.com" + image_url
        
        # 작가명 추출
        artist_name = (
            item.get("artistName") or 
            item.get("sellerName") or 
            item.get("artistNickname") or
            (item.get("artist", {}) or {}).get("name") or
            (item.get("artist", {}) or {}).get("nickname") or
            (item.get("seller", {}) or {}).get("name") or
            "작가"
        )
        
        return {
            "id": str(product_id or f"product-{hash(title) % 100000}"),
            "title": title or "상품명 없음",
            "price": item.get("price") or item.get("salePrice") or item.get("finalPrice") or 0,
            "originalPrice": item.get("originPrice") or item.get("originalPrice") or item.get("listPrice"),
            "discountRate": item.get("discountRate") or item.get("discount") or item.get("discountPercent"),
            "image": image_url,
            "artistName": artist_name,
            "rating": float(item.get("reviewAvg") or item.get("rating") or item.get("score") or item.get("reviewScore") or 0),
            "reviewCount": int(item.get("reviewCount") or item.get("reviewCnt") or item.get("reviewTotal") or 0),
            "url": f"https://www.idus.com/v2/product/{product_id}",
            "category": item.get("categoryName") or item.get("category"),
        }
    
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
        """__NUXT_DATA__에서 상품 파싱 (Nuxt3 payload 구조)"""
        products = []
        
        try:
            if not isinstance(data, list):
                return products
            
            # Nuxt3 payload는 flat array로 되어있고 참조 구조를 사용
            # 먼저 모든 객체를 수집
            all_objects = []
            for item in data:
                if isinstance(item, dict):
                    all_objects.append(item)
                elif isinstance(item, list):
                    for sub in item:
                        if isinstance(sub, dict):
                            all_objects.append(sub)
            
            # uuid나 productId를 가진 객체 찾기
            for obj in all_objects:
                if not isinstance(obj, dict):
                    continue
                    
                # 상품 데이터인지 확인
                has_uuid = "uuid" in obj
                has_name = "name" in obj or "productName" in obj
                has_price = "price" in obj or "salePrice" in obj
                
                if (has_uuid or ("id" in obj and isinstance(obj.get("id"), str) and len(obj.get("id", "")) > 10)) and has_name and has_price:
                    product = self._normalize_product(obj)
                    if product and product.get("title") and product.get("price"):
                        # 중복 확인
                        if not any(p.get("id") == product.get("id") for p in products):
                            products.append(product)
                            if len(products) >= size:
                                return products
            
            # products 배열이 있는 객체 찾기
            for obj in all_objects:
                if isinstance(obj, dict) and "products" in obj:
                    prod_list = obj["products"]
                    if isinstance(prod_list, list):
                        for p in prod_list:
                            if isinstance(p, dict):
                                product = self._normalize_product(p)
                                if product and not any(existing.get("id") == product.get("id") for existing in products):
                                    products.append(product)
                                    if len(products) >= size:
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
        
        # 이미지 URL 추출 (다양한 필드 확인)
        image_url = ""
        image_fields = ["imageUrl", "image", "thumbnailUrl", "mainImage", "thumbUrl", "img", "coverImage"]
        for field in image_fields:
            if item.get(field):
                image_url = item.get(field)
                break
        
        # images 배열에서 첫 번째 이미지
        if not image_url and item.get("images") and isinstance(item.get("images"), list) and len(item["images"]) > 0:
            first_img = item["images"][0]
            if isinstance(first_img, str):
                image_url = first_img
            elif isinstance(first_img, dict):
                image_url = first_img.get("url") or first_img.get("imageUrl") or ""
        
        # idus 이미지 URL 정규화
        if image_url and not image_url.startswith("http"):
            if image_url.startswith("//"):
                image_url = "https:" + image_url
            elif image_url.startswith("/"):
                image_url = "https://www.idus.com" + image_url
        
        return {
            "id": str(product_id or f"product-{hash(title) % 100000}"),
            "title": title or "상품명 없음",
            "price": item.get("price") or item.get("salePrice") or 0,
            "originalPrice": item.get("originPrice") or item.get("originalPrice") or item.get("listPrice"),
            "discountRate": item.get("discountRate") or item.get("discount"),
            "image": image_url,
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
                            
                            // 이미지 URL 추출 (다양한 속성 확인)
                            const img = link.querySelector('img');
                            let imageUrl = '';
                            if (img) {
                                // 우선순위: src > data-src > srcset > data-lazy > style background
                                imageUrl = img.src || '';
                                
                                // src가 base64나 placeholder면 다른 속성 확인
                                if (!imageUrl || imageUrl.includes('data:') || imageUrl.includes('placeholder') || imageUrl.length < 20) {
                                    imageUrl = img.dataset.src || img.getAttribute('data-src') || '';
                                }
                                
                                if (!imageUrl) {
                                    imageUrl = img.getAttribute('data-lazy') || img.getAttribute('data-original') || '';
                                }
                                
                                // srcset에서 추출
                                if (!imageUrl && img.srcset) {
                                    const srcsetParts = img.srcset.split(',')[0];
                                    if (srcsetParts) {
                                        imageUrl = srcsetParts.trim().split(' ')[0];
                                    }
                                }
                                
                                // 배경 이미지 확인
                                if (!imageUrl) {
                                    const style = img.style.backgroundImage;
                                    if (style) {
                                        const match = style.match(/url\\(['"]?([^'"\\)]+)['"]?\\)/);
                                        if (match) imageUrl = match[1];
                                    }
                                }
                            }
                            
                            // 이미지가 없으면 부모에서 찾기
                            if (!imageUrl) {
                                const parentImg = link.closest('div')?.querySelector('img');
                                if (parentImg) {
                                    imageUrl = parentImg.src || parentImg.dataset.src || '';
                                }
                            }
                            
                            // URL 정규화
                            if (imageUrl) {
                                if (imageUrl.startsWith('//')) {
                                    imageUrl = 'https:' + imageUrl;
                                } else if (imageUrl.startsWith('/')) {
                                    imageUrl = 'https://www.idus.com' + imageUrl;
                                }
                                // base64나 placeholder 제거
                                if (imageUrl.includes('data:') || imageUrl.includes('placeholder') || imageUrl.length < 30) {
                                    imageUrl = '';
                                }
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
