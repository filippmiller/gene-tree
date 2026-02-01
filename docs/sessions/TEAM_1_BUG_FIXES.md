# Team 1: Bug Fixes & Migration

## Objective
Commit all bug fixes and the critical database migration.

## Files to Commit

### Migration (CRITICAL)
- `supabase/migrations/0036_fix_critical_bugs.sql`

### Bug Fixes (Modified Files)
```
src/app/[locale]/(auth)/sign-in/page.tsx
src/app/[locale]/(auth)/sign-up/page.tsx
src/app/[locale]/(protected)/app/page.tsx
src/app/[locale]/(protected)/elder-questions/ElderQuestionsClient.tsx
src/app/[locale]/(protected)/my-profile/page.tsx
src/app/[locale]/(protected)/people/page.tsx
src/app/[locale]/(protected)/relationship-finder/page.tsx
src/app/[locale]/invite/[token]/page.tsx
src/app/[locale]/profile/[id]/page.tsx
src/components/dashboard/NotificationsPanel.tsx
src/components/elder-questions/QuestionList.tsx
src/components/feed/ActivityFeed.tsx
src/components/feed/ActivityItem.tsx
src/components/notifications/NotificationBell.tsx
src/components/notifications/NotificationItem.tsx
src/components/photo-tags/PhotoTagOverlay.tsx
src/components/photo-tags/TagMarker.tsx
src/components/profile/ProfilePhotosSection.tsx
src/components/relationship-path/PathVisualization.tsx
src/components/relationship-path/RelationshipPathFinder.tsx
src/components/relationships/AddRelationshipModal.tsx
src/components/relationships/RelationshipsList.tsx
src/components/relatives/AddRelativeForm.tsx
src/components/this-day/EventCard.tsx
src/components/this-day/ThisDayHub.tsx
src/components/tribute/GuestbookEntry.tsx
src/components/tribute/TributePageLayout.tsx
src/messages/en/common.json
src/messages/ru/common.json
```

## Bugs Fixed (Reference)

| Bug | Fix |
|-----|-----|
| RLS blocking invitation lookup | Added public SELECT policy |
| Deceased constraint | Modified to allow is_deceased=true |
| is_profile_owner function | Fixed to compare profile_id = user_id |
| UNDEFINED in names | Safe name pattern: `[a,b].filter(Boolean).join(' ')` |
| Mixed EN/RU on auth | Added locale-based translations |
| Infinite loop in ProfilePhotos | useMemo for client + hasError state |

## Commit Message Template

```
fix: critical database bugs and UI fixes

Database (migration 0036):
- Add RLS policy for invitation token lookup
- Fix deceased constraint to allow memorial profiles
- Fix is_profile_owner function

UI Fixes:
- Fix UNDEFINED display in 15+ components
- Add EN/RU translations to auth pages
- Fix infinite loop in ProfilePhotosSection
- Fix relationship finder dropdown

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

## Steps

1. Stage migration file
2. Stage all modified src/ files listed above
3. Stage message files
4. Create commit with message above
5. Verify commit succeeded

## Do NOT Include
- Admin pages (Team 2)
- Test files (Team 3)
- Session docs (Team 3)
