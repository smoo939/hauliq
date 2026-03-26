export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type AppDatabase = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string | null
          phone: string | null
          role: string | null
          avatar_url: string | null
          verified: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name?: string | null
          phone?: string | null
          role?: string | null
          avatar_url?: string | null
          verified?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string | null
          phone?: string | null
          role?: string | null
          avatar_url?: string | null
          verified?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: string
        }
        Insert: {
          id?: string
          user_id: string
          role: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: string
        }
        Relationships: []
      }
      loads: {
        Row: {
          id: string
          shipper_id: string
          driver_id: string | null
          title: string
          description: string | null
          pickup_location: string
          delivery_location: string
          pickup_date: string | null
          price: number
          platform_fee: number | null
          weight_lbs: number | null
          equipment_type: string | null
          load_type: string | null
          payment_method: string | null
          status: string
          tracking_code: string | null
          accepted_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          shipper_id: string
          driver_id?: string | null
          title: string
          description?: string | null
          pickup_location: string
          delivery_location: string
          pickup_date?: string | null
          price: number
          platform_fee?: number | null
          weight_lbs?: number | null
          equipment_type?: string | null
          load_type?: string | null
          payment_method?: string | null
          status?: string
          tracking_code?: string | null
          accepted_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shipper_id?: string
          driver_id?: string | null
          title?: string
          description?: string | null
          pickup_location?: string
          delivery_location?: string
          pickup_date?: string | null
          price?: number
          platform_fee?: number | null
          weight_lbs?: number | null
          equipment_type?: string | null
          load_type?: string | null
          payment_method?: string | null
          status?: string
          tracking_code?: string | null
          accepted_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      bids: {
        Row: {
          id: string
          load_id: string
          driver_id: string
          amount: number
          message: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          load_id: string
          driver_id: string
          amount: number
          message?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          load_id?: string
          driver_id?: string
          amount?: number
          message?: string | null
          status?: string
          created_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          load_id: string
          sender_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          load_id: string
          sender_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          load_id?: string
          sender_id?: string
          content?: string
          created_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          id: string
          load_id: string
          reviewer_id: string
          reviewed_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          load_id: string
          reviewer_id: string
          reviewed_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          load_id?: string
          reviewer_id?: string
          reviewed_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          read: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          read?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          read?: boolean | null
          created_at?: string
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
          _user_id: string
          _role: string
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
