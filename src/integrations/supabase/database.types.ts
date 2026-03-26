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
          body: string | null
          type: string | null
          load_id: string | null
          read: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          body?: string | null
          type?: string | null
          load_id?: string | null
          read?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          body?: string | null
          type?: string | null
          load_id?: string | null
          read?: boolean | null
          created_at?: string
        }
        Relationships: []
      }
      driver_verifications: {
        Row: {
          id: string; user_id: string
          license_url: string | null; license_number: string | null; license_expiry: string | null; license_name: string | null
          national_id_url: string | null; national_id_number: string | null; national_id_name: string | null
          selfie_url: string | null; selfie_match_score: number | null
          license_status: string; id_status: string; selfie_status: string; overall_status: string
          rejection_reason: string | null; verified_at: string | null
          created_at: string; updated_at: string
        }
        Insert: {
          user_id: string; id?: string
          license_url?: string | null; license_number?: string | null; license_expiry?: string | null; license_name?: string | null
          national_id_url?: string | null; national_id_number?: string | null; national_id_name?: string | null
          selfie_url?: string | null; selfie_match_score?: number | null
          license_status?: string; id_status?: string; selfie_status?: string; overall_status?: string
          rejection_reason?: string | null; verified_at?: string | null
          created_at?: string; updated_at?: string
        }
        Update: {
          id?: string; user_id?: string
          license_url?: string | null; license_number?: string | null; license_expiry?: string | null; license_name?: string | null
          national_id_url?: string | null; national_id_number?: string | null; national_id_name?: string | null
          selfie_url?: string | null; selfie_match_score?: number | null
          license_status?: string; id_status?: string; selfie_status?: string; overall_status?: string
          rejection_reason?: string | null; verified_at?: string | null
          created_at?: string; updated_at?: string
        }
        Relationships: []
      }
      truck_verifications: {
        Row: {
          id: string; user_id: string; truck_label: string | null
          registration_url: string | null; registration_number: string | null; registration_expiry: string | null
          insurance_url: string | null; insurance_number: string | null; insurance_expiry: string | null
          truck_photo_url: string | null; plate_from_photo: string | null
          reg_status: string; insurance_status: string; photo_status: string; overall_status: string
          rejection_reason: string | null; verified_at: string | null
          created_at: string; updated_at: string
        }
        Insert: {
          user_id: string; id?: string; truck_label?: string | null
          registration_url?: string | null; registration_number?: string | null; registration_expiry?: string | null
          insurance_url?: string | null; insurance_number?: string | null; insurance_expiry?: string | null
          truck_photo_url?: string | null; plate_from_photo?: string | null
          reg_status?: string; insurance_status?: string; photo_status?: string; overall_status?: string
          rejection_reason?: string | null; verified_at?: string | null
          created_at?: string; updated_at?: string
        }
        Update: {
          id?: string; user_id?: string; truck_label?: string | null
          registration_url?: string | null; registration_number?: string | null; registration_expiry?: string | null
          insurance_url?: string | null; insurance_number?: string | null; insurance_expiry?: string | null
          truck_photo_url?: string | null; plate_from_photo?: string | null
          reg_status?: string; insurance_status?: string; photo_status?: string; overall_status?: string
          rejection_reason?: string | null; verified_at?: string | null
          created_at?: string; updated_at?: string
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
