/**
 * Memory Book Types
 *
 * Type definitions for the Memory Book PDF generator feature.
 * Supports multiple themes, page sizes, and section types.
 */

export type PageSize = 'A4' | 'LETTER';
export type PageOrientation = 'portrait' | 'landscape';

export type BookThemeId = 'classic' | 'modern' | 'vintage' | 'elegant';

export interface BookTheme {
  id: BookThemeId;
  name: string;
  description: string;
  fonts: {
    heading: string;
    body: string;
    accent: string;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    textMuted: string;
    border: string;
  };
  styles: {
    borderRadius: number;
    headerStyle: 'centered' | 'left' | 'ornate';
    photoStyle: 'rounded' | 'square' | 'circle' | 'polaroid';
  };
}

export type BookSectionType =
  | 'cover'
  | 'dedication'
  | 'toc'
  | 'profile'
  | 'story'
  | 'photos'
  | 'timeline'
  | 'family-tree'
  | 'blank';

export interface BookSection {
  id: string;
  type: BookSectionType;
  title?: string;
  order: number;
  // Section-specific data
  data?: {
    // For profile sections
    profileId?: string;
    includePhotos?: boolean;
    includeBio?: boolean;
    includeMilestones?: boolean;
    // For story sections
    storyId?: string;
    // For photo grid sections
    photoIds?: string[];
    // For dedication
    dedicationText?: string;
    // For cover
    subtitle?: string;
    coverImageUrl?: string;
  };
}

export interface SelectedPerson {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  birthDate: string | null;
  deathDate: string | null;
  isLiving: boolean;
  bio: string | null;
  occupation: string | null;
  birthPlace: string | null;
}

export interface SelectedStory {
  id: string;
  title: string | null;
  content: string | null;
  mediaType: 'image' | 'video' | 'audio' | 'text';
  mediaUrl: string | null;
  createdAt: string;
  author: {
    firstName: string;
    lastName: string;
  };
  subject: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface SelectedPhoto {
  id: string;
  url: string;
  caption?: string;
  takenDate?: string;
  tags?: Array<{
    personId: string;
    personName: string;
  }>;
}

export interface BookConfig {
  // Basic info
  title: string;
  subtitle?: string;

  // Cover
  coverImageUrl?: string;
  dedication?: string;

  // Theme and layout
  theme: BookThemeId;
  pageSize: PageSize;
  orientation: PageOrientation;

  // Content selections
  selectedPeople: SelectedPerson[];
  selectedStories: SelectedStory[];
  selectedPhotos: SelectedPhoto[];

  // Sections (ordered)
  sections: BookSection[];

  // Options
  includeTableOfContents: boolean;
  includePageNumbers: boolean;
  includeDateGenerated: boolean;

  // Metadata
  generatedBy: {
    userId: string;
    userName: string;
  };
  familyId?: string;
}

export interface BookGenerationRequest {
  config: BookConfig;
}

export interface BookGenerationResult {
  success: boolean;
  pdfUrl?: string;
  pdfBlob?: Blob;
  error?: string;
  pageCount?: number;
  generatedAt?: string;
}

// Predefined themes
export const BOOK_THEMES: Record<BookThemeId, BookTheme> = {
  classic: {
    id: 'classic',
    name: 'Classic',
    description: 'Timeless elegance with serif fonts and warm tones',
    fonts: {
      heading: 'Times-Roman',
      body: 'Times-Roman',
      accent: 'Times-Italic',
    },
    colors: {
      primary: '#2C1810',
      secondary: '#8B7355',
      accent: '#A67C52',
      background: '#FDF8F3',
      text: '#2C1810',
      textMuted: '#6B5B4F',
      border: '#D4C4B0',
    },
    styles: {
      borderRadius: 0,
      headerStyle: 'centered',
      photoStyle: 'square',
    },
  },
  modern: {
    id: 'modern',
    name: 'Modern',
    description: 'Clean, minimal design with sans-serif typography',
    fonts: {
      heading: 'Helvetica-Bold',
      body: 'Helvetica',
      accent: 'Helvetica-Oblique',
    },
    colors: {
      primary: '#1A1A2E',
      secondary: '#4A5568',
      accent: '#3182CE',
      background: '#FFFFFF',
      text: '#1A202C',
      textMuted: '#718096',
      border: '#E2E8F0',
    },
    styles: {
      borderRadius: 8,
      headerStyle: 'left',
      photoStyle: 'rounded',
    },
  },
  vintage: {
    id: 'vintage',
    name: 'Vintage',
    description: 'Nostalgic feel with sepia tones and decorative elements',
    fonts: {
      heading: 'Times-Bold',
      body: 'Times-Roman',
      accent: 'Times-Italic',
    },
    colors: {
      primary: '#3D2914',
      secondary: '#6B4423',
      accent: '#8B6914',
      background: '#F5E6D3',
      text: '#3D2914',
      textMuted: '#7D6B5D',
      border: '#C4A77D',
    },
    styles: {
      borderRadius: 4,
      headerStyle: 'ornate',
      photoStyle: 'polaroid',
    },
  },
  elegant: {
    id: 'elegant',
    name: 'Elegant',
    description: 'Sophisticated design with rich colors and refined typography',
    fonts: {
      heading: 'Times-Bold',
      body: 'Helvetica',
      accent: 'Times-Italic',
    },
    colors: {
      primary: '#1C1C3B',
      secondary: '#4A4A6A',
      accent: '#7B68EE',
      background: '#FAFAFA',
      text: '#1C1C3B',
      textMuted: '#6B6B8A',
      border: '#D1D1E0',
    },
    styles: {
      borderRadius: 12,
      headerStyle: 'centered',
      photoStyle: 'circle',
    },
  },
};

// Default section templates for quick setup
export const DEFAULT_BOOK_SECTIONS: BookSection[] = [
  { id: 'cover-1', type: 'cover', order: 0 },
  { id: 'dedication-1', type: 'dedication', order: 1 },
  { id: 'toc-1', type: 'toc', order: 2 },
];
