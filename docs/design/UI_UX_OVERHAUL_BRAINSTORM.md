# GeneTree UI/UX Overhaul: Design System Brainstorm

**Date:** January 23, 2026
**Goal:** Transform GeneTree from a dated CRUD app into a world-class 2026 social network
**Inspiration:** Stripe, Linear, Vercel, Facebook, Instagram

---

## Executive Summary

This document consolidates insights from three design perspectives:
1. **Visual Design Architect** - Color, typography, glassmorphism, motion
2. **Social Network UX Specialist** - Engagement, feeds, ad placement, mobile UX
3. **Component System Designer** - Scalable Tailwind + Radix component library

---

## Part 1: Visual Design System

### 1.1 Color Palette

**Primary Palette - "Warm Connection"**
```
Primary:        hsl(262, 83%, 58%)    // #8B5CF6 - Violet (warmth + trust)
Primary Light:  hsl(262, 83%, 68%)    // #A78BFA
Primary Dark:   hsl(262, 83%, 48%)    // #7C3AED

Secondary:      hsl(199, 89%, 48%)    // #0EA5E9 - Sky blue (clarity)
Secondary Light: hsl(199, 89%, 58%)   // #38BDF8

Accent:         hsl(24, 94%, 53%)     // #F97316 - Orange (energy, family warmth)
Accent Soft:    hsl(24, 94%, 63%)     // #FB923C

Success:        hsl(142, 76%, 36%)    // #16A34A
Warning:        hsl(38, 92%, 50%)     // #EAB308
Error:          hsl(0, 84%, 60%)      // #DC2626
```

**Neutral Palette - "Warm Gray"**
```
Gray 50:   hsl(240, 20%, 99%)   // Near white with warmth
Gray 100:  hsl(240, 15%, 97%)   // Subtle warm
Gray 200:  hsl(240, 12%, 93%)
Gray 300:  hsl(240, 10%, 85%)
Gray 400:  hsl(240, 8%, 65%)
Gray 500:  hsl(240, 6%, 45%)
Gray 600:  hsl(240, 6%, 35%)
Gray 700:  hsl(240, 8%, 25%)
Gray 800:  hsl(240, 10%, 15%)
Gray 900:  hsl(240, 12%, 10%)   // Deep with warmth
```

**Background Gradients**
```css
/* Main app background */
--bg-gradient-warm: linear-gradient(135deg,
  hsl(262, 50%, 98%) 0%,      /* Soft violet tint */
  hsl(240, 20%, 99%) 50%,     /* Near white */
  hsl(199, 50%, 98%) 100%     /* Soft blue tint */
);

/* Card surfaces */
--glass-gradient: linear-gradient(135deg,
  rgba(255, 255, 255, 0.9) 0%,
  rgba(255, 255, 255, 0.7) 100%
);
```

### 1.2 Glassmorphism System

**Glass Levels**
```css
/* Level 1: Subtle Glass (navigation, tooltips) */
.glass-subtle {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

/* Level 2: Medium Glass (cards, panels) */
.glass-medium {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 8px 32px rgba(139, 92, 246, 0.08);
}

/* Level 3: Frosted Glass (modals, overlays) */
.glass-frosted {
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 16px 48px rgba(139, 92, 246, 0.12);
}

/* Level 4: Colored Glass (highlighted cards) */
.glass-tinted {
  background: linear-gradient(135deg,
    rgba(139, 92, 246, 0.08) 0%,
    rgba(14, 165, 233, 0.05) 100%
  );
  backdrop-filter: blur(16px);
  border: 1px solid rgba(139, 92, 246, 0.15);
}
```

**Dark Mode Glass**
```css
.dark .glass-medium {
  background: rgba(15, 15, 25, 0.7);
  border: 1px solid rgba(139, 92, 246, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}
```

### 1.3 Typography

**Font Stack**
```css
/* Display/Headings - Modern geometric with warmth */
--font-display: 'Inter', 'SF Pro Display', system-ui, sans-serif;

/* Body - Highly legible, personal feel */
--font-body: 'Inter', 'SF Pro Text', system-ui, sans-serif;

/* Accent/Special - For quotes, stories */
--font-accent: 'Source Serif 4', Georgia, serif;
```

