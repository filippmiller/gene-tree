-- Seed data for gamification system
-- Point values and initial challenges

-- ============================================
-- POINT VALUES CONFIGURATION
-- ============================================

INSERT INTO point_values (action_type, points, description, description_ru, daily_limit, is_active) VALUES
-- Photo actions
('photo_upload', 10, 'Upload a photo', 'Загрузить фото', 10, true),
('photo_tag', 2, 'Tag someone in a photo', 'Отметить кого-то на фото', 20, true),

-- Story actions
('story_write', 25, 'Write a story', 'Написать историю', 5, true),
('story_respond', 15, 'Respond to a story prompt', 'Ответить на вопрос', 5, true),
('voice_story_record', 30, 'Record a voice story', 'Записать голосовую историю', 3, true),

-- Tree building actions
('invite_send', 5, 'Send a family invitation', 'Отправить приглашение', 10, true),
('invite_accepted', 20, 'Invitation accepted', 'Приглашение принято', NULL, true),
('relative_add', 15, 'Add a relative to the tree', 'Добавить родственника', NULL, true),

-- Engagement actions
('comment_add', 5, 'Add a comment', 'Добавить комментарий', 20, true),
('reaction_add', 2, 'Add a reaction', 'Добавить реакцию', 50, true),

-- Profile actions
('profile_update', 5, 'Update profile information', 'Обновить профиль', 1, true),
('profile_photo_set', 10, 'Set profile photo', 'Установить фото профиля', 1, true),
('bio_write', 15, 'Write biography', 'Написать биографию', 1, true),

-- Daily actions
('daily_login', 5, 'Daily login bonus', 'Бонус за ежедневный вход', 1, true),
('daily_streak_bonus', 10, 'Streak continuation bonus', 'Бонус за продолжение серии', 1, true),

-- Special actions
('milestone_reached', 50, 'Reach a family milestone', 'Достичь семейной вехи', NULL, true),
('tribute_create', 100, 'Create a tribute page', 'Создать страницу памяти', NULL, true),
('interview_elder', 75, 'Record an elder interview', 'Записать интервью со старшим', NULL, true)
ON CONFLICT (action_type) DO UPDATE
SET
  points = EXCLUDED.points,
  description = EXCLUDED.description,
  description_ru = EXCLUDED.description_ru,
  daily_limit = EXCLUDED.daily_limit,
  is_active = EXCLUDED.is_active;

-- ============================================
-- ADD STREAK BADGES
-- ============================================

INSERT INTO badges (name, name_ru, description, description_ru, icon, category, criteria_type, criteria_target, criteria_value, rarity, sort_order) VALUES
-- Streak badges
('Dedicated', 'Преданный', 'Maintain a 7-day activity streak', 'Сохраняйте активность 7 дней подряд', 'flame', 'special', 'count', 'streak_days', 7, 'common', 50),
('Committed', 'Целеустремленный', 'Maintain a 30-day activity streak', 'Сохраняйте активность 30 дней подряд', 'zap', 'special', 'count', 'streak_days', 30, 'rare', 51),
('Unstoppable', 'Неостановимый', 'Maintain a 100-day activity streak', 'Сохраняйте активность 100 дней подряд', 'rocket', 'special', 'count', 'streak_days', 100, 'legendary', 52),

-- Points badges
('Rising Star', 'Восходящая Звезда', 'Earn 500 points', 'Наберите 500 очков', 'star', 'special', 'count', 'total_points', 500, 'common', 60),
('Point Master', 'Мастер Очков', 'Earn 2500 points', 'Наберите 2500 очков', 'trophy', 'special', 'count', 'total_points', 2500, 'rare', 61),
('Legend', 'Легенда', 'Earn 10000 points', 'Наберите 10000 очков', 'medal', 'special', 'count', 'total_points', 10000, 'legendary', 62),

-- Challenge badges
('Challenger', 'Претендент', 'Complete your first challenge', 'Завершите первое испытание', 'target', 'special', 'count', 'challenges_completed', 1, 'common', 70),
('Challenge Champion', 'Чемпион Испытаний', 'Complete 10 challenges', 'Завершите 10 испытаний', 'award', 'special', 'count', 'challenges_completed', 10, 'rare', 71)
ON CONFLICT DO NOTHING;

-- ============================================
-- SAMPLE FAMILY CHALLENGES
-- ============================================

-- Note: These are global challenges for all families
INSERT INTO family_challenges (
  title, title_ru,
  description, description_ru,
  challenge_type, target_value, reward_points,
  start_date, end_date,
  family_scope, is_active
) VALUES
(
  'Photo Week',
  'Неделя Фотографий',
  'Upload 5 family photos this week to preserve precious memories.',
  'Загрузите 5 семейных фотографий на этой неделе, чтобы сохранить драгоценные воспоминания.',
  'photo_upload',
  5,
  100,
  date_trunc('week', now()),
  date_trunc('week', now()) + INTERVAL '7 days',
  'all',
  true
),
(
  'Story Month',
  'Месяц Историй',
  'Write 3 family stories this month to capture your heritage.',
  'Напишите 3 семейные истории в этом месяце, чтобы сохранить наследие.',
  'story_write',
  3,
  150,
  date_trunc('month', now()),
  date_trunc('month', now()) + INTERVAL '1 month',
  'all',
  true
),
(
  'Growing Together',
  'Растем Вместе',
  'Invite 2 family members to join the tree.',
  'Пригласите 2 членов семьи присоединиться к древу.',
  'invite_family',
  2,
  75,
  now(),
  now() + INTERVAL '30 days',
  'all',
  true
);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE point_values IS 'Initial point values configured - 17 action types';
COMMENT ON TABLE family_challenges IS 'Sample global challenges seeded - 3 challenges';
