/**
 * Dashboard Preferences Types
 * Types for user dashboard widget customization
 */

export type WidgetId =
  | 'activity_feed'
  | 'this_day'
  | 'notifications'
  | 'quick_actions'
  | 'family_stats'
  | 'explore_features'
  | 'memory_prompts'
  | 'time_capsules';

export interface WidgetConfig {
  visible: boolean;
  order: number;
}

export interface WidgetInfo {
  id: WidgetId;
  labelKey: string;
  descriptionKey: string;
  icon: string;
}

export interface DashboardPreferences {
  widgets: Record<WidgetId, WidgetConfig>;
  layout: 'default' | 'compact';
}

export const DEFAULT_DASHBOARD_PREFERENCES: DashboardPreferences = {
  widgets: {
    activity_feed: { visible: true, order: 0 },
    this_day: { visible: true, order: 1 },
    memory_prompts: { visible: true, order: 2 },
    notifications: { visible: true, order: 3 },
    time_capsules: { visible: true, order: 4 },
    quick_actions: { visible: true, order: 5 },
    family_stats: { visible: true, order: 6 },
    explore_features: { visible: true, order: 7 },
  },
  layout: 'default',
};

export const WIDGET_INFO: WidgetInfo[] = [
  {
    id: 'notifications',
    labelKey: 'widgetSettings.widgets.notifications',
    descriptionKey: 'widgetSettings.widgetsDesc.notifications',
    icon: 'Bell',
  },
  {
    id: 'activity_feed',
    labelKey: 'widgetSettings.widgets.activityFeed',
    descriptionKey: 'widgetSettings.widgetsDesc.activityFeed',
    icon: 'Activity',
  },
  {
    id: 'this_day',
    labelKey: 'widgetSettings.widgets.thisDay',
    descriptionKey: 'widgetSettings.widgetsDesc.thisDay',
    icon: 'Calendar',
  },
  {
    id: 'memory_prompts',
    labelKey: 'widgetSettings.widgets.memoryPrompts',
    descriptionKey: 'widgetSettings.widgetsDesc.memoryPrompts',
    icon: 'MessageCircle',
  },
  {
    id: 'quick_actions',
    labelKey: 'widgetSettings.widgets.quickActions',
    descriptionKey: 'widgetSettings.widgetsDesc.quickActions',
    icon: 'Zap',
  },
  {
    id: 'family_stats',
    labelKey: 'widgetSettings.widgets.familyStats',
    descriptionKey: 'widgetSettings.widgetsDesc.familyStats',
    icon: 'BarChart3',
  },
  {
    id: 'explore_features',
    labelKey: 'widgetSettings.widgets.exploreFeatures',
    descriptionKey: 'widgetSettings.widgetsDesc.exploreFeatures',
    icon: 'Compass',
  },
  {
    id: 'time_capsules',
    labelKey: 'widgetSettings.widgets.timeCapsules',
    descriptionKey: 'widgetSettings.widgetsDesc.timeCapsules',
    icon: 'Timer',
  },
];