**Type Scale**
```
Display XL:  48px / 1.1 / -0.02em  (Hero headlines)
Display:     36px / 1.2 / -0.015em (Page titles)
Heading 1:   28px / 1.3 / -0.01em  (Section titles)
Heading 2:   22px / 1.35 / 0       (Card titles)
Heading 3:   18px / 1.4 / 0        (Subsections)
Body Large:  16px / 1.6 / 0        (Featured text)
Body:        14px / 1.6 / 0        (Default)
Body Small:  13px / 1.5 / 0        (Secondary)
Caption:     12px / 1.4 / 0.01em   (Labels, hints)
Micro:       11px / 1.3 / 0.02em   (Badges, tags)
```

### 1.4 Iconography Strategy

**Replace Emoji with Lucide Icons + Colored Backgrounds**

Instead of: 👨 Родители (Parents)
Use: Icon badge with gradient background

```tsx
// Relationship category icons
const categoryIcons = {
  parents: { icon: Users, gradient: 'from-violet-500 to-purple-600' },
  grandparents: { icon: Crown, gradient: 'from-amber-500 to-orange-600' },
  children: { icon: Baby, gradient: 'from-sky-500 to-blue-600' },
  grandchildren: { icon: Sparkles, gradient: 'from-pink-500 to-rose-600' },
  siblings: { icon: Users2, gradient: 'from-emerald-500 to-teal-600' },
  spouses: { icon: Heart, gradient: 'from-red-500 to-pink-600' },
  extended: { icon: Network, gradient: 'from-indigo-500 to-violet-600' },
};
```

**Icon Badge Component**
```tsx
<div className="
  w-10 h-10 rounded-xl
  bg-gradient-to-br from-violet-500 to-purple-600
  flex items-center justify-center
  shadow-lg shadow-violet-500/25
">
  <Users className="w-5 h-5 text-white" />
</div>
```

### 1.5 Shadow & Elevation System

```css
/* Soft shadows with color tint */
--shadow-xs: 0 1px 2px rgba(139, 92, 246, 0.04);
--shadow-sm: 0 2px 4px rgba(139, 92, 246, 0.06);
--shadow-md: 0 4px 12px rgba(139, 92, 246, 0.08);
--shadow-lg: 0 8px 24px rgba(139, 92, 246, 0.1);
--shadow-xl: 0 16px 48px rgba(139, 92, 246, 0.12);
--shadow-glow: 0 0 24px rgba(139, 92, 246, 0.2);

/* Interactive lift */
--shadow-hover: 0 12px 32px rgba(139, 92, 246, 0.15);
```

### 1.6 Motion & Animation

**Timing Functions**
```css
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
```

**Micro-interactions**
- Button hover: `translate-y(-2px)` + shadow increase
- Card hover: `translate-y(-4px)` + glow
- Page transition: Fade + slight scale (0.98 → 1)
- Loading: Shimmer gradient animation
- Success: Confetti burst (for achievements)

---

## Part 2: Social Network UX Architecture

### 2.1 Layout Structure

```
┌────────────────────────────────────────────────────────────┐
│  NAV BAR (sticky, glass)                                   │
│  Logo   |  Dashboard  People  Tree  Stories  |  🔔 👤      │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────────────┐  ┌────────────────────────┐  │
│  │                          │  │  RIGHT SIDEBAR         │  │
│  │     MAIN CONTENT         │  │  (Desktop only)        │  │
│  │     (Feed, Lists)        │  │                        │  │
│  │                          │  │  • Quick Stats         │  │
│  │     Max-width: 680px     │  │  • Ad Zone 1           │  │
│  │     Centered             │  │  • Upcoming Events     │  │
│  │                          │  │  • Suggestions         │  │
│  │                          │  │  • Ad Zone 2           │  │
│  │                          │  │                        │  │
│  │                          │  │  Width: 320px          │  │
│  └──────────────────────────┘  └────────────────────────┘  │
│                                                            │
├────────────────────────────────────────────────────────────┤
│  MOBILE BOTTOM NAV (fixed)    🏠  👥  🌳  📖  👤           │
└────────────────────────────────────────────────────────────┘
```

### 2.2 Ad Placement Zones

**Zone 1: Right Sidebar (Desktop)**
- Position: Below quick stats
- Size: 300x250 (medium rectangle)
- Frequency: 1 ad per sidebar

**Zone 2: In-Feed (Mobile & Desktop)**
- Position: Every 5th item in feed
- Native format: Blends with content cards
- Clearly labeled "Sponsored"

**Zone 3: Stories Tray**
- Position: First slot after user's own story
- Format: Story-format ads (vertical)

### 2.3 Feed Content Types

