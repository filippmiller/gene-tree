'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function createProfile(prevState: {error?: string} | null, formData: FormData): Promise<{error?: string} | null> {
  console.log('[PROFILE-ACTION] Starting profile creation...');
  
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: any) {
            cookieStore.set(name, '', { ...options, maxAge: 0 });
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('[PROFILE-ACTION] No user found');
      return { error: 'Unauthorized' };
    }

    // Required fields
    const first_name = formData.get('first_name') as string;
    const last_name = formData.get('last_name') as string;
    const gender = formData.get('gender') as string;

    if (!first_name || !last_name || !gender) {
      console.error('[PROFILE-ACTION] Missing required fields');
      return { error: 'Missing required fields: first_name, last_name, gender' };
    }

    // Optional fields
    const middle_name = formData.get('middle_name') as string | null;
    const maiden_name = formData.get('maiden_name') as string | null;
    const nickname = formData.get('nickname') as string | null;
    const birth_date = formData.get('birth_date') as string | null;
    const birth_place = formData.get('birth_place') as string | null;
    const phone = formData.get('phone') as string | null;
    const occupation = formData.get('occupation') as string | null;
    const bio = formData.get('bio') as string | null;

    // Build profile data object - only include non-empty values
    const profileData: any = {
      id: user.id,
      first_name,
      last_name,
      gender,
    };

    // Add optional fields only if they have values
    if (middle_name) profileData.middle_name = middle_name;
    if (maiden_name) profileData.maiden_name = maiden_name;
    if (nickname) profileData.nickname = nickname;
    if (birth_date) profileData.birth_date = birth_date;
    if (birth_place) profileData.birth_place = birth_place;
    if (phone) profileData.phone = phone;
    if (occupation) profileData.occupation = occupation;
    if (bio) profileData.bio = bio;

    console.log('[PROFILE-ACTION] Creating profile:', { 
      userId: user.id, 
      email: user.email,
      fields: Object.keys(profileData)
    });

    // Insert profile
    const { error: insertError } = await supabase
      .from('user_profiles')
      .insert(profileData);

    if (insertError) {
      console.error('[PROFILE-ACTION] Error:', insertError);
      return { error: insertError.message };
    }

    console.log('[PROFILE-ACTION] Profile created successfully');

  } catch (error: any) {
    console.error('[PROFILE-ACTION] Unexpected error:', error);
    return { error: error.message };
  }

  // Redirect to dashboard on success
  redirect('/en/app');
  return null; // This won't be reached due to redirect, but TypeScript needs it
}
