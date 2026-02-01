'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { BOOK_THEMES } from '@/lib/memory-book/types';
import type { BookConfig, BookTheme } from '@/lib/memory-book/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BookOpen, Image, User } from 'lucide-react';

interface BookPreviewProps {
  config: Partial<BookConfig>;
  currentPage?: number;
}

export default function BookPreview({ config, currentPage = 0 }: BookPreviewProps) {
  const theme = BOOK_THEMES[config.theme || 'classic'];

  // Calculate total pages
  const pages = useMemo(() => {
    const pageList: Array<{ type: string; title: string; content?: any }> = [];

    // Cover page
    pageList.push({
      type: 'cover',
      title: config.title || 'My Memory Book',
    });

    // Dedication
    if (config.dedication) {
      pageList.push({
        type: 'dedication',
        title: 'Dedication',
        content: config.dedication,
      });
    }

    // Table of contents
    if (config.includeTableOfContents) {
      pageList.push({
        type: 'toc',
        title: 'Contents',
      });
    }

    // Profile pages
    (config.selectedPeople || []).forEach((person) => {
      pageList.push({
        type: 'profile',
        title: `${person.firstName} ${person.lastName}`,
        content: person,
      });
    });

    // Story pages
    (config.selectedStories || []).forEach((story) => {
      pageList.push({
        type: 'story',
        title: story.title || `Story`,
        content: story,
      });
    });

    // Photo gallery
    if ((config.selectedPhotos || []).length > 0) {
      pageList.push({
        type: 'photos',
        title: 'Photo Gallery',
        content: config.selectedPhotos,
      });
    }

    return pageList;
  }, [config]);

  const activePage = pages[currentPage] || pages[0];

  return (
    <div className="flex flex-col items-center">
      {/* Page preview */}
      <div
        className="w-full max-w-sm aspect-[3/4] rounded-lg shadow-xl border overflow-hidden relative"
        style={{ backgroundColor: theme.colors.background }}
      >
        {/* Page content based on type */}
        {activePage.type === 'cover' && (
          <CoverPreview
            title={config.title || 'My Memory Book'}
            subtitle={config.subtitle}
            coverImageUrl={config.coverImageUrl}
            theme={theme}
          />
        )}

        {activePage.type === 'dedication' && (
          <DedicationPreview dedication={config.dedication || ''} theme={theme} />
        )}

        {activePage.type === 'toc' && (
          <TocPreview pages={pages} theme={theme} />
        )}

        {activePage.type === 'profile' && activePage.content && (
          <ProfilePreview person={activePage.content} theme={theme} />
        )}

        {activePage.type === 'story' && activePage.content && (
          <StoryPreview story={activePage.content} theme={theme} />
        )}

        {activePage.type === 'photos' && (
          <PhotosPreview photos={config.selectedPhotos || []} theme={theme} />
        )}

        {/* Page number */}
        {config.includePageNumbers && currentPage > 0 && (
          <div
            className="absolute bottom-3 left-0 right-0 text-center text-xs"
            style={{ color: theme.colors.textMuted }}
          >
            {currentPage}
          </div>
        )}
      </div>

      {/* Page navigation dots */}
      <div className="flex gap-1.5 mt-4">
        {pages.map((_, index) => (
          <div
            key={index}
            className={cn(
              'w-2 h-2 rounded-full transition-all',
              index === currentPage
                ? 'w-6'
                : 'opacity-50'
            )}
            style={{
              backgroundColor:
                index === currentPage
                  ? theme.colors.accent
                  : theme.colors.border,
            }}
          />
        ))}
      </div>

      {/* Page info */}
      <p className="text-xs text-gray-500 mt-2">
        Page {currentPage + 1} of {pages.length}
      </p>
    </div>
  );
}

