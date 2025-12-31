# idus Marketing Studio

아이디어스 글로벌 비즈니스를 위한 퍼포먼스 마케팅 자동화 도구입니다.

## 주요 기능

### 📱 작품 탐색 (Product Discovery)
- 키워드 기반 아이디어스 작품 검색
- 정렬 및 필터링 (인기순, 최신순, 가격순, 평점순)
- 다중 작품 선택 (최대 5개)

### ✨ 콘텐츠 스튜디오 (Content Studio)
- **소셜 콘텐츠 생성**: Meta(Instagram), X(Twitter) 대응
- **다국어 지원**: 한국어, 영어, 일본어 동시 생성
- **콘텐츠 포맷**: 피드, 카드뉴스(캐러셀), 릴스 대본
- **해시태그 자동 필터링**: 경쟁사 태그 제외, 브랜드 태그 필수 포함
- **CRM 카피 생성**: 트리거 기반 푸시 메시지 A/B 테스트안

### 📊 히스토리 (History)
- 생성된 콘텐츠 기록 저장
- 마크다운 내보내기
- 복사 및 재활용

## 기술 스택

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS + Framer Motion
- **State**: Zustand (로컬 스토리지 영속화)
- **AI**: Google Gemini 2.5 Flash
- **UI Components**: Radix UI + Lucide Icons
- **Deployment**: Vercel + Railway

## 환경 변수

프로젝트 루트에 `.env` 파일 생성:

\`\`\`env
# Gemini API Key (필수)
GEMINI_API_KEY=your_gemini_api_key_here

# API URL (선택 - 배포 시 자동 설정됨)
VITE_API_URL=
\`\`\`

## 설치 및 실행

\`\`\`bash
# 의존성 설치
npm install

# 개발 서버 시작
npm run dev

# 빌드
npm run build

# 프로덕션 미리보기
npm run preview
\`\`\`

## 프로젝트 구조

\`\`\`
├── api/                    # Vercel Serverless Functions
│   └── crawl/
│       └── search.ts       # idus 크롤링 API
├── components/             # React 컴포넌트
│   ├── ProductCard.tsx     # 작품 카드
│   ├── ProductDiscovery.tsx # 작품 탐색 탭
│   ├── ContentStudio.tsx   # 콘텐츠 생성 탭
│   └── History.tsx         # 히스토리 탭
├── services/               # API 서비스
│   ├── geminiService.ts    # 소셜 콘텐츠 생성
│   ├── crmService.ts       # CRM 카피 생성
│   └── idusService.ts      # 작품 검색
├── store/                  # 상태 관리
│   └── campaignStore.ts    # Zustand 스토어
├── App.tsx                 # 메인 앱 컴포넌트
├── constants.ts            # 상수 정의 (해시태그 룰 포함)
├── types.ts                # TypeScript 타입 정의
└── index.tsx               # 엔트리 포인트
\`\`\`

## 해시태그 룰 시스템

### 금지 태그 (Blocklist)
- 경쟁사: etsy, etsyfinds, minne, creema, amazon...
- 타 플랫폼: 쿠팡, 네이버쇼핑, ebay, aliexpress...
- 스팸성: followforfollow, likeforlike...

### 필수 태그 (Required)
- 한국어: #아이디어스, #핸드메이드
- 영어: #idus, #handmade, #handcrafted
- 일본어: #アイディアス, #ハンドメイド

## 배포

### Vercel

\`\`\`bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel
\`\`\`

### Railway

Railway 대시보드에서 GitHub 저장소 연결 후 자동 배포

## 라이선스

Private - idus Global Business Team
