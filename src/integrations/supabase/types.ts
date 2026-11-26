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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      ai_usage: {
        Row: {
          amount: number
          created_at: string
          id: string
          kind: string
          period: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          kind: string
          period?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          kind?: string
          period?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string
          id: string
          metadata: Json
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_user_id?: string | null
        }
        Relationships: []
      }
      entitlements: {
        Row: {
          created_at: string
          expires_at: string | null
          feature: string
          granted_by: string | null
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          feature: string
          granted_by?: string | null
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          feature?: string
          granted_by?: string | null
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entitlements_feature_fkey"
            columns: ["feature"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
        ]
      }
      family_links: {
        Row: {
          created_at: string
          id: string
          parent_id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          parent_id: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          parent_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_links_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_links_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          created_at: string
          enabled: boolean
          feature: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          feature: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          feature?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_feature_fkey"
            columns: ["feature"]
            isOneToOne: true
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
        ]
      }
      features: {
        Row: {
          created_at: string
          description: string
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          id: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      flashcards: {
        Row: {
          back: string
          created_at: string
          due_on: string
          ease: number
          front: string
          id: string
          interval_days: number
          reviews: number
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          back: string
          created_at?: string
          due_on?: string
          ease?: number
          front: string
          id?: string
          interval_days?: number
          reviews?: number
          topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          back?: string
          created_at?: string
          due_on?: string
          ease?: number
          front?: string
          id?: string
          interval_days?: number
          reviews?: number
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lesson_sessions: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          lesson: Json
          messages: Json
          notes: string
          quiz_answer: number | null
          slide_index: number
          subject: string
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          lesson?: Json
          messages?: Json
          notes?: string
          quiz_answer?: number | null
          slide_index?: number
          subject?: string
          topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          lesson?: Json
          messages?: Json
          notes?: string
          quiz_answer?: number | null
          slide_index?: number
          subject?: string
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mock_tests: {
        Row: {
          accuracy: number
          analysis: Json
          created_at: string
          exam: string
          id: string
          predicted_percentile: number | null
          rank_high: number | null
          rank_low: number | null
          score: number
          topic: string
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          accuracy?: number
          analysis?: Json
          created_at?: string
          exam: string
          id?: string
          predicted_percentile?: number | null
          rank_high?: number | null
          rank_low?: number | null
          score?: number
          topic: string
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          accuracy?: number
          analysis?: Json
          created_at?: string
          exam?: string
          id?: string
          predicted_percentile?: number | null
          rank_high?: number | null
          rank_low?: number | null
          score?: number
          topic?: string
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          content: string
          created_at: string
          id: string
          kind: string
          title: string
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          kind?: string
          title: string
          topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          kind?: string
          title?: string
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      org_members: {
        Row: {
          created_at: string
          id: string
          member_id: string
          member_role: string
          org_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_id: string
          member_role?: string
          org_id: string
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string
          member_role?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          description: string
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          id: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      point_ledger: {
        Row: {
          created_at: string
          id: string
          kind: string
          note: string
          points: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          note?: string
          points: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          note?: string
          points?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "point_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          board: string | null
          created_at: string
          daily_hours: number
          display_name: string | null
          exam_date: string | null
          exam_goal: string | null
          explanation_style: string | null
          grade: string | null
          id: string
          language: string
          last_active_on: string | null
          learning_goal: string | null
          learning_style: string | null
          level: number
          onboarded: boolean
          streak_days: number
          strong_subjects: string[]
          subjects: string[]
          target_exams: string[]
          updated_at: string
          weak_subjects: string[]
          xp: number
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          board?: string | null
          created_at?: string
          daily_hours?: number
          display_name?: string | null
          exam_date?: string | null
          exam_goal?: string | null
          explanation_style?: string | null
          grade?: string | null
          id: string
          language?: string
          last_active_on?: string | null
          learning_goal?: string | null
          learning_style?: string | null
          level?: number
          onboarded?: boolean
          streak_days?: number
          strong_subjects?: string[]
          subjects?: string[]
          target_exams?: string[]
          updated_at?: string
          weak_subjects?: string[]
          xp?: number
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          board?: string | null
          created_at?: string
          daily_hours?: number
          display_name?: string | null
          exam_date?: string | null
          exam_goal?: string | null
          explanation_style?: string | null
          grade?: string | null
          id?: string
          language?: string
          last_active_on?: string | null
          learning_goal?: string | null
          learning_style?: string | null
          level?: number
          onboarded?: boolean
          streak_days?: number
          strong_subjects?: string[]
          subjects?: string[]
          target_exams?: string[]
          updated_at?: string
          weak_subjects?: string[]
          xp?: number
        }
        Relationships: []
      }
      redemptions: {
        Row: {
          created_at: string
          id: string
          points_spent: number
          reward_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points_spent: number
          reward_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points_spent?: number
          reward_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          cost: number
          created_at: string
          description: string
          id: string
          name: string
          status: string
        }
        Insert: {
          cost: number
          created_at?: string
          description?: string
          id: string
          name: string
          status?: string
        }
        Update: {
          cost?: number
          created_at?: string
          description?: string
          id?: string
          name?: string
          status?: string
        }
        Relationships: []
      }
      study_plans: {
        Row: {
          created_at: string
          id: string
          plan: Json
          rationale: string | null
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          plan?: Json
          rationale?: string | null
          updated_at?: string
          user_id: string
          week_start?: string
        }
        Update: {
          created_at?: string
          id?: string
          plan?: Json
          rationale?: string | null
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          granted_by: string | null
          id: string
          note: string | null
          plan: string
          reason: string | null
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          note?: string | null
          plan: string
          reason?: string | null
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          note?: string | null
          plan?: string
          reason?: string | null
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_fkey"
            columns: ["plan"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_assignments: {
        Row: {
          created_at: string
          id: string
          org_id: string
          student_id: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          student_id: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          student_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_assignments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      twin_memory: {
        Row: {
          confidence: number | null
          created_at: string
          id: string
          kind: string
          note: string
          topic: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          id?: string
          kind: string
          note: string
          topic?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          id?: string
          kind?: string
          note?: string
          topic?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_premium: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin"
        | "content_admin"
        | "support_admin"
        | "teacher"
        | "parent"
        | "org_admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "admin",
        "content_admin",
        "support_admin",
        "teacher",
        "parent",
        "org_admin",
      ],
    },
  },
} as const
