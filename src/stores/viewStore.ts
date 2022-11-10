import create from 'zustand';

import { config } from '@services/config';

import { createNav, getStateFromUrl } from './view/view';

export const useViewStore = create((set, get) => ({
  alerts:         null,
  modals:         null,
  navState:       getStateFromUrl(),
  activeLanguage: config.language,
  activeUI:       config.uiName,
  changeLanguage: () => {},
  changeUI:       () => {},
  navigateTo:     { ...createNav(navState => set({ navState }), config.routes) },
}));
