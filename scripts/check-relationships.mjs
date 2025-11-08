// check-relationships.mjs
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRelationships() {
  console.log('🔍 Проверка наличия таблицы relationships...\n');

  try {
    // Попытка получить связи
    const { data: relationships, error } = await supabase
      .from('relationships')
      .select(`
        id,
        relationship_type,
        marriage_date,
        marriage_place,
        divorce_date,
        user1:user1_id(id, first_name, last_name, email),
        user2:user2_id(id, first_name, last_name, email),
        created_at
      `)
      .limit(100);

    if (error) {
      if (error.message.includes('relation "public.relationships" does not exist')) {
        console.log('❌ Таблица relationships НЕ существует');
        console.log('\n📝 Необходимо создать таблицу. См. миграцию 001_invitation_based_tree.sql\n');
        return { exists: false, count: 0 };
      }
      throw error;
    }

    console.log(`✅ Таблица relationships существует`);
    console.log(`📊 Найдено связей: ${relationships?.length || 0}\n`);

    if (relationships && relationships.length > 0) {
      console.log('📋 Существующие связи:\n');
      
      // Группировка по типам
      const byType = relationships.reduce((acc, rel) => {
        acc[rel.relationship_type] = (acc[rel.relationship_type] || 0) + 1;
        return acc;
      }, {});

      console.log('По типам:');
      Object.entries(byType).forEach(([type, count]) => {
        console.log(`  - ${type}: ${count}`);
      });

      console.log('\n📝 Примеры связей:\n');
      relationships.slice(0, 10).forEach(rel => {
        const user1Name = rel.user1?.first_name && rel.user1?.last_name 
          ? `${rel.user1.first_name} ${rel.user1.last_name}`
          : rel.user1?.email || 'Unknown';
        const user2Name = rel.user2?.first_name && rel.user2?.last_name
          ? `${rel.user2.first_name} ${rel.user2.last_name}`
          : rel.user2?.email || 'Unknown';
        
        const extra = [];
        if (rel.marriage_date) extra.push(`married: ${rel.marriage_date}`);
        if (rel.divorce_date) extra.push(`divorced: ${rel.divorce_date}`);
        const extraStr = extra.length > 0 ? ` (${extra.join(', ')})` : '';
        
        console.log(`  ${user1Name} --[${rel.relationship_type}]--> ${user2Name}${extraStr}`);
      });
    } else {
      console.log('ℹ️  Связей пока нет. Таблица пустая.\n');
    }

    return { 
      exists: true, 
      count: relationships?.length || 0,
      relationships 
    };

  } catch (error) {
    console.error('❌ Ошибка при проверке:', error.message);
    return { exists: false, count: 0, error };
  }
}

// Дополнительно: проверить профили
async function checkProfiles() {
  console.log('\n👥 Проверка профилей пользователей...\n');

  try {
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, email, birth_date, gender, created_at')
      .limit(20);

    if (error) {
      if (error.message.includes('relation "public.user_profiles" does not exist')) {
        console.log('❌ Таблица user_profiles НЕ существует\n');
        return { count: 0, error };
      }
      throw error;
    }

    console.log(`✅ Найдено профилей: ${profiles?.length || 0}\n`);

    if (profiles && profiles.length > 0) {
      console.log('📝 Профили в БД:\n');
      profiles.forEach(profile => {
        const name = profile.first_name && profile.last_name 
          ? `${profile.first_name} ${profile.last_name}`
          : profile.email || 'No name';
        const gender = profile.gender ? ` (${profile.gender})` : '';
        const dob = profile.birth_date ? ` [DOB: ${profile.birth_date}]` : '';
        console.log(`  - ${name}${gender}${dob}`);
      });
    }

    return { count: profiles?.length || 0, profiles };

  } catch (error) {
    console.error('❌ Ошибка при проверке профилей:', error.message);
    return { count: 0, error };
  }
}

// Запуск проверки
async function main() {
  console.log('='.repeat(60));
  console.log('  Проверка базы данных: Relationships & Profiles');
  console.log('='.repeat(60));
  console.log();

  const relationshipsResult = await checkRelationships();
  const profilesResult = await checkProfiles();

  console.log('\n' + '='.repeat(60));
  console.log('  Итого:');
  console.log('='.repeat(60));
  console.log(`  Таблица relationships: ${relationshipsResult.exists ? '✅ Есть' : '❌ Нет'}`);
  console.log(`  Связей в БД: ${relationshipsResult.count}`);
  console.log(`  Профилей в БД: ${profilesResult.count}`);
  console.log('='.repeat(60));
  console.log();
}

main().catch(console.error);
