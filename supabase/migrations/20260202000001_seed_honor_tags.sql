-- Seed Data: Honor Tags
-- Created: 2026-02-02
-- Description: Initial set of honor tags for Russian/Soviet and international contexts

-- ============================================
-- CATEGORY: military_wwii (WWII Related)
-- ============================================

INSERT INTO honor_tags (code, name, name_ru, description, description_ru, category, icon, color, background_color, country_code, sort_order) VALUES

-- Siege survivors
('blockade_survivor', 'Siege of Leningrad Survivor', 'Блокадник Ленинграда',
 'Resident of Leningrad during the 872-day siege (1941-1944)',
 'Житель Ленинграда во время 872-дневной блокады (1941-1944)',
 'military_wwii', 'shield', '#1E3A5F', '#E8F0FE', 'RU', 1),

('sevastopol_survivor', 'Siege of Sevastopol Survivor', 'Житель осаждённого Севастополя',
 'Resident of Sevastopol during the siege (1941-1942)',
 'Житель Севастополя во время осады (1941-1942)',
 'military_wwii', 'shield', '#1E3A5F', '#E8F0FE', 'RU', 2),

('stalingrad_survivor', 'Siege of Stalingrad Survivor', 'Житель осаждённого Сталинграда',
 'Resident of Stalingrad during the battle (1942-1943)',
 'Житель Сталинграда во время битвы (1942-1943)',
 'military_wwii', 'shield', '#1E3A5F', '#E8F0FE', 'RU', 3),

-- WWII Veterans
('wwii_veteran', 'WWII Veteran', 'Ветеран Великой Отечественной войны',
 'Veteran of World War II (1941-1945)',
 'Участник Великой Отечественной войны (1941-1945)',
 'military_wwii', 'medal', '#B8860B', '#FEF3C7', 'RU', 4),

('wwii_veteran_us', 'WWII Veteran (US)', 'Ветеран Второй мировой (США)',
 'United States veteran of World War II',
 'Ветеран Второй мировой войны (США)',
 'military_wwii', 'medal', '#B8860B', '#FEF3C7', 'US', 5),

-- Home front
('home_front_worker', 'Home Front Worker', 'Труженик тыла',
 'Worked in the home front during WWII (1941-1945)',
 'Работник тыла во время Великой Отечественной войны (1941-1945)',
 'military_wwii', 'hammer', '#78350F', '#FEF3C7', 'RU', 6),

-- Concentration camps
('concentration_camp_survivor', 'Concentration Camp Survivor', 'Узник концлагеря',
 'Survivor of Nazi concentration camps',
 'Бывший узник фашистских концлагерей',
 'military_wwii', 'dove', '#4A5568', '#F7FAFC', NULL, 7),

('minor_concentration_camp', 'Minor Concentration Camp Survivor', 'Несовершеннолетний узник концлагеря',
 'Was a minor during imprisonment in Nazi concentration camps',
 'Был несовершеннолетним во время заключения в фашистских концлагерях',
 'military_wwii', 'dove', '#4A5568', '#F7FAFC', NULL, 8),

-- Children of war
('child_of_war', 'Child of War', 'Дети войны',
 'Born between 1927-1945, experienced wartime childhood',
 'Рождённые в 1927-1945, пережившие военное детство',
 'military_wwii', 'heart', '#6B46C1', '#EDE9FE', 'RU', 9),

-- Medals
('defense_of_leningrad', 'Medal "For the Defense of Leningrad"', 'Медаль «За оборону Ленинграда»',
 'Awarded for participation in the defense of Leningrad',
 'Награждён за участие в обороне Ленинграда',
 'military_wwii', 'award', '#B8860B', '#FEF3C7', 'RU', 10),

('defense_of_stalingrad', 'Medal "For the Defense of Stalingrad"', 'Медаль «За оборону Сталинграда»',
 'Awarded for participation in the defense of Stalingrad',
 'Награждён за участие в обороне Сталинграда',
 'military_wwii', 'award', '#B8860B', '#FEF3C7', 'RU', 11);

-- ============================================
-- CATEGORY: military_other (Other Military)
-- ============================================

INSERT INTO honor_tags (code, name, name_ru, description, description_ru, category, icon, color, background_color, country_code, sort_order) VALUES

('afghan_veteran', 'Afghan War Veteran', 'Ветеран Афганской войны',
 'Veteran of the Soviet-Afghan War (1979-1989)',
 'Участник Афганской войны (1979-1989)',
 'military_other', 'medal', '#1F2937', '#F3F4F6', 'RU', 20),

('chernobyl_liquidator', 'Chernobyl Liquidator', 'Ликвидатор аварии на ЧАЭС',
 'Participated in Chernobyl disaster cleanup (1986-1990)',
 'Участник ликвидации аварии на Чернобыльской АЭС (1986-1990)',
 'military_other', 'radiation', '#F59E0B', '#FEF3C7', 'RU', 21),

