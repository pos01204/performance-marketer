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
}

// 개발/테스트용 Mock 데이터
const mockProducts: ProductResult[] = [
  {
    id: 'prod-001',
    title: '손으로 빚은 도자기 컵 - 청화백자',
    price: 45000,
    image: '/brand/brand assets/도자.png',
    artistName: '도예공방 달',
    rating: 4.9,
    reviewCount: 128,
    url: 'https://www.idus.com/w/product/prod-001',
  },
  {
    id: 'prod-002',
    title: '내추럴 가죽 반지갑 - 브라운',
    price: 68000,
    originalPrice: 85000,
    discountRate: 20,
    image: '/brand/brand assets/가방.png',
    artistName: '가죽공방 손',
    rating: 4.8,
    reviewCount: 256,
    url: 'https://www.idus.com/w/product/prod-002',
  },
  {
    id: 'prod-003',
    title: '소이캔들 세트 - 라벤더 & 바닐라',
    price: 32000,
    image: '/brand/brand assets/캔들.png',
    artistName: '향기공방 봄',
    rating: 5.0,
    reviewCount: 89,
    url: 'https://www.idus.com/w/product/prod-003',
  },
  {
    id: 'prod-004',
    title: '천연 자개 이어링 - 달빛',
    price: 28000,
    image: '/brand/brand assets/주얼리_목걸이.png',
    artistName: '자개공방 별',
    rating: 4.7,
    reviewCount: 167,
    url: 'https://www.idus.com/w/product/prod-004',
  },
  {
    id: 'prod-005',
    title: '손뜨개 숄더백 - 아이보리',
    price: 55000,
    image: '/brand/brand assets/가방.png',
    artistName: '뜨개공방 실',
    rating: 4.9,
    reviewCount: 203,
    url: 'https://www.idus.com/w/product/prod-005',
  },
  {
    id: 'prod-006',
    title: '감성 일러스트 엽서 세트 (10장)',
    price: 12000,
    image: '/brand/brand assets/문구사무용품.png',
    artistName: '드로잉 스튜디오',
    rating: 4.8,
    reviewCount: 445,
    url: 'https://www.idus.com/w/product/prod-006',
  },
  {
    id: 'prod-007',
    title: '유기농 수제 비누 세트',
    price: 25000,
    image: '/brand/brand assets/뷰티.png',
    artistName: '비누공방 향',
    rating: 4.9,
    reviewCount: 312,
    url: 'https://www.idus.com/w/product/prod-007',
  },
  {
    id: 'prod-008',
    title: '원목 커팅보드 - 월넛',
    price: 48000,
    image: '/brand/brand assets/목공.png',
    artistName: '목공방 나무',
    rating: 4.8,
    reviewCount: 178,
    url: 'https://www.idus.com/w/product/prod-008',
  },
  {
    id: 'prod-009',
    title: '실크스크린 티셔츠 - 아트 에디션',
    price: 38000,
    image: '/brand/brand assets/실크스크린.png',
    artistName: '프린트 스튜디오',
    rating: 4.7,
    reviewCount: 89,
    url: 'https://www.idus.com/w/product/prod-009',
  },
  {
    id: 'prod-010',
    title: '다육이 화분 세트 - 미니멀',
    price: 22000,
    image: '/brand/brand assets/플랜트.png',
    artistName: '플랜트 하우스',
    rating: 4.9,
    reviewCount: 267,
    url: 'https://www.idus.com/w/product/prod-010',
  },
  {
    id: 'prod-011',
    title: '수제 마카롱 12개입 세트',
    price: 35000,
    image: '/brand/brand assets/디저트.png',
    artistName: '마카롱 공방',
    rating: 5.0,
    reviewCount: 521,
    url: 'https://www.idus.com/w/product/prod-011',
  },
  {
    id: 'prod-012',
    title: '미니어처 카메라 키링',
    price: 15000,
    image: '/brand/brand assets/카메라.png',
    artistName: '미니어처 스튜디오',
    rating: 4.6,
    reviewCount: 134,
    url: 'https://www.idus.com/w/product/prod-012',
  },
];

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
    const { keyword, sort = 'popular', page = 1 } = req.body;

    if (!keyword || keyword.trim().length === 0) {
      return res.status(400).json({ error: 'Keyword is required' });
    }

    // TODO: 실제 Puppeteer 크롤링 구현
    // 현재는 Mock 데이터 반환
    
    // 키워드 필터링 시뮬레이션
    const searchLower = keyword.toLowerCase();
    let filteredProducts = mockProducts.filter(p => 
      p.title.toLowerCase().includes(searchLower) ||
      p.artistName.toLowerCase().includes(searchLower)
    );

    // 검색어에 관계없이 일부 결과 반환 (데모용)
    if (filteredProducts.length === 0) {
      filteredProducts = mockProducts.slice(0, 8);
    }

    // 정렬
    switch (sort) {
      case 'newest':
        // 랜덤하게 섞기 (데모용)
        filteredProducts.sort(() => Math.random() - 0.5);
        break;
      case 'price_asc':
        filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        filteredProducts.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filteredProducts.sort((a, b) => b.rating - a.rating);
        break;
      default: // popular
        filteredProducts.sort((a, b) => b.reviewCount - a.reviewCount);
    }

    // 인위적인 지연 (실제 크롤링 시간 시뮬레이션)
    await new Promise(resolve => setTimeout(resolve, 500));

    return res.status(200).json({
      products: filteredProducts,
      total: filteredProducts.length,
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
