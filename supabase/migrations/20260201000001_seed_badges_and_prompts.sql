-- Migration 0038: Seed Initial Badges and Story Prompts
-- Initial data for gamification and memory capture features

-- ============================================
-- SEED BADGES
-- ============================================

INSERT INTO badges (name, name_ru, description, description_ru, icon, category, criteria_type, criteria_target, criteria_value, rarity, sort_order) VALUES
-- Tree Builder Category (🌱)
('First Root', 'Первый Корень', 'Add your first relative to the family tree', 'Добавьте первого родственника в семейное древо', 'sprout', 'tree_builder', 'exists', 'relatives', 1, 'common', 1),
('Growing Family', 'Растущая Семья', 'Connect 10 relatives to your family tree', 'Свяжите 10 родственников с вашим семейным древом', 'tree-deciduous', 'tree_builder', 'count', 'relatives', 10, 'common', 2),
('Family Forest', 'Семейный Лес', 'Connect 50 relatives to your family tree', 'Свяжите 50 родственников с вашим семейным древом', 'trees', 'tree_builder', 'count', 'relatives', 50, 'rare', 3),
('Dynasty', 'Династия', 'Connect 100 or more relatives', 'Свяжите 100 или более родственников', 'crown', 'tree_builder', 'count', 'relatives', 100, 'legendary', 4),

-- Memory Keeper Category (📸)
('First Snapshot', 'Первый Снимок', 'Upload your first photo', 'Загрузите первую фотографию', 'camera', 'memory_keeper', 'exists', 'photos', 1, 'common', 10),
('Photo Album', 'Фотоальбом', 'Upload 25 photos to preserve memories', 'Загрузите 25 фотографий для сохранения воспоминаний', 'images', 'memory_keeper', 'count', 'photos', 25, 'common', 11),
('Gallery Curator', 'Куратор Галереи', 'Upload 100 photos', 'Загрузите 100 фотографий', 'image', 'memory_keeper', 'count', 'photos', 100, 'rare', 12),
('Voice of History', 'Голос Истории', 'Record your first voice story', 'Запишите первую голосовую историю', 'mic', 'memory_keeper', 'manual', NULL, 1, 'rare', 13),

-- Storyteller Category (📖)
('First Tale', 'Первый Рассказ', 'Write your first family story', 'Напишите первую семейную историю', 'book-open', 'storyteller', 'exists', 'stories', 1, 'common', 20),
('Family Bard', 'Семейный Сказитель', 'Write 10 stories about your family', 'Напишите 10 историй о вашей семье', 'book', 'storyteller', 'count', 'stories', 10, 'common', 21),
('Living Archive', 'Живой Архив', 'Write 50 family stories', 'Напишите 50 семейных историй', 'library', 'storyteller', 'count', 'stories', 50, 'rare', 22),

-- Connector Category (🔗)
('First Invite', 'Первое Приглашение', 'Send your first family invitation', 'Отправьте первое семейное приглашение', 'send', 'connector', 'exists', 'invites_sent', 1, 'common', 30),
('Family Gatherer', 'Собиратель Семьи', 'Have 5 invitations accepted', 'Получите 5 принятых приглашений', 'users', 'connector', 'count', 'invites_accepted', 5, 'common', 31),
('Reunion Host', 'Хозяин Встречи', 'Have 10 invitations accepted', 'Получите 10 принятых приглашений', 'users-round', 'connector', 'count', 'invites_accepted', 10, 'rare', 32),

-- Special Category (🎖️)
('Pioneer', 'Первопроходец', 'Early adopter of the family tree platform', 'Один из первых пользователей платформы', 'flag', 'special', 'manual', NULL, 1, 'legendary', 40),
('Tribute Keeper', 'Хранитель Памяти', 'Create a tribute page for a loved one', 'Создайте страницу памяти для близкого человека', 'heart', 'special', 'manual', NULL, 1, 'rare', 41),
('Elder''s Voice', 'Голос Старейшины', 'Record an interview with an elder family member', 'Запишите интервью со старшим членом семьи', 'mic-2', 'special', 'manual', NULL, 1, 'rare', 42);

-- ============================================
-- SEED STORY PROMPTS
-- ============================================

INSERT INTO story_prompts (category, prompt_text, prompt_text_ru, min_age, max_age, tags, sort_order) VALUES
-- Childhood Category
('childhood', 'What games did you play as a child?', 'В какие игры вы играли в детстве?', NULL, NULL, ARRAY['games', 'memories'], 1),
('childhood', 'Describe your childhood home.', 'Опишите дом вашего детства.', NULL, NULL, ARRAY['home', 'memories'], 2),
('childhood', 'Who was your best friend growing up?', 'Кто был вашим лучшим другом в детстве?', NULL, NULL, ARRAY['friends', 'relationships'], 3),
('childhood', 'What was your favorite subject in school?', 'Какой был ваш любимый предмет в школе?', NULL, NULL, ARRAY['school', 'education'], 4),
('childhood', 'What did you want to be when you grew up?', 'Кем вы хотели стать, когда вырастете?', NULL, NULL, ARRAY['dreams', 'career'], 5),
('childhood', 'What was your favorite childhood meal?', 'Какая еда была вашей любимой в детстве?', NULL, NULL, ARRAY['food', 'memories'], 6),