// Sub-components for different page types
function CoverPreview({
  title,
  subtitle,
  coverImageUrl,
  theme,
}: {
  title: string;
  subtitle?: string;
  coverImageUrl?: string;
  theme: BookTheme;
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
      {coverImageUrl ? (
        <div
          className="w-32 h-32 rounded-lg bg-cover bg-center mb-4"
          style={{
            backgroundImage: `url(${coverImageUrl})`,
            borderRadius: theme.styles.borderRadius,
          }}
        />
      ) : (
        <div
          className="w-32 h-32 rounded-lg mb-4 flex items-center justify-center"
          style={{
            backgroundColor: theme.colors.border,
            borderRadius: theme.styles.borderRadius,
          }}
        >
          <BookOpen className="w-12 h-12" style={{ color: theme.colors.accent }} />
        </div>
      )}
      <div
        className="w-16 h-0.5 mb-4"
        style={{ backgroundColor: theme.colors.accent }}
      />
      <h1
        className="text-xl font-bold mb-2"
        style={{ color: theme.colors.primary }}
      >
        {title}
      </h1>
      {subtitle && (
        <p className="text-sm" style={{ color: theme.colors.secondary }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function DedicationPreview({
  dedication,
  theme,
}: {
  dedication: string;
  theme: BookTheme;
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
      <div
        className="w-12 h-0.5 mb-6"
        style={{ backgroundColor: theme.colors.accent }}
      />
      <p
        className="text-sm italic leading-relaxed"
        style={{ color: theme.colors.text }}
      >
        {dedication}
      </p>
      <div
        className="w-12 h-0.5 mt-6"
        style={{ backgroundColor: theme.colors.accent }}
      />
    </div>
  );
}

function TocPreview({
  pages,
  theme,
}: {
  pages: Array<{ type: string; title: string }>;
  theme: BookTheme;
}) {
  const contentPages = pages.filter(
    (p) => !['cover', 'dedication', 'toc'].includes(p.type)
  );

  return (
    <div className="h-full p-6">
      <h2
        className="text-lg font-bold mb-4"
        style={{ color: theme.colors.primary }}
      >
        Contents
      </h2>
      <div className="space-y-2">
        {contentPages.slice(0, 8).map((page, index) => (
          <div
            key={index}
            className="flex justify-between text-xs"
            style={{ color: theme.colors.text }}
          >
            <span className="truncate mr-2">{page.title}</span>
            <span style={{ color: theme.colors.textMuted }}>{index + 4}</span>
          </div>
        ))}
        {contentPages.length > 8 && (
          <p className="text-xs" style={{ color: theme.colors.textMuted }}>
            ...and {contentPages.length - 8} more
          </p>
        )}
      </div>
    </div>
  );
}

function ProfilePreview({
  person,
  theme,
}: {
  person: any;
  theme: BookTheme;
}) {
  return (
    <div className="h-full p-6">
      <div className="flex items-start gap-3 mb-4">
        <Avatar className="w-12 h-12">
          <AvatarImage src={person.avatarUrl} />
          <AvatarFallback>
            {person.firstName[0]}
            {person.lastName[0]}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3
            className="font-bold text-sm"
            style={{ color: theme.colors.primary }}
          >
            {person.firstName} {person.lastName}
          </h3>
          {person.occupation && (
            <p className="text-xs" style={{ color: theme.colors.secondary }}>
              {person.occupation}
            </p>
          )}
        </div>
      </div>
      {person.bio && (
        <p
          className="text-xs line-clamp-6 leading-relaxed"
          style={{ color: theme.colors.text }}
        >
          {person.bio}
        </p>
      )}
    </div>
  );
}

function StoryPreview({
  story,
  theme,
}: {
  story: any;
  theme: BookTheme;
}) {
  return (
    <div className="h-full p-6">
      <h3
        className="font-bold text-sm mb-2"
        style={{ color: theme.colors.primary }}
      >
        {story.title || `About ${story.subject.firstName}`}
      </h3>
      <p className="text-xs mb-3" style={{ color: theme.colors.textMuted }}>
        By {story.author.firstName} {story.author.lastName}
      </p>
      {story.content && (
        <p
          className="text-xs line-clamp-8 leading-relaxed"
          style={{ color: theme.colors.text }}
        >
          {story.content}
        </p>
      )}
    </div>
  );
}

function PhotosPreview({
  photos,
  theme,
}: {
  photos: any[];
  theme: BookTheme;
}) {
  return (
    <div className="h-full p-6">
      <h3
        className="font-bold text-sm mb-4"
        style={{ color: theme.colors.primary }}
      >
        Photo Gallery
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {photos.length > 0 ? (
          photos.slice(0, 4).map((photo, index) => (
            <div
              key={photo.id || index}
              className="aspect-square rounded bg-cover bg-center"
              style={{
                backgroundImage: `url(${photo.url})`,
                borderRadius: theme.styles.borderRadius,
              }}
            />
          ))
        ) : (
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="aspect-square rounded flex items-center justify-center"
              style={{
                backgroundColor: theme.colors.border,
                borderRadius: theme.styles.borderRadius,
              }}
            >
              <Image className="w-6 h-6" style={{ color: theme.colors.textMuted }} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
