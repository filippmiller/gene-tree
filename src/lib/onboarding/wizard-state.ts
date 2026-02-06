/**
 * Onboarding Wizard State Management
 *
 * Manages the wizard data and progress between steps using localStorage
 * for persistence across page refreshes.
 */

import { Gender } from '@/types/database';

// Step 1: About You
export interface AboutYouData {
  firstName: string;
  lastName: string;
  birthDate?: string;
  gender?: Gender;
  avatarFile?: File;
  avatarPreview?: string;
}

// Step 2: Parents
export interface ParentData {
  firstName: string;
  lastName: string;
  birthYear?: string;
  isDeceased: boolean;
  skip?: boolean;
}

export interface ParentsData {
  mother: ParentData;
  father: ParentData;
}

// Step 3: Siblings/Spouse
export interface SiblingData {
  firstName: string;
  lastName: string;
  birthYear?: string;
  gender: Gender;
}

export interface SpouseData {
  firstName: string;
  lastName: string;
  birthYear?: string;
  marriageYear?: string;
}

export interface SiblingsData {
  siblings: SiblingData[];
  spouse?: SpouseData;
}

// Step 4: Invite
export interface InviteData {
  relativeId?: string;
  relativeName?: string;
  relationshipType?: string;
  email?: string;
  phone?: string;
  skip?: boolean;
}

// Complete wizard state
export interface WizardState {
  currentStep: number;
  aboutYou: AboutYouData;
  parents: ParentsData;
  siblings: SiblingsData;
  invite: InviteData;
  /** IDs created in step 2 (parents) - enables idempotent re-submission */
  step2CreatedIds: string[];
  /** IDs created in step 3 (siblings/spouse) - enables idempotent re-submission */
  step3CreatedIds: string[];
  /** @deprecated Use step2CreatedIds + step3CreatedIds instead */
  createdRelativeIds: string[];
}

const STORAGE_KEY = 'gene-tree-onboarding-wizard';

const defaultState: WizardState = {
  currentStep: 1,
  aboutYou: {
    firstName: '',
    lastName: '',
  },
  parents: {
    mother: {
      firstName: '',
      lastName: '',
      isDeceased: false,
    },
    father: {
      firstName: '',
      lastName: '',
      isDeceased: false,
    },
  },
  siblings: {
    siblings: [],
  },
  invite: {},
  step2CreatedIds: [],
  step3CreatedIds: [],
  createdRelativeIds: [],
};

/**
 * Load wizard state from localStorage with deep merge to prevent corruption
 */
export function loadWizardState(): WizardState {
  if (typeof window === 'undefined') {
    return defaultState;
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Don't restore file objects from localStorage
      if (parsed.aboutYou) {
        delete parsed.aboutYou.avatarFile;
      }

      // Deep merge to protect against corrupted nested data
      const merged: WizardState = {
        currentStep:
          typeof parsed.currentStep === 'number' ? parsed.currentStep : defaultState.currentStep,
        aboutYou: {
          ...defaultState.aboutYou,
          ...(parsed.aboutYou && typeof parsed.aboutYou === 'object' ? parsed.aboutYou : {}),
        },
        parents: {
          mother: {
            ...defaultState.parents.mother,
            ...(parsed.parents?.mother && typeof parsed.parents.mother === 'object'
              ? parsed.parents.mother
              : {}),
          },
          father: {
            ...defaultState.parents.father,
            ...(parsed.parents?.father && typeof parsed.parents.father === 'object'
              ? parsed.parents.father
              : {}),
          },
        },
        siblings: {
          siblings: Array.isArray(parsed.siblings?.siblings) ? parsed.siblings.siblings : [],
          spouse: parsed.siblings?.spouse || undefined,
        },
        invite: {
          ...defaultState.invite,
          ...(parsed.invite && typeof parsed.invite === 'object' ? parsed.invite : {}),
        },
        step2CreatedIds: Array.isArray(parsed.step2CreatedIds) ? parsed.step2CreatedIds : [],
        step3CreatedIds: Array.isArray(parsed.step3CreatedIds) ? parsed.step3CreatedIds : [],
        // Migrate legacy field
        createdRelativeIds: Array.isArray(parsed.createdRelativeIds)
          ? parsed.createdRelativeIds
          : [],
      };

      // Validate currentStep is within bounds
      if (merged.currentStep < 1 || merged.currentStep > 4) {
        merged.currentStep = 1;
      }

      return merged;
    }
  } catch (e) {
    console.error('Failed to load wizard state:', e);
    // Clear corrupted state
    localStorage.removeItem(STORAGE_KEY);
  }

  return defaultState;
}

/**
 * Save wizard state to localStorage
 */
export function saveWizardState(state: WizardState): void {
  if (typeof window === 'undefined') return;

  try {
    // Don't save file objects
    const toSave = {
      ...state,
      aboutYou: {
        ...state.aboutYou,
        avatarFile: undefined,
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.error('Failed to save wizard state:', e);
  }
}

/**
 * Clear wizard state from localStorage
 */
export function clearWizardState(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Update a specific step's data
 */
export function updateStepData<K extends keyof WizardState>(
  state: WizardState,
  key: K,
  data: WizardState[K]
): WizardState {
  const newState = {
    ...state,
    [key]: data,
  };
  saveWizardState(newState);
  return newState;
}

/**
 * Move to next step
 */
export function nextStep(state: WizardState): WizardState {
  const newState = {
    ...state,
    currentStep: Math.min(state.currentStep + 1, 4),
  };
  saveWizardState(newState);
  return newState;
}

/**
 * Move to previous step
 */
export function prevStep(state: WizardState): WizardState {
  const newState = {
    ...state,
    currentStep: Math.max(state.currentStep - 1, 1),
  };
  saveWizardState(newState);
  return newState;
}

/**
 * Add a created relative ID (for invite step)
 */
export function addCreatedRelativeId(state: WizardState, id: string): WizardState {
  const newState = {
    ...state,
    createdRelativeIds: [...state.createdRelativeIds, id],
  };
  saveWizardState(newState);
  return newState;
}
