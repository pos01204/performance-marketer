// ============================================
// 플랫폼 & 언어 옵션
// ============================================
export const PLATFORM_OPTIONS = [
  { id: 'meta', label: 'Meta (Instagram/Facebook)', icon: 'instagram' },
  { id: 'x', label: 'X (Twitter)', icon: 'twitter' },
] as const;

export const LANGUAGE_OPTIONS = [
  { id: 'korean', label: '한국어', flag: '🇰🇷' },
  { id: 'english', label: 'English', flag: '🇺🇸' },
  { id: 'japanese', label: '日本語', flag: '🇯🇵' },
] as const;

// ============================================
// 콘텐츠 포맷 옵션
// ============================================
export const CONTENT_FORMAT_OPTIONS = [
  { id: 'feed', label: '피드', description: '이미지 + 캡션', icon: '🖼️' },
  { id: 'carousel', label: '카드뉴스', description: '슬라이드형', icon: '📑' },
  { id: 'reels', label: '릴스', description: '영상 대본', icon: '🎥' },
] as const;

// ============================================
// 톤앤매너 옵션
// ============================================
export const TONE_OPTIONS = [
  { id: '따뜻하고 감성적인', label: '따뜻하고 감성적인', emoji: '🌸' },
  { id: '모던하고 세련된', label: '모던하고 세련된', emoji: '✨' },
  { id: '유쾌하고 발랄한', label: '유쾌하고 발랄한', emoji: '🎉' },
  { id: '전문적이고 신뢰감 있는', label: '전문적이고 신뢰감 있는', emoji: '💼' },
  { id: '미니멀하고 간결한', label: '미니멀하고 간결한', emoji: '🎯' },
] as const;

// ============================================
// 정렬 옵션
// ============================================
export const SORT_OPTIONS = [
  { id: 'popular', label: '인기순' },
  { id: 'newest', label: '최신순' },
  { id: 'price_asc', label: '가격 낮은순' },
  { id: 'price_desc', label: '가격 높은순' },
  { id: 'rating', label: '평점순' },
] as const;

// ============================================
// CRM 설정
// ============================================
export const CRM_TYPE_OPTIONS = [
  { 
    id: 'product', 
    label: '작품 기반', 
    description: '선택한 작품의 구매를 유도합니다',
    badge: '기본',
  },
  { 
    id: 'exhibition', 
    label: '기획전 기반', 
    description: '기획전 URL을 입력하여 CRM 생성',
    badge: '확장',
  },
  { 
    id: 'artist', 
    label: '작가 홈 기반', 
    description: '작가 홈 URL을 입력하여 CRM 생성',
    badge: '확장',
  },
] as const;

export const CRM_TRIGGER_OPTIONS = [
  { 
    id: 'cart_abandonment', 
    label: '🛒 장바구니 유기',
    description: '상품을 담고 구매하지 않은 고객에게 리마인드',
  },
  { 
    id: 'browse_abandonment', 
    label: '👀 조회 이탈',
    description: '상세페이지만 보고 이탈한 고객의 관심 환기',
  },
  { 
    id: 'welcome_series', 
    label: '👋 가입 환영',
    description: '회원가입 직후 첫 구매 유도',
  },
  { 
    id: 'post_purchase', 
    label: '🚚 구매 후 리뷰 요청',
    description: '배송 완료 후 리뷰 작성 유도',
  },
  { 
    id: 'win_back', 
    label: '💤 휴면 복귀',
    description: '30일 이상 미방문 고객에게 혜택 제안',
  },
] as const;

export const CRM_VARIABLE_OPTIONS = [
  { id: 'user_name', label: '고객명', token: '{{user_name}}' },
  { id: 'product_name', label: '작품명', token: '{{product_name}}' },
  { id: 'discount_rate', label: '할인율', token: '{{discount_rate}}' },
  { id: 'coupon_expiry', label: '만료일', token: '{{coupon_expiry}}' },
] as const;

export const TARGET_REGION_OPTIONS = [
  { id: 'north_america', label: '북미 (English)', flag: '🇺🇸' },
  { id: 'japan', label: '일본 (日本語)', flag: '🇯🇵' },
] as const;

