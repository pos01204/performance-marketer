"""
idus 크롤링 API 서버
playwright-stealth를 사용하여 봇 탐지 우회
"""

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from contextlib import asynccontextmanager

# 전역 스크래퍼 인스턴스
scraper = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """앱 수명주기 관리"""
    global scraper
    # 시작 시 스크래퍼 초기화는 첫 요청 시 지연 로딩
    print("Server starting...")
    yield
    # 종료 시 정리
    if scraper:
        await scraper.close()
        print("Browser closed")


app = FastAPI(
    title="Idus Crawler API",
    description="아이디어스 상품 검색 및 크롤링 API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


class ProductDetailResponse(BaseModel):
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
    description: Optional[str] = None
    additionalImages: List[str] = []
    options: List[dict] = []
    tags: List[str] = []


async def get_scraper():
    """스크래퍼 인스턴스 가져오기 (지연 로딩)"""
    global scraper
    if scraper is None:
        from .scraper import IdusScraper
        scraper = IdusScraper()
        await scraper.initialize()
        print("Browser initialized")
    return scraper


@app.get("/")
async def root():
    """루트 엔드포인트"""
    return {"message": "Idus Crawler API", "status": "running"}


@app.get("/api/health")
async def health_check():
    """헬스 체크 - 빠르게 응답"""
    return {"status": "healthy", "service": "idus-crawler"}


@app.get("/health")
async def health_check_alt():
    """대체 헬스 체크 경로"""
    return {"status": "healthy"}


@app.post("/api/search", response_model=SearchResponse)
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
        
        return SearchResponse(
            products=[ProductItem(**p) for p in result["products"]],
            total=result["total"],
            hasMore=result["hasMore"],
            keyword=request.keyword,
            sort=request.sort,
            page=request.page
        )
    except Exception as e:
        print(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/product/detail", response_model=ProductDetailResponse)
async def get_product_detail(request: ProductDetailRequest):
    """상품 URL로 상세 정보 가져오기"""
    try:
        scraper_instance = await get_scraper()
        result = await scraper_instance.get_product_detail(request.url)
        return ProductDetailResponse(**result)
    except Exception as e:
        print(f"Product detail error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
