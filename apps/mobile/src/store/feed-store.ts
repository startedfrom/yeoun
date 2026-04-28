import type { FeedTab } from '@gamdojang/domain';
import { create } from 'zustand';

type FeedState = {
  currentTab: FeedTab;
  setCurrentTab: (tab: FeedTab) => void;
};

export const useFeedStore = create<FeedState>((set) => ({
  currentTab: 'recommended',
  setCurrentTab: (tab) => set({ currentTab: tab })
}));
