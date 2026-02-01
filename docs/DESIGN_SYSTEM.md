# Gene-Tree Heritage Design System

> A warm, sophisticated design system inspired by leading genealogy platforms while maintaining a unique identity.

## Design Philosophy

The Heritage Design System draws inspiration from:
- **Ancestry.com**: Warm sage greens, serif typography, leaf iconography
- **MyHeritage**: Vibrant accents, multiple tree views, smart matching UI
- **FamilySearch**: Clean layouts, warm illustrations, accessible design
- **Modern Apps**: Story-first navigation, micro-interactions, mobile-first approach

**Our Unique Identity**: Warm Sage + Rich Amber palette, creating a "vintage photo album" aesthetic that feels trustworthy and timeless.

---

## Color Palette

### Primary: Heritage Sage
A calming sage green that evokes nature, growth, and heritage.

| Token | HSL | Hex | Usage |
|-------|-----|-----|-------|
| `--primary` | `95 35% 42%` | `#638552` | Buttons, links, tree nodes |
| `heritage-sage-500` | - | `#638552` | Primary actions |
| `heritage-sage-600` | - | `#4d6a40` | Hover states |
| `heritage-sage-100` | - | `#e5ebe1` | Light backgrounds |

### Accent: Rich Amber
A warm amber/gold that evokes vintage photographs and warmth.

| Token | HSL | Hex | Usage |
|-------|-----|-----|-------|
| `--accent` | `32 65% 55%` | `#d4874a` | Hints, badges, highlights |
| `heritage-amber-500` | - | `#d4874a` | Accent elements |
| `heritage-amber-300` | - | `#e9c08d` | Soft highlights |

### Backgrounds
| Token | Description |
|-------|-------------|
| `--background` | Warm cream (`40 30% 98%`) |
| `--card` | Slightly warmer white (`40 40% 99%`) |
| `--paper` | Antique paper feel (`42 35% 96%`) |
| `--sepia` | Photo sepia tint (`35 45% 85%`) |

### Semantic Colors
| Token | Color | Usage |
|-------|-------|-------|
| `--success` | Forest Green | Confirmations, completed |
| `--warning` | Golden Amber | Alerts, pending |
| `--destructive` | Terracotta Red | Errors, delete actions |
| `--info` | Dusty Blue | Information, tips |

### Generation Colors (Family Tree)
| Generation | Color | Token |
|------------|-------|-------|
| Self (0) | Sage Green | `--generation-0` |
| Parents (1) | Forest Green | `--generation-1` |
| Grandparents (2) | Dusty Blue | `--generation-2` |
| Great-grandparents (3) | Rich Amber | `--generation-3` |
| Ancestors (4+) | Soft Purple | `--generation-4` |

### Relationship Colors
| Relationship | Color | Token |
|--------------|-------|-------|
| Parent | Sage Green | `--relation-parent` |
| Child | Forest Green | `--relation-child` |
| Spouse | Rose | `--relation-spouse` |
| Sibling | Dusty Blue | `--relation-sibling` |

---

## Typography

### Fonts
```css
/* Headings - Heritage Serif */
font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;

/* Body - Modern Sans */
font-family: 'Inter', system-ui, -apple-system, sans-serif;
```

### Usage
- **h1, h2, h3**: Playfair Display (automatically applied)
- **Body text**: Inter
- **`.font-heritage`**: Force heritage font on any element

### Scale
| Element | Class | Weight |
|---------|-------|--------|
| Page Title | `text-3xl font-heritage` | 600 |
| Section Title | `text-2xl font-heritage` | 600 |
| Card Title | `text-xl font-heritage` | 600 |
| Body | `text-base` | 400 |
| Caption | `text-sm text-muted-foreground` | 400 |

---

## Spacing & Layout

### Border Radius
| Token | Value | Usage |
|-------|-------|-------|
| `rounded-heritage` | 1.25rem (20px) | Cards, panels |
| `rounded-heritage-lg` | 1.5rem (24px) | Large cards |
| `rounded-pill` | 9999px | Buttons, badges |
| `rounded-2xl` | 1.25rem | Modern cards |
| `rounded-3xl` | 1.5rem | Featured cards |

### Shadows
| Token | Usage |
|-------|-------|
| `shadow-heritage` | Default card shadow |
| `shadow-heritage-hover` | Hover state |
| `shadow-frame` | Photo frames |
| `shadow-elevation-1` to `shadow-elevation-5` | Layered elevation |

---

## Components