('combat_veteran', 'Combat Veteran', 'Ветеран боевых действий',
 'Veteran of combat operations',
 'Участник боевых действий',
 'military_other', 'medal', '#1F2937', '#F3F4F6', NULL, 22),

('vietnam_veteran', 'Vietnam War Veteran', 'Ветеран Вьетнамской войны',
 'United States veteran of the Vietnam War',
 'Ветеран Вьетнамской войны (США)',
 'military_other', 'medal', '#1F2937', '#F3F4F6', 'US', 23),

('korea_veteran', 'Korean War Veteran', 'Ветеран Корейской войны',
 'Veteran of the Korean War (1950-1953)',
 'Ветеран Корейской войны (1950-1953)',
 'military_other', 'medal', '#1F2937', '#F3F4F6', NULL, 24),

('purple_heart', 'Purple Heart Recipient', 'Кавалер Пурпурного сердца',
 'Wounded or killed while serving in the U.S. military',
 'Ранен или погиб при исполнении воинского долга (США)',
 'military_other', 'heart', '#7C3AED', '#EDE9FE', 'US', 25);

-- ============================================
-- CATEGORY: persecution (Persecution & Survival)
-- ============================================

INSERT INTO honor_tags (code, name, name_ru, description, description_ru, category, icon, color, background_color, country_code, sort_order) VALUES

('holocaust_survivor', 'Holocaust Survivor', 'Переживший Холокост',
 'Survivor of the Holocaust',
 'Переживший Холокост',
 'persecution', 'candle', '#4A5568', '#F7FAFC', NULL, 30),

('gulag_survivor', 'Gulag Survivor', 'Узник ГУЛАГа',
 'Survivor of Soviet labor camps (Gulag)',
 'Бывший узник ГУЛАГа',
 'persecution', 'chain', '#4A5568', '#F7FAFC', 'RU', 31),

('political_prisoner', 'Political Prisoner', 'Политический заключённый',
 'Was imprisoned for political reasons',
 'Был заключён по политическим мотивам',
 'persecution', 'gavel', '#4A5568', '#F7FAFC', NULL, 32),

('repressed', 'Victim of Political Repression', 'Репрессированный',
 'Victim of political repressions',
 'Жертва политических репрессий',
 'persecution', 'scroll', '#4A5568', '#F7FAFC', 'RU', 33),

('rehabilitated', 'Rehabilitated', 'Реабилитированный',
 'Officially rehabilitated after political repression',
 'Официально реабилитирован после политических репрессий',
 'persecution', 'scale', '#059669', '#D1FAE5', 'RU', 34),

('refugee', 'Refugee', 'Беженец',
 'Forced to flee their homeland',
 'Был вынужден покинуть родину',
 'persecution', 'home', '#4A5568', '#F7FAFC', NULL, 35),

('displaced_person', 'Displaced Person', 'Перемещённое лицо',
 'Displaced due to war or persecution',
 'Перемещённый в результате войны или преследований',
 'persecution', 'map', '#4A5568', '#F7FAFC', NULL, 36);

-- ============================================
-- CATEGORY: civil_honors (Civil Honors)
-- ============================================

INSERT INTO honor_tags (code, name, name_ru, description, description_ru, category, icon, color, background_color, country_code, requires_verification, sort_order) VALUES

('hero_ussr', 'Hero of the Soviet Union', 'Герой Советского Союза',
 'Highest distinction in the USSR',
 'Высшая степень отличия в СССР',
 'civil_honors', 'star', '#DC2626', '#FEE2E2', 'RU', true, 40),

('hero_russia', 'Hero of the Russian Federation', 'Герой Российской Федерации',
 'Highest title in the Russian Federation',
 'Высшее звание в Российской Федерации',
 'civil_honors', 'star', '#DC2626', '#FEE2E2', 'RU', true, 41),

('peoples_artist', 'People''s Artist', 'Народный артист',
 'Highest honorary title for performing artists',
 'Высшее почётное звание для артистов',
 'civil_honors', 'music', '#7C3AED', '#EDE9FE', 'RU', true, 42),

('honored_artist', 'Honored Artist', 'Заслуженный артист',
 'Honorary title for distinguished artists',
 'Почётное звание за выдающиеся заслуги в искусстве',
 'civil_honors', 'music', '#7C3AED', '#EDE9FE', 'RU', true, 43),

('honored_teacher', 'Honored Teacher', 'Заслуженный учитель',
 'Honorary title for distinguished educators',
 'Почётное звание за выдающиеся заслуги в образовании',
 'civil_honors', 'book-open', '#2563EB', '#DBEAFE', 'RU', true, 44),

('honored_doctor', 'Honored Doctor', 'Заслуженный врач',
 'Honorary title for distinguished medical professionals',
 'Почётное звание за выдающиеся заслуги в медицине',
 'civil_honors', 'heart-pulse', '#DC2626', '#FEE2E2', 'RU', true, 45),

