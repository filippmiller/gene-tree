# Brainstorm Session: Honor Tags & Personal Credo

**Date:** 2026-02-02
**Facilitator:** Claude
**Duration:** 30 iterations

---

## Virtual Team (Consilium)

| Name | Role | Expertise |
|------|------|-----------|
| **Alexey** | Product Designer | UX/UI, information architecture |
| **Maria** | Cultural Consultant | Russian/Soviet history, genealogy traditions |
| **Dmitry** | Backend Engineer | Database design, API architecture |
| **Natasha** | Frontend Developer | React components, accessibility |
| **Boris** | Business Analyst | Market research, monetization |

---

## Topic 1: Honor Tags (Теги Почёта)

### Research Summary

**Russian/Soviet Context (from web research):**
- Блокадник Ленинграда (Siege of Leningrad survivor)
- Житель осаждённого Севастополя (Besieged Sevastopol resident)
- Житель осаждённого Сталинграда (Besieged Stalingrad resident)
- Ветеран Великой Отечественной войны (WWII Veteran)
- Труженик тыла (Home Front Worker)
- Узник концлагеря (Concentration Camp Survivor)
- Дети войны (Children of War)
- Герой России / СССР (Hero of Russia/USSR)
- Заслуженный артист/учитель/врач (Honored Artist/Teacher/Doctor)
- Народный артист (People's Artist)
- Ветеран труда (Labor Veteran)
- Мать-героиня (Hero Mother - 10+ children)
- Орденоносец (Order holder)

**International Context:**
- Holocaust Survivor
- Purple Heart Recipient
- Medal of Honor
- War Veteran (various conflicts)
- Refugee Status
- Nobel Laureate
- Knighthood / Dame
- OBE/MBE (British honors)

---

## Iteration Log

### Iteration 1 — Maria (Cultural Consultant)
> "Honor tags must be treated with extreme sensitivity. In Russian culture, these aren't just labels — they carry deep emotional weight. A блокадник is not just a 'tag', it's a sacred identity. We must design this with reverence, not gamification."

**Key insight:** Separate honor tags from achievement badges. Different emotional register.

---

### Iteration 2 — Alexey (Product Designer)
> "I agree with Maria. Visual language must be different from gamification badges. Think: muted colors, elegant ribbons, formal typography. Perhaps even grayscale options for memorial profiles."

**Proposal:** Two distinct systems:
1. Achievement Badges (gamification, colorful)
2. Honor Tags (memorial, dignified)

---

### Iteration 3 — Dmitry (Backend Engineer)
> "From a data perspective, we need:
> - `honor_tags` table with i18n support
> - `profile_honor_tags` junction table
> - `verification_level` field (self-declared vs family-verified vs documented)
> - Support for custom tags (family-specific honors)"

**Schema draft:**
```sql
CREATE TABLE honor_tags (
  id UUID PRIMARY KEY,
  code TEXT UNIQUE,  -- 'blockade_survivor', 'wwii_veteran'
  name_en TEXT,
  name_ru TEXT,
  description_en TEXT,
  description_ru TEXT,
  category TEXT,  -- 'military', 'civil', 'labor', 'family', 'custom'
  icon TEXT,
  color TEXT,
  is_official BOOLEAN,
  requires_verification BOOLEAN,
  sort_order INT
);
```

---

### Iteration 4 — Boris (Business Analyst)
> "This feature has strong emotional appeal for our Russian diaspora target. It differentiates us from Ancestry/MyHeritage. Could drive word-of-mouth: 'Gene-Tree lets me honor my grandmother as a блокадник.'"

**Market insight:** Holocaust survivors database integration could be valuable partnership (Yad Vashem, USHMM).

---

### Iteration 5 — Natasha (Frontend Developer)
> "UI placement options:
> 1. Badge row under profile photo (most visible)
> 2. Dedicated 'Honors' section on profile
> 3. Ribbon overlay on avatar (elegant but complex)
>
> I vote for option 2 with subtle indicators in option 1 for key honors."

---

### Iteration 6 — Maria (Cultural Consultant)
> "We need categories that make sense across cultures:
>
> **Military/War:**
> - Combat veteran (by conflict)
> - Prisoner of war
> - Siege survivor
> - Resistance fighter
> - War refugee
>
> **Civil Service:**
> - Government honors
> - Professional distinctions
> - Academic achievements
>
> **Labor:**
> - Labor veteran
> - Home front worker
> - Pioneer/Settler
>
> **Family:**
> - Founding ancestor
> - Family historian
> - Hero mother/father
>
> **Persecution/Survival:**
> - Holocaust survivor
> - Gulag survivor
> - Political prisoner
> - Refugee"

---

### Iteration 7 — Alexey (Product Designer)
> "For deceased profiles, the honor tags become especially important. Proposal:
> - Living profiles: honor tags shown with subtle styling
> - Deceased profiles: honor tags prominently featured, possibly with memorial ribbon treatment"

**Wireframe concept:**
```
┌─────────────────────────────────┐
│  [Avatar]                       │
│   Name (1920-2005)              │
│   ◇ Блокадник Ленинграда        │
│   ◇ Ветеран труда               │
│                                 │
│  "Прожила достойную жизнь..."   │
└─────────────────────────────────┘
```

---

### Iteration 8 — Dmitry (Backend Engineer)
> "Verification workflow for honor tags:
> 1. **Self-declared** — User adds to own profile (green check)
> 2. **Family-verified** — 3+ family members confirm (bronze badge)
> 3. **Documented** — Upload supporting document (gold badge)
>
> For deceased, only family-verified or documented should be allowed."

---

### Iteration 9 — Boris (Business Analyst)
> "Potential premium feature: 'Official Document Upload' with archival storage. Free tier: 3 honor tags. Premium: unlimited + document archive."

**Pricing consideration:** This could be a differentiator for premium tiers.

---

### Iteration 10 — Natasha (Frontend Developer)
> "Accessibility concern: honor tags must be screen-reader friendly. Each tag needs:
> - `aria-label` with full description
> - Sufficient color contrast
> - Text alternative for icons"

---

### Iteration 11 — Maria (Cultural Consultant)
> "Expanded tag list based on research:
>
> **Russian-specific:**
> - Блокадник Ленинграда
> - Житель осаждённого Севастополя
> - Житель осаждённого Сталинграда
> - Труженик тыла
> - Узник концлагеря (несовершеннолетний)
> - Узник ГУЛАГ
> - Репрессированный
> - Реабилитированный
> - Дети войны
> - Афганец (Afghan War Veteran)
> - Чернобылец (Chernobyl Liquidator)
> - Ветеран боевых действий
>
> **Soviet Awards:**
> - Герой Советского Союза
> - Герой Социалистического Труда
> - Орден Ленина
> - Орден Красной Звезды
> - Медаль 'За оборону Ленинграда'
> - Медаль 'За оборону Сталинграда'
> - Медаль 'За доблестный труд'
>
> **Russian Federation:**
> - Герой Российской Федерации
> - Заслуженный артист РФ
> - Заслуженный учитель РФ
> - Заслуженный врач РФ
> - Народный артист РФ
> - Мать-героиня (10+ детей)
> - Ветеран труда"

---

### Iteration 12 — Alexey (Product Designer)
> "Icon system for honor tags:
> - Military: star, medal, shield
> - Civil: laurel wreath, ribbon
> - Labor: hammer, gear, wheat
> - Family: heart, home, tree
> - Persecution: candle, dove, broken chain
>
> Color palette:
> - Military: deep blue, gold
> - Civil: purple, silver
> - Labor: bronze, earth tones
> - Family: warm burgundy
> - Persecution: muted gray with single accent color (hope)"

---

### Iteration 13 — Dmitry (Backend Engineer)
> "API endpoints:
> ```
> GET  /api/honor-tags               — List all available tags
> GET  /api/honor-tags/categories    — List categories
> POST /api/profiles/:id/honor-tags  — Add tag to profile
> DELETE /api/profiles/:id/honor-tags/:tagId
> POST /api/profiles/:id/honor-tags/:tagId/verify
> POST /api/profiles/:id/honor-tags/:tagId/document
> GET  /api/profiles/:id/honor-tags  — Get profile's tags
> ```"

---

### Iteration 14 — Boris (Business Analyst)
> "Competitive analysis:
> - **Ancestry:** Basic military records, no honor system
> - **MyHeritage:** DNA focus, no honor tags
> - **FamilySearch:** Religious focus, no secular honors
> - **Find a Grave:** Memorial focus but no structured honors
>
> **Our opportunity:** First genealogy platform with structured honor/commemoration system."

---

### Iteration 15 — Natasha (Frontend Developer)
> "Component hierarchy:
> ```tsx
> <HonorTagsSection>
>   <HonorTagsHeader title='Honors & Distinctions' />
>   <HonorTagsList>
>     <HonorTag
>       tag={tag}
>       verificationLevel='family_verified'
>       onVerify={handleVerify}
>     />
>   </HonorTagsList>
>   <AddHonorTagButton onClick={openTagSelector} />
> </HonorTagsSection>
> ```"

---

## Topic 2: Personal Credo (Личное Кредо)

### Iteration 16 — Alexey (Product Designer)
> "Naming options:
> 1. **Bio** — Too generic (social media)
> 2. **Credo** — Too formal
> 3. **Life Motto** — Good, but limited
> 4. **About Me** — Generic
> 5. **My Words / Мои слова** — Personal, poetic
> 6. **Life Quote / Жизненная цитата** — Specific but limiting
>
> **Recommendation:** 'Personal Statement' / 'О себе' with subtitle 'Your words to future generations'"

---

### Iteration 17 — Maria (Cultural Consultant)
> "In Russian tradition, epitaphs and life mottos are very important. The concept of 'завещание' (testament) and 'напутствие' (parting words) resonates deeply.
>
> For living people: 'Мой девиз' (My motto)
> For deceased: 'Слова, которые остались' (Words that remained)"

---

### Iteration 18 — Boris (Business Analyst)
> "Character limit research:
> - Twitter/X bio: 160 chars
> - Instagram bio: 150 chars
> - LinkedIn summary: 2,600 chars
> - Facebook intro: 101 chars
>
> **Recommendation:**
> - Short motto: 150 chars (always visible)
> - Extended bio: 500 chars (expandable)"

---

### Iteration 19 — Dmitry (Backend Engineer)
> "Schema addition to user_profiles:
> ```sql
> ALTER TABLE user_profiles ADD COLUMN
>   personal_statement TEXT,
>   personal_statement_privacy privacy_level DEFAULT 'family',
>   life_motto VARCHAR(150),
>   life_motto_privacy privacy_level DEFAULT 'public';
> ```
>
> Two fields:
> - `life_motto`: Short, always visible (150 chars)
> - `personal_statement`: Longer bio (500 chars)"

---

### Iteration 20 — Natasha (Frontend Developer)
> "UI placement:
> 1. Directly under name (most prominent)
> 2. In profile header card
> 3. As first item in 'About' section
>
> For deceased profiles, the motto/statement becomes the 'epitaph' area."

**Mockup:**
```
┌─────────────────────────────────┐
│  [Avatar]     Name              │
│              1920-2005          │
│                                 │
│  "Жизнь прожита не зря,        │
│   если хоть один человек       │
│   стал от неё счастливее"      │
│                                 │
│  ◇ Блокадник ◇ Ветеран труда   │
└─────────────────────────────────┘
```

---

### Iteration 21 — Alexey (Product Designer)
> "Typography for life motto:
> - Italic or script font
> - Quotation marks styling (decorative « »)
> - Slightly larger font size than body text
> - Subtle background highlight (like paper texture)
>
> For deceased: Could add a small candle or dove icon."

---

### Iteration 22 — Maria (Cultural Consultant)
> "Important: The personal statement should support Cyrillic properly, including:
> - Russian
> - Ukrainian
> - Hebrew transliteration
> - Yiddish
>
> Many diaspora families have quotes in their original language."

---

### Iteration 23 — Boris (Business Analyst)
> "Feature value:
> - **Emotional connection:** Seeing grandmother's words
> - **Preservation:** Saving wisdom for future generations
> - **Differentiation:** No competitor has this
> - **Sharing:** Quotable content for social media
>
> Potential feature: 'Quote of the Day' — daily notification with ancestor's words"

---

### Iteration 24 — Dmitry (Backend Engineer)
> "Additional fields for deceased profiles (family-managed):
> ```sql
> -- For deceased profiles (managed by family)
> memorial_quote TEXT,
> memorial_quote_author UUID REFERENCES user_profiles(user_id),
> memorial_quote_added_at TIMESTAMPTZ
> ```
>
> This allows family members to add a memorial quote with attribution."

---

### Iteration 25 — Natasha (Frontend Developer)
> "Input component for life motto:
> - Character counter (150)
> - Real-time preview
> - Emoji support (limited, tasteful)
> - Privacy toggle inline
> - 'Inspiration' button with famous quotes"

---

### Iteration 26 — Alexey (Product Designer)
> "Memorial profile special treatment:
> ```
> ┌─────────────────────────────────────────┐
> │                                         │
> │  ┌─────────┐                            │
> │  │         │   Мария Ивановна           │
> │  │  Photo  │   Петрова                  │
> │  │  ✕      │   1923 — 2019              │
> │  └─────────┘                            │
> │                                         │
> │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
> │                                         │
> │  « Главное в жизни — это семья.        │
> │    Всё остальное — приложится. »       │
> │                                         │
> │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
> │                                         │
> │  ◈ Блокадник Ленинграда                │
> │  ◈ Ветеран труда                        │
> │  ◈ Заслуженный учитель РСФСР           │
> │                                         │
> └─────────────────────────────────────────┘
> ```"

---

### Iteration 27 — Maria (Cultural Consultant)
> "Suggested prompt questions to help people write their statement:
>
> 1. Что бы вы хотели, чтобы ваши правнуки знали о вас?
> 2. Какой главный урок вы вынесли из жизни?
> 3. Что для вас значит семья?
> 4. Какими словами вы хотели бы быть запомнены?
>
> These prompts help people who struggle with 'what to write.'"

---

### Iteration 28 — Boris (Business Analyst)
> "Feature rollout plan:
> 1. **Phase 1:** Life motto field (150 chars) — MVP
> 2. **Phase 2:** Extended bio (500 chars) — v1.1
> 3. **Phase 3:** Memorial mode integration — v1.2
> 4. **Phase 4:** Quote of the Day notifications — v2.0"

---

### Iteration 29 — Dmitry (Backend Engineer)
> "Complete migration draft:
> ```sql
> -- Honor Tags and Personal Credo Migration
>
> -- 1. Honor Tags System
> CREATE TABLE honor_tags (
>   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
>   code TEXT UNIQUE NOT NULL,
>   name TEXT NOT NULL,
>   name_ru TEXT,
>   description TEXT,
>   description_ru TEXT,
>   category TEXT NOT NULL CHECK (category IN (
>     'military_wwii', 'military_other', 'civil_honors',
>     'labor', 'family', 'persecution', 'custom'
>   )),
>   icon TEXT DEFAULT 'medal',
>   color TEXT DEFAULT '#6B7280',
>   is_official BOOLEAN DEFAULT true,
>   requires_verification BOOLEAN DEFAULT false,
>   country_code TEXT,  -- 'RU', 'US', 'IL', etc.
>   sort_order INT DEFAULT 0,
>   is_active BOOLEAN DEFAULT true,
>   created_at TIMESTAMPTZ DEFAULT now()
> );
>
> -- 2. Profile Honor Tags (junction)
> CREATE TABLE profile_honor_tags (
>   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
>   profile_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
>   honor_tag_id UUID NOT NULL REFERENCES honor_tags(id) ON DELETE CASCADE,
>   verification_level TEXT DEFAULT 'self_declared' CHECK (
>     verification_level IN ('self_declared', 'family_verified', 'documented')
>   ),
>   verified_by UUID[] DEFAULT '{}',
>   document_url TEXT,
>   notes TEXT,
>   added_by UUID REFERENCES auth.users(id),
>   added_at TIMESTAMPTZ DEFAULT now(),
>   UNIQUE(profile_id, honor_tag_id)
> );
>
> -- 3. Personal Credo fields
> ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS
>   life_motto VARCHAR(150),
>   life_motto_privacy privacy_level DEFAULT 'family',
>   personal_statement VARCHAR(500),
>   personal_statement_privacy privacy_level DEFAULT 'family';
>
> -- Indexes
> CREATE INDEX idx_honor_tags_category ON honor_tags(category);
> CREATE INDEX idx_honor_tags_country ON honor_tags(country_code);
> CREATE INDEX idx_profile_honor_tags_profile ON profile_honor_tags(profile_id);
> CREATE INDEX idx_profile_honor_tags_tag ON profile_honor_tags(honor_tag_id);
> ```"

---

### Iteration 30 — Alexey (Product Designer)
> "Final recommendations summary:
>
> **Honor Tags:**
> - Separate visual system from achievement badges
> - Dignified, muted color palette
> - Three verification levels with visual indicators
> - Special treatment for memorial profiles
> - Category-based organization
>
> **Personal Credo:**
> - Two-tier system: Life Motto (150) + Extended Bio (500)
> - Prominent placement under name
> - Special 'epitaph' styling for deceased
> - Writing prompts to help users
> - Privacy controls per field"

---

## Consolidated Recommendations

### Honor Tags System

#### Database Schema
- New `honor_tags` table with i18n support
- Junction table `profile_honor_tags` with verification levels
- Support for official and custom tags

#### Tag Categories
1. **Military (WWII):** Блокадник, Ветеран ВОВ, Труженик тыла, Узник концлагеря
2. **Military (Other):** Афганец, Чернобылец, Ветеран боевых действий
3. **Civil Honors:** Герой России, Заслуженный (artist/teacher/doctor), Народный артист
4. **Labor:** Ветеран труда, Герой Социалистического Труда
5. **Family:** Основатель рода, Хранитель истории, Мать-героиня
6. **Persecution/Survival:** Holocaust Survivor, Узник ГУЛАГ, Репрессированный, Беженец
7. **Custom:** Family-specific honors

#### Verification Levels
1. **Self-declared** — Added by profile owner (badge: ○)
2. **Family-verified** — 3+ family members confirm (badge: ◉)
3. **Documented** — Supporting document uploaded (badge: ★)

#### UI Placement
- Section below profile header
- Compact view: 3 tags + "N more"
- Expanded modal with full list and verification actions

### Personal Credo System

#### Fields
1. **Life Motto** — 150 characters, always visible
2. **Personal Statement** — 500 characters, expandable

#### Naming (Localized)
- EN: "Life Motto" / "About Me"
- RU: "Мой девиз" / "О себе"

#### UI Placement
- Directly under name in profile header
- Decorative quotation marks styling
- Privacy toggle per field

#### Memorial Mode
- For deceased: "Words that remained" / "Слова, которые остались"
- Added by family members with attribution
- Epitaph-style visual treatment

---

## Implementation Priority

### Phase 1 (MVP)
1. Life Motto field (150 chars) with privacy
2. Basic honor tags table with Russian WWII tags
3. Simple tag display on profile

### Phase 2
1. Extended bio field (500 chars)
2. Tag verification workflow
3. Memorial mode integration

### Phase 3
1. Custom tags support
2. Document upload for verification
3. International tags expansion

---

## Sources Referenced

- [Государственные награды РФ — Википедия](https://ru.wikipedia.org/wiki/Государственные_награды_Российской_Федерации)
- [Льготы блокадникам — gogov.ru](https://gogov.ru/services/vvov-benefits/siege-of-leningrad)
- [Ветераны ВОВ — Википедия](https://ru.wikipedia.org/wiki/Ветераны_Великой_Отечественной_войны)
- [Труженики тыла — Википедия](https://ru.wikipedia.org/wiki/Труженики_тыла)
- [Holocaust Survivor Database — USHMM](https://www.ushmm.org/remember/resources-holocaust-survivors-victims/database-of-holocaust-survivor-and-victim-names)
- [Social Media Bio Limits — sproutsocial.com](https://sproutsocial.com/insights/social-media-character-counter/)
