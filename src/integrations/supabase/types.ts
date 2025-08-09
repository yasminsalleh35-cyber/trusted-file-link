export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          address: string | null
          client_admin_id: string | null
          company_name: string
          contact_email: string
          contact_phone: string | null
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          client_admin_id?: string | null
          company_name: string
          contact_email: string
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          client_admin_id?: string | null
          company_name?: string
          contact_email?: string
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_clients_admin"
            columns: ["client_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_clients_admin"
            columns: ["client_admin_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      file_assignments: {
        Row: {
          assigned_by: string
          assigned_to_client: string | null
          created_at: string | null
          file_id: string
          id: string
        }
        Insert: {
          assigned_by: string
          assigned_to_client?: string | null
          created_at?: string | null
          file_id: string
          id?: string
        }
        Update: {
          assigned_by?: string
          assigned_to_client?: string | null
          created_at?: string | null
          file_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_assignments_assigned_to_client_fkey"
            columns: ["assigned_to_client"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_assignments_assigned_to_user_fkey"
            columns: ["assigned_to_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_assignments_assigned_to_user_fkey"
            columns: ["assigned_to_user"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_assignments_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "file_assignments_detailed"
            referencedColumns: ["file_id"]
          },
          {
            foreignKeyName: "file_assignments_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          created_at: string | null
          description: string | null
          file_size: number
          file_type: string
          filename: string
          id: string
          original_filename: string
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          file_size: number
          file_type: string
          filename: string
          id?: string
          original_filename: string
          storage_path: string
          uploaded_by: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          file_size?: number
          file_type?: string
          filename?: string
          id?: string
          original_filename?: string
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          message_type: Database["public"]["Enums"]["message_type"]
          read_at: string | null
          recipient_id: string
          sender_id: string
          subject: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          message_type: Database["public"]["Enums"]["message_type"]
          read_at?: string | null
          recipient_id: string
          sender_id: string
          subject?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          message_type?: Database["public"]["Enums"]["message_type"]
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      news: {
        Row: {
          content: string
          created_at: string | null
          created_by: string
          id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by: string
          id?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string
          id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      news_assignments: {
        Row: {
          assigned_by: string
          assigned_to_client: string | null
          assigned_to_user: string | null
          created_at: string | null
          id: string
          news_id: string
        }
        Insert: {
          assigned_by: string
          assigned_to_client?: string | null
          assigned_to_user?: string | null
          created_at?: string | null
          id?: string
          news_id: string
        }
        Update: {
          assigned_by?: string
          assigned_to_client?: string | null
          assigned_to_user?: string | null
          created_at?: string | null
          id?: string
          news_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_assignments_assigned_to_client_fkey"
            columns: ["assigned_to_client"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_assignments_assigned_to_user_fkey"
            columns: ["assigned_to_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_assignments_assigned_to_user_fkey"
            columns: ["assigned_to_user"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_assignments_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_assignments_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news_assignments_detailed"
            referencedColumns: ["news_id"]
          },
        ]
      }
      profiles: {
        Row: {
          client_id: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      file_assignments_detailed: {
        Row: {
          assigned_at: string | null
          assigned_by_name: string | null
          assigned_to_client: string | null
          assigned_to_user: string | null
          assignment_id: string | null
          client_name: string | null
          description: string | null
          file_id: string | null
          file_size: number | null
          file_type: string | null
          filename: string | null
          original_filename: string | null
          user_email: string | null
          user_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "file_assignments_assigned_to_client_fkey"
            columns: ["assigned_to_client"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_assignments_assigned_to_user_fkey"
            columns: ["assigned_to_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_assignments_assigned_to_user_fkey"
            columns: ["assigned_to_user"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      news_assignments_detailed: {
        Row: {
          assigned_at: string | null
          assigned_by_name: string | null
          assigned_to_client: string | null
          assigned_to_user: string | null
          assignment_id: string | null
          client_name: string | null
          content: string | null
          news_created_at: string | null
          news_id: string | null
          title: string | null
          user_email: string | null
          user_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_assignments_assigned_to_client_fkey"
            columns: ["assigned_to_client"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_assignments_assigned_to_user_fkey"
            columns: ["assigned_to_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_assignments_assigned_to_user_fkey"
            columns: ["assigned_to_user"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles_with_clients: {
        Row: {
          client_email: string | null
          client_id: string | null
          company_name: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      message_type:
        | "admin_to_client"
        | "admin_to_user"
        | "client_to_user"
        | "user_to_admin"
      user_role: "admin" | "client" | "user"
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
  public: {
    Enums: {
      message_type: [
        "admin_to_client",
        "admin_to_user",
        "client_to_user",
        "user_to_admin",
      ],
      user_role: ["admin", "client", "user"],
    },
  },
} as const
