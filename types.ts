// ============================================
// 이미지 파일 타입
// ============================================
export interface ImageFile {
  name: string;
  base64: string;
  mimeType: string;
}

// ============================================
// idus 작품 관련 타입
// ============================================
export interface IdusProduct {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  discountRate?: number;
  image: string;
  images?: string[];
  additionalImages?: string[];
  artistName: string;
  artistId?: string;
  artistProfileImage?: string;
  artistDescription?: string;
  rating: number;
  reviewCount: number;
  url: string;
  description?: string;
  category?: string;
  subcategory?: string;
  tags?: string[];
  shippingInfo?: string;
}

export interface ProductSearchParams {
  keyword: string;
  sort?: 'popular' | 'newest' | 'price_asc' | 'price_desc' | 'rating';
  page?: number;
}

export interface ProductSearchResult {
  products: IdusProduct[];
  total: number;
  keyword: string;
  sort: string;
}

// ============================================
// 소셜 콘텐츠 생성 타입
// ============================================
export type ContentFormat = 'feed' | 'carousel' | 'reels';
export type Platform = 'meta' | 'x';
export type Language = 'korean' | 'english' | 'japanese';

export interface SocialContentInput {
  products: IdusProduct[];
  platforms: Platform[];
  languages: Language[];
  format: ContentFormat;
  tone: string;
  seasonalEvent: string | null;
  includeReasoning: boolean;
}

export interface CaptionBlock {
  type: 'feed';
  caption: string;
  hashtags: string[];
}

export interface CarouselSlide {
  slideNumber: number;
  visualDesc: string;
  textOverlay: string;
  caption: string;
}

export interface CarouselBlock {
  type: 'carousel';
  slides: CarouselSlide[];
  caption: string;
  hashtags: string[];
}

export interface ReelsScene {
  timestamp: string;
  visualAction: string;
  audio: string;
  caption: string;
}

export interface ReelsBlock {
  type: 'reels';
  script: ReelsScene[];
  caption: string;
  hashtags: string[];
}

export type ContentResult = CaptionBlock | CarouselBlock | ReelsBlock;

export interface PlatformContent {
  meta: ContentResult;
  x: ContentResult;
}

export interface LanguageOutput {
  korean: PlatformContent;
  english: PlatformContent;
  japanese: PlatformContent;
}

export interface VisualStrategy {
  selectedImageIndex: number;
  rationale: string;
  visualFocus: string;
}

export interface SocialContentResult {
  marketingContent: Partial<LanguageOutput>;
  visualStrategy: {
    korean?: VisualStrategy;
    english?: VisualStrategy;
    japanese?: VisualStrategy;
  };
  reasoning: {
    korean?: string;
    english?: string;
    japanese?: string;
  } | null;
}

// ============================================
// CRM 카피 생성 타입
// ============================================
export type CrmType = 'product' | 'exhibition' | 'artist';
export type CrmTrigger = 'welcome_series' | 'cart_abandonment' | 'browse_abandonment' | 'post_purchase' | 'win_back';
export type TargetRegion = 'north_america' | 'japan';

export interface CrmContentInput {
  crmType: CrmType;
  // 작품 기반
  products?: IdusProduct[];
  // 기획전 기반
  exhibitionUrl?: string;
  exhibitionTitle?: string;
  exhibitionBenefit?: string;
  exhibitionPeriod?: { start: string; end: string };
  // 작가 기반
  artistUrl?: string;
  artistName?: string;
  artistStory?: string;
  // 공통
  trigger: CrmTrigger;
  targetRegions: TargetRegion[];
  variables: string[];
  additionalBenefit?: string;
}

export interface CrmCopy {
  mainCopy: string;
  subCopy: string;
}

export interface CrmLanguageOutput {
  korean: CrmCopy[];
  english: CrmCopy[];
  japanese: CrmCopy[];
}

export interface SendingTimeSuggestion {
  region: 'North America' | 'Japan';
  time: string;
  reason: string;
}

export interface CrmContentResult {
  crmContent: Partial<CrmLanguageOutput>;
  sendingTime: SendingTimeSuggestion[];
}

// ============================================
// 히스토리 타입
// ============================================
export interface GeneratedContent {
  id: string;
  createdAt: string;
  type: 'social' | 'crm' | 'both';
  
  // 입력 데이터
  products: IdusProduct[];
  
  // 소셜 콘텐츠
  socialInput?: SocialContentInput;
  socialResult?: SocialContentResult;
  
  // CRM 콘텐츠
  crmInput?: CrmContentInput;
  crmResult?: CrmContentResult;
}

// ============================================
// 앱 전역 상태 타입
// ============================================
export type AppTab = 'discovery' | 'studio' | 'history';

export interface AppState {
  // 현재 탭
  activeTab: AppTab;
  
  // 선택된 작품
  selectedProducts: IdusProduct[];
  
  // 생성된 콘텐츠 히스토리
  history: GeneratedContent[];
  
  // 설정
  settings: {
    defaultLanguages: Language[];
    defaultPlatforms: Platform[];
    defaultTone: string;
    defaultTrigger: CrmTrigger;
  };
}

// ============================================
// 유틸리티 타입
// ============================================
export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
