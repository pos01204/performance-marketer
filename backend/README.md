# idus 크롤링 백엔드

Python + FastAPI + Playwright + playwright-stealth를 사용한 idus 크롤링 서버입니다.

## 기술 스택

- **Python 3.11**
- **FastAPI** - 고성능 웹 프레임워크
- **Playwright** - 헤드리스 브라우저 자동화
- **playwright-stealth** - 봇 탐지 우회
- **Railway** - 배포 플랫폼

## 주요 기능

- 키워드 기반 상품 검색
- 상품 상세 정보 크롤링
- 봇 탐지 우회 (playwright-stealth)
- 불필요한 리소스 차단으로 속도 향상

## API 엔드포인트

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | 서버 상태 |
| GET | `/api/health` | 헬스 체크 |
| POST | `/api/search` | 상품 검색 |
| POST | `/api/product/detail` | 상품 상세 정보 |

### 상품 검색 예시

```bash
curl -X POST https://your-app.up.railway.app/api/search \
  -H "Content-Type: application/json" \
  -d '{"keyword": "폰케이스", "sort": "popular", "page": 1, "size": 24}'
```

### 응답 예시

```json
{
  "products": [
    {
      "id": "abc123-def456",
      "title": "가죽 폰케이스",
      "price": 35000,
      "originalPrice": 40000,
      "discountRate": 12,
      "image": "https://...",
      "artistName": "케이스공방",
      "rating": 4.8,
      "reviewCount": 324,
      "url": "https://www.idus.com/w/product/abc123-def456"
    }
  ],
  "total": 100,
  "hasMore": true,
  "keyword": "폰케이스",
  "sort": "popular",
  "page": 1
}
```

## 로컬 실행

```bash
# 가상환경 생성
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# Playwright 브라우저 설치
playwright install chromium

# 서버 실행
uvicorn app.main:app --reload --port 8000
```

## Railway 배포

1. [Railway](https://railway.app) 접속 및 로그인
2. "New Project" → "Deploy from GitHub repo"
3. 이 저장소 선택
4. **Root Directory**: `backend` 설정
5. Deploy!

자동으로 Dockerfile을 감지하여 빌드합니다.

## 환경변수

Railway에서 별도 환경변수 설정이 필요 없습니다.
필요한 경우 다음 변수를 설정할 수 있습니다:

| 변수 | 설명 | 기본값 |
|------|------|--------|
| PORT | 서버 포트 | 8000 |

## 참고

이 프로젝트는 [GB-translation](https://github.com/pos01204/GB-translation)의 크롤링 방식을 참고했습니다.