### Heritage Card
```jsx
<div className="heritage-card">
  {/* Content */}
</div>
```
Applies: rounded corners, subtle border, warm shadow, hover lift animation.

### Pill Button (like Ancestry)
```jsx
<button className="btn-pill bg-primary text-primary-foreground">
  Save Changes
</button>
```

### Hint Badge (like Ancestry leaf)
```jsx
<span className="hint-badge">
  <LeafIcon className="w-3 h-3" />
  3 hints
</span>
```

### Glass Panel
```jsx
<div className="glass-panel rounded-heritage p-6">
  {/* Frosted glass effect */}
</div>
```

### Photo Frame
```jsx
<div className="photo-frame">
  <img src="..." alt="..." />
</div>

{/* Vintage style */}
<div className="photo-frame-vintage">
  <img src="..." alt="..." />
</div>
```

### Story Card
```jsx
<div className="story-card">
  {/* Paper texture background */}
</div>
```

### Timeline Marker
```jsx
<div className="timeline-marker" />
```

---

## Effects & Utilities

### Sepia Photo Effect
```jsx
<img className="sepia-effect" />
```
Applies subtle sepia, removes on hover.

### Paper Texture
```jsx
<div className="paper-texture" />
```
Adds subtle noise texture for vintage feel.

### Text Gradient
```jsx
<h1 className="text-gradient-heritage">
  Family Legacy
</h1>
```

### Vintage Corners
```jsx
<div className="vintage-corners">
  {/* Decorative corner brackets */}
</div>
```

---

## Animations

| Class | Effect |
|-------|--------|
| `animate-fade-in-up` | Fade in with upward motion |
| `animate-card-enter` | Card entrance animation |
| `animate-lift` | Hover lift effect |
| `animate-wiggle` | Attention wiggle (for hints) |
| `animate-shimmer` | Loading shimmer |
| `animate-pulse-glow` | Subtle pulsing glow |

### Timing Functions
| Class | Feel |
|-------|------|
| `ease-heritage` | Smooth, organic |
| `ease-smooth` | Standard easing |
| `ease-bounce-soft` | Subtle bounce |

---

## Dark Mode

All tokens automatically adapt to dark mode:
- Background becomes warm dark (`30 15% 8%`)
- Cards become slightly lighter dark
- Primary sage lightens for visibility
- Warm tones preserved throughout

---

## Usage Examples

### Profile Card
```jsx
<div className="heritage-card p-6">
  <div className="photo-frame w-24 h-24 mx-auto mb-4">
    <img src={avatar} alt={name} className="sepia-effect" />
  </div>
  <h3 className="text-xl font-heritage text-center">{name}</h3>
  <p className="text-sm text-muted-foreground text-center">
    {birthYear} - {deathYear || 'Present'}
  </p>
  <div className="mt-4 flex justify-center gap-2">
    <span className="hint-badge">
      <LeafIcon className="w-3 h-3" />
      {hintCount} hints
    </span>
  </div>
</div>
```

### Story Entry
```jsx
<div className="story-card">
  <div className="flex items-start gap-4">
    <div className="timeline-marker flex-shrink-0 mt-1" />
    <div>
      <h4 className="font-heritage text-lg">{title}</h4>
      <p className="text-sm text-muted-foreground mb-2">{date}</p>
      <p>{content}</p>
    </div>
  </div>
</div>
```

### Family Tree Node
```jsx
<div
  className="heritage-card p-4"
  style={{ backgroundColor: `hsl(var(--generation-${generation}))` }}
>
  <div className="generation-badge mb-2">{generation}</div>
  <p className="font-heritage">{name}</p>
</div>
```

---

## Competitor Pattern Reference

### From Ancestry
- Sage green primary color
- Serif headings (Playfair Display)
- Leaf icon for hints
- Pill-shaped buttons
- Warm, trustworthy palette

### From MyHeritage
- Bold accent colors for matches
- Color-coded relationship types
- Multiple tree visualization options
- Smart matching UI patterns

### From FamilySearch
- Clean, accessible layouts
- Warm illustrations
- Fan chart visualizations
- Community contribution focus

### Modern App Patterns
- 20-24px border radius
- Subtle hover animations
- Story-first navigation
- Mobile-responsive cards

---

## Files

- `src/app/globals.css` - CSS variables and base styles
- `tailwind.config.ts` - Tailwind tokens and utilities
- Google Fonts: Playfair Display + Inter

---

*Last updated: February 1, 2026*
