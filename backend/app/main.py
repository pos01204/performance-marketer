"""
idus 크롤링 API 서버
playwright-stealth를 사용하여 봇 탐지 우회
"""

import os
import sys
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List

print("=" * 50, file=sys.stderr, flush=True)
print("IDUS CRAWLER API LOADING", file=sys.stderr, flush=True)
print(f"PORT: {os.environ.get('PORT', '8000')}", file=sys.stderr, flush=True)
print("=" * 50, file=sys.stderr, flush=True)

app = FastAPI(
    title="Idus Crawler API",
    description="아이디어스 상품 검색 및 크롤링 API",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 전역 스크래퍼 인스턴스 (지연 로딩)
_scraper = None


class SearchRequest(BaseModel):
    keyword: str
    sort: str = "popular"
    page: int = 1
    size: int = 24


class ProductItem(BaseModel):
    id: str
    title: str
    price: int
    originalPrice: Optional[int] = None
    discountRate: Optional[int] = None
    image: str
    artistName: str
    rating: float
    reviewCount: int
    url: str
    category: Optional[str] = None


class SearchResponse(BaseModel):
    products: List[ProductItem]
    total: int
    hasMore: bool
    keyword: str
    sort: str
    page: int


class ProductDetailRequest(BaseModel):
    url: str


async def get_scraper():
    """스크래퍼 인스턴스 가져오기 (지연 로딩)"""
    global _scraper
    if _scraper is None:
        print("Initializing scraper...", file=sys.stderr, flush=True)
        from .scraper import IdusScraper
        _scraper = IdusScraper()
        await _scraper.initialize()
        print("Scraper initialized!", file=sys.stderr, flush=True)
    return _scraper


@app.get("/")
async def root():
    """루트 엔드포인트 - 헬스체크용"""
    return {"status": "ok", "service": "idus-crawler"}


@app.get("/health")
async def health():
    """헬스 체크"""
    return {"status": "healthy"}


@app.get("/api/health")
async def api_health():
    """API 헬스 체크"""
    return {"status": "healthy", "service": "idus-crawler"}


@app.post("/api/search")
async def search_products(request: SearchRequest):
    """키워드로 idus 상품 검색"""
    try:
        scraper_instance = await get_scraper()
        result = await scraper_instance.search_products(
            keyword=request.keyword,
            sort=request.sort,
            page=request.page,
            size=request.size
        )
        
        return {
            "products": result["products"],
            "total": result["total"],
            "hasMore": result["hasMore"],
            "keyword": request.keyword,
            "sort": request.sort,
            "page": request.page
        }
    except Exception as e:
        print(f"Search error: {e}", file=sys.stderr, flush=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/product/detail")
async def get_product_detail(request: ProductDetailRequest):
    """상품 URL로 상세 정보 가져오기"""
    try:
        scraper_instance = await get_scraper()
        result = await scraper_instance.get_product_detail(request.url)
        return result
    except Exception as e:
        print(f"Product detail error: {e}", file=sys.stderr, flush=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.on_event("shutdown")
async def shutdown_event():
    """서버 종료 시 정리"""
    global _scraper
    if _scraper:
        await _scraper.close()
        print("Browser closed", file=sys.stderr, flush=True)


print("FastAPI app created successfully", file=sys.stderr, flush=True)