('honored_scientist', 'Honored Scientist', 'Заслуженный деятель науки',
 'Honorary title for distinguished scientists',
 'Почётное звание за выдающиеся заслуги в науке',
 'civil_honors', 'flask', '#2563EB', '#DBEAFE', 'RU', true, 46),

('order_of_lenin', 'Order of Lenin', 'Орден Ленина',
 'Highest civilian decoration of the USSR',
 'Высшая награда СССР',
 'civil_honors', 'award', '#DC2626', '#FEE2E2', 'RU', true, 47),

('order_of_red_star', 'Order of the Red Star', 'Орден Красной Звезды',
 'Soviet military decoration',
 'Советская военная награда',
 'civil_honors', 'star', '#DC2626', '#FEE2E2', 'RU', true, 48);

-- ============================================
-- CATEGORY: labor (Labor)
-- ============================================

INSERT INTO honor_tags (code, name, name_ru, description, description_ru, category, icon, color, background_color, country_code, sort_order) VALUES

('labor_veteran', 'Labor Veteran', 'Ветеран труда',
 'Honored for long and distinguished labor service',
 'Награждён за долголетний добросовестный труд',
 'labor', 'briefcase', '#78350F', '#FEF3C7', 'RU', 50),

('hero_socialist_labor', 'Hero of Socialist Labor', 'Герой Социалистического Труда',
 'Highest distinction for labor achievements in USSR',
 'Высшее отличие за трудовые достижения в СССР',
 'labor', 'star', '#B8860B', '#FEF3C7', 'RU', 51),

('valiant_labor_medal', 'Medal "For Valiant Labor"', 'Медаль «За доблестный труд»',
 'Awarded for exceptional labor achievements',
 'Награждён за выдающиеся трудовые достижения',
 'labor', 'award', '#78350F', '#FEF3C7', 'RU', 52),

('shock_worker', 'Shock Worker', 'Ударник труда',
 'Recognized for exceptional labor productivity',
 'Отмечен за выдающуюся производительность труда',
 'labor', 'zap', '#78350F', '#FEF3C7', 'RU', 53);

-- ============================================
-- CATEGORY: family (Family)
-- ============================================

INSERT INTO honor_tags (code, name, name_ru, description, description_ru, category, icon, color, background_color, country_code, sort_order) VALUES

('hero_mother', 'Hero Mother', 'Мать-героиня',
 'Mother who raised 10 or more children',
 'Мать, воспитавшая 10 и более детей',
 'family', 'heart', '#DB2777', '#FCE7F3', 'RU', 60),

('founding_ancestor', 'Founding Ancestor', 'Основатель рода',
 'Earliest known ancestor in the family tree',
 'Самый ранний известный предок в родословной',
 'family', 'tree-deciduous', '#059669', '#D1FAE5', NULL, 61),

('family_historian', 'Family Historian', 'Хранитель семейной истории',
 'Preserved and documented family history',
 'Сохранял и документировал семейную историю',
 'family', 'book', '#7C3AED', '#EDE9FE', NULL, 62),

('family_elder', 'Family Elder', 'Старейшина рода',
 'Respected elder and keeper of family wisdom',
 'Уважаемый старейшина и хранитель семейной мудрости',
 'family', 'crown', '#B8860B', '#FEF3C7', NULL, 63),

('centenarian', 'Centenarian', 'Долгожитель',
 'Lived to 100 years or more',
 'Прожил 100 и более лет',
 'family', 'cake', '#059669', '#D1FAE5', NULL, 64);

-- ============================================
-- CATEGORY: academic (Academic)
-- ============================================

INSERT INTO honor_tags (code, name, name_ru, description, description_ru, category, icon, color, background_color, country_code, sort_order) VALUES

('professor', 'Professor', 'Профессор',
 'Academic professor',
 'Профессор',
 'academic', 'graduation-cap', '#2563EB', '#DBEAFE', NULL, 70),

('doctor_of_science', 'Doctor of Science', 'Доктор наук',
 'Highest academic degree',
 'Высшая учёная степень',
 'academic', 'scroll', '#2563EB', '#DBEAFE', 'RU', 71),

('candidate_of_science', 'Candidate of Science', 'Кандидат наук',
 'Academic degree (equivalent to PhD)',
 'Учёная степень (эквивалент PhD)',
 'academic', 'scroll', '#2563EB', '#DBEAFE', 'RU', 72),

('academician', 'Academician', 'Академик',
 'Member of the Academy of Sciences',
 'Член Академии наук',
 'academic', 'building', '#7C3AED', '#EDE9FE', 'RU', 73),

('nobel_laureate', 'Nobel Laureate', 'Лауреат Нобелевской премии',
 'Recipient of the Nobel Prize',
 'Лауреат Нобелевской премии',
 'academic', 'trophy', '#B8860B', '#FEF3C7', NULL, 74);

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT SELECT ON honor_tags TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON profile_honor_tags TO authenticated;
GRANT SELECT, INSERT ON honor_tag_verifications TO authenticated;
