import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  AppTab, 
  IdusProduct, 
  GeneratedContent, 
  Language, 
  Platform, 
  CrmTrigger,
  ContentFormat
} from '../types';
import { DEFAULT_SETTINGS, MAX_SELECTED_PRODUCTS } from '../constants';

interface CampaignStore {
  // 현재 탭
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;

  // 선택된 작품
  selectedProducts: IdusProduct[];
  addProduct: (product: IdusProduct) => void;
  removeProduct: (productId: string) => void;
  clearProducts: () => void;
  isProductSelected: (productId: string) => boolean;

  // 검색 상태
  searchKeyword: string;
  setSearchKeyword: (keyword: string) => void;
  searchResults: IdusProduct[];
  setSearchResults: (products: IdusProduct[]) => void;
  isSearching: boolean;
  setIsSearching: (loading: boolean) => void;
  searchError: string | null;
  setSearchError: (error: string | null) => void;

  // 생성 상태
  isGenerating: boolean;
  setIsGenerating: (loading: boolean) => void;
  generationError: string | null;
  setGenerationError: (error: string | null) => void;

  // 히스토리
  history: GeneratedContent[];
  addToHistory: (content: GeneratedContent) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;

  // 설정
  settings: {
    defaultLanguages: Language[];
    defaultPlatforms: Platform[];
    defaultTone: string;
    defaultTrigger: CrmTrigger;
    defaultFormat: ContentFormat;
  };
  updateSettings: (settings: Partial<CampaignStore['settings']>) => void;

  // 유틸리티
  reset: () => void;
}

const initialState = {
  activeTab: 'discovery' as AppTab,
  selectedProducts: [],
  searchKeyword: '',
  searchResults: [],
  isSearching: false,
  searchError: null,
  isGenerating: false,
  generationError: null,
  history: [],
  settings: {
    defaultLanguages: [...DEFAULT_SETTINGS.defaultLanguages] as Language[],
    defaultPlatforms: [...DEFAULT_SETTINGS.defaultPlatforms] as Platform[],
    defaultTone: DEFAULT_SETTINGS.defaultTone,
    defaultTrigger: DEFAULT_SETTINGS.defaultTrigger,
    defaultFormat: DEFAULT_SETTINGS.defaultFormat,
  },
};

export const useCampaignStore = create<CampaignStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // 탭 관리
      setActiveTab: (tab) => set({ activeTab: tab }),

      // 작품 선택 관리
      addProduct: (product) => {
        const { selectedProducts } = get();
        if (selectedProducts.length >= MAX_SELECTED_PRODUCTS) {
          return; // 최대 개수 초과
        }
        if (selectedProducts.some(p => p.id === product.id)) {
          return; // 이미 선택됨
        }
        set({ selectedProducts: [...selectedProducts, product] });
      },

      removeProduct: (productId) => {
        set((state) => ({
          selectedProducts: state.selectedProducts.filter(p => p.id !== productId),
        }));
      },

      clearProducts: () => set({ selectedProducts: [] }),

      isProductSelected: (productId) => {
        return get().selectedProducts.some(p => p.id === productId);
      },

      // 검색 상태 관리
      setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),
      setSearchResults: (products) => set({ searchResults: products }),
      setIsSearching: (loading) => set({ isSearching: loading }),
      setSearchError: (error) => set({ searchError: error }),

      // 생성 상태 관리
      setIsGenerating: (loading) => set({ isGenerating: loading }),
      setGenerationError: (error) => set({ generationError: error }),

      // 히스토리 관리
      addToHistory: (content) => {
        set((state) => ({
          history: [content, ...state.history].slice(0, 100), // 최대 100개 유지
        }));
      },

      removeFromHistory: (id) => {
        set((state) => ({
          history: state.history.filter(h => h.id !== id),
        }));
      },

      clearHistory: () => set({ history: [] }),

      // 설정 관리
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      // 리셋
      reset: () => set(initialState),
    }),
    {
      name: 'idus-marketing-studio',
      partialize: (state) => ({
        history: state.history,
        settings: state.settings,
        selectedProducts: state.selectedProducts,
      }),
    }
  )
);

// 선택된 작품 수를 쉽게 가져오는 셀렉터
export const useSelectedProductCount = () => 
  useCampaignStore((state) => state.selectedProducts.length);

// 히스토리 개수를 쉽게 가져오는 셀렉터
export const useHistoryCount = () => 
  useCampaignStore((state) => state.history.length);
