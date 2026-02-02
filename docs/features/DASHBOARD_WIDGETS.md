# Dashboard Widget Toggles

> **Feature ID:** Sprint2-C2
> **Status:** ✅ Complete
> **Added:** February 2, 2026

## Overview

Dashboard Widget Toggles allow users to customize which widgets appear on their dashboard. Preferences are stored per-user and persist across sessions.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Dashboard Page                           │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    DashboardWidgets                       │ │
│  │  ┌─────────────────────────────────────────────────────┐  │ │
│  │  │ [Customize] ← Opens settings modal                  │  │ │
│  │  └─────────────────────────────────────────────────────┘  │ │
│  │                                                           │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │ │
│  │  │ Widget A    │ │ Widget B    │ │ Widget C    │ ← Only  │ │
│  │  │ (visible)   │ │ (visible)   │ │ (hidden)    │   shows │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘   if    │ │
│  │                                                    enabled│ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌──────────────────────────────┐
              │       WidgetSettings         │
              │        (Modal Dialog)        │
              │                              │
              │  ☑️ Family Stats             │
              │  ☑️ This Day in History      │
              │  ☐ Quick Actions             │
              │  ☑️ Activity Feed            │
              │                              │
              │  [Save] [Cancel] [Reset]     │
              └──────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │   /api/user/dashboard-preferences     │
         │                                        │
         │   GET  → Fetch preferences            │
         │   PATCH → Update preferences          │
         └────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │          user_profiles                 │
         │   dashboard_preferences (JSONB)        │
         └────────────────────────────────────────┘
```

## Database Schema

### Column Added

```sql
ALTER TABLE user_profiles
ADD COLUMN dashboard_preferences JSONB
DEFAULT '{
  "widgets": {
    "notifications": { "visible": true, "order": 0 },
    "family_stats": { "visible": true, "order": 1 },
    "this_day": { "visible": true, "order": 2 },
    "quick_actions": { "visible": true, "order": 3 },
    "activity_feed": { "visible": true, "order": 4 },
    "explore_features": { "visible": true, "order": 5 }
  },
  "layout": "default"
}'::jsonb;
```

## Files

### Types

**`src/types/dashboard-preferences.ts`**

```typescript
export type WidgetId =
  | 'notifications'
  | 'family_stats'
  | 'this_day'
  | 'quick_actions'
  | 'activity_feed'
  | 'explore_features';

export interface WidgetConfig {
  visible: boolean;
  order: number;
}

export interface DashboardPreferences {
  widgets: Record<WidgetId, WidgetConfig>;
  layout: 'default' | 'compact' | 'expanded';
}

export const DEFAULT_DASHBOARD_PREFERENCES: DashboardPreferences;
export const WIDGET_INFO: Record<WidgetId, WidgetMetadata>;
```

### Hook

**`src/hooks/useDashboardPreferences.ts`**

```typescript
import { useDashboardPreferences } from '@/hooks/useDashboardPreferences';

