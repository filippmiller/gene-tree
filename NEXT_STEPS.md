# Gene-Tree: Следующие шаги разработки

## ✅ Завершено
- [x] Стабилизация Next.js 15.0.3 + React 18
- [x] Разделение Supabase клиентов (admin/SSR/browser)
- [x] Ленивая инициализация для Docker build
- [x] Деплой на Railway
- [x] Исправление hydration errors

## 🔥 Phase 1: Критические исправления (High Priority)

### 1.1 Auth Flow Debugging
**Статус:** В процессе  
**Проблема:** После исправления hydration ошибок нужно протестировать полный auth flow  
**Задачи:**
- [ ] Проверить что sign-in работает и создает сессию
- [ ] Проверить что cookies правильно сохраняются
- [ ] Проверить редирект после login → /app
- [ ] Протестировать sign-up flow
- [ ] Проверить password reset

### 1.2 Code Quality Cleanup  
**Цель:** Убрать технический долг  
**Задачи:**
- [ ] Удалить все `as any` в API routes (media/*, relationships/*, tree/*)
- [ ] Создать правильные типы для API responses
- [ ] Заменить `<img>` на Next.js `<Image>` в:
  - [ ] `components/profile/AvatarUpload.tsx`
  - [ ] `components/tree/PersonCard.tsx`
  - [ ] `app/[locale]/(protected)/app/page.tsx`
- [ ] Снизить ESLint max-warnings: 220 → 180 → 120 → 60 → 0

### 1.3 Security Hardening
**Цель:** Безопасность production окружения  
**Задачи:**
- [ ] Audit: где используется `supabaseAdmin` (service role)
- [ ] Проверить что SSR использует только anon key (не service role)
- [ ] Добавить rate limiting на:
  - [ ] `/api/auth/*` endpoints
  - [ ] `/api/media/signed-upload`
  - [ ] `/api/invitations/*`
- [ ] Добавить CSRF protection
- [ ] Настроить RLS policies в Supabase
- [ ] Проверить что secrets не попадают в client bundle

---

## 🚀 Phase 2: Core Features (Medium Priority)

### 2.1 User Profile Management
**Задачи:**
- [ ] Завершить profile completion flow
- [ ] Добавить avatar upload с preview
- [ ] Валидация полей профиля
- [ ] Редактирование профиля
- [ ] Настройки приватности

### 2.2 Family Tree Visualization
**Задачи:**
- [ ] Улучшить производительность D3 дерева
- [ ] Добавить zoom/pan controls
- [ ] Поиск по дереву
- [ ] Фильтры (поколения, пол, живые/умершие)
- [ ] Export дерева в PDF/PNG

### 2.3 Relationships Management
**Задачи:**
- [ ] UI для добавления родственников
- [ ] Валидация связей (избежать циклов)
- [ ] Bulk import из CSV
- [ ] Merge duplicate profiles
- [ ] История изменений

### 2.4 Media Management
**Задачи:**
- [ ] Gallery view для фотографий
- [ ] Теги и метаданные
- [ ] Face detection (опционально)
- [ ] Watermarking
- [ ] Batch operations

---

## 💡 Phase 3: Nice to Have (Low Priority)

### 3.1 Internationalization
**Задачи:**
- [ ] Завершить русский перевод
- [ ] Добавить английский
- [ ] Language switcher в UI
- [ ] RTL support (опционально)

### 3.2 Collaboration Features
**Задачи:**
- [ ] Comments на профилях
- [ ] Activity feed
- [ ] Notifications
- [ ] Family admin roles
- [ ] Invite workflow improvements

### 3.3 Analytics & Reports
**Задачи:**
- [ ] Family statistics dashboard
- [ ] Longevity reports
- [ ] Geographic distribution
- [ ] Name frequency analysis

### 3.4 Mobile Experience
**Задачи:**
- [ ] Responsive tree view
- [ ] Touch gestures
- [ ] Mobile-optimized forms
- [ ] PWA support

---

## 🐛 Known Issues

### High Priority
- [ ] Sign-in может не редиректить после успешной авторизации (тестируем)
- [ ] Health check endpoints нужно защитить от внешнего доступа
- [ ] Missing TypeScript types для многих DB queries

### Medium Priority  
- [ ] 212 ESLint warnings (преимущественно `no-explicit-any`)
- [ ] Some pages missing error boundaries
- [ ] Loading states не везде реализованы

### Low Priority
- [ ] Console warnings про autocomplete attributes
- [ ] Some unused variables in API routes
- [ ] Missing accessibility labels

---

## 📊 Metrics & Goals

### Performance
- [ ] Lighthouse score > 90 для всех страниц
- [ ] FCP < 1.5s
- [ ] TTI < 3.5s
- [ ] Bundle size < 200KB (main)

### Code Quality
- [ ] 0 TypeScript errors ✅
- [ ] 0 ESLint errors ✅  
- [ ] 0 ESLint warnings (current: 212)
- [ ] Test coverage > 70%

### Security
- [ ] All secrets in env vars ✅
- [ ] RLS enabled on all tables
- [ ] Rate limiting active
- [ ] HTTPS only ✅
- [ ] Security headers configured

---

## 🛠️ Technical Debt

### High Priority
1. **Type Safety:** Remove all `as any` casts (~50+ occurrences)
2. **Error Handling:** Add proper error boundaries and fallbacks
3. **Testing:** Add unit tests for critical paths (auth, relationships logic)

### Medium Priority
1. **Performance:** Optimize tree rendering for large families (>100 nodes)
2. **Caching:** Add React Query or SWR for data fetching
3. **Logging:** Implement structured logging (instead of console.log)

### Low Priority
1. **Documentation:** Add JSDoc comments to all public functions
2. **Storybook:** Create component library
3. **E2E Tests:** Playwright tests for critical flows

---

## 📝 Notes

- Always test auth flow after deployment
- Monitor Railway logs for errors
- Keep `DATABASE_URL` as pooled connection
- Use `NODE_VERSION=20` in Railway
- Never commit secrets to git

---

**Last Updated:** 2025-11-11  
**Current Version:** dev-v37  
**Environment:** Next.js 15.0.3 + React 18.2.0 + Supabase
