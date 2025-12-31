"""
idus 크롤링 API 서버
playwright-stealth를 사용하여 봇 탐지 우회
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os

from .scraper import IdusScaper

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

# 스크래퍼 인스턴스
scraper = IdusScaper()


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


@app.get("/")
async def root():
    return {"message": "Idus Crawler API", "status": "running"}


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "idus-crawler"}


@app.post("/api/search", response_model=SearchResponse)
async def search_products(request: SearchRequest):
    """
    키워드로 idus 상품 검색
    """
    try:
        result = await scraper.search_products(
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
    """
    상품 URL로 상세 정보 가져오기
    """
    try:
        result = await scraper.get_product_detail(request.url)
        return ProductDetailResponse(**result)
    except Exception as e:
        print(f"Product detail error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.on_event("startup")
async def startup_event():
    """서버 시작 시 브라우저 초기화"""
    await scraper.initialize()
    print("Browser initialized")


@app.on_event("shutdown")
async def shutdown_event():
    """서버 종료 시 브라우저 정리"""
    await scraper.close()
    print("Browser closed")