```
1. STORY CARD
   - Photo/video preview
   - Author avatar + name
   - Story title + excerpt
   - Reactions + comments count

2. MEMORY CARD
   - "On this day X years ago..."
   - Photo collage
   - Family members tagged

3. MILESTONE CARD
   - Birthday, anniversary, memorial
   - Celebratory visual treatment
   - Quick reaction buttons

4. ACTIVITY CARD
   - "X added Y as their parent"
   - "X confirmed relationship with Y"
   - Compact, informational

5. SUGGESTION CARD
   - "Add your grandmother?"
   - "Complete your profile"
   - Actionable CTAs
```

### 2.4 Mobile Navigation

**Bottom Tab Bar (5 items)**
```
┌─────┬─────┬─────┬─────┬─────┐
│ 🏠  │ 👥  │ 🌳  │ 📖  │ 👤  │
│Home │Family│Tree │Story│ Me  │
└─────┴─────┴─────┴─────┴─────┘
```

- Icon + label (always visible)
- Active state: Filled icon + primary color
- Badge indicators for notifications

### 2.5 Empty States

**Principles:**
- Warm illustration (not generic icons)
- Clear explanation of the value
- Single prominent CTA
- Subtle secondary action

**Example: No Stories**
```
┌─────────────────────────────────┐
│                                 │
│      [Warm illustration of     │
│       family reading book]      │
│                                 │
│   Your family story begins here │
│                                 │
│   Share photos, memories, and   │
│   the moments that matter most. │
│                                 │
│   ┌──────────────────────────┐  │
│   │   📝 Create Your Story   │  │
│   └──────────────────────────┘  │
│                                 │
│   Or explore example stories    │
└─────────────────────────────────┘
```

---

## Part 3: Component System

### 3.1 Glass Card System

**Base Glass Card**
```tsx
const glassCardVariants = cva(
  "rounded-2xl transition-all duration-300",
  {
    variants: {
      glass: {
        subtle: "bg-white/70 backdrop-blur-sm border border-white/50",
        medium: "bg-white/60 backdrop-blur-md border border-white/40 shadow-lg shadow-violet-500/5",
        frosted: "bg-white/50 backdrop-blur-lg border border-white/30 shadow-xl shadow-violet-500/10",
        tinted: "bg-gradient-to-br from-violet-500/10 to-sky-500/5 backdrop-blur-md border border-violet-500/20",
      },
      hover: {
        lift: "hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-500/15",
        glow: "hover:shadow-glow hover:border-violet-500/30",
        scale: "hover:scale-[1.02]",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      }
    },
    defaultVariants: {
      glass: "medium",
      padding: "md",
    }
  }
);
```

### 3.2 Person Card (Replace Emoji-Based Cards)

**Before (Current - Ugly)**
```
👨 фывфавы фывафв
```

**After (New Design)**
```tsx
<div className="
  group relative flex items-center gap-4 p-4
  bg-white/60 backdrop-blur-md rounded-2xl
  border border-white/40
  hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-500/10
  transition-all duration-300
">
  {/* Avatar with ring */}
  <div className="relative">
    <Avatar className="w-14 h-14 ring-2 ring-white shadow-md">
      <AvatarImage src={photo} />
      <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white">
        {initials}
      </AvatarFallback>
    </Avatar>
    {/* Status indicator */}
    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 ring-2 ring-white" />
  </div>

  {/* Info */}
  <div className="flex-1 min-w-0">
    <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
    <p className="text-sm text-gray-500">{relationship}</p>
  </div>

  {/* Actions */}
  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
    <Button variant="ghost" size="icon">
      <MessageCircle className="w-4 h-4" />
    </Button>
    <Button variant="ghost" size="icon">
      <MoreHorizontal className="w-4 h-4" />
    </Button>
  </div>
</div>
```

### 3.3 Category Section Header (Replace Emoji Headers)

**Before (Current - Cheap)**
```
👨 👩 Родители
Depth = 1 (один шаг вверх)
```

**After (New Design)**
```tsx
<div className="flex items-center gap-4 mb-4">
  {/* Icon badge */}
  <div className="
    w-12 h-12 rounded-xl
    bg-gradient-to-br from-violet-500 to-purple-600
    flex items-center justify-center
    shadow-lg shadow-violet-500/25
  ">
    <Users className="w-6 h-6 text-white" />
  </div>

  {/* Title + description */}
  <div className="flex-1">
    <h2 className="text-xl font-semibold text-gray-900">Родители</h2>
    <p className="text-sm text-gray-500">1 generation up</p>
  </div>

  {/* Count badge */}
  <div className="
    px-3 py-1 rounded-full
    bg-violet-100 text-violet-700
    text-sm font-medium
  ">
    3
  </div>
</div>
```

### 3.4 Stat Card