// ============================================
// 해시태그 룰 시스템 (핵심!)
// ============================================

// 절대 금지 해시태그 (경쟁사, 타 플랫폼, 스팸성)
export const HASHTAG_BLOCKLIST = [
  // 경쟁사 - Etsy
  'etsy', 'etsyfinds', 'etsyseller', 'etsyshop', 'etsystore', 'etsygifts',
  'etsyuk', 'etsyusa', 'etsylove', 'etsyhunter', 'etsyhandmade', 'etsyjewelry',
  'etsywedding', 'etsysmall', 'shopetsy', 'etsyshare',
  
  // 경쟁사 - Minne (일본)
  'minne', 'ミンネ', 'minne作家', 'minneで販売中', 'minneにて販売中',
  
  // 경쟁사 - Creema (일본)
  'creema', 'クリーマ', 'creema作家', 'creemaで販売中',
  
  // 경쟁사 - Amazon
  'amazonhandmade', 'amazon', 'アマゾン', 'amazonfba',
  
  // 타 플랫폼 - 국내
  '쿠팡', 'coupang', '네이버쇼핑', 'smartstore', '스마트스토어',
  '11번가', 'gmarket', 'g마켓', '옥션', 'auction', '위메프', '티몬',
  
  // 타 플랫폼 - 해외
  'shopee', '쇼피', 'lazada', 'alibaba', 'aliexpress', '알리익스프레스',
  'ebay', '이베이', 'wish', 'temu', '테무',
  
  // 스팸성 태그
  'followforfollow', 'f4f', 'follow4follow', 'followback',
  'likeforlike', 'l4l', 'like4like', 'likeback',
  'followme', 'instalike', 'instagood', 'instadaily',
  'tagsforlikes', 'tflers', 'spam4spam',
  
  // 부적절한 태그
  '광고', 'ad', 'sponsored', 'pr', '협찬',
] as const;

// 필수 포함 해시태그 (브랜드)
export const HASHTAG_REQUIRED = {
  brand: {
    korean: ['아이디어스', '핸드메이드', '수공예'],
    english: ['idus', 'handmade', 'handcrafted'],
    japanese: ['アイディアス', 'ハンドメイド', '手作り'],
  },
  recommended: {
    korean: ['작가작품', '온리원', '선물추천', '수제'],
    english: ['shopsmall', 'supportsmallbusiness', 'artisan', 'handmadegifts', 'madewithlove'],
    japanese: ['作家さんの作品', '一点もの', 'ハンドメイド好きさんと繋がりたい', '手仕事'],
  },
} as const;

// 카테고리별 권장 해시태그
export const HASHTAG_BY_CATEGORY = {
  jewelry: {
    korean: ['주얼리', '악세서리', '귀걸이', '목걸이', '반지', '팔찌'],
    english: ['jewelry', 'accessories', 'earrings', 'necklace', 'rings', 'bracelet'],
    japanese: ['ジュエリー', 'アクセサリー', 'ピアス', 'ネックレス', 'リング'],
  },
  ceramic: {
    korean: ['도자기', '그릇', '컵', '머그컵', '도예', '접시'],
    english: ['ceramic', 'pottery', 'cup', 'mug', 'ceramicart', 'handmadepottery'],
    japanese: ['陶器', '器', 'カップ', 'マグカップ', '陶芸', '焼き物'],
  },
  leather: {
    korean: ['가죽', '지갑', '카드지갑', '가죽공예', '레더', '가방'],
    english: ['leather', 'wallet', 'leathercraft', 'leathergoods', 'handstitched', 'leatherbag'],
    japanese: ['革', '財布', 'レザー', 'レザークラフト', '革小物', '革製品'],
  },
  candle: {
    korean: ['캔들', '양초', '향초', '소이캔들', '아로마', '디퓨저'],
    english: ['candle', 'soycandle', 'handmadecandle', 'aromatherapy', 'diffuser', 'homedecor'],
    japanese: ['キャンドル', 'アロマキャンドル', 'ソイキャンドル', 'ディフューザー'],
  },
  textile: {
    korean: ['패브릭', '자수', '뜨개질', '니트', '가방', '파우치'],
    english: ['textile', 'embroidery', 'knitting', 'crochet', 'fabricart', 'pouch'],
    japanese: ['ファブリック', '刺繍', '編み物', 'ニット', 'ポーチ'],
  },
  stationery: {
    korean: ['문구', '다이어리', '노트', '스티커', '씰스티커', '엽서'],
    english: ['stationery', 'planner', 'notebook', 'stickers', 'postcard', 'papergoods'],
    japanese: ['文房具', '手帳', 'ノート', 'シール', 'ステッカー', 'ポストカード'],
  },
} as const;

