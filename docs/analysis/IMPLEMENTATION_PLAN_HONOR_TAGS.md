# Implementation Plan: Honor Tags & Personal Credo

**Created:** 2026-02-02
**Status:** Ready for Implementation
**Priority:** HIGH (Engagement Phase feature)

---

## Executive Summary

Two new features to enhance profile personalization and commemoration:

1. **Honor Tags** — Commemorative tags for special statuses (veterans, survivors, awards)
2. **Personal Credo** — Life motto and personal statement fields

These features align with Gene-Tree's core philosophy:
- **Stories Matter** — Preserving identity beyond names and dates
- **Cultural Awareness** — Supporting Russian/Soviet honor traditions
- **Preservation** — Capturing important family heritage markers

---

## What Was Created

### Database

| File | Description |
|------|-------------|
| `supabase/migrations/20260202000000_honor_tags_and_credo.sql` | Schema for honor tags system + personal credo fields |
| `supabase/migrations/20260202000001_seed_honor_tags.sql` | 50+ pre-defined honor tags (Russian, Soviet, international) |

### TypeScript Types

| File | Description |
|------|-------------|
| `src/types/honor-tags.ts` | Type definitions for honor tags system |

### React Components

| File | Description |
|------|-------------|
| `src/components/honor-tags/HonorTag.tsx` | Single honor tag display component |
| `src/components/honor-tags/HonorTagsSection.tsx` | Honor tags section for profile page |
| `src/components/honor-tags/index.ts` | Barrel exports |
| `src/components/profile/PersonalCredo.tsx` | Life motto and bio display/input components |

### Documentation

| File | Description |
|------|-------------|
| `docs/analysis/BRAINSTORM_HONOR_TAGS_AND_CREDO.md` | Full 30-iteration brainstorm session |

---

## Honor Tags System

### Categories

| Category | Description | Examples |
|----------|-------------|----------|
| `military_wwii` | WWII-related honors | Blockade survivor, WWII Veteran, Home front worker |
| `military_other` | Other conflicts | Afghan veteran, Chernobyl liquidator |
| `civil_honors` | Government awards | Hero of Russia, Honored Artist |
| `labor` | Labor achievements | Labor Veteran, Hero of Socialist Labor |
| `family` | Family roles | Founding ancestor, Family historian |
| `persecution` | Survival | Holocaust survivor, Gulag survivor |
| `academic` | Academic titles | Professor, Academician |
| `custom` | User-defined | Family-specific honors |

### Pre-seeded Tags (50+)

**Russian/Soviet:**
- Блокадник Ленинграда
- Житель осаждённого Севастополя
- Житель осаждённого Сталинграда
- Ветеран ВОВ
- Труженик тыла
- Узник концлагеря
- Дети войны
- Афганец
- Чернобылец
- Герой СССР/России
- Заслуженный артист/учитель/врач
- Ветеран труда
- Мать-героиня
- Узник ГУЛАГа
- Репрессированный

**International:**
- Holocaust Survivor
- Purple Heart Recipient
- Vietnam/Korea Veteran
- Nobel Laureate
- Professor/Academician

### Verification Levels

| Level | Icon | Description |
|-------|------|-------------|
| `self_declared` | ○ | Added by profile owner |
| `family_verified` | ◉ | Confirmed by 3+ family members |
| `documented` | ★ | Supporting document uploaded |

---

## Personal Credo System

### Fields

| Field | Limit | Privacy Default | Purpose |
|-------|-------|-----------------|---------|
| `life_motto` | 150 chars | Family | Short personal quote/motto |
| `personal_statement` | 500 chars | Family | Extended biography |
| `memorial_quote` | Unlimited | Family | For deceased (added by family) |

### UI Placement

- **Life Motto:** Displayed prominently under profile name
- **Personal Statement:** Expandable "About me" section
- **Memorial Quote:** Epitaph-style display for deceased profiles

### Writing Prompts (Russian & English)

1. What would you want your great-grandchildren to know about you?
2. What is the main lesson you learned from life?
3. What does family mean to you?
4. What words would you like to be remembered by?

---

## Remaining Work

### Phase 1: MVP (Current Sprint)

- [x] Database migration
- [x] Seed honor tags
- [x] TypeScript types
- [x] HonorTag component
- [x] HonorTagsSection component
- [x] PersonalCredo component
- [ ] API endpoints (`/api/honor-tags/*`)
- [ ] Integration into profile page
- [ ] Honor tag selector modal

### Phase 2: Full Features

- [ ] Tag verification workflow UI
- [ ] Document upload for verification
- [ ] Custom tag creation
- [ ] Memorial mode integration
- [ ] Honor tags in tree view (icon overlay)

### Phase 3: Enhancements

- [ ] International tags expansion
- [ ] Historical archives integration
- [ ] "Quote of the Day" notifications
- [ ] PDF export with honor tags

---

## API Endpoints (To Create)

```
GET    /api/honor-tags                    — List all available tags
GET    /api/honor-tags/categories         — List categories with counts
GET    /api/profiles/:id/honor-tags       — Get profile's tags
POST   /api/profiles/:id/honor-tags       — Add tag to profile
DELETE /api/profiles/:id/honor-tags/:id   — Remove tag
POST   /api/profiles/:id/honor-tags/:id/verify — Submit verification
PATCH  /api/profiles/:id/credo            — Update life motto/statement
```

---

## Visual Design Guidelines

### Honor Tags (distinct from achievement badges)

| Aspect | Honor Tags | Achievement Badges |
|--------|------------|-------------------|
| Color palette | Muted, dignified | Vibrant, celebratory |
| Shape | Pill/ribbon | Circular |
| Animation | None | Subtle glow |
| Typography | Elegant serif hints | Bold sans-serif |
| Purpose | Commemoration | Gamification |

### Memorial Profile Treatment

- Slightly desaturated colors
- Candle/flame icon accent
- Decorative quotation marks
- Separator lines above/below credo

---

## Testing Checklist

- [ ] Honor tags display correctly in EN and RU
- [ ] Verification levels show correct icons
- [ ] Privacy controls respected
- [ ] Deceased profiles show memorial styling
- [ ] Personal credo character limits enforced
- [ ] Screen reader accessibility verified
- [ ] Mobile responsive layout

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Profiles with honor tags | 20% of deceased profiles |
| Life motto completion | 15% of active users |
| Verification rate | 40% of honor tags verified |
| Feature NPS | >60 |

---

## Next Steps

1. Run database migrations
2. Create API endpoints
3. Integrate components into profile page
4. Create honor tag selector modal
5. Test with Russian/English locales
6. Gather user feedback

---

*This feature supports the Gene-Tree philosophy: "Not just names and dates — living narratives."*
