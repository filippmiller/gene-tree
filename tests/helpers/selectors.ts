/**
 * Centralized Selectors for E2E Tests
 *
 * All CSS selectors, data-testid values, and text patterns
 * used across test files. Grouped by feature area.
 *
 * VERIFIED against actual UI on 2026-02-06.
 */

export const selectors = {
  // ───── Authentication ─────
  auth: {
    signInForm: '[data-testid="sign-in-form"]',
    signUpForm: '[data-testid="sign-up-form"]',
    signInError: '[data-testid="sign-in-error"]',
    emailInput: '#email',
    passwordInput: '#password',
    nameInput: '#name',
    confirmPasswordInput: '#confirmPassword',
    submitButton: 'button[type="submit"]',
    signOutBtn: '[data-testid="sign-out-btn"]',
    signUpLink: (locale: string) => `a[href="/${locale}/sign-up"]`,
    signInLink: (locale: string) => `a[href="/${locale}/sign-in"]`,
  },

  // ───── Onboarding Wizard ─────
  onboarding: {
    firstName: '[data-testid="onboarding-firstName"]',
    lastName: '[data-testid="onboarding-lastName"]',
    birthDate: '[data-testid="onboarding-birthDate"]',
    genderTrigger: '[data-testid="onboarding-gender"]',
    // Step 2: Parents
    motherFirstName: '#mother-firstName',
    motherLastName: '#mother-lastName',
    fatherFirstName: '#father-firstName',
    fatherLastName: '#father-lastName',
    // Step 3: Grandparents (use aria-labels since no testids)
    grandparentInput: (role: string) => `#${role}-firstName`,
    // Navigation buttons
    nextButton: 'button:has-text("Next"), button:has-text("Далее")',
    backButton: 'button:has-text("Back"), button:has-text("Назад")',
    skipButton: 'button:has-text("Skip"), button:has-text("Пропустить")',
    finishButton: 'button:has-text("Finish"), button:has-text("Завершить")',
    // Step indicator
    stepIndicator: (step: number, total: number) =>
      `text=Step ${step} of ${total}`,
    // Error
    errorAlert: '[role="alert"]',
  },

  // ───── Add Relative Form (verified 2026-02-06) ─────
  addRelative: {
    // No data-testid on the form — use heading as anchor
    heading: 'h1:has-text("Add Family Member")',
    // Relationship dropdown is a native <select> (combobox)
    relationshipSelect: '[data-testid="relationship-select"]',
    // Second dropdown: gender-specific variant (Mother/Father, Brother/Sister, etc.)
    specificRelationshipSelect: '[data-testid="specific-relationship-select"]',
    // Name inputs use placeholder text
    firstNameInput: 'input[placeholder="John"]',
    lastNameInput: 'input[placeholder="Smith"]',
    // Contact inputs
    emailInput: 'input[placeholder="email@example.com"]',
    phoneInput: 'input[placeholder="+1 (555) 123-4567"]',
    // "In memory of the departed" checkbox
    deceasedCheckbox: 'text=In memory of the departed',
    // Submit button text
    submitButton: 'button:has-text("Invite Relative")',
    cancelButton: 'button:has-text("Cancel")',
    // Required fields note
    requiredNote: 'text=First name, last name, relationship type',
  },

  // ───── Tree View ─────
  tree: {
    canvas: '.react-flow',
    // React Flow nodes
    personNode: '.react-flow__node',
    // Person card within a node
    personCard: '[data-testid="person-card"]',
    // Quick-add button (appears on hover)
    quickAddButton: '[data-testid="quick-add-trigger"]',
    // Header
    treeHeader: 'h1:has-text("Family Tree")',
  },

  // ───── Quick Add Dialog ─────
  quickAdd: {
    dialog: '[role="dialog"]',
    firstName: '#qa-firstName',
    lastName: '#qa-lastName',
    birthYear: '#qa-birthYear',
    deceasedCheckbox: 'input[type="checkbox"]',
    cancelButton: 'button:has-text("Cancel"), button:has-text("Отмена")',
    addButton: 'button:has-text("Add"), button:has-text("Добавить")',
  },

  // ───── Global Search ─────
  search: {
    modal: '[role="dialog"][aria-modal="true"]',
    input: 'input[aria-autocomplete="list"]',
    results: '#search-results',
    resultOption: '[role="option"]',
    escKey: 'kbd:has-text("ESC")',
    noResults: 'text=No results',
  },

  // ───── Profile ─────
  profile: {
    avatarUpload: 'input[type="file"][accept*="image"]',
    editButton: 'button:has-text("Edit"), button:has-text("Редактировать")',
    saveButton: 'button:has-text("Save"), button:has-text("Сохранить")',
  },

  // ───── Stories (verified 2026-02-06) ─────
  stories: {
    heading: 'h1:has-text("Family Stories")',
    // "Add Story" is a link wrapping a button
    addStoryLink: 'a[href*="/stories/new"]',
    addStoryButton: 'button:has-text("Add Story")',
    storyCard: 'article, [class*="Card"]',
    emptyState: 'text=No stories yet',
  },

  // ───── Family Chat ─────
  chat: {
    container: 'main',
    messageInput: 'textarea',
    sendButton: 'button:has(svg)',
    message: '[class*="message"]',
    hint: 'text=Press Enter to send',
  },

  // ───── Sidebar Navigation (verified 2026-02-06) ─────
  sidebar: {
    nav: 'nav',
    signOutBtn: 'button:has-text("Sign Out")',
    searchButton: 'button:has-text("Search people")',
    dashboardLink: 'a[href*="/app"]',
    familyChatLink: 'a[href*="/family-chat"]',
    peopleLink: 'a[href*="/people"]',
    treeLinkSidebar: 'a[href*="/tree"]',
    storiesLink: 'a[href*="/stories"]',
    addPersonLink: 'a[href*="/people/new"]',
  },

  // ───── Landing Page ─────
  landing: {
    nav: '[data-testid="landing-nav"]',
    signInLink: '[data-testid="nav-sign-in"]',
    getStartedLink: '[data-testid="nav-get-started"]',
    heroSection: '[data-testid="hero-section"]',
    featuresSection: '[data-testid="features-section"]',
    ctaSection: '[data-testid="cta-section"]',
    languageSwitcher: '[data-testid="landing-language-switcher"]',
  },
} as const;

/**
 * Common URL patterns for assertions.
 */
export const urlPatterns = {
  signIn: (locale: string) => new RegExp(`/${locale}/sign-in`),
  signUp: (locale: string) => new RegExp(`/${locale}/sign-up`),
  dashboard: (locale: string) => new RegExp(`/${locale}/app`),
  tree: (locale: string) => new RegExp(`/${locale}/tree`),
  onboarding: (locale: string) => new RegExp(`/${locale}.*onboarding`),
  profile: (locale: string, id?: string) =>
    new RegExp(`/${locale}/profile${id ? `/${id}` : ''}`),
  stories: (locale: string) => new RegExp(`/${locale}.*stories`),
  familyChat: (locale: string) => new RegExp(`/${locale}.*family-chat`),
} as const;
