# idus 실제 크롤링 구현 완료 보고서

## 📋 작업 개요
Mock 데이터 대신 실제 idus 검색 결과를 가져오도록 크롤링 기능 구현

---

## ✅ 완료된 작업

### 1. Vercel Serverless API 구현
**파일**: `api/crawl/search.ts`

**기능**:
- idus 내부 API 호출 (`api.idus.com/api/v2/search/product`)
- API 실패 시 웹 페이지 스크래핑 fallback
- `__NEXT_DATA__` 스크립트에서 데이터 추출
- JSON-LD 데이터 파싱 지원
- 정렬 옵션 매핑 (인기순, 최신순, 가격순, 평점순)

### 2. 프론트엔드 서비스 업데이트
**파일**: `services/idusService.ts`

**변경사항**:
- `USE_MOCK_IN_DEV = false` 설정으로 실제 API 호출
- 3단계 fallback 전략:
  1. Vercel API 호출 시도
  2. 직접 idus API 호출 (프록시 경유)
  3. idus 웹 페이지 크롤링
  4. 최후의 수단으로 Mock 데이터

**새로 추가된 함수**:
- `searchIdusProductsWithPagination()`: API 호출 (페이지네이션)
- `searchIdusDirectly()`: 직접 idus API 호출
- `searchIdusWebPage()`: 웹 페이지 크롤링
- `parseIdusSearchHtml()`: HTML 파싱
- `getProductDetail()`: 상품 상세 정보 가져오기
- `extractProductIdFromUrl()`: URL에서 상품 ID 추출
- `getMultipleProductDetails()`: 여러 상품 일괄 조회

### 3. Vite 프록시 설정
**파일**: `vite.config.ts`

**프록시 경로**:
- `/idus-proxy` → `https://www.idus.com` (웹 페이지)
- `/idus-api` → `https://api.idus.com` (API)
- `/api` → `http://localhost:3001` (로컬 API 서버)

### 4. Vercel 배포 설정
**파일**: `vercel.json`

**설정**:
- API 함수 메모리: 1024MB
- 최대 실행 시간: 30초
- CORS 헤더 설정
- 캐시 비활성화

---

## 🔧 데이터 흐름

```
[사용자 검색]
      ↓
[searchProductsWithPagination()]
      ↓
┌─────────────────────────────────────┐
│  1. Vercel API 호출 시도            │
│     /api/crawl/search               │
│     ↓ 실패 시                       │
│  2. 직접 idus API 호출              │
│     /idus-api/api/v2/search/product │
│     ↓ 실패 시                       │
│  3. 웹 페이지 크롤링                │
│     /idus-proxy/w/search            │
│     ↓ 실패 시                       │
│  4. Mock 데이터 반환                │
└─────────────────────────────────────┘
      ↓
[검색 결과 표시]
```

---

## 📦 응답 데이터 구조

```typescript
interface IdusProduct {
  id: string;           // 상품 UUID
  title: string;        // 상품명
  price: number;        // 판매가
  originalPrice?: number; // 정가
  discountRate?: number;  // 할인율
  image: string;        // 대표 이미지 URL
  artistName: string;   // 작가명
  rating: number;       // 평점 (0-5)
  reviewCount: number;  // 리뷰 수
  url: string;          // 상품 페이지 URL
  category?: string;    // 카테고리
}
```

---

## 🚀 배포 방법

### 1. 환경 변수 설정 (Vercel Dashboard)
```
GEMINI_API_KEY=your_api_key_here
```

### 2. Git Push
```bash
git add .
git commit -m "feat: idus 실제 크롤링 구현"
git push origin main
```

### 3. Vercel 자동 배포
- GitHub 연동 시 자동 배포
- 또는 `vercel --prod` 명령어 사용

---

## ⚠️ 주의사항

1. **CORS 제한**: 
   - 브라우저에서 직접 idus API 호출 불가
   - 반드시 서버사이드(Vercel API) 또는 프록시 경유 필요

2. **Rate Limiting**:
   - idus API에 과도한 요청 시 차단될 수 있음
   - 적절한 요청 간격 유지 권장

3. **데이터 구조 변경**:
   - idus 웹사이트 구조 변경 시 파싱 로직 수정 필요
   - `__NEXT_DATA__` 구조 모니터링 필요

---

## 📅 완료일
2024년 12월 31일