**Before (Current - Basic)**
```
Всего людей
8          [icon]
```

**After (New Design)**
```tsx
<div className="
  relative overflow-hidden
  p-6 rounded-2xl
  bg-gradient-to-br from-violet-500 to-purple-600
  text-white
">
  {/* Background decoration */}
  <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
  <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5" />

  {/* Content */}
  <div className="relative">
    <p className="text-white/80 text-sm font-medium">Family Members</p>
    <p className="text-4xl font-bold mt-1">8</p>
    <p className="text-white/60 text-sm mt-2">+2 this month</p>
  </div>

  {/* Icon */}
  <Users className="absolute right-4 bottom-4 w-8 h-8 text-white/20" />
</div>
```

### 3.5 Navigation Bar

```tsx
<nav className="
  sticky top-0 z-50
  bg-white/70 backdrop-blur-xl
  border-b border-white/50
  shadow-sm shadow-violet-500/5
">
  <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
    {/* Logo */}
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
        <TreePine className="w-5 h-5 text-white" />
      </div>
      <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
        GeneTree
      </span>
    </div>

    {/* Nav items - Desktop */}
    <div className="hidden md:flex items-center gap-1">
      {navItems.map(item => (
        <NavItem key={item.href} {...item} />
      ))}
    </div>

    {/* Actions */}
    <div className="flex items-center gap-2">
      <NotificationButton />
      <ThemeToggle />
      <UserMenu />
    </div>
  </div>
</nav>
```

### 3.6 Button System

```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/30 active:translate-y-0",
        secondary: "bg-white/80 backdrop-blur-sm text-gray-900 border border-gray-200 hover:bg-white hover:border-gray-300",
        ghost: "text-gray-600 hover:text-gray-900 hover:bg-gray-100/50",
        danger: "bg-red-500 text-white hover:bg-red-600",
        success: "bg-emerald-500 text-white hover:bg-emerald-600",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);
```

---

## Part 4: Page-by-Page Redesign Plan

### 4.1 Dashboard

**Current Issues:**
- Flat white cards look dated
- Stats are basic boxes
- Quick actions are uninspiring
- "Failed to fetch" error is ugly

**New Design:**
- Hero welcome banner with gradient
- Stat cards with colored backgrounds
- Activity feed in main area
- Quick actions as floating FAB (mobile) or card grid
- Right sidebar with upcoming events, suggestions

### 4.2 Family Members (People)

**Current Issues:**
- Plain list with no hierarchy
- No visual distinction between pending/confirmed
- "+ Его/Её родственники" buttons look cheap

**New Design:**
- Search bar at top
- Filter tabs (All, Pending, Confirmed)
- Person cards with avatars, not text lists
- Status badges (Pending = amber, Confirmed = green)
- Quick actions on hover

### 4.3 Relationships

**Current Issues:**
- Emoji headers look unprofessional (👨👩)
- NDEFIN showing in avatar (bug)
- Cards are basic boxes

**New Design:**
- Icon badges with gradients instead of emojis
- Collapsible sections with smooth animation
- Person cards with photos
- Visual tree lines connecting generations (optional)

### 4.4 Family Tree Visualization

**Current:** D3-based tree works but styling is basic

**Enhancements:**
- Glass node cards
- Animated connections
- Zoom controls with glass styling
- Mini-map for large trees

---

## Part 5: Implementation Priority

### Phase 1: Foundation (Week 1)
1. Update Tailwind config with new colors, shadows, typography
2. Create new CSS custom properties
3. Build GlassCard component
4. Build IconBadge component
5. Update Button variants

### Phase 2: Core Components (Week 2)
1. PersonCard component
2. CategoryHeader component
3. StatCard component
4. Updated navigation bar
5. Mobile bottom nav

### Phase 3: Page Overhauls (Week 3-4)
1. Dashboard redesign
2. Family Members redesign
3. Relationships redesign
4. Empty states

### Phase 4: Polish (Week 5)
1. Motion/animation
2. Loading states
3. Dark mode refinement
4. Accessibility audit

---

## Appendix: Tailwind Config Additions

```js
// tailwind.config.ts additions
{
  theme: {
    extend: {
      colors: {
        violet: {
          // Custom violet scale if needed
        },
      },
      boxShadow: {
        'glow': '0 0 24px rgba(139, 92, 246, 0.2)',
        'glow-lg': '0 0 48px rgba(139, 92, 246, 0.25)',
      },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
}
```

---

*This design system prioritizes warmth, trust, and modern aesthetics while maintaining the accessibility and performance standards required for a family-focused social network.*
