export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity_events: {
        Row: {
          actor_id: string
          created_at: string | null
          display_data: Json | null
          event_type: string
          id: string
          subject_id: string
          subject_type: string
          visibility: string | null
        }
        Insert: {
          actor_id: string
          created_at?: string | null
          display_data?: Json | null
          event_type: string
          id?: string
          subject_id: string
          subject_type: string
          visibility?: string | null
        }
        Update: {
          actor_id?: string
          created_at?: string | null
          display_data?: Json | null
          event_type?: string
          id?: string
          subject_id?: string
          subject_type?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "gt_v_person"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ancestor_cache: {
        Row: {
          ancestor_id: string
          depth: number
          last_computed: string | null
          path: string[]
          user_id: string
        }
        Insert: {
          ancestor_id: string
          depth: number
          last_computed?: string | null
          path: string[]
          user_id: string
        }
        Update: {
          ancestor_id?: string
          depth?: number
          last_computed?: string | null
          path?: string[]
          user_id?: string
        }
        Relationships: []
      }
      assigned_prompts: {
        Row: {
          answered_at: string | null
          created_at: string | null
          from_user_id: string
          id: string
          message: string | null
          prompt_id: string
          response_story_id: string | null
          status: string | null
          to_user_id: string
        }
        Insert: {
          answered_at?: string | null
          created_at?: string | null
          from_user_id: string
          id?: string
          message?: string | null
          prompt_id: string
          response_story_id?: string | null
          status?: string | null
          to_user_id: string
        }
        Update: {
          answered_at?: string | null
          created_at?: string | null
          from_user_id?: string
          id?: string
          message?: string | null
          prompt_id?: string
          response_story_id?: string | null
          status?: string | null
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assigned_prompts_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "story_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          error_message: string | null
          error_stack: string | null
          id: string
          ip_address: string | null
          method: string | null
          path: string | null
          request_body: Json | null
          response_body: Json | null
          response_status: number | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          error_stack?: string | null
          id?: string
          ip_address?: string | null
          method?: string | null
          path?: string | null
          request_body?: Json | null
          response_body?: Json | null
          response_status?: number | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          error_stack?: string | null
          id?: string
          ip_address?: string | null
          method?: string | null
          path?: string | null
          request_body?: Json | null
          response_body?: Json | null
          response_status?: number | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      badge_progress: {
        Row: {
          badge_id: string
          current_value: number | null
          last_updated: string | null
          user_id: string
        }
        Insert: {
          badge_id: string
          current_value?: number | null
          last_updated?: string | null
          user_id: string
        }
        Update: {
          badge_id?: string
          current_value?: number | null
          last_updated?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "badge_progress_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          category: string
          created_at: string | null
          criteria_target: string | null
          criteria_type: string
          criteria_value: number | null
          description: string | null
          description_ru: string | null
          icon: string
          id: string
          is_active: boolean | null
          name: string
          name_ru: string | null
          rarity: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          criteria_target?: string | null
          criteria_type: string
          criteria_value?: number | null
          description?: string | null
          description_ru?: string | null
          icon?: string
          id?: string
          is_active?: boolean | null
          name: string
          name_ru?: string | null
          rarity?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          criteria_target?: string | null
          criteria_type?: string
          criteria_value?: number | null
          description?: string | null
          description_ru?: string | null
          icon?: string
          id?: string
          is_active?: boolean | null
          name?: string
          name_ru?: string | null
          rarity?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      bridge_blocked_users: {
        Row: {
          blocked_user_id: string
          created_at: string | null
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          blocked_user_id: string
          created_at?: string | null
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          blocked_user_id?: string
          created_at?: string | null
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bridge_candidates: {
        Row: {
          candidate_user_id: string
          created_at: string | null
          dismissed_at: string | null
          id: string
          is_dismissed: boolean | null
          match_reasons: Json | null
          match_score: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          candidate_user_id: string
          created_at?: string | null
          dismissed_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          match_reasons?: Json | null
          match_score?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          candidate_user_id?: string
          created_at?: string | null
          dismissed_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          match_reasons?: Json | null
          match_score?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bridge_requests: {
        Row: {
          claimed_relationship: string
          common_ancestor_hint: string | null
          created_at: string | null
          established_relationship_type: string | null
          expires_at: string | null
          id: string
          requester_id: string
          responded_at: string | null
          response_message: string | null
          status: string | null
          supporting_info: string | null
          target_user_id: string
          updated_at: string | null
        }
        Insert: {
          claimed_relationship: string
          common_ancestor_hint?: string | null
          created_at?: string | null
          established_relationship_type?: string | null
          expires_at?: string | null
          id?: string
          requester_id: string
          responded_at?: string | null
          response_message?: string | null
          status?: string | null
          supporting_info?: string | null
          target_user_id: string
          updated_at?: string | null
        }
        Update: {
          claimed_relationship?: string
          common_ancestor_hint?: string | null
          created_at?: string | null
          established_relationship_type?: string | null
          expires_at?: string | null
          id?: string
          requester_id?: string
          responded_at?: string | null
          response_message?: string | null
          status?: string | null
          supporting_info?: string | null
          target_user_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      challenge_participants: {
        Row: {
          challenge_id: string
          completed_at: string | null
          current_progress: number | null
          id: string
          joined_at: string | null
          reward_claimed: boolean | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          current_progress?: number | null
          id?: string
          joined_at?: string | null
          reward_claimed?: boolean | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          current_progress?: number | null
          id?: string
          joined_at?: string | null
          reward_claimed?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "family_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      connection_requests: {
        Row: {
          created_at: string | null
          from_user_id: string
          id: string
          message: string | null
          relationship_description: string | null
          responded_at: string | null
          shared_ancestor_id: string | null
          status: string
          to_user_id: string
        }
        Insert: {
          created_at?: string | null
          from_user_id: string
          id?: string
          message?: string | null
          relationship_description?: string | null
          responded_at?: string | null
          shared_ancestor_id?: string | null
          status?: string
          to_user_id: string
        }
        Update: {
          created_at?: string | null
          from_user_id?: string
          id?: string
          message?: string | null
          relationship_description?: string | null
          responded_at?: string | null
          shared_ancestor_id?: string | null
          status?: string
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connection_requests_shared_ancestor_id_fkey"
            columns: ["shared_ancestor_id"]
            isOneToOne: false
            referencedRelation: "gt_v_person"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connection_requests_shared_ancestor_id_fkey"
            columns: ["shared_ancestor_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connection_requests_shared_ancestor_id_fkey"
            columns: ["shared_ancestor_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_events_cache: {
        Row: {
          created_at: string | null
          display_title: string
          event_day: number
          event_month: number
          event_type: string
          id: string
          profile_id: string
          related_profile_id: string | null
          years_ago: number | null
        }
        Insert: {
          created_at?: string | null
          display_title: string
          event_day: number
          event_month: number
          event_type: string
          id?: string
          profile_id: string
          related_profile_id?: string | null
          years_ago?: number | null
        }
        Update: {
          created_at?: string | null
          display_title?: string
          event_day?: number
          event_month?: number
          event_type?: string
          id?: string
          profile_id?: string
          related_profile_id?: string | null
          years_ago?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_events_cache_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "gt_v_person"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_events_cache_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_events_cache_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_events_cache_related_profile_id_fkey"
            columns: ["related_profile_id"]
            isOneToOne: false
            referencedRelation: "gt_v_person"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_events_cache_related_profile_id_fkey"
            columns: ["related_profile_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_events_cache_related_profile_id_fkey"
            columns: ["related_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deceased_relatives: {
        Row: {
          added_by_user_id: string
          bio: string | null
          birth_date: string | null
          birth_place: string | null
          created_at: string | null
          death_date: string | null
          death_place: string | null
          first_name: string
          gender: string | null
          id: string
          is_living: boolean | null
          last_name: string
          maiden_name: string | null
          middle_name: string | null
          nickname: string | null
          occupation: string | null
          photos: Json | null
          relationship_to_adder: string
          updated_at: string | null
        }
        Insert: {
          added_by_user_id: string
          bio?: string | null
          birth_date?: string | null
          birth_place?: string | null
          created_at?: string | null
          death_date?: string | null
          death_place?: string | null
          first_name: string
          gender?: string | null
          id?: string
          is_living?: boolean | null
          last_name: string
          maiden_name?: string | null
          middle_name?: string | null
          nickname?: string | null
          occupation?: string | null
          photos?: Json | null
          relationship_to_adder: string
          updated_at?: string | null
        }
        Update: {
          added_by_user_id?: string
          bio?: string | null
          birth_date?: string | null
          birth_place?: string | null
          created_at?: string | null
          death_date?: string | null
          death_place?: string | null
          first_name?: string
          gender?: string | null
          id?: string
          is_living?: boolean | null
          last_name?: string
          maiden_name?: string | null
          middle_name?: string | null
          nickname?: string | null
          occupation?: string | null
          photos?: Json | null
          relationship_to_adder?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      duplicate_scan_history: {
        Row: {
          created_at: string
          duplicates_found: number
          duplicates_inserted: number
          duration_ms: number | null
          id: string
          min_confidence: number
          profiles_scanned: number
          scan_type: string
          scanned_by: string | null
        }
        Insert: {
          created_at?: string
          duplicates_found?: number
          duplicates_inserted?: number
          duration_ms?: number | null
          id?: string
          min_confidence?: number
          profiles_scanned?: number
          scan_type?: string
          scanned_by?: string | null
        }
        Update: {
          created_at?: string
          duplicates_found?: number
          duplicates_inserted?: number
          duration_ms?: number | null
          id?: string
          min_confidence?: number
          profiles_scanned?: number
          scan_type?: string
          scanned_by?: string | null
        }
        Relationships: []
      }
      education: {
        Row: {
          created_at: string | null
          degree: string | null
          description: string | null
          end_year: number | null
          field_of_study: string | null
          id: string
          institution_name: string
          institution_type: string | null
          is_current: boolean | null
          start_year: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          degree?: string | null
          description?: string | null
          end_year?: number | null
          field_of_study?: string | null
          id?: string
          institution_name: string
          institution_type?: string | null
          is_current?: boolean | null
          start_year?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          degree?: string | null
          description?: string | null
          end_year?: number | null
          field_of_study?: string | null
          id?: string
          institution_name?: string
          institution_type?: string | null
          is_current?: boolean | null
          start_year?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "education_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "gt_v_person"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "education_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "education_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      elder_questions: {
        Row: {
          answer: string | null
          answered_at: string | null
          asker_id: string
          created_at: string | null
          elder_id: string
          id: string
          question: string
          status: Database["public"]["Enums"]["elder_question_status"] | null
          visibility: string | null
        }
        Insert: {
          answer?: string | null
          answered_at?: string | null
          asker_id: string
          created_at?: string | null
          elder_id: string
          id?: string
          question: string
          status?: Database["public"]["Enums"]["elder_question_status"] | null
          visibility?: string | null
        }
        Update: {
          answer?: string | null
          answered_at?: string | null
          asker_id?: string
          created_at?: string | null
          elder_id?: string
          id?: string
          question?: string
          status?: Database["public"]["Enums"]["elder_question_status"] | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "elder_questions_asker_id_fkey"
            columns: ["asker_id"]
            isOneToOne: false
            referencedRelation: "gt_v_person"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "elder_questions_asker_id_fkey"
            columns: ["asker_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "elder_questions_asker_id_fkey"
            columns: ["asker_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "elder_questions_elder_id_fkey"
            columns: ["elder_id"]
            isOneToOne: false
            referencedRelation: "gt_v_person"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "elder_questions_elder_id_fkey"
            columns: ["elder_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "elder_questions_elder_id_fkey"
            columns: ["elder_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employment: {
        Row: {
          company_name: string
          created_at: string | null
          description: string | null
          employment_type: string | null
          end_date: string | null
          id: string
          is_current: boolean | null
          location: string | null
          position: string
          start_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_name: string
          created_at?: string | null
          description?: string | null
          employment_type?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          location?: string | null
          position: string
          start_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_name?: string
          created_at?: string | null
          description?: string | null
          employment_type?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          location?: string | null
          position?: string
          start_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employment_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "gt_v_person"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employment_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employment_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      family_challenges: {
        Row: {
          challenge_type: string
          created_at: string | null
          created_by: string | null
          description: string | null
          description_ru: string | null
          end_date: string
          family_scope: string | null
          id: string
          is_active: boolean | null
          reward_badge_id: string | null
          reward_points: number | null
          start_date: string
          target_value: number
          title: string
          title_ru: string | null
          updated_at: string | null
        }
        Insert: {
          challenge_type: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          description_ru?: string | null
          end_date: string
          family_scope?: string | null
          id?: string
          is_active?: boolean | null
          reward_badge_id?: string | null
          reward_points?: number | null
          start_date: string
          target_value?: number
          title: string
          title_ru?: string | null
          updated_at?: string | null
        }
        Update: {
          challenge_type?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          description_ru?: string | null
          end_date?: string
          family_scope?: string | null
          id?: string
          is_active?: boolean | null
          reward_badge_id?: string | null
          reward_points?: number | null
          start_date?: string
          target_value?: number
          title?: string
          title_ru?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_challenges_reward_badge_id_fkey"
            columns: ["reward_badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      family_messages: {
        Row: {
          content: string
          created_at: string | null
          from_user_id: string
          id: string
          read_at: string | null
          thread_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          from_user_id: string
          id?: string
          read_at?: string | null
          thread_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          from_user_id?: string
          id?: string
          read_at?: string | null
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      honor_tag_verifications: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          profile_honor_tag_id: string
          verified: boolean
          verifier_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          profile_honor_tag_id: string
          verified: boolean
          verifier_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          profile_honor_tag_id?: string
          verified?: boolean
          verifier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "honor_tag_verifications_profile_honor_tag_id_fkey"
            columns: ["profile_honor_tag_id"]
            isOneToOne: false
            referencedRelation: "profile_honor_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      honor_tags: {
        Row: {
          applicable_to_deceased: boolean | null
          applicable_to_living: boolean | null
          background_color: string | null
          category: string
          code: string
          color: string | null
          country_code: string | null
          created_at: string | null
          description: string | null
          description_ru: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_official: boolean | null
          name: string
          name_ru: string | null
          requires_verification: boolean | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          applicable_to_deceased?: boolean | null
          applicable_to_living?: boolean | null
          background_color?: string | null
          category: string
          code: string
          color?: string | null
          country_code?: string | null
          created_at?: string | null
          description?: string | null
          description_ru?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_official?: boolean | null
          name: string
          name_ru?: string | null
          requires_verification?: boolean | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          applicable_to_deceased?: boolean | null
          applicable_to_living?: boolean | null
          background_color?: string | null
          category?: string
          code?: string
          color?: string | null
          country_code?: string | null
          created_at?: string | null
          description?: string | null
          description_ru?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_official?: boolean | null
          name?: string
          name_ru?: string | null
          requires_verification?: boolean | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      institution_ref: {
        Row: {
          city: string | null
          country_code: string | null
          created_at: string | null
          external_id: string | null
          geo_point: unknown
          id: string
          name: string
          name_alt: string[] | null
          region: string | null
          source: string
          updated_at: string | null
          verified: boolean | null
          website: string | null
        }
        Insert: {
          city?: string | null
          country_code?: string | null
          created_at?: string | null
          external_id?: string | null
          geo_point?: unknown
          id?: string
          name: string
          name_alt?: string[] | null
          region?: string | null
          source: string
          updated_at?: string | null
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          city?: string | null
          country_code?: string | null
          created_at?: string | null
          external_id?: string | null
          geo_point?: unknown
          id?: string
          name?: string
          name_alt?: string[] | null
          region?: string | null
          source?: string
          updated_at?: string | null
          verified?: boolean | null
          website?: string | null
        }
        Relationships: []
      }
      invitations: {
        Row: {
          accepted_at: string | null
          accepted_user_id: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          invitee_email: string
          invitee_phone: string | null
          inviter_id: string
          message: string | null
          relationship_type: string
          status: string | null
          token: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invitee_email: string
          invitee_phone?: string | null
          inviter_id: string
          message?: string | null
          relationship_type: string
          status?: string | null
          token?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invitee_email?: string
          invitee_phone?: string | null
          inviter_id?: string
          message?: string | null
          relationship_type?: string
          status?: string | null
          token?: string
        }
        Relationships: []
      }
      kin_terms_ru: {
        Row: {
          path_expr: string
          term: string
        }
        Insert: {
          path_expr: string
          term: string
        }
        Update: {
          path_expr?: string
          term?: string
        }
        Relationships: []
      }
      kin_types: {
        Row: {
          name_en: string
          name_ru: string
          path_expr: string
        }
        Insert: {
          name_en: string
          name_ru: string
          path_expr: string
        }
        Update: {
          name_en?: string
          name_ru?: string
          path_expr?: string
        }
        Relationships: []
      }
      kinship_labels: {
        Row: {
          direction: string
          gender: string
          id: number
          label: string
          lang: string
          type_id: number
        }
        Insert: {
          direction: string
          gender?: string
          id?: number
          label: string
          lang: string
          type_id: number
        }
        Update: {
          direction?: string
          gender?: string
          id?: number
          label?: string
          lang?: string
          type_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "kinship_labels_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "relationship_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_settings: {
        Row: {
          show_badges: boolean | null
          show_on_leaderboard: boolean | null
          show_points: boolean | null
          show_real_name: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          show_badges?: boolean | null
          show_on_leaderboard?: boolean | null
          show_points?: boolean | null
          show_real_name?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          show_badges?: boolean | null
          show_on_leaderboard?: boolean | null
          show_points?: boolean | null
          show_real_name?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      matching_preferences: {
        Row: {
          allow_matching: boolean | null
          created_at: string | null
          min_ancestor_depth: number | null
          notify_on_match: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allow_matching?: boolean | null
          created_at?: string | null
          min_ancestor_depth?: number | null
          notify_on_match?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allow_matching?: boolean | null
          created_at?: string | null
          min_ancestor_depth?: number | null
          notify_on_match?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      media_jobs: {
        Row: {
          created_at: string | null
          error: string | null
          finished_at: string | null
          id: string
          kind: string
          payload: Json
          started_at: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          finished_at?: string | null
          id?: string
          kind: string
          payload: Json
          started_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string | null
          error?: string | null
          finished_at?: string | null
          id?: string
          kind?: string
          payload?: Json
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      memory_prompts: {
        Row: {
          category: string
          created_at: string | null
          id: string
          is_active: boolean | null
          is_seasonal: boolean | null
          placeholder_type: string | null
          prompt_en: string
          prompt_ru: string
          season: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_seasonal?: boolean | null
          placeholder_type?: string | null
          prompt_en: string
          prompt_ru: string
          season?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_seasonal?: boolean | null
          placeholder_type?: string | null
          prompt_en?: string
          prompt_ru?: string
          season?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      merge_history: {
        Row: {
          created_at: string
          duplicate_record_id: string | null
          id: string
          kept_profile_id: string
          merge_data: Json
          merged_by: string
          merged_profile_id: string
          relationships_transferred: number
        }
        Insert: {
          created_at?: string
          duplicate_record_id?: string | null
          id?: string
          kept_profile_id: string
          merge_data?: Json
          merged_by: string
          merged_profile_id: string
          relationships_transferred?: number
        }
        Update: {
          created_at?: string
          duplicate_record_id?: string | null
          id?: string
          kept_profile_id?: string
          merge_data?: Json
          merged_by?: string
          merged_profile_id?: string
          relationships_transferred?: number
        }
        Relationships: [
          {
            foreignKeyName: "merge_history_duplicate_record_id_fkey"
            columns: ["duplicate_record_id"]
            isOneToOne: false
            referencedRelation: "potential_duplicates"
            referencedColumns: ["id"]
          },
        ]
      }
      message_threads: {
        Row: {
          created_at: string | null
          id: string
          participant_1: string
          participant_2: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          participant_1: string
          participant_2: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          participant_1?: string
          participant_2?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      milestones: {
        Row: {
          category: Database["public"]["Enums"]["milestone_category"]
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          media_urls: string[] | null
          milestone_date: string
          milestone_type: string
          profile_id: string
          remind_annually: boolean | null
          reminder_days_before: number | null
          title: string
          updated_at: string | null
          visibility: Database["public"]["Enums"]["media_visibility"]
        }
        Insert: {
          category?: Database["public"]["Enums"]["milestone_category"]
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          media_urls?: string[] | null
          milestone_date: string
          milestone_type: string
          profile_id: string
          remind_annually?: boolean | null
          reminder_days_before?: number | null
          title: string
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["media_visibility"]
        }
        Update: {
          category?: Database["public"]["Enums"]["milestone_category"]
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          media_urls?: string[] | null
          milestone_date?: string
          milestone_type?: string
          profile_id?: string
          remind_annually?: boolean | null
          reminder_days_before?: number | null
          title?: string
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["media_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "milestones_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "gt_v_person"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "gt_v_person"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_recipients: {
        Row: {
          is_read: boolean
          notification_id: string
          profile_id: string
          read_at: string | null
        }
        Insert: {
          is_read?: boolean
          notification_id: string
          profile_id: string
          read_at?: string | null
        }
        Update: {
          is_read?: boolean
          notification_id?: string
          profile_id?: string
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_recipients_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_recipients_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "gt_v_person"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_recipients_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_recipients_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_profile_id: string
          created_at: string
          event_type: string
          id: string
          payload: Json | null
          primary_profile_id: string | null
          related_profile_id: string | null
        }
        Insert: {
          actor_profile_id: string
          created_at?: string
          event_type: string
          id?: string
          payload?: Json | null
          primary_profile_id?: string | null
          related_profile_id?: string | null
        }
        Update: {
          actor_profile_id?: string
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json | null
          primary_profile_id?: string | null
          related_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "gt_v_person"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_primary_profile_id_fkey"
            columns: ["primary_profile_id"]
            isOneToOne: false
            referencedRelation: "gt_v_person"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_primary_profile_id_fkey"
            columns: ["primary_profile_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_primary_profile_id_fkey"
            columns: ["primary_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_profile_id_fkey"
            columns: ["related_profile_id"]
            isOneToOne: false
            referencedRelation: "gt_v_person"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_profile_id_fkey"
            columns: ["related_profile_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_profile_id_fkey"
            columns: ["related_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_relatives: {
        Row: {
          accepted_at: string | null
          cousin_degree: number | null
          cousin_removed: number | null
          created_at: string
          date_of_birth: string | null
          divorce_date: string | null
          email: string | null
          facebook_url: string | null
          first_name: string
          halfness: string | null
          id: string
          instagram_url: string | null
          invitation_token: string
          invited_at: string | null
          invited_by: string
          is_deceased: boolean
          is_pending: boolean | null
          is_temporary: boolean | null
          is_verified: boolean | null
          last_name: string
          level: number | null
          lineage: string | null
          marriage_date: string | null
          phone: string | null
          related_to_relationship: string | null
          related_to_user_id: string | null
          relationship_status: string | null
          relationship_type: string
          role_for_a: string | null
          role_for_b: string | null
          status: string
          updated_at: string
          verification_status: string
        }
        Insert: {
          accepted_at?: string | null
          cousin_degree?: number | null
          cousin_removed?: number | null
          created_at?: string
          date_of_birth?: string | null
          divorce_date?: string | null
          email?: string | null
          facebook_url?: string | null
          first_name: string
          halfness?: string | null
          id?: string
          instagram_url?: string | null
          invitation_token?: string
          invited_at?: string | null
          invited_by: string
          is_deceased?: boolean
          is_pending?: boolean | null
          is_temporary?: boolean | null
          is_verified?: boolean | null
          last_name: string
          level?: number | null
          lineage?: string | null
          marriage_date?: string | null
          phone?: string | null
          related_to_relationship?: string | null
          related_to_user_id?: string | null
          relationship_status?: string | null
          relationship_type: string
          role_for_a?: string | null
          role_for_b?: string | null
          status?: string
          updated_at?: string
          verification_status?: string
        }
        Update: {
          accepted_at?: string | null
          cousin_degree?: number | null
          cousin_removed?: number | null
          created_at?: string
          date_of_birth?: string | null
          divorce_date?: string | null
          email?: string | null
          facebook_url?: string | null
          first_name?: string
          halfness?: string | null
          id?: string
          instagram_url?: string | null
          invitation_token?: string
          invited_at?: string | null
          invited_by?: string
          is_deceased?: boolean
          is_pending?: boolean | null
          is_temporary?: boolean | null
          is_verified?: boolean | null
          last_name?: string
          level?: number | null
          lineage?: string | null
          marriage_date?: string | null
          phone?: string | null
          related_to_relationship?: string | null
          related_to_user_id?: string | null
          relationship_status?: string | null
          relationship_type?: string
          role_for_a?: string | null
          role_for_b?: string | null
          status?: string
          updated_at?: string
          verification_status?: string
        }
        Relationships: []
      }
      person_education: {
        Row: {
          certainty: Database["public"]["Enums"]["certainty_level"] | null
          created_at: string | null
          created_by: string | null
          degree: string | null
          end_date: string | null
          end_precision: Database["public"]["Enums"]["date_precision"] | null
          faculty: string | null
          grade_level: string | null
          id: string
          institution_ref_id: string | null
          institution_text: string | null
          is_current: boolean | null
          major: string | null
          notes: string | null
          person_id: string
          source: Json | null
          start_date: string | null
          start_precision: Database["public"]["Enums"]["date_precision"] | null
          status: Database["public"]["Enums"]["education_status"] | null
          type: Database["public"]["Enums"]["education_type"]
          updated_at: string | null
          visibility: Database["public"]["Enums"]["visibility_level"] | null
        }
        Insert: {
          certainty?: Database["public"]["Enums"]["certainty_level"] | null
          created_at?: string | null
          created_by?: string | null
          degree?: string | null
          end_date?: string | null
          end_precision?: Database["public"]["Enums"]["date_precision"] | null
          faculty?: string | null
          grade_level?: string | null
          id?: string
          institution_ref_id?: string | null
          institution_text?: string | null
          is_current?: boolean | null
          major?: string | null
          notes?: string | null
          person_id: string
          source?: Json | null
          start_date?: string | null
          start_precision?: Database["public"]["Enums"]["date_precision"] | null
          status?: Database["public"]["Enums"]["education_status"] | null
          type: Database["public"]["Enums"]["education_type"]
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["visibility_level"] | null
        }
        Update: {
          certainty?: Database["public"]["Enums"]["certainty_level"] | null
          created_at?: string | null
          created_by?: string | null
          degree?: string | null
          end_date?: string | null
          end_precision?: Database["public"]["Enums"]["date_precision"] | null
          faculty?: string | null
          grade_level?: string | null
          id?: string
          institution_ref_id?: string | null
          institution_text?: string | null
          is_current?: boolean | null
          major?: string | null
          notes?: string | null
          person_id?: string
          source?: Json | null
          start_date?: string | null
          start_precision?: Database["public"]["Enums"]["date_precision"] | null
          status?: Database["public"]["Enums"]["education_status"] | null
          type?: Database["public"]["Enums"]["education_type"]
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["visibility_level"] | null
        }
        Relationships: [
          {
            foreignKeyName: "person_education_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "gt_v_person"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_education_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_education_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_education_institution_ref_id_fkey"
            columns: ["institution_ref_id"]
            isOneToOne: false
            referencedRelation: "institution_ref"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_education_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "gt_v_person"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_education_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_education_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      person_residence: {
        Row: {
          apartment: string | null
          building: string | null
          certainty: Database["public"]["Enums"]["certainty_level"] | null
          city: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          district: string | null
          end_date: string | null
          end_precision: Database["public"]["Enums"]["date_precision"] | null
          geo_point: unknown
          id: string
          is_current: boolean | null
          notes: string | null
          person_id: string
          place_ref_id: string | null
          place_text: string | null
          postal_code: string | null
          region: string | null
          source: Json | null
          start_date: string | null
          start_precision: Database["public"]["Enums"]["date_precision"] | null
          street: string | null
          updated_at: string | null
          visibility: Database["public"]["Enums"]["visibility_level"] | null
        }
        Insert: {
          apartment?: string | null
          building?: string | null
          certainty?: Database["public"]["Enums"]["certainty_level"] | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          district?: string | null
          end_date?: string | null
          end_precision?: Database["public"]["Enums"]["date_precision"] | null
          geo_point?: unknown
          id?: string
          is_current?: boolean | null
          notes?: string | null
          person_id: string
          place_ref_id?: string | null
          place_text?: string | null
          postal_code?: string | null
          region?: string | null
          source?: Json | null
          start_date?: string | null
          start_precision?: Database["public"]["Enums"]["date_precision"] | null
          street?: string | null
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["visibility_level"] | null
        }
        Update: {
          apartment?: string | null
          building?: string | null
          certainty?: Database["public"]["Enums"]["certainty_level"] | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          district?: string | null
          end_date?: string | null
          end_precision?: Database["public"]["Enums"]["date_precision"] | null
          geo_point?: unknown
          id?: string
          is_current?: boolean | null
          notes?: string | null
          person_id?: string
          place_ref_id?: string | null
          place_text?: string | null
          postal_code?: string | null
          region?: string | null
          source?: Json | null
          start_date?: string | null
          start_precision?: Database["public"]["Enums"]["date_precision"] | null
          street?: string | null
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["visibility_level"] | null
        }
        Relationships: [
          {
            foreignKeyName: "person_residence_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "gt_v_person"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_residence_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_residence_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_residence_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "gt_v_person"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_residence_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_residence_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_residence_place_ref_id_fkey"
            columns: ["place_ref_id"]
            isOneToOne: false
            referencedRelation: "place_ref"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_people: {
        Row: {
          photo_id: string
          profile_id: string
          role: string | null
        }
        Insert: {
          photo_id: string
          profile_id: string
          role?: string | null
        }
        Update: {
          photo_id?: string
          profile_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "photo_people_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_people_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "gt_v_person"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_people_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_people_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_reviews: {
        Row: {
          action: string
          actor: string
          created_at: string | null
          id: string
          photo_id: string
          reason: string | null
        }
        Insert: {
          action: string
          actor: string
          created_at?: string | null
          id?: string
          photo_id: string
          reason?: string | null
        }
        Update: {
          action?: string
          actor?: string
          created_at?: string | null
          id?: string
          photo_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "photo_reviews_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_tags: {
        Row: {
          created_at: string | null
          id: string
          is_confirmed: boolean | null
          photo_id: string
          tagged_by: string
          tagged_profile_id: string
          x_percent: number
          y_percent: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_confirmed?: boolean | null
          photo_id: string
          tagged_by: string
          tagged_profile_id: string
          x_percent: number
          y_percent: number
        }
        Update: {
          created_at?: string | null
          id?: string
          is_confirmed?: boolean | null
          photo_id?: string
          tagged_by?: string
          tagged_profile_id?: string
          x_percent?: number
          y_percent?: number
        }
        Relationships: [
          {
            foreignKeyName: "photo_tags_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_tags_tagged_by_fkey"
            columns: ["tagged_by"]
            isOneToOne: false
            referencedRelation: "gt_v_person"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_tags_tagged_by_fkey"
            columns: ["tagged_by"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_tags_tagged_by_fkey"
            columns: ["tagged_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_tags_tagged_profile_id_fkey"
            columns: ["tagged_profile_id"]
            isOneToOne: false
            referencedRelation: "gt_v_person"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_tags_tagged_profile_id_fkey"
            columns: ["tagged_profile_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_tags_tagged_profile_id_fkey"
            columns: ["tagged_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          archived_at: string | null
          bucket: string
          caption: string | null
          created_at: string | null
          exif: Json | null
          height: number | null
          id: string
          path: string
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          sha256: string | null
          status: Database["public"]["Enums"]["media_status"]
          storage_object_id: string | null
          taken_at: string | null
          target_profile_id: string | null
          type: Database["public"]["Enums"]["media_type"]
          uploaded_by: string
          visibility: Database["public"]["Enums"]["media_visibility"]
          width: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          archived_at?: string | null
          bucket: string
          caption?: string | null
          created_at?: string | null
          exif?: Json | null
          height?: number | null
          id?: string
          path: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          sha256?: string | null
          status?: Database["public"]["Enums"]["media_status"]
          storage_object_id?: string | null
          taken_at?: string | null
          target_profile_id?: string | null
          type?: Database["public"]["Enums"]["media_type"]
          uploaded_by: string
          visibility?: Database["public"]["Enums"]["media_visibility"]
          width?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          archived_at?: string | null
          bucket?: string
          caption?: string | null
          created_at?: string | null
          exif?: Json | null
          height?: number | null
          id?: string
          path?: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          sha256?: string | null
          status?: Database["public"]["Enums"]["media_status"]
          storage_object_id?: string | null
          taken_at?: string | null
          target_profile_id?: string | null
          type?: Database["public"]["Enums"]["media_type"]
          uploaded_by?: string
          visibility?: Database["public"]["Enums"]["media_visibility"]
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "photos_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "gt_v_person"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      place_ref: {
        Row: {
          address_full: string | null
          admin1: string | null
          admin2: string | null
          country_code: string
          created_at: string | null
          external_id: string | null
          geo_point: unknown
          id: string
          name: string
          source: string
          updated_at: string | null
        }
        Insert: {
          address_full?: string | null
          admin1?: string | null
          admin2?: string | null
          country_code: string
          created_at?: string | null
          external_id?: string | null
          geo_point: unknown
          id?: string
          name: string
          source: string
          updated_at?: string | null
        }
        Update: {
          address_full?: string | null
          admin1?: string | null
          admin2?: string | null
          country_code?: string
          created_at?: string | null
          external_id?: string | null
          geo_point?: unknown
          id?: string
          name?: string
          source?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      point_transactions: {
        Row: {
          action_id: string | null
          action_type: string
          created_at: string | null
          description: string | null
          id: string
          points: number
          user_id: string
        }
        Insert: {
          action_id?: string | null
          action_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          points: number
          user_id: string
        }
        Update: {
          action_id?: string | null
          action_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          points?: number
          user_id?: string
        }
        Relationships: []
      }
      point_values: {
        Row: {
          action_type: string
          daily_limit: number | null
          description: string | null
          description_ru: string | null
          is_active: boolean | null
          points: number
        }
        Insert: {
          action_type: string
          daily_limit?: number | null
          description?: string | null
          description_ru?: string | null
          is_active?: boolean | null
          points: number
        }
        Update: {
          action_type?: string
          daily_limit?: number | null
          description?: string | null
          description_ru?: string | null
          is_active?: boolean | null
          points?: number
        }
        Relationships: []
      }
      potential_duplicates: {
        Row: {
          confidence_score: number
          created_at: string
          id: string
          is_deceased_pair: boolean | null
          kept_profile_id: string | null
          match_reasons: Json
          profile_a_id: string
          profile_b_id: string
          resolution_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          shared_relatives_count: number | null
          status: string
          updated_at: string
        }
        Insert: {
          confidence_score: number
          created_at?: string
          id?: string
          is_deceased_pair?: boolean | null
          kept_profile_id?: string | null
          match_reasons?: Json
          profile_a_id: string
          profile_b_id: string
          resolution_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shared_relatives_count?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          confidence_score?: number
          created_at?: string
          id?: string
          is_deceased_pair?: boolean | null
          kept_profile_id?: string | null
          match_reasons?: Json
          profile_a_id?: string
          profile_b_id?: string
          resolution_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shared_relatives_count?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "potential_duplicates_kept_profile_id_fkey"
            columns: ["kept_profile_id"]
            isOneToOne: false
            referencedRelation: "gt_v_person"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "potential_duplicates_kept_profile_id_fkey"
            columns: ["kept_profile_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "potential_duplicates_kept_profile_id_fkey"
            columns: ["kept_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "potential_duplicates_profile_a_id_fkey"
            columns: ["profile_a_id"]
            isOneToOne: false
            referencedRelation: "gt_v_person"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "potential_duplicates_profile_a_id_fkey"
            columns: ["profile_a_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "potential_duplicates_profile_a_id_fkey"
            columns: ["profile_a_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "potential_duplicates_profile_b_id_fkey"
            columns: ["profile_b_id"]
            isOneToOne: false
            referencedRelation: "gt_v_person"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "potential_duplicates_profile_b_id_fkey"
            columns: ["profile_b_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "potential_duplicates_profile_b_id_fkey"
            columns: ["profile_b_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_honor_tags: {
        Row: {
          added_at: string | null
          added_by: string | null
          display_order: number | null
          document_url: string | null
          honor_tag_id: string
          id: string
          is_featured: boolean | null
          notes: string | null
          profile_id: string
          updated_at: string | null
          verification_level: string | null
          verified_by: string[] | null
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          display_order?: number | null
          document_url?: string | null
          honor_tag_id: string
          id?: string
          is_featured?: boolean | null
          notes?: string | null
          profile_id: string
          updated_at?: string | null
          verification_level?: string | null
          verified_by?: string[] | null
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          display_order?: number | null
          document_url?: string | null
          honor_tag_id?: string
          id?: string
          is_featured?: boolean | null
          notes?: string | null
          profile_id?: string
          updated_at?: string | null
          verification_level?: string | null
          verified_by?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_honor_tags_honor_tag_id_fkey"
            columns: ["honor_tag_id"]
            isOneToOne: false
            referencedRelation: "honor_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_honor_tags_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "gt_v_person"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_honor_tags_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_honor_tags_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quick_invite_links: {
        Row: {
          code: string
          created_at: string | null
          created_by: string
          current_uses: number | null
          event_name: string | null
          expires_at: string
          id: string
          is_active: boolean | null
          max_uses: number | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by: string
          current_uses?: number | null
          event_name?: string | null
          expires_at: string
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string
          current_uses?: number | null
          event_name?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      quick_link_signups: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          claimed_relationship: string | null
          created_at: string | null
          created_profile_id: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          link_id: string
          phone: string | null
          rejection_reason: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          claimed_relationship?: string | null
          created_at?: string | null
          created_profile_id?: string | null
          email: string
          first_name: string
          id?: string
          last_name: string
          link_id: string
          phone?: string | null
          rejection_reason?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          claimed_relationship?: string | null
          created_at?: string | null
          created_profile_id?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          link_id?: string
          phone?: string | null
          rejection_reason?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quick_link_signups_created_profile_id_fkey"
            columns: ["created_profile_id"]
            isOneToOne: false
            referencedRelation: "gt_v_person"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quick_link_signups_created_profile_id_fkey"
            columns: ["created_profile_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quick_link_signups_created_profile_id_fkey"
            columns: ["created_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quick_link_signups_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "quick_invite_links"
            referencedColumns: ["id"]
          },
        ]
      }
      reactions: {
        Row: {
          created_at: string | null
          id: string
          profile_id: string
          reaction_type: Database["public"]["Enums"]["reaction_type"]
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          profile_id: string
          reaction_type: Database["public"]["Enums"]["reaction_type"]
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          profile_id?: string
          reaction_type?: Database["public"]["Enums"]["reaction_type"]
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "gt_v_person"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      relationship_types: {
        Row: {
          category: string
          code: string
          default_inverse_code: string | null
          default_inverse_type_id: number | null
          description: string | null
          id: number
          is_directed: boolean
          is_symmetric: boolean
        }
        Insert: {
          category: string
          code: string
          default_inverse_code?: string | null
          default_inverse_type_id?: number | null
          description?: string | null
          id?: number
          is_directed?: boolean
          is_symmetric?: boolean
        }
        Update: {
          category?: string
          code?: string
          default_inverse_code?: string | null
          default_inverse_type_id?: number | null
          description?: string | null
          id?: number
          is_directed?: boolean
          is_symmetric?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "relationship_types_default_inverse_type_id_fkey"
            columns: ["default_inverse_type_id"]
            isOneToOne: false
            referencedRelation: "relationship_types"
            referencedColumns: ["id"]
          },
        ]
      }
      relationship_verifications: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          relationship_id: string | null
          verification_type: string
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          relationship_id?: string | null
          verification_type: string
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          relationship_id?: string | null
          verification_type?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "relationship_verifications_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "relationships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationship_verifications_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "v_graph_edges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationship_verifications_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "v_immediate_family"
            referencedColumns: ["id"]
          },
        ]
      }
      relationships: {
        Row: {
          cousin_degree: number | null
          cousin_removed: number
          created_at: string | null
          created_by: string | null
          created_from_invitation_id: string | null
          divorce_date: string | null
          halfness: string | null
          id: string
          in_law: boolean
          is_ex: boolean
          lineage: string | null
          marriage_date: string | null
          marriage_place: string | null
          notes: string | null
          qualifiers: Json
          relationship_type: string
          source: Json
          type_id: number | null
          updated_at: string | null
          user1_id: string
          user2_id: string
          verification_status: string | null
          verified_by: string[] | null
        }
        Insert: {
          cousin_degree?: number | null
          cousin_removed?: number
          created_at?: string | null
          created_by?: string | null
          created_from_invitation_id?: string | null
          divorce_date?: string | null
          halfness?: string | null
          id?: string
          in_law?: boolean
          is_ex?: boolean
          lineage?: string | null
          marriage_date?: string | null
          marriage_place?: string | null
          notes?: string | null
          qualifiers?: Json
          relationship_type: string
          source?: Json
          type_id?: number | null
          updated_at?: string | null
          user1_id: string
          user2_id: string
          verification_status?: string | null
          verified_by?: string[] | null
        }
        Update: {
          cousin_degree?: number | null
          cousin_removed?: number
          created_at?: string | null
          created_by?: string | null
          created_from_invitation_id?: string | null
          divorce_date?: string | null
          halfness?: string | null
          id?: string
          in_law?: boolean
          is_ex?: boolean
          lineage?: string | null
          marriage_date?: string | null
          marriage_place?: string | null
          notes?: string | null
          qualifiers?: Json
          relationship_type?: string
          source?: Json
          type_id?: number | null
          updated_at?: string | null
          user1_id?: string
          user2_id?: string
          verification_status?: string | null
          verified_by?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "relationships_created_from_invitation_id_fkey"
            columns: ["created_from_invitation_id"]
            isOneToOne: false
            referencedRelation: "invitations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationships_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "relationship_types"
            referencedColumns: ["id"]
          },
        ]
      }
      residences: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          institution_name: string | null
          is_current: boolean | null
          position_title: string | null
          start_date: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          institution_name?: string | null
          is_current?: boolean | null
          position_title?: string | null
          start_date?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          institution_name?: string | null
          is_current?: boolean | null
          position_title?: string | null
          start_date?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      story_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          id: string
          mentioned_profile_ids: string[] | null
          parent_id: string | null
          story_id: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          mentioned_profile_ids?: string[] | null
          parent_id?: string | null
          story_id: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          mentioned_profile_ids?: string[] | null
          parent_id?: string | null
          story_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "gt_v_person"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "story_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      story_prompts: {
        Row: {
          category: string
          created_at: string | null
          id: string
          is_active: boolean | null
          max_age: number | null
          min_age: number | null
          prompt_text: string
          prompt_text_ru: string | null
          sort_order: number | null
          tags: string[] | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_age?: number | null
          min_age?: number | null
          prompt_text: string
          prompt_text_ru?: string | null
          sort_order?: number | null
          tags?: string[] | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_age?: number | null
          min_age?: number | null
          prompt_text?: string
          prompt_text_ru?: string | null
          sort_order?: number | null
          tags?: string[] | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      streak_history: {
        Row: {
          created_at: string | null
          ended_at: string
          id: string
          started_at: string
          streak_length: number
          streak_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          ended_at: string
          id?: string
          started_at: string
          streak_length: number
          streak_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          ended_at?: string
          id?: string
          started_at?: string
          streak_length?: number
          streak_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tribute_guestbook: {
        Row: {
          author_id: string
          created_at: string | null
          id: string
          is_approved: boolean | null
          message: string | null
          tribute_profile_id: string
          tribute_type: string
        }
        Insert: {
          author_id: string
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          message?: string | null
          tribute_profile_id: string
          tribute_type: string
        }
        Update: {
          author_id?: string
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          message?: string | null
          tribute_profile_id?: string
          tribute_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "tribute_guestbook_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "gt_v_person"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tribute_guestbook_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tribute_guestbook_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tribute_guestbook_tribute_profile_id_fkey"
            columns: ["tribute_profile_id"]
            isOneToOne: false
            referencedRelation: "gt_v_person"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tribute_guestbook_tribute_profile_id_fkey"
            columns: ["tribute_profile_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tribute_guestbook_tribute_profile_id_fkey"
            columns: ["tribute_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string | null
          id: string
          is_featured: boolean | null
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string | null
          id?: string
          is_featured?: boolean | null
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string | null
          id?: string
          is_featured?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birth_city: string | null
          birth_country: string | null
          birth_date: string | null
          birth_place: string | null
          created_at: string | null
          current_address: string | null
          current_avatar_id: string | null
          current_city: string | null
          current_country: string | null
          dashboard_preferences: Json | null
          death_date: string | null
          death_place: string | null
          email_preferences: Json | null
          first_name: string
          gender: string | null
          id: string
          is_living: boolean | null
          last_name: string
          last_seen_at: string | null
          life_motto: string | null
          life_motto_privacy: string | null
          maiden_name: string | null
          memorial_quote: string | null
          memorial_quote_added_at: string | null
          memorial_quote_author: string | null
          middle_name: string | null
          nickname: string | null
          occupation: string | null
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          onboarding_step: number | null
          personal_statement: string | null
          personal_statement_privacy: string | null
          phone: string | null
          preferred_locale: string | null
          privacy_settings: Json | null
          role: string | null
          show_online_status: boolean | null
          tribute_mode_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birth_city?: string | null
          birth_country?: string | null
          birth_date?: string | null
          birth_place?: string | null
          created_at?: string | null
          current_address?: string | null
          current_avatar_id?: string | null
          current_city?: string | null
          current_country?: string | null
          dashboard_preferences?: Json | null
          death_date?: string | null
          death_place?: string | null
          email_preferences?: Json | null
          first_name: string
          gender?: string | null
          id: string
          is_living?: boolean | null
          last_name: string
          last_seen_at?: string | null
          life_motto?: string | null
          life_motto_privacy?: string | null
          maiden_name?: string | null
          memorial_quote?: string | null
          memorial_quote_added_at?: string | null
          memorial_quote_author?: string | null
          middle_name?: string | null
          nickname?: string | null
          occupation?: string | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_step?: number | null
          personal_statement?: string | null
          personal_statement_privacy?: string | null
          phone?: string | null
          preferred_locale?: string | null
          privacy_settings?: Json | null
          role?: string | null
          show_online_status?: boolean | null
          tribute_mode_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birth_city?: string | null
          birth_country?: string | null
          birth_date?: string | null
          birth_place?: string | null
          created_at?: string | null
          current_address?: string | null
          current_avatar_id?: string | null
          current_city?: string | null
          current_country?: string | null
          dashboard_preferences?: Json | null
          death_date?: string | null
          death_place?: string | null
          email_preferences?: Json | null
          first_name?: string
          gender?: string | null
          id?: string
          is_living?: boolean | null
          last_name?: string
          last_seen_at?: string | null
          life_motto?: string | null
          life_motto_privacy?: string | null
          maiden_name?: string | null
          memorial_quote?: string | null
          memorial_quote_added_at?: string | null
          memorial_quote_author?: string | null
          middle_name?: string | null
          nickname?: string | null
          occupation?: string | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_step?: number | null
          personal_statement?: string | null
          personal_statement_privacy?: string | null
          phone?: string | null
          preferred_locale?: string | null
          privacy_settings?: Json | null
          role?: string | null
          show_online_status?: boolean | null
          tribute_mode_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_current_avatar_id_fkey"
            columns: ["current_avatar_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_prompt_history: {
        Row: {
          answered_at: string | null
          id: string
          prompt_id: string
          shown_at: string | null
          status: string | null
          story_id: string | null
          user_id: string
          week_number: number
          year: number
        }
        Insert: {
          answered_at?: string | null
          id?: string
          prompt_id: string
          shown_at?: string | null
          status?: string | null
          story_id?: string | null
          user_id: string
          week_number: number
          year: number
        }
        Update: {
          answered_at?: string | null
          id?: string
          prompt_id?: string
          shown_at?: string | null
          status?: string | null
          story_id?: string | null
          user_id?: string
          week_number?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_prompt_history_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "story_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_prompt_responses: {
        Row: {
          context_profile_id: string | null
          id: string
          prompt_id: string
          remind_after: string | null
          remind_later: boolean | null
          responded_at: string | null
          skipped: boolean | null
          story_id: string | null
          user_id: string
        }
        Insert: {
          context_profile_id?: string | null
          id?: string
          prompt_id: string
          remind_after?: string | null
          remind_later?: boolean | null
          responded_at?: string | null
          skipped?: boolean | null
          story_id?: string | null
          user_id: string
        }
        Update: {
          context_profile_id?: string | null
          id?: string
          prompt_id?: string
          remind_after?: string | null
          remind_later?: boolean | null
          responded_at?: string | null
          skipped?: boolean | null
          story_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_prompt_responses_context_profile_id_fkey"
            columns: ["context_profile_id"]
            isOneToOne: false
            referencedRelation: "gt_v_person"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_prompt_responses_context_profile_id_fkey"
            columns: ["context_profile_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_prompt_responses_context_profile_id_fkey"
            columns: ["context_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_prompt_responses_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "memory_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_streaks: {
        Row: {
          created_at: string | null
          current_streak: number | null
          last_activity_date: string | null
          longest_streak: number | null
          monthly_points: number | null
          points_last_reset_at: string | null
          streak_frozen_until: string | null
          streak_type: string | null
          total_points: number | null
          updated_at: string | null
          user_id: string
          weekly_points: number | null
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          last_activity_date?: string | null
          longest_streak?: number | null
          monthly_points?: number | null
          points_last_reset_at?: string | null
          streak_frozen_until?: string | null
          streak_type?: string | null
          total_points?: number | null
          updated_at?: string | null
          user_id: string
          weekly_points?: number | null
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          last_activity_date?: string | null
          longest_streak?: number | null
          monthly_points?: number | null
          points_last_reset_at?: string | null
          streak_frozen_until?: string | null
          streak_type?: string | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string
          weekly_points?: number | null
        }
        Relationships: []
      }
      voice_memories: {
        Row: {
          created_at: string
          description: string | null
          duration_seconds: number
          file_size_bytes: number | null
          id: string
          privacy_level: string
          profile_id: string | null
          storage_path: string
          title: string | null
          transcription: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_seconds: number
          file_size_bytes?: number | null
          id?: string
          privacy_level?: string
          profile_id?: string | null
          storage_path: string
          title?: string | null
          transcription?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_seconds?: number
          file_size_bytes?: number | null
          id?: string
          privacy_level?: string
          profile_id?: string | null
          storage_path?: string
          title?: string | null
          transcription?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_memories_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "gt_v_person"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_memories_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_memories_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_stories: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          bucket: string
          created_at: string | null
          created_by: string
          duration_seconds: number | null
          id: string
          narrator_profile_id: string
          path: string
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          size_bytes: number | null
          status: Database["public"]["Enums"]["media_status"]
          tags: string[] | null
          target_profile_id: string
          title: string | null
          transcript_confidence: number | null
          transcript_lang: string | null
          transcript_text: string | null
          visibility: Database["public"]["Enums"]["media_visibility"]
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          bucket?: string
          created_at?: string | null
          created_by: string
          duration_seconds?: number | null
          id?: string
          narrator_profile_id: string
          path: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          size_bytes?: number | null
          status?: Database["public"]["Enums"]["media_status"]
          tags?: string[] | null
          target_profile_id: string
          title?: string | null
          transcript_confidence?: number | null
          transcript_lang?: string | null
          transcript_text?: string | null
          visibility?: Database["public"]["Enums"]["media_visibility"]
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          bucket?: string
          created_at?: string | null
          created_by?: string
          duration_seconds?: number | null
          id?: string
          narrator_profile_id?: string
          path?: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          size_bytes?: number | null
          status?: Database["public"]["Enums"]["media_status"]
          tags?: string[] | null
          target_profile_id?: string
          title?: string | null
          transcript_confidence?: number | null
          transcript_lang?: string | null
          transcript_text?: string | null
          visibility?: Database["public"]["Enums"]["media_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "voice_stories_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "gt_v_person"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_stories_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_stories_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_stories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "gt_v_person"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_stories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_stories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_stories_narrator_profile_id_fkey"
            columns: ["narrator_profile_id"]
            isOneToOne: false
            referencedRelation: "gt_v_person"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_stories_narrator_profile_id_fkey"
            columns: ["narrator_profile_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_stories_narrator_profile_id_fkey"
            columns: ["narrator_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_stories_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "gt_v_person"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_stories_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_stories_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_stories_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "gt_v_person"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_stories_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_stories_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      gt_v_parent_child: {
        Row: {
          child_id: string | null
          is_pending: boolean | null
          is_temporary: boolean | null
          is_verified: boolean | null
          parent_id: string | null
        }
        Insert: {
          child_id?: string | null
          is_pending?: boolean | null
          is_temporary?: boolean | null
          is_verified?: boolean | null
          parent_id?: string | null
        }
        Update: {
          child_id?: string | null
          is_pending?: boolean | null
          is_temporary?: boolean | null
          is_verified?: boolean | null
          parent_id?: string | null
        }
        Relationships: []
      }
      gt_v_person: {
        Row: {
          birth_date: string | null
          death_date: string | null
          gender: string | null
          id: string | null
          is_alive: boolean | null
          name: string | null
          photo_url: string | null
        }
        Insert: {
          birth_date?: string | null
          death_date?: string | null
          gender?: string | null
          id?: string | null
          is_alive?: never
          name?: never
          photo_url?: string | null
        }
        Update: {
          birth_date?: string | null
          death_date?: string | null
          gender?: string | null
          id?: string | null
          is_alive?: never
          name?: never
          photo_url?: string | null
        }
        Relationships: []
      }
      gt_v_tree_stats: {
        Row: {
          total_children: number | null
          total_parents: number | null
          total_pending: number | null
          total_people: number | null
          total_temporary: number | null
          total_unions: number | null
          total_verified: number | null
        }
        Relationships: []
      }
      gt_v_union: {
        Row: {
          divorce_date: string | null
          is_pending: boolean | null
          is_temporary: boolean | null
          is_verified: boolean | null
          marriage_date: string | null
          person1_id: string | null
          person2_id: string | null
          role_p1: string | null
          role_p2: string | null
          union_id: string | null
        }
        Insert: {
          divorce_date?: string | null
          is_pending?: boolean | null
          is_temporary?: boolean | null
          is_verified?: boolean | null
          marriage_date?: string | null
          person1_id?: string | null
          person2_id?: string | null
          role_p1?: string | null
          role_p2?: string | null
          union_id?: never
        }
        Update: {
          divorce_date?: string | null
          is_pending?: boolean | null
          is_temporary?: boolean | null
          is_verified?: boolean | null
          marriage_date?: string | null
          person1_id?: string | null
          person2_id?: string | null
          role_p1?: string | null
          role_p2?: string | null
          union_id?: never
        }
        Relationships: []
      }
      gt_v_union_child: {
        Row: {
          child_id: string | null
          is_pending: boolean | null
          is_temporary: boolean | null
          is_verified: boolean | null
          union_id: string | null
        }
        Relationships: []
      }
      parent_child: {
        Row: {
          child_id: string | null
          parent_id: string | null
        }
        Insert: {
          child_id?: string | null
          parent_id?: string | null
        }
        Update: {
          child_id?: string | null
          parent_id?: string | null
        }
        Relationships: []
      }
      persons: {
        Row: {
          avatar_url: string | null
          first_name: string | null
          gender: string | null
          id: string | null
          last_name: string | null
          middle_name: string | null
          nickname: string | null
        }
        Insert: {
          avatar_url?: string | null
          first_name?: string | null
          gender?: never
          id?: string | null
          last_name?: string | null
          middle_name?: string | null
          nickname?: string | null
        }
        Update: {
          avatar_url?: string | null
          first_name?: string | null
          gender?: never
          id?: string | null
          last_name?: string | null
          middle_name?: string | null
          nickname?: string | null
        }
        Relationships: []
      }
      spouses: {
        Row: {
          a_id: string | null
          b_id: string | null
        }
        Relationships: []
      }
      v_graph_edges: {
        Row: {
          cousin_degree: number | null
          cousin_removed: number | null
          halfness: string | null
          id: string | null
          in_law: boolean | null
          is_ex: boolean | null
          is_symmetric: boolean | null
          lineage: string | null
          source: string | null
          target: string | null
          type_code: string | null
        }
        Relationships: []
      }
      v_immediate_family: {
        Row: {
          cousin_degree: number | null
          cousin_removed: number | null
          halfness: string | null
          id: string | null
          in_law: boolean | null
          is_ex: boolean | null
          label: string | null
          lineage: string | null
          person_id: string | null
          rel_code: string | null
          relative_id: string | null
        }
        Relationships: []
      }
      v_pending_relatives_with_labels: {
        Row: {
          accepted_at: string | null
          cousin_degree: number | null
          cousin_removed: number | null
          created_at: string | null
          email: string | null
          facebook_url: string | null
          first_name: string | null
          halfness: string | null
          id: string | null
          instagram_url: string | null
          invitation_token: string | null
          invited_at: string | null
          invited_by: string | null
          inviter_first_name: string | null
          inviter_last_name: string | null
          last_name: string | null
          level: number | null
          lineage: string | null
          phone: string | null
          related_person_first_name: string | null
          related_person_last_name: string | null
          related_to_relationship: string | null
          related_to_user_id: string | null
          relationship_description: string | null
          relationship_type: string | null
          status: string | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_bridge_request: {
        Args: {
          p_relationship_type: string
          p_request_id: string
          p_response_message?: string
        }
        Returns: Json
      }
      award_badge: {
        Args: { p_badge_id: string; p_user_id: string }
        Returns: boolean
      }
      can_upload_to_profile: {
        Args: { profile_id: string; user_id: string }
        Returns: boolean
      }
      check_all_badges_for_user: {
        Args: { p_user_id: string }
        Returns: number
      }
      check_and_award_badge: {
        Args: { p_badge_id: string; p_user_id: string }
        Returns: boolean
      }
      check_honor_tag_verification: {
        Args: { p_profile_honor_tag_id: string }
        Returns: undefined
      }
      current_user_is_admin: { Args: never; Returns: boolean }
      find_bridge_candidates: {
        Args: { p_user_id: string }
        Returns: {
          candidate_id: string
          match_reasons: Json
          match_score: number
        }[]
      }
      fn_add_relationship_by_code: {
        Args: {
          p_code: string
          p_created_by?: string
          p_qualifiers?: Json
          p_user1: string
          p_user2: string
        }
        Returns: string
      }
      fn_compute_layers: {
        Args: { p_down?: number; p_root: string; p_up?: number }
        Returns: {
          layer: number
          person_id: string
        }[]
      }
      fn_count_shared_relatives: {
        Args: { p_profile_a_id: string; p_profile_b_id: string }
        Returns: number
      }
      fn_find_deceased_duplicates: {
        Args: { p_min_confidence?: number }
        Returns: {
          confidence_score: number
          match_reasons: Json
          profile_a_id: string
          profile_b_id: string
          shared_relatives: number
        }[]
      }
      fn_find_potential_duplicates: {
        Args: { p_min_confidence?: number }
        Returns: {
          confidence_score: number
          match_reasons: Json
          profile_a_id: string
          profile_b_id: string
        }[]
      }
      fn_find_shared_ancestors: {
        Args: { p_max_depth?: number; p_user1: string; p_user2: string }
        Returns: {
          ancestor_id: string
          ancestor_name: string
          user1_depth: number
          user2_depth: number
        }[]
      }
      fn_get_ancestors: {
        Args: { p_max_depth?: number; p_person: string }
        Returns: {
          ancestor_id: string
          depth: number
          path: string[]
        }[]
      }
      fn_get_descendants: {
        Args: { p_max_depth?: number; p_person: string }
        Returns: {
          depth: number
          descendant_id: string
          path: string[]
        }[]
      }
      fn_get_potential_relatives: {
        Args: { p_limit?: number; p_max_depth?: number; p_user_id: string }
        Returns: {
          relationship_closeness: number
          relative_avatar_url: string
          relative_depth: number
          relative_name: string
          relative_user_id: string
          shared_ancestor_id: string
          shared_ancestor_name: string
          user_depth: number
        }[]
      }
      fn_refresh_ancestor_cache: {
        Args: { p_max_depth?: number; p_user_id: string }
        Returns: number
      }
      generate_invite_code: { Args: never; Returns: string }
      get_active_challenges: {
        Args: { p_user_id: string }
        Returns: {
          challenge_id: string
          challenge_type: string
          current_progress: number
          days_remaining: number
          description: string
          description_ru: string
          end_date: string
          is_completed: boolean
          is_joined: boolean
          participant_count: number
          reward_badge_id: string
          reward_points: number
          start_date: string
          target_value: number
          title: string
          title_ru: string
        }[]
      }
      get_ancestors_with_depth: {
        Args: { max_depth?: number; person_id: string }
        Returns: {
          birth_date: string
          death_date: string
          depth: number
          gender: string
          id: string
          is_alive: boolean
          name: string
          photo_url: string
        }[]
      }
      get_bridge_request_counts: { Args: { p_user_id: string }; Returns: Json }
      get_current_season: { Args: never; Returns: string }
      get_daily_memory_prompt: {
        Args: { p_context_profile_id?: string; p_user_id: string }
        Returns: {
          category: string
          is_new: boolean
          is_seasonal: boolean
          placeholder_type: string
          prompt_en: string
          prompt_id: string
          prompt_ru: string
          season: string
        }[]
      }
      get_descendants_with_depth: {
        Args: { max_depth?: number; person_id: string }
        Returns: {
          birth_date: string
          death_date: string
          depth: number
          gender: string
          id: string
          is_alive: boolean
          name: string
          photo_url: string
        }[]
      }
      get_family_circle_profile_ids: {
        Args: { p_user_id: string }
        Returns: {
          profile_id: string
        }[]
      }
      get_family_leaderboard: {
        Args: { p_limit?: number; p_period?: string; p_user_id: string }
        Returns: {
          avatar_url: string
          badge_count: number
          current_streak: number
          display_name: string
          points: number
          rank: number
          user_id: string
        }[]
      }
      get_memory_prompt_stats: {
        Args: { p_user_id: string }
        Returns: {
          answered_count: number
          by_category: Json
          pending_count: number
          skipped_count: number
          total_prompts: number
        }[]
      }
      get_memory_prompts_for_user: {
        Args: {
          p_category?: string
          p_include_answered?: boolean
          p_limit?: number
          p_offset?: number
          p_user_id: string
        }
        Returns: {
          category: string
          is_answered: boolean
          is_seasonal: boolean
          is_skipped: boolean
          placeholder_type: string
          prompt_en: string
          prompt_id: string
          prompt_ru: string
          responded_at: string
          season: string
          story_id: string
        }[]
      }
      get_or_create_message_thread: {
        Args: { user_a: string; user_b: string }
        Returns: string
      }
      get_profile_honor_tags: {
        Args: { p_profile_id: string }
        Returns: {
          added_at: string
          background_color: string
          category: string
          code: string
          color: string
          description: string
          description_ru: string
          display_order: number
          honor_tag_id: string
          icon: string
          id: string
          is_featured: boolean
          name: string
          name_ru: string
          verification_level: string
          verified_by: string[]
        }[]
      }
      get_prompts_for_age: {
        Args: { p_age: number; p_category?: string }
        Returns: {
          category: string
          created_at: string | null
          id: string
          is_active: boolean | null
          max_age: number | null
          min_age: number | null
          prompt_text: string
          prompt_text_ru: string | null
          sort_order: number | null
          tags: string[] | null
          updated_at: string | null
          usage_count: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "story_prompts"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_reverse_relationship_type: {
        Args: { rel_type: string }
        Returns: string
      }
      get_siblings: {
        Args: { person_id: string }
        Returns: {
          birth_date: string
          death_date: string
          gender: string
          id: string
          is_alive: boolean
          name: string
          photo_url: string
        }[]
      }
      get_spouses: {
        Args: { person_id: string }
        Returns: {
          birth_date: string
          death_date: string
          divorce_date: string
          gender: string
          id: string
          is_alive: boolean
          marriage_date: string
          name: string
          photo_url: string
        }[]
      }
      get_this_day_events: {
        Args: { p_day?: number; p_month?: number; p_user_id: string }
        Returns: {
          display_title: string
          event_day: number
          event_month: number
          event_type: string
          id: string
          profile_avatar_url: string
          profile_first_name: string
          profile_id: string
          profile_last_name: string
          related_profile_id: string
          years_ago: number
        }[]
      }
      get_user_badge_stats: {
        Args: { p_user_id: string }
        Returns: {
          by_category: Json
          total_available: number
          total_earned: number
        }[]
      }
      get_user_gamification_stats: {
        Args: { p_user_id: string }
        Returns: {
          active_challenges: number
          badges_earned: number
          challenges_completed: number
          current_streak: number
          longest_streak: number
          monthly_points: number
          rank_in_family: number
          total_family_members: number
          total_points: number
          weekly_points: number
        }[]
      }
      get_user_prompt_stats: {
        Args: { p_user_id: string }
        Returns: {
          by_category: Json
          current_week_answered: boolean
          total_answered: number
          total_available: number
          total_shown: number
          total_skipped: number
        }[]
      }
      get_weekly_prompt: {
        Args: { p_category?: string; p_user_id: string }
        Returns: {
          category: string
          is_new: boolean
          prompt_id: string
          prompt_text: string
          prompt_text_ru: string
          tags: string[]
        }[]
      }
      increment_prompt_usage: {
        Args: { p_prompt_id: string }
        Returns: undefined
      }
      increment_quick_link_usage: {
        Args: { link_code: string }
        Returns: boolean
      }
      is_admin: { Args: { user_id: string }; Returns: boolean }
      is_in_family_circle: {
        Args: { profile_id: string; user_id: string }
        Returns: boolean
      }
      is_profile_owner: {
        Args: { profile_id: string; user_id: string }
        Returns: boolean
      }
      kin_find_by_path: {
        Args: { path_expr: string; start_id: string }
        Returns: {
          person_id: string
        }[]
      }
      kin_parse_ru: { Args: { phrase: string }; Returns: string }
      kin_resolve_ru: {
        Args: { p_phrase: string; p_start: string }
        Returns: {
          name_ru: string
          path_expr: string
          person_id: string
        }[]
      }
      mark_prompt_answered: {
        Args: { p_prompt_id: string; p_story_id?: string; p_user_id: string }
        Returns: boolean
      }
      record_user_activity: {
        Args: {
          p_action_id?: string
          p_action_type: string
          p_description?: string
          p_user_id: string
        }
        Returns: {
          badges_earned: string[]
          new_streak: number
          points_earned: number
          streak_increased: boolean
        }[]
      }
      remind_later_memory_prompt: {
        Args: { p_days?: number; p_prompt_id: string; p_user_id: string }
        Returns: boolean
      }
      respond_to_memory_prompt: {
        Args: {
          p_context_profile_id?: string
          p_prompt_id: string
          p_story_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      skip_memory_prompt: {
        Args: { p_prompt_id: string; p_user_id: string }
        Returns: boolean
      }
      update_last_seen: { Args: never; Returns: undefined }
    }
    Enums: {
      certainty_level: "certain" | "approximate" | "unknown"
      date_precision: "day" | "month" | "year" | "unknown"
      education_status: "attended" | "graduated" | "current" | "dropped_out"
      education_type:
        | "school"
        | "college"
        | "university"
        | "vocational"
        | "graduate"
      elder_question_status: "pending" | "answered" | "declined"
      media_status: "pending" | "approved" | "rejected" | "archived"
      media_type:
        | "avatar"
        | "portrait"
        | "group"
        | "document"
        | "event"
        | "headstone"
        | "certificate"
        | "other"
      media_visibility: "public" | "family" | "private" | "unlisted"
      milestone_category:
        | "baby"
        | "education"
        | "career"
        | "relationship"
        | "life"
        | "custom"
      reaction_type: "heart" | "sad" | "hug" | "laugh" | "pray"
      visibility_level: "public" | "family" | "private"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      certainty_level: ["certain", "approximate", "unknown"],
      date_precision: ["day", "month", "year", "unknown"],
      education_status: ["attended", "graduated", "current", "dropped_out"],
      education_type: [
        "school",
        "college",
        "university",
        "vocational",
        "graduate",
      ],
      elder_question_status: ["pending", "answered", "declined"],
      media_status: ["pending", "approved", "rejected", "archived"],
      media_type: [
        "avatar",
        "portrait",
        "group",
        "document",
        "event",
        "headstone",
        "certificate",
        "other",
      ],
      media_visibility: ["public", "family", "private", "unlisted"],
      milestone_category: [
        "baby",
        "education",
        "career",
        "relationship",
        "life",
        "custom",
      ],
      reaction_type: ["heart", "sad", "hug", "laugh", "pray"],
      visibility_level: ["public", "family", "private"],
    },
  },
} as const