// ============================================
// 시즌 이벤트 캘린더
// ============================================
export interface SeasonalEvent {
  id: string;
  label: string;
  month: number;
  day: number;
  region: 'North America' | 'Japan' | 'Global';
  keywords: string[];
  emoji: string;
}

export const SEASONAL_EVENTS: SeasonalEvent[] = [
  // 1월
  { id: 'new_year', label: "새해", month: 1, day: 1, region: 'Global', keywords: ['새해선물', 'New Year', '新年'], emoji: '🌅' },
  { id: 'seijin_no_hi', label: "성인의 날", month: 1, day: 9, region: 'Japan', keywords: ['성인식', '成人の日'], emoji: '👘' },
  
  // 2월
  { id: 'valentines', label: "발렌타인데이", month: 2, day: 14, region: 'Global', keywords: ['발렌타인', 'Valentine', 'バレンタイン'], emoji: '💝' },
  
  // 3월
  { id: 'white_day', label: "화이트데이", month: 3, day: 14, region: 'Japan', keywords: ['화이트데이', 'ホワイトデー'], emoji: '🍬' },
  { id: 'sakura', label: "벚꽃 시즌", month: 3, day: 25, region: 'Japan', keywords: ['벚꽃', '桜', 'Sakura'], emoji: '🌸' },
  
  // 5월
  { id: 'mothers_day', label: "어머니의 날", month: 5, day: 12, region: 'Global', keywords: ['어머니날', "Mother's Day", '母の日'], emoji: '💐' },
  
  // 6월
  { id: 'fathers_day', label: "아버지의 날", month: 6, day: 16, region: 'Global', keywords: ['아버지날', "Father's Day", '父の日'], emoji: '👔' },
  
  // 10월
  { id: 'halloween', label: "할로윈", month: 10, day: 31, region: 'Global', keywords: ['할로윈', 'Halloween', 'ハロウィン'], emoji: '🎃' },
  
  // 11월
  { id: 'thanksgiving', label: "추수감사절", month: 11, day: 28, region: 'North America', keywords: ['추수감사절', 'Thanksgiving'], emoji: '🦃' },
  { id: 'black_friday', label: "블랙프라이데이", month: 11, day: 29, region: 'North America', keywords: ['블프', 'Black Friday', 'Sale'], emoji: '🛍️' },
  
  // 12월
  { id: 'christmas', label: "크리스마스", month: 12, day: 25, region: 'Global', keywords: ['크리스마스', 'Christmas', 'クリスマス', '선물'], emoji: '🎄' },
];

// ============================================
// 이미지 설정
// ============================================
export const MAX_IMAGES = 5;
export const MAX_IMAGE_SIZE_MB = 4;
export const MAX_SELECTED_PRODUCTS = 5;

// ============================================
// 검색 설정
// ============================================
export const SEARCH_RESULTS_PER_PAGE = 24;
export const SEARCH_DEBOUNCE_MS = 300;

// ============================================
// 기본값
// ============================================
export const DEFAULT_SETTINGS = {
  defaultLanguages: ['english', 'japanese'] as const,
  defaultPlatforms: ['meta', 'x'] as const,
  defaultTone: '따뜻하고 감성적인',
  defaultTrigger: 'cart_abandonment' as const,
  defaultFormat: 'feed' as const,
};