function MyComponent() {
  const {
    preferences,         // DashboardPreferences
    isLoading,          // boolean
    hasChanges,         // boolean
    toggleWidget,       // (id: WidgetId) => void
    savePreferences,    // () => Promise<void>
    resetToDefaults,    // () => void
    isWidgetVisible,    // (id: WidgetId) => boolean
  } = useDashboardPreferences();
}
```

### Components

**`src/components/dashboard/WidgetSettings.tsx`**

Modal dialog for managing widget visibility.

**`src/components/dashboard/DashboardWidgets.tsx`**

Container that renders widgets based on preferences.

### API

**`src/app/api/user/dashboard-preferences/route.ts`**

## API Endpoints

### `GET /api/user/dashboard-preferences`

Fetch current user's dashboard preferences.

**Response:**
```json
{
  "preferences": {
    "widgets": {
      "notifications": { "visible": true, "order": 0 },
      "family_stats": { "visible": true, "order": 1 },
      "this_day": { "visible": false, "order": 2 },
      "quick_actions": { "visible": true, "order": 3 },
      "activity_feed": { "visible": true, "order": 4 },
      "explore_features": { "visible": true, "order": 5 }
    },
    "layout": "default"
  }
}
```

### `PATCH /api/user/dashboard-preferences`

Update user's dashboard preferences.

**Request:**
```json
{
  "preferences": {
    "widgets": {
      "this_day": { "visible": false, "order": 2 }
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "preferences": { ... }
}
```

## Available Widgets

| Widget ID | Name | Description | Icon |
|-----------|------|-------------|------|
| `notifications` | Notifications | Notification panel | Bell |
| `family_stats` | Family Stats | People, generations, relationships | Users |
| `this_day` | This Day | Events on this day in your family | Calendar |
| `quick_actions` | Quick Actions | Add Member, View Tree buttons | Zap |
| `activity_feed` | Activity Feed | Recent family activity | Activity |
| `explore_features` | Explore | Feature cards grid | Compass |

## Component Usage

### DashboardWidgets

```typescript
import DashboardWidgets from '@/components/dashboard/DashboardWidgets';

// In dashboard page
<DashboardWidgets
  initialPreferences={preferences}
  locale={locale}
>
  {/* Render your widgets here based on visibility */}
  {preferences.widgets.family_stats.visible && (
    <FamilyStatsWidget stats={stats} />
  )}
  {preferences.widgets.activity_feed.visible && (
    <ActivityFeedWidget feed={feed} />
  )}
</DashboardWidgets>
```

### WidgetSettings

```typescript
import WidgetSettings from '@/components/dashboard/WidgetSettings';

<WidgetSettings
  open={isSettingsOpen}
  onOpenChange={setIsSettingsOpen}
  onSave={() => router.refresh()}
/>
```

## Localization

**English (`src/messages/en/common.json`):**
```json
{
  "widgetSettings": {
    "title": "Customize Dashboard",
    "description": "Choose which widgets to show on your dashboard",
    "save": "Save Changes",
    "cancel": "Cancel",
    "reset": "Reset to Default",
    "saved": "Preferences saved!",
    "widgets": {
      "notifications": "Notifications",
      "family_stats": "Family Statistics",
      "this_day": "This Day in Your Family",
      "quick_actions": "Quick Actions",
      "activity_feed": "Activity Feed",
      "explore_features": "Explore Features"
    },
    "descriptions": {
      "notifications": "See recent notifications",
      "family_stats": "View family tree statistics",
      "this_day": "Events on this day in history",
      "quick_actions": "Quick access to common actions",
      "activity_feed": "Recent family activity",
      "explore_features": "Discover platform features"
    }
  }
}
```

**Russian (`src/messages/ru/common.json`):**
```json
{
  "widgetSettings": {
    "title": "Настроить панель",
    "description": "Выберите, какие виджеты показывать на панели",
    "save": "Сохранить",
    "cancel": "Отмена",
    "reset": "Сбросить",
    "saved": "Настройки сохранены!",
    "widgets": {
      "notifications": "Уведомления",
      "family_stats": "Статистика семьи",
      "this_day": "Этот день в вашей семье",
      "quick_actions": "Быстрые действия",
      "activity_feed": "Лента активности",
      "explore_features": "Возможности"
    },
    "descriptions": {
      "notifications": "Последние уведомления",
      "family_stats": "Статистика семейного древа",
      "this_day": "События в этот день",
      "quick_actions": "Быстрый доступ к действиям",
      "activity_feed": "Недавняя активность семьи",
      "explore_features": "Возможности платформы"
    }
  }
}
```

## Optimistic Updates

The hook implements optimistic UI updates:

```typescript
const toggleWidget = useCallback((widgetId: WidgetId) => {
  // Immediately update local state
  setPreferences((prev) => ({
    ...prev,
    widgets: {
      ...prev.widgets,
      [widgetId]: {
        ...prev.widgets[widgetId],
        visible: !prev.widgets[widgetId].visible,
      },
    },
  }));
  setHasChanges(true);
}, []);
```

Actual save happens when user clicks "Save":

```typescript
const savePreferences = useCallback(async () => {
  const response = await fetch('/api/user/dashboard-preferences', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ preferences }),
  });
  // ...
}, [preferences]);
```

## Testing

### Manual Testing Checklist

- [ ] Click "Customize" button on dashboard
- [ ] Settings modal opens
- [ ] Toggle widgets on/off
- [ ] Click "Save" - preferences persist
- [ ] Refresh page - widgets still hidden/shown
- [ ] Click "Reset to Default" - all widgets visible
- [ ] Click "Cancel" - changes discarded

### Unit Tests

```typescript
// tests/unit/dashboard-preferences.spec.ts
describe('useDashboardPreferences', () => {
  it('initializes with default preferences', () => {
    const { result } = renderHook(() => useDashboardPreferences());
    expect(result.current.preferences).toEqual(DEFAULT_DASHBOARD_PREFERENCES);
  });

  it('toggles widget visibility', () => {
    const { result } = renderHook(() => useDashboardPreferences());
    act(() => result.current.toggleWidget('family_stats'));
    expect(result.current.preferences.widgets.family_stats.visible).toBe(false);
  });
});
```

## Future Improvements

1. **Drag-and-drop reordering** - Visual handles already in place
2. **Widget collapse/expand** - Minimize widgets without hiding
3. **Layout presets** - Compact, expanded, default layouts
4. **Widget sizing** - Allow resizing individual widgets
5. **Dashboard templates** - Pre-built configurations for different use cases
