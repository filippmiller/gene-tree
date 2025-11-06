-- ============================================
-- Генеалогическое дерево - Начальная схема
-- ============================================

-- 1. Типы (ENUMs)
-- ============================================

create type public.gender as enum ('unknown','male','female','nonbinary');
create type public.visibility as enum ('private','members','public');
create type public.relationship_type as enum ('parent_child','spouse','partner','sibling');
create type public.member_role as enum ('owner','admin','editor','viewer');

-- 2. Таблицы
-- ============================================

-- Дерево (проект)
create table public.trees (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text unique,
  visibility public.visibility not null default 'members',
  created_at timestamptz not null default now()
);

-- Участники дерева с ролями
create table public.tree_memberships (
  tree_id uuid not null references public.trees(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.member_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (tree_id, user_id)
);

-- Профиль пользователя
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  locale text default 'ru',
  timezone text default 'Europe/Moscow',
  created_at timestamptz not null default now()
);

-- Люди (узлы дерева)
create table public.persons (
  id uuid primary key default gen_random_uuid(),
  tree_id uuid not null references public.trees(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  given_name text,
  middle_name text,
  family_name text,
  gender public.gender not null default 'unknown',
  birth_date date,
  death_date date,
  birth_place_id uuid,
  death_place_id uuid,
  biography text,
  is_living boolean not null default true,
  visibility public.visibility not null default 'members',
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Связи между людьми
create table public.relationships (
  id uuid primary key default gen_random_uuid(),
  tree_id uuid not null references public.trees(id) on delete cascade,
  type public.relationship_type not null,
  person_a uuid not null references public.persons(id) on delete cascade,
  person_b uuid not null references public.persons(id) on delete cascade,
  start_date date,
  end_date date,
  notes text,
  created_at timestamptz not null default now(),
  unique (tree_id, type, person_a, person_b)
);

-- Места (геометки)
create table public.places (
  id uuid primary key default gen_random_uuid(),
  tree_id uuid not null references public.trees(id) on delete cascade,
  name text not null,
  kind text, -- город, адрес, кладбище и т.п.
  lat double precision,
  lng double precision,
  address text,
  country_code text,
  created_at timestamptz not null default now()
);

-- События (рождение, брак и т.д.)
create table public.events (
  id uuid primary key default gen_random_uuid(),
  tree_id uuid not null references public.trees(id) on delete cascade,
  type text not null, -- 'birth','marriage','death','residence','immigration','custom', ...
  date date,
  place_id uuid references public.places(id) on delete set null,
  description text,
  visibility public.visibility not null default 'members',
  created_at timestamptz not null default now()
);

-- Участники события (кто к нему относится)
create table public.person_events (
  event_id uuid not null references public.events(id) on delete cascade,
  person_id uuid not null references public.persons(id) on delete cascade,
  role text, -- 'subject','spouse','witness', ...
  primary key (event_id, person_id)
);

-- Медиа (фото/видео/док)
create table public.media (
  id uuid primary key default gen_random_uuid(),
  tree_id uuid not null references public.trees(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete set null,
  kind text not null, -- image/video/doc
  url text not null,  -- Supabase Storage path/URL
  person_id uuid references public.persons(id) on delete set null,
  event_id uuid references public.events(id) on delete set null,
  visibility public.visibility not null default 'members',
  created_at timestamptz not null default now()
);

-- Приглашения в дерево
create table public.invites (
  id uuid primary key default gen_random_uuid(),
  tree_id uuid not null references public.trees(id) on delete cascade,
  email text not null,
  role public.member_role not null default 'viewer',
  token text not null,
  status text not null default 'pending', -- 'pending'|'accepted'|'expired'
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

-- Аудит (минимум на будущее)
create table public.audit_logs (
  id bigserial primary key,
  tree_id uuid references public.trees(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action text not null, -- 'person.create','relationship.delete', ...
  entity text not null,
  entity_id uuid,
  meta jsonb,
  created_at timestamptz not null default now()
);

-- 3. Индексы для производительности
-- ============================================

create index on public.persons (tree_id);
create index on public.relationships (tree_id);
create index on public.relationships (person_a);
create index on public.relationships (person_b);
create index on public.events (tree_id);
create index on public.media (tree_id);
create index on public.places (tree_id);
create index on public.tree_memberships (tree_id);
create index on public.tree_memberships (user_id);

-- 4. Функции
-- ============================================

-- Хелпер: проверка членства в дереве
create or replace function public.is_tree_member(t uuid)
returns boolean 
language sql 
stable 
as $$
  select exists (
    select 1 from public.tree_memberships m
    where m.tree_id = t and m.user_id = auth.uid()
  );
$$;

-- Автоматическое создание профиля при регистрации
create or replace function public.handle_new_user()
returns trigger
language plpgsql 
security definer 
set search_path = public 
as $$
begin
  insert into public.profiles (id, display_name, locale)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'full_name', new.email), 
    'ru'
  );
  return new;
end;
$$;

-- Триггер для создания профиля
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RPC для создания дерева владельцу
create or replace function public.create_default_tree(p_owner uuid, p_name text default 'Моё дерево')
returns uuid
language plpgsql 
security definer 
set search_path = public 
as $$
declare 
  t uuid; 
begin
  insert into public.trees(owner_id, name) 
  values (p_owner, coalesce(p_name,'My Tree')) 
  returning id into t;
  
  insert into public.tree_memberships(tree_id, user_id, role) 
  values (t, p_owner, 'owner');
  
  return t;
end;
$$;

-- Гранты
grant execute on function public.create_default_tree(uuid, text) to authenticated;

-- 5. RLS (Row Level Security) политики
-- ============================================

-- Включаем RLS на все таблицы
alter table public.trees enable row level security;
alter table public.tree_memberships enable row level security;
alter table public.profiles enable row level security;
alter table public.persons enable row level security;
alter table public.relationships enable row level security;
alter table public.places enable row level security;
alter table public.events enable row level security;
alter table public.person_events enable row level security;
alter table public.media enable row level security;
alter table public.invites enable row level security;
alter table public.audit_logs enable row level security;

-- Trees: чтение для участников, создание для владельца
create policy trees_select on public.trees
  for select 
  using (public.is_tree_member(id) or owner_id = auth.uid());

create policy trees_insert on public.trees
  for insert 
  with check (owner_id = auth.uid());

create policy trees_update on public.trees
  for update 
  using (owner_id = auth.uid());

-- Tree memberships: чтение для участников дерева, вставка для владельца
create policy tm_select on public.tree_memberships
  for select 
  using (user_id = auth.uid() or public.is_tree_member(tree_id));

create policy tm_insert on public.tree_memberships
  for insert 
  with check (
    user_id = auth.uid() or 
    exists (
      select 1 from public.tree_memberships m
      where m.tree_id = tree_memberships.tree_id 
      and m.user_id = auth.uid() 
      and m.role in ('owner','admin')
    )
  );

-- Profiles: чтение для всех, обновление только своего
create policy profiles_select on public.profiles
  for select 
  using (true);

create policy profiles_update on public.profiles
  for update 
  using (id = auth.uid());

-- Persons: чтение для участников, модификация для редакторов и выше
create policy persons_select on public.persons
  for select 
  using (public.is_tree_member(tree_id));

create policy persons_modify on public.persons
  for all 
  using (
    public.is_tree_member(tree_id) and exists (
      select 1 from public.tree_memberships m
      where m.tree_id = persons.tree_id 
      and m.user_id = auth.uid() 
      and m.role in ('owner','admin','editor')
    )
  ) 
  with check (public.is_tree_member(tree_id));

-- Relationships: аналогично persons
create policy relationships_select on public.relationships
  for select 
  using (public.is_tree_member(tree_id));

create policy relationships_modify on public.relationships
  for all 
  using (
    public.is_tree_member(tree_id) and exists (
      select 1 from public.tree_memberships m
      where m.tree_id = relationships.tree_id 
      and m.user_id = auth.uid() 
      and m.role in ('owner','admin','editor')
    )
  ) 
  with check (public.is_tree_member(tree_id));

-- Places: аналогично persons
create policy places_select on public.places
  for select 
  using (public.is_tree_member(tree_id));

create policy places_modify on public.places
  for all 
  using (
    public.is_tree_member(tree_id) and exists (
      select 1 from public.tree_memberships m
      where m.tree_id = places.tree_id 
      and m.user_id = auth.uid() 
      and m.role in ('owner','admin','editor')
    )
  ) 
  with check (public.is_tree_member(tree_id));

-- Events: аналогично persons
create policy events_select on public.events
  for select 
  using (public.is_tree_member(tree_id));

create policy events_modify on public.events
  for all 
  using (
    public.is_tree_member(tree_id) and exists (
      select 1 from public.tree_memberships m
      where m.tree_id = events.tree_id 
      and m.user_id = auth.uid() 
      and m.role in ('owner','admin','editor')
    )
  ) 
  with check (public.is_tree_member(tree_id));

-- Person events: аналогично persons
create policy person_events_select on public.person_events
  for select 
  using (
    exists (
      select 1 from public.events e
      where e.id = person_events.event_id 
      and public.is_tree_member(e.tree_id)
    )
  );

create policy person_events_modify on public.person_events
  for all 
  using (
    exists (
      select 1 from public.events e
      join public.tree_memberships m on m.tree_id = e.tree_id
      where e.id = person_events.event_id 
      and m.user_id = auth.uid() 
      and m.role in ('owner','admin','editor')
    )
  );

-- Media: аналогично persons
create policy media_select on public.media
  for select 
  using (public.is_tree_member(tree_id));

create policy media_modify on public.media
  for all 
  using (
    public.is_tree_member(tree_id) and exists (
      select 1 from public.tree_memberships m
      where m.tree_id = media.tree_id 
      and m.user_id = auth.uid() 
      and m.role in ('owner','admin','editor')
    )
  ) 
  with check (public.is_tree_member(tree_id));

-- Invites: чтение для владельцев/админов, создание для владельцев/админов
create policy invites_select on public.invites
  for select 
  using (
    exists (
      select 1 from public.tree_memberships m
      where m.tree_id = invites.tree_id 
      and m.user_id = auth.uid() 
      and m.role in ('owner','admin')
    )
  );

create policy invites_modify on public.invites
  for all 
  using (
    exists (
      select 1 from public.tree_memberships m
      where m.tree_id = invites.tree_id 
      and m.user_id = auth.uid() 
      and m.role in ('owner','admin')
    )
  );

-- Audit logs: чтение для участников дерева
create policy audit_logs_select on public.audit_logs
  for select 
  using (
    tree_id is null or public.is_tree_member(tree_id)
  );

