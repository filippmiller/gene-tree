-- 0010_kinship_search.sql
-- Kinship search system: views, dictionaries, parser, path-walk functions

-- Совместимость с persons: если таблицы нет, делаем view на user_profiles
do $$ begin
  if not exists (select 1 from information_schema.tables where table_schema='public' and table_name='persons') then
    execute $v$
      create or replace view public.persons as
      select
        up.id::uuid as id,
        coalesce(nullif(lower(up.gender),'unknown'),'unknown') as gender,
        up.first_name, up.middle_name, up.last_name, up.nickname, up.avatar_url
      from public.user_profiles up
    $v$;
  end if;
end $$;

-- Представления рёбер графа поверх relationships
create or replace view public.parent_child as
select
  r.user1_id::uuid as parent_id,
  r.user2_id::uuid as child_id
from public.relationships r
where r.relationship_type = 'parent_child';

create or replace view public.spouses as
select a.user1_id::uuid as a_id, a.user2_id::uuid as b_id from public.relationships a where a.relationship_type = 'spouse'
union all
select a.user2_id::uuid as a_id, a.user1_id::uuid as b_id from public.relationships a where a.relationship_type = 'spouse';

-- Словарь терминов RU → шаг или композиция (правило: разбираем справа налево)
create table if not exists public.kin_terms_ru (
  term text primary key,
  path_expr text not null
);

-- Очистим и заполним минимальный набор (можно расширять)
truncate public.kin_terms_ru;

insert into public.kin_terms_ru(term, path_expr) values
-- базовые
('мама','P(f)'), ('матери','P(f)'), ('мамы','P(f)'),
('папа','P(m)'), ('отца','P(m)'), ('папы','P(m)'),
('родитель','P(*)'), ('родителя','P(*)'),
('брат','S(m)'), ('брата','S(m)'),
('сестра','S(f)'), ('сестры','S(f)'),
('сын','C(m)'), ('сына','C(m)'),
('дочь','C(f)'), ('дочка','C(f)'), ('дочки','C(f)'),
('ребёнок','C(*)'), ('ребенка','C(*)'),
('жена','H(f)'), ('муж','H(m)'),
-- бабушки/дедушки
('бабушка','P(*)>P(f)'), ('бабушки','P(*)>P(f)'),
('дедушка','P(*)>P(m)'), ('дедушки','P(*)>P(m)'),
-- тёти/дяди
('тётя','P(*)>S(f)'), ('тети','P(*)>S(f)'), ('тёти','P(*)>S(f)'),
('дядя','P(*)>S(m)'), ('дяди','P(*)>S(m)'),
-- племянники/племянницы
('племянница','S(*)>C(f)'), ('племянницы','S(*)>C(f)'),
('племянник','S(*)>C(m)'), ('племянника','S(*)>C(m)'),
-- двоюродные
('двоюродная сестра','P(*)>S(*)>C(f)'),
('двоюродный брат','P(*)>S(*)>C(m)');

-- Таблица «человеческих» названий для канонических путей
create table if not exists public.kin_types (
  path_expr text primary key,
  name_ru text not null,
  name_en text not null
);

insert into public.kin_types(path_expr, name_ru, name_en) values
('P(f)','мама','mother') on conflict do nothing;
insert into public.kin_types(path_expr, name_ru, name_en) values
('P(m)','папа','father') on conflict do nothing;
insert into public.kin_types(path_expr, name_ru, name_en) values
('S(f)','сестра','sister') on conflict do nothing;
insert into public.kin_types(path_expr, name_ru, name_en) values
('S(m)','брат','brother') on conflict do nothing;
insert into public.kin_types(path_expr, name_ru, name_en) values
('C(f)','дочь','daughter') on conflict do nothing;
insert into public.kin_types(path_expr, name_ru, name_en) values
('C(m)','сын','son') on conflict do nothing;
insert into public.kin_types(path_expr, name_ru, name_en) values
('H(f)','жена','wife') on conflict do nothing;
insert into public.kin_types(path_expr, name_ru, name_en) values
('H(m)','муж','husband') on conflict do nothing;
insert into public.kin_types(path_expr, name_ru, name_en) values
('P(*)>P(f)','бабушка','grandmother') on conflict do nothing;
insert into public.kin_types(path_expr, name_ru, name_en) values
('P(*)>P(m)','дедушка','grandfather') on conflict do nothing;
insert into public.kin_types(path_expr, name_ru, name_en) values
('P(*)>S(f)','тётя','aunt') on conflict do nothing;
insert into public.kin_types(path_expr, name_ru, name_en) values
('P(*)>S(m)','дядя','uncle') on conflict do nothing;
insert into public.kin_types(path_expr, name_ru, name_en) values
('S(*)>C(f)','племянница','niece') on conflict do nothing;
insert into public.kin_types(path_expr, name_ru, name_en) values
('S(*)>C(m)','племянник','nephew') on conflict do nothing;
insert into public.kin_types(path_expr, name_ru, name_en) values
('P(*)>S(*)>C(f)','двоюродная сестра','female cousin') on conflict do nothing;
insert into public.kin_types(path_expr, name_ru, name_en) values
('P(*)>S(*)>C(m)','двоюродный брат','male cousin') on conflict do nothing;

