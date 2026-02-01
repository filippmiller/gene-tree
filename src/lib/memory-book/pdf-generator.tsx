/**
 * Memory Book PDF Generator
 *
 * Server-side PDF generation using @react-pdf/renderer.
 * Creates beautiful, print-ready family memory books.
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import type {
  BookConfig,
  BookTheme,
  BookSection,
  SelectedPerson,
  SelectedStory,
  SelectedPhoto,
  BOOK_THEMES,
} from './types';

// Helper to get theme
function getTheme(themeId: string): BookTheme {
  const themes: Record<string, BookTheme> = {
    classic: {
      id: 'classic',
      name: 'Classic',
      description: 'Timeless elegance',
      fonts: { heading: 'Times-Roman', body: 'Times-Roman', accent: 'Times-Italic' },
      colors: {
        primary: '#2C1810',
        secondary: '#8B7355',
        accent: '#A67C52',
        background: '#FDF8F3',
        text: '#2C1810',
        textMuted: '#6B5B4F',
        border: '#D4C4B0',
      },
      styles: { borderRadius: 0, headerStyle: 'centered', photoStyle: 'square' },
    },
    modern: {
      id: 'modern',
      name: 'Modern',
      description: 'Clean and minimal',
      fonts: { heading: 'Helvetica-Bold', body: 'Helvetica', accent: 'Helvetica-Oblique' },
      colors: {
        primary: '#1A1A2E',
        secondary: '#4A5568',
        accent: '#3182CE',
        background: '#FFFFFF',
        text: '#1A202C',
        textMuted: '#718096',
        border: '#E2E8F0',
      },
      styles: { borderRadius: 8, headerStyle: 'left', photoStyle: 'rounded' },
    },
    vintage: {
      id: 'vintage',
      name: 'Vintage',
      description: 'Nostalgic feel',
      fonts: { heading: 'Times-Bold', body: 'Times-Roman', accent: 'Times-Italic' },
      colors: {
        primary: '#3D2914',
        secondary: '#6B4423',
        accent: '#8B6914',
        background: '#F5E6D3',
        text: '#3D2914',
        textMuted: '#7D6B5D',
        border: '#C4A77D',
      },
      styles: { borderRadius: 4, headerStyle: 'ornate', photoStyle: 'polaroid' },
    },
    elegant: {
      id: 'elegant',
      name: 'Elegant',
      description: 'Sophisticated design',
      fonts: { heading: 'Times-Bold', body: 'Helvetica', accent: 'Times-Italic' },
      colors: {
        primary: '#1C1C3B',
        secondary: '#4A4A6A',
        accent: '#7B68EE',
        background: '#FAFAFA',
        text: '#1C1C3B',
        textMuted: '#6B6B8A',
        border: '#D1D1E0',
      },
      styles: { borderRadius: 12, headerStyle: 'centered', photoStyle: 'circle' },
    },
  };
  return themes[themeId] || themes.classic;
}

// Create dynamic styles based on theme
function createStyles(theme: BookTheme) {
  return StyleSheet.create({
    // Page styles
    page: {
      flexDirection: 'column',
      backgroundColor: theme.colors.background,
      padding: 40,
      fontFamily: theme.fonts.body,
    },
    pageWithMargin: {
      flexDirection: 'column',
      backgroundColor: theme.colors.background,
      paddingTop: 60,
      paddingBottom: 60,
      paddingLeft: 50,
      paddingRight: 50,
    },

    // Cover page
    coverPage: {
      flexDirection: 'column',
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    coverTitle: {
      fontSize: 36,
      fontFamily: theme.fonts.heading,
      color: theme.colors.primary,
      textAlign: 'center',
      marginBottom: 16,
    },
    coverSubtitle: {
      fontSize: 18,
      fontFamily: theme.fonts.accent,
      color: theme.colors.secondary,
      textAlign: 'center',
      marginBottom: 30,
    },
    coverImage: {
      width: 300,
      height: 300,
      objectFit: 'cover',
      borderRadius: theme.styles.borderRadius,
      marginBottom: 40,
    },
    coverOrnament: {
      width: 100,
      height: 2,
      backgroundColor: theme.colors.accent,
      marginVertical: 20,
    },

    // Dedication page
    dedicationPage: {
      flexDirection: 'column',
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 80,
    },
    dedicationText: {
      fontSize: 16,
      fontFamily: theme.fonts.accent,
      color: theme.colors.text,
      textAlign: 'center',
      lineHeight: 2,
      maxWidth: 400,
    },

    // Table of Contents
    tocPage: {
      flexDirection: 'column',
      backgroundColor: theme.colors.background,
      padding: 50,
    },
    tocTitle: {
      fontSize: 28,
      fontFamily: theme.fonts.heading,
      color: theme.colors.primary,
      marginBottom: 30,
      textAlign: theme.styles.headerStyle === 'centered' ? 'center' : 'left',
    },
    tocEntry: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      borderBottomStyle: 'dotted',
    },
    tocEntryTitle: {
      fontSize: 12,
      fontFamily: theme.fonts.body,
      color: theme.colors.text,
    },
    tocEntryPage: {
      fontSize: 12,
      fontFamily: theme.fonts.body,
      color: theme.colors.textMuted,
    },

    // Profile page
    profileHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 30,
    },
    profileAvatar: {
      width: 120,
      height: 120,
      objectFit: 'cover',
      borderRadius: theme.styles.photoStyle === 'circle' ? 60 : theme.styles.borderRadius,
      marginRight: 24,
    },
    profileInfo: {
      flex: 1,
    },
    profileName: {
      fontSize: 24,
      fontFamily: theme.fonts.heading,
      color: theme.colors.primary,
      marginBottom: 8,
    },
    profileDates: {
      fontSize: 12,
      fontFamily: theme.fonts.body,
      color: theme.colors.textMuted,
      marginBottom: 4,
    },
    profileOccupation: {
      fontSize: 12,
      fontFamily: theme.fonts.accent,
      color: theme.colors.secondary,
      marginBottom: 8,
    },
    profileBio: {
      fontSize: 11,
      fontFamily: theme.fonts.body,
      color: theme.colors.text,
      lineHeight: 1.6,
      marginTop: 16,
    },

    // Story page
    storyTitle: {
      fontSize: 20,
      fontFamily: theme.fonts.heading,
      color: theme.colors.primary,
      marginBottom: 16,
    },
    storyMeta: {
      fontSize: 10,
      fontFamily: theme.fonts.body,
      color: theme.colors.textMuted,
      marginBottom: 20,
    },
    storyContent: {
      fontSize: 11,
      fontFamily: theme.fonts.body,
      color: theme.colors.text,
      lineHeight: 1.8,
      textAlign: 'justify',
    },
    storyImage: {
      width: '100%',
      maxHeight: 300,
      objectFit: 'contain',
      borderRadius: theme.styles.borderRadius,
      marginTop: 20,
    },

    // Photo grid
    photoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
    },
    photoItem: {
      width: '45%',
      marginBottom: 16,
    },
    photoImage: {
      width: '100%',
      height: 180,
      objectFit: 'cover',
      borderRadius: theme.styles.borderRadius,
    },
    photoCaption: {
      fontSize: 9,
      fontFamily: theme.fonts.body,
      color: theme.colors.textMuted,
      marginTop: 6,
      textAlign: 'center',
    },

    // Section headers
    sectionHeader: {
      fontSize: 22,
      fontFamily: theme.fonts.heading,
      color: theme.colors.primary,
      marginBottom: 24,
      paddingBottom: 12,
      borderBottomWidth: 2,
      borderBottomColor: theme.colors.accent,
      textAlign: theme.styles.headerStyle === 'centered' ? 'center' : 'left',
    },

    // Page footer
    pageNumber: {
      position: 'absolute',
      bottom: 30,
      left: 0,
      right: 0,
      textAlign: 'center',
      fontSize: 10,
      fontFamily: theme.fonts.body,
      color: theme.colors.textMuted,
    },

    // Decorative elements
    divider: {
      width: '100%',
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: 20,
    },
    ornamentalDivider: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 24,
    },
    ornamentLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.border,
    },
    ornamentCenter: {
      width: 10,
      height: 10,
      backgroundColor: theme.colors.accent,
      borderRadius: 5,
      marginHorizontal: 12,
    },
  });
}

// Cover Page Component
function CoverPage({
  config,
  styles,
  theme,
}: {
  config: BookConfig;
  styles: ReturnType<typeof createStyles>;
  theme: BookTheme;
}) {
  return (
    <Page size={config.pageSize} style={styles.coverPage}>
      {config.coverImageUrl && (
        <Image src={config.coverImageUrl} style={styles.coverImage} />
      )}
      <View style={styles.coverOrnament} />
      <Text style={styles.coverTitle}>{config.title}</Text>
      {config.subtitle && (
        <Text style={styles.coverSubtitle}>{config.subtitle}</Text>
      )}
      <View style={styles.coverOrnament} />
      {config.includeDateGenerated && (
        <Text style={{ ...styles.coverSubtitle, fontSize: 12, marginTop: 40 }}>
          {new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      )}
    </Page>
  );
}

// Dedication Page Component
function DedicationPage({
  dedication,
  styles,
}: {
  dedication: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Page size="A4" style={styles.dedicationPage}>
      <View style={styles.ornamentalDivider}>
        <View style={styles.ornamentLine} />
        <View style={styles.ornamentCenter} />
        <View style={styles.ornamentLine} />
      </View>
      <Text style={styles.dedicationText}>{dedication}</Text>
      <View style={styles.ornamentalDivider}>
        <View style={styles.ornamentLine} />
        <View style={styles.ornamentCenter} />
        <View style={styles.ornamentLine} />
      </View>
    </Page>
  );
}

// Table of Contents Component
function TableOfContentsPage({
  sections,
  styles,
  config,
}: {
  sections: Array<{ title: string; page: number }>;
  styles: ReturnType<typeof createStyles>;
  config: BookConfig;
}) {
  return (
    <Page size={config.pageSize} style={styles.tocPage}>
      <Text style={styles.tocTitle}>Table of Contents</Text>
      {sections.map((entry, index) => (
        <View key={index} style={styles.tocEntry}>
          <Text style={styles.tocEntryTitle}>{entry.title}</Text>
          <Text style={styles.tocEntryPage}>{entry.page}</Text>
        </View>
      ))}
      {config.includePageNumbers && (
        <Text
          style={styles.pageNumber}
          render={({ pageNumber }) => `${pageNumber}`}
          fixed
        />
      )}
    </Page>
  );
}

// Profile Page Component
function ProfilePage({
  person,
  styles,
  config,
}: {
  person: SelectedPerson;
  styles: ReturnType<typeof createStyles>;
  config: BookConfig;
}) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const birthDate = formatDate(person.birthDate);
  const deathDate = formatDate(person.deathDate);

  return (
    <Page size={config.pageSize} style={styles.pageWithMargin}>
      <View style={styles.profileHeader}>
        {person.avatarUrl && (
          <Image src={person.avatarUrl} style={styles.profileAvatar} />
        )}
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>
            {person.firstName} {person.lastName}
          </Text>
          {birthDate && (
            <Text style={styles.profileDates}>
              Born: {birthDate}
              {person.birthPlace ? ` in ${person.birthPlace}` : ''}
            </Text>
          )}
          {deathDate && (
            <Text style={styles.profileDates}>Passed: {deathDate}</Text>
          )}
          {person.occupation && (
            <Text style={styles.profileOccupation}>{person.occupation}</Text>
          )}
        </View>
      </View>

      {person.bio && (
        <>
          <View style={styles.divider} />
          <Text style={styles.profileBio}>{person.bio}</Text>
        </>
      )}

      {config.includePageNumbers && (
        <Text
          style={styles.pageNumber}
          render={({ pageNumber }) => `${pageNumber}`}
          fixed
        />
      )}
    </Page>
  );
}

// Story Page Component
function StoryPage({
  story,
  styles,
  config,
}: {
  story: SelectedStory;
  styles: ReturnType<typeof createStyles>;
  config: BookConfig;
}) {
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Page size={config.pageSize} style={styles.pageWithMargin}>
      {story.title && <Text style={styles.storyTitle}>{story.title}</Text>}
      <Text style={styles.storyMeta}>
        By {story.author.firstName} {story.author.lastName} | About{' '}
        {story.subject.firstName} {story.subject.lastName} |{' '}
        {formatDate(story.createdAt)}
      </Text>

      {story.content && <Text style={styles.storyContent}>{story.content}</Text>}

      {story.mediaType === 'image' && story.mediaUrl && (
        <Image src={story.mediaUrl} style={styles.storyImage} />
      )}

      {config.includePageNumbers && (
        <Text
          style={styles.pageNumber}
          render={({ pageNumber }) => `${pageNumber}`}
          fixed
        />
      )}
    </Page>
  );
}

// Photo Grid Page Component
function PhotoGridPage({
  photos,
  title,
  styles,
  config,
}: {
  photos: SelectedPhoto[];
  title?: string;
  styles: ReturnType<typeof createStyles>;
  config: BookConfig;
}) {
  return (
    <Page size={config.pageSize} style={styles.pageWithMargin}>
      {title && <Text style={styles.sectionHeader}>{title}</Text>}
      <View style={styles.photoGrid}>
        {photos.slice(0, 6).map((photo, index) => (
          <View key={photo.id || index} style={styles.photoItem}>
            <Image src={photo.url} style={styles.photoImage} />
            {photo.caption && (
              <Text style={styles.photoCaption}>{photo.caption}</Text>
            )}
          </View>
        ))}
      </View>

      {config.includePageNumbers && (
        <Text
          style={styles.pageNumber}
          render={({ pageNumber }) => `${pageNumber}`}
          fixed
        />
      )}
    </Page>
  );
}

// Main Document Component
interface MemoryBookDocumentProps {
  config: BookConfig;
}

export function MemoryBookDocument({ config }: MemoryBookDocumentProps) {
  const theme = getTheme(config.theme);
  const styles = createStyles(theme);

  // Build table of contents entries
  const tocEntries: Array<{ title: string; page: number }> = [];
  let currentPage = config.dedication ? 3 : 2; // After cover and optional dedication

  if (config.includeTableOfContents) {
    currentPage++; // TOC page itself
  }

  // Add people to TOC
  config.selectedPeople.forEach((person) => {
    tocEntries.push({
      title: `${person.firstName} ${person.lastName}`,
      page: currentPage++,
    });
  });

  // Add stories to TOC
  config.selectedStories.forEach((story) => {
    tocEntries.push({
      title: story.title || `Story about ${story.subject.firstName}`,
      page: currentPage++,
    });
  });

  // Add photos section to TOC if we have photos
  if (config.selectedPhotos.length > 0) {
    tocEntries.push({
      title: 'Photo Gallery',
      page: currentPage,
    });
  }

  return (
    <Document
      title={config.title}
      author={config.generatedBy.userName}
      subject="Family Memory Book"
      creator="Gene Tree Memory Book Generator"
    >
      {/* Cover Page */}
      <CoverPage config={config} styles={styles} theme={theme} />

      {/* Dedication Page */}
      {config.dedication && (
        <DedicationPage dedication={config.dedication} styles={styles} />
      )}

      {/* Table of Contents */}
      {config.includeTableOfContents && tocEntries.length > 0 && (
        <TableOfContentsPage
          sections={tocEntries}
          styles={styles}
          config={config}
        />
      )}

      {/* Profile Pages */}
      {config.selectedPeople.map((person) => (
        <ProfilePage
          key={person.id}
          person={person}
          styles={styles}
          config={config}
        />
      ))}

      {/* Story Pages */}
      {config.selectedStories.map((story) => (
        <StoryPage
          key={story.id}
          story={story}
          styles={styles}
          config={config}
        />
      ))}

      {/* Photo Gallery Pages */}
      {config.selectedPhotos.length > 0 && (
        <PhotoGridPage
          photos={config.selectedPhotos}
          title="Photo Gallery"
          styles={styles}
          config={config}
        />
      )}
    </Document>
  );
}

export { createStyles, getTheme };
