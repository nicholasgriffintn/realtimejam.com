import { type States } from '@cloudflare/realtimekit-ui';
import { create } from 'zustand';

type Size = 'sm' | 'md' | 'lg';

interface Dimensions {
  width: number;
  height: number;
}

export interface MeetingStore {
  isImmersiveMode: boolean;
  darkMode: boolean;
  toggleDarkMode: (val: boolean) => void;
  setIsImmersiveMode: (val: boolean) => void;
  toggleImmersiveMode: () => void;

  isActiveSpeakerMode: boolean;
  setIsActiveSpeakerMode: (val: boolean) => void;
  dimensions?: Dimensions;
  setDimensions: (dimensions: Dimensions) => void;

  size: Size;
  setSize: (size: Size) => void;

  isMobile: boolean;
  states: States;
  setStates: (states: States) => void;
}

export const useMeetingStore = create<MeetingStore>((set, get) => ({
  isActiveSpeakerMode: false,
  setIsActiveSpeakerMode: (isActiveSpeakerMode) => set({ isActiveSpeakerMode }),

  darkMode: true,
  toggleDarkMode: (darkMode) => set({ darkMode }),

  isImmersiveMode: false,
  setIsImmersiveMode: (isImmersiveMode) => set({ isImmersiveMode }),
  toggleImmersiveMode: () => set({ isImmersiveMode: !get().isImmersiveMode }),

  size: 'sm',
  setSize: (size) => set({ size }),

  dimensions: undefined,
  setDimensions: (dimensions) => {
    const currentState = get();

    // Check if dimensions actually changed
    if (
      currentState.dimensions &&
      currentState.dimensions.width === dimensions.width &&
      currentState.dimensions.height === dimensions.height
    ) {
      return;
    }

    let size: Size = 'lg';
    if (dimensions.width < 768) {
      size = 'sm';
    } else if (dimensions.width < 1024) {
      size = 'md';
    }

    let isMobile = size === 'lg' ? false : true;

    set({ dimensions, size, isMobile });
  },

  isMobile: false,

  states: { activeSidebar: true, sidebar: 'chat' },
  setStates: (newStates: States) => {
    const currentStates = get().states;

    // Check if any values actually changed
    let hasChanges = false;
    for (const key in newStates) {
      if (
        currentStates[key as keyof States] !== newStates[key as keyof States]
      ) {
        hasChanges = true;
        break;
      }
    }

    // Only update if there are actual changes
    if (hasChanges) {
      set({ states: { ...currentStates, ...newStates } });
    }
  },
}));