-- Парсер фразы: справа налево «максимально возможный матч» по term
create or replace function public.kin_parse_ru(phrase text)
returns text
language plpgsql
as $$
declare
  s text := lower(trim(translate(phrase,'ё','е')));
  acc text := '';
  hit text;
  -- берём самый длинный term, который совпадает с правым суффиксом
begin
  if s = '' then raise exception 'kin_parse_ru: empty phrase'; end if;

  loop
    -- найти любой term, который встречается в конце строки (\y — граница слова)
    select kt.path_expr
    into hit
    from public.kin_terms_ru kt
    where s ~ ('\y' || regexp_replace(kt.term, '([.^$*+?()[]{}\|\\-])','\\\1','g') || '\s*$')
    order by length(kt.term) desc
    limit 1;

    if hit is null then
      exit;
    end if;

    acc := case when acc = '' then hit else hit || '>' || acc end;

    -- удалить совпавший хвост и лишние пробелы
    s := regexp_replace(s, '\s*' ||
           (select regexp_replace(kt.term,'([.^$*+?()[]{}\|\\-])','\\\1','g') from public.kin_terms_ru kt
             where kt.path_expr = hit
             limit 1) || '\s*$', '', 'g');

    s := trim(s);
    if s = '' then exit; end if;
  end loop;

  if acc = '' then
    raise exception 'kin_parse_ru: no recognizable kinship terms in "%"', phrase;
  end if;
  return acc;
end $$;

-- Рекурсивный обход пути (возвращаем все ветви, не один вариант)
create or replace function public.kin_find_by_path(start_id uuid, path_expr text)
returns table(person_id uuid)
language sql
as $$
with steps as (
  select row_number() over () as idx,
         split_part(s, '(', 1) as rel,
         nullif(replace(split_part(s, '(', 2), ')',''),'') as g
  from regexp_split_to_table(path_expr, '>') as s
),
frontier(pid, depth) as (
  select start_id, 0
  union all
  select
    nxt.next_id,
    f.depth + 1
  from frontier f
  join steps st on st.idx = f.depth + 1
  join lateral (
    -- вычисляем множество next_id для заданного шага
    select case st.rel
             when 'P' then pc.parent_id
             when 'C' then pc.child_id
             when 'H' then sp.b_id
             when 'S' then sib.sib_id
           end as next_id
    from (
      select parent_id, child_id from public.parent_child where child_id = f.pid
      union all
      select parent_id, child_id from public.parent_child where parent_id = f.pid
    ) pc
    full join public.spouses sp
      on (st.rel = 'H' and (sp.a_id = f.pid))
    left join (
      -- все сиблинги: общий родитель
      select pb.child_id as sib_id
      from public.parent_child pa
      join public.parent_child pb on pb.parent_id = pa.parent_id
      where pa.child_id = f.pid and pb.child_id <> f.pid
    ) sib on st.rel = 'S'
    where
      (st.rel='P' and pc.child_id = f.pid) or
      (st.rel='C' and pc.parent_id = f.pid) or
      (st.rel='H' and sp.a_id = f.pid) or
      (st.rel='S' and sib.sib_id is not null)
  ) as nxt on true
),
targets as (
  select f.pid as person_id
  from frontier f
  where f.depth = (select max(idx) from steps)
)
select p.id
from targets t
join public.persons p on p.id = t.person_id
join steps st on st.idx = (select max(idx) from steps)
where coalesce(st.g,'*') = '*' or
      (st.g='f' and coalesce(p.gender,'unknown') in ('f','female','жен','женский','woman')) or
      (st.g='m' and coalesce(p.gender,'unknown') in ('m','male','муж','мужской','man'));
$$;

-- Обёртка: одна RPC — принимает RU фразу, парсит, находит и возвращает с «человеческим» названием пути
create or replace function public.kin_resolve_ru(p_start uuid, p_phrase text)
returns table(person_id uuid, path_expr text, name_ru text)
language plpgsql security definer set search_path=public
as $$
declare v_path text;
begin
  v_path := public.kin_parse_ru(p_phrase);
  return query
    select f.person_id, v_path, coalesce(t.name_ru, v_path)
    from public.kin_find_by_path(p_start, v_path) f
    left join public.kin_types t on t.path_expr = v_path;
end $$;

grant execute on function public.kin_resolve_ru(uuid, text) to authenticated;