-- Traditions Category
('traditions', 'How did your family celebrate holidays?', 'Как ваша семья отмечала праздники?', NULL, NULL, ARRAY['holidays', 'celebrations'], 10),
('traditions', 'What family recipes have been passed down?', 'Какие семейные рецепты передавались из поколения в поколение?', NULL, NULL, ARRAY['food', 'recipes'], 11),
('traditions', 'What traditions do you want to preserve?', 'Какие традиции вы хотите сохранить?', NULL, NULL, ARRAY['values', 'culture'], 12),
('traditions', 'How did your family celebrate birthdays?', 'Как ваша семья отмечала дни рождения?', NULL, NULL, ARRAY['birthdays', 'celebrations'], 13),
('traditions', 'What songs did your family sing together?', 'Какие песни пела ваша семья вместе?', NULL, NULL, ARRAY['music', 'memories'], 14),

-- Life Lessons Category
('life_lessons', 'What is the best advice you ever received?', 'Какой лучший совет вы когда-либо получали?', 30, NULL, ARRAY['wisdom', 'advice'], 20),
('life_lessons', 'What would you tell your younger self?', 'Что бы вы сказали себе молодому?', 30, NULL, ARRAY['wisdom', 'reflection'], 21),
('life_lessons', 'What are you most proud of?', 'Чем вы больше всего гордитесь?', NULL, NULL, ARRAY['achievements', 'pride'], 22),
('life_lessons', 'What was your biggest challenge and how did you overcome it?', 'Какой была ваша самая большая трудность и как вы её преодолели?', NULL, NULL, ARRAY['challenges', 'growth'], 23),
('life_lessons', 'What values did your parents teach you?', 'Каким ценностям вас научили родители?', NULL, NULL, ARRAY['values', 'family'], 24),
('life_lessons', 'What do you wish you had learned earlier in life?', 'Чему вы хотели бы научиться раньше в жизни?', 40, NULL, ARRAY['wisdom', 'reflection'], 25),

-- Historical Category
('historical', 'Where were you when a major historical event happened?', 'Где вы были, когда произошло важное историческое событие?', 50, NULL, ARRAY['history', 'events'], 30),
('historical', 'How did world events affect your family?', 'Как мировые события повлияли на вашу семью?', NULL, NULL, ARRAY['history', 'family'], 31),
('historical', 'What was life like when you were young?', 'Какой была жизнь, когда вы были молоды?', 50, NULL, ARRAY['history', 'memories'], 32),
('historical', 'How has technology changed since your childhood?', 'Как изменились технологии со времён вашего детства?', 40, NULL, ARRAY['technology', 'change'], 33),
('historical', 'What was your first job?', 'Какой была ваша первая работа?', NULL, NULL, ARRAY['career', 'history'], 34),

-- Relationships Category
('relationships', 'How did you meet your spouse/partner?', 'Как вы познакомились со своим супругом/партнёром?', NULL, NULL, ARRAY['love', 'romance'], 40),
('relationships', 'What do you remember about your grandparents?', 'Что вы помните о своих бабушках и дедушках?', NULL, NULL, ARRAY['grandparents', 'memories'], 41),
('relationships', 'Who was the most influential person in your life?', 'Кто был самым влиятельным человеком в вашей жизни?', NULL, NULL, ARRAY['influence', 'mentors'], 42),
('relationships', 'What is your favorite memory of your parents?', 'Какое ваше любимое воспоминание о родителях?', NULL, NULL, ARRAY['parents', 'memories'], 43),
('relationships', 'Tell me about your siblings.', 'Расскажите о своих братьях и сёстрах.', NULL, NULL, ARRAY['siblings', 'family'], 44),

-- Career Category
('career', 'What was the most rewarding work you ever did?', 'Какая работа была самой вознаграждающей для вас?', NULL, NULL, ARRAY['career', 'fulfillment'], 50),
('career', 'Who was your mentor?', 'Кто был вашим наставником?', NULL, NULL, ARRAY['career', 'mentors'], 51),
('career', 'What professional accomplishment are you most proud of?', 'Каким профессиональным достижением вы больше всего гордитесь?', NULL, NULL, ARRAY['career', 'achievements'], 52),

-- Personal Category
('personal', 'What makes you happiest?', 'Что делает вас счастливым?', NULL, NULL, ARRAY['happiness', 'personal'], 60),
('personal', 'What are your hobbies and interests?', 'Каковы ваши хобби и интересы?', NULL, NULL, ARRAY['hobbies', 'interests'], 61),
('personal', 'What is your philosophy of life?', 'Какова ваша жизненная философия?', NULL, NULL, ARRAY['philosophy', 'values'], 62),
('personal', 'What do you hope your grandchildren will remember about you?', 'Что вы надеетесь, ваши внуки будут помнить о вас?', 50, NULL, ARRAY['legacy', 'family'], 63);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE badges IS 'Initial badges seeded - 17 badges across 5 categories';
COMMENT ON TABLE story_prompts IS 'Initial prompts seeded - 35 prompts across 7 categories';
