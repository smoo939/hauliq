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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      bids: {
        Row: {
          amount: number
          created_at: string
          driver_id: string
          id: string
          load_id: string
          note: string | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          driver_id: string
          id?: string
          load_id: string
          note?: string | null
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          driver_id?: string
          id?: string
          load_id?: string
          note?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "bids_load_id_fkey"
            columns: ["load_id"]
            isOneToOne: false
            referencedRelation: "loads"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_subscriptions: {
        Row: {
          amount: number
          carrier_type: string | null
          contipay_transaction_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          phone_number: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          carrier_type?: string | null
          contipay_transaction_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          phone_number?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          carrier_type?: string | null
          contipay_transaction_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          phone_number?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      driver_verifications: {
        Row: {
          created_at: string
          id: string
          id_status: string
          license_expiry: string | null
          license_name: string | null
          license_number: string | null
          license_status: string
          license_url: string | null
          manual_review_notes: string | null
          manual_review_requested: boolean | null
          national_id_name: string | null
          national_id_number: string | null
          national_id_url: string | null
          overall_status: string
          rejection_reason: string | null
          selfie_match_score: number | null
          selfie_status: string
          selfie_url: string | null
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          id_status?: string
          license_expiry?: string | null
          license_name?: string | null
          license_number?: string | null
          license_status?: string
          license_url?: string | null
          manual_review_notes?: string | null
          manual_review_requested?: boolean | null
          national_id_name?: string | null
          national_id_number?: string | null
          national_id_url?: string | null
          overall_status?: string
          rejection_reason?: string | null
          selfie_match_score?: number | null
          selfie_status?: string
          selfie_url?: string | null
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          id_status?: string
          license_expiry?: string | null
          license_name?: string | null
          license_number?: string | null
          license_status?: string
          license_url?: string | null
          manual_review_notes?: string | null
          manual_review_requested?: boolean | null
          national_id_name?: string | null
          national_id_number?: string | null
          national_id_url?: string | null
          overall_status?: string
          rejection_reason?: string | null
          selfie_match_score?: number | null
          selfie_status?: string
          selfie_url?: string | null
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      loads: {
        Row: {
          accepted_at: string | null
          completed_at: string | null
          created_at: string
          delivery_location: string
          description: string | null
          driver_id: string | null
          equipment_type: string | null
          id: string
          load_type: string | null
          payment_method: string | null
          pickup_date: string | null
          pickup_location: string
          pickup_time: string | null
          platform_fee: number | null
          price: number | null
          shipper_id: string
          status: string
          title: string
          updated_at: string
          urgent: boolean | null
          weight_lbs: number | null
        }
        Insert: {
          accepted_at?: string | null
          completed_at?: string | null
          created_at?: string
          delivery_location: string
          description?: string | null
          driver_id?: string | null
          equipment_type?: string | null
          id?: string
          load_type?: string | null
          payment_method?: string | null
          pickup_date?: string | null
          pickup_location: string
          pickup_time?: string | null
          platform_fee?: number | null
          price?: number | null
          shipper_id: string
          status?: string
          title: string
          updated_at?: string
          urgent?: boolean | null
          weight_lbs?: number | null
        }
        Update: {
          accepted_at?: string | null
          completed_at?: string | null
          created_at?: string
          delivery_location?: string
          description?: string | null
          driver_id?: string | null
          equipment_type?: string | null
          id?: string
          load_type?: string | null
          payment_method?: string | null
          pickup_date?: string | null
          pickup_location?: string
          pickup_time?: string | null
          platform_fee?: number | null
          price?: number | null
          shipper_id?: string
          status?: string
          title?: string
          updated_at?: string
          urgent?: boolean | null
          weight_lbs?: number | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          load_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          load_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          load_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_load_id_fkey"
            columns: ["load_id"]
            isOneToOne: false
            referencedRelation: "loads"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          load_id: string | null
          read: boolean | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          load_id?: string | null
          read?: boolean | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          load_id?: string | null
          read?: boolean | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_load_id_fkey"
            columns: ["load_id"]
            isOneToOne: false
            referencedRelation: "loads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          role: string | null
          updated_at: string
          user_id: string
          verified: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string | null
          updated_at?: string
          user_id: string
          verified?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string | null
          updated_at?: string
          user_id?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          load_id: string
          rating: number
          reviewed_id: string
          reviewer_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          load_id: string
          rating: number
          reviewed_id: string
          reviewer_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          load_id?: string
          rating?: number
          reviewed_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_load_id_fkey"
            columns: ["load_id"]
            isOneToOne: false
            referencedRelation: "loads"
            referencedColumns: ["id"]
          },
        ]
      }
      truck_verifications: {
        Row: {
          created_at: string
          id: string
          insurance_expiry: string | null
          insurance_number: string | null
          insurance_status: string
          insurance_url: string | null
          manual_review_notes: string | null
          manual_review_requested: boolean | null
          overall_status: string
          photo_status: string
          plate_from_photo: string | null
          reg_status: string
          registration_expiry: string | null
          registration_number: string | null
          registration_url: string | null
          rejection_reason: string | null
          truck_label: string | null
          truck_photo_url: string | null
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          insurance_expiry?: string | null
          insurance_number?: string | null
          insurance_status?: string
          insurance_url?: string | null
          manual_review_notes?: string | null
          manual_review_requested?: boolean | null
          overall_status?: string
          photo_status?: string
          plate_from_photo?: string | null
          reg_status?: string
          registration_expiry?: string | null
          registration_number?: string | null
          registration_url?: string | null
          rejection_reason?: string | null
          truck_label?: string | null
          truck_photo_url?: string | null
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          insurance_expiry?: string | null
          insurance_number?: string | null
          insurance_status?: string
          insurance_url?: string | null
          manual_review_notes?: string | null
          manual_review_requested?: boolean | null
          overall_status?: string
          photo_status?: string
          plate_from_photo?: string | null
          reg_status?: string
          registration_expiry?: string | null
          registration_number?: string | null
          registration_url?: string | null
          rejection_reason?: string | null
          truck_label?: string | null
          truck_photo_url?: string | null
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "shipper" | "driver"
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
      app_role: ["admin", "moderator", "user", "shipper", "driver"],
    },
  },
} as const
