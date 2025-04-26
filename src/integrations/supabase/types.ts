export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      brand_sales: {
        Row: {
          brand: Database["public"]["Enums"]["tobacco_brand"]
          created_at: string | null
          id: string
          packs_per_week: number
          survey_id: string | null
          updated_at: string | null
        }
        Insert: {
          brand: Database["public"]["Enums"]["tobacco_brand"]
          created_at?: string | null
          id?: string
          packs_per_week: number
          survey_id?: string | null
          updated_at?: string | null
        }
        Update: {
          brand?: Database["public"]["Enums"]["tobacco_brand"]
          created_at?: string | null
          id?: string
          packs_per_week?: number
          survey_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_sales_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "cafe_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      cafe_surveys: {
        Row: {
          cafe_id: string | null
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          cafe_id?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          cafe_id?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cafe_surveys_cafe_id_fkey"
            columns: ["cafe_id"]
            isOneToOne: false
            referencedRelation: "cafes"
            referencedColumns: ["id"]
          },
        ]
      }
      cafes: {
        Row: {
          city: string
          created_at: string | null
          created_by: string
          governorate: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          number_of_hookahs: number
          number_of_tables: number
          owner_name: string
          owner_number: string
          photo_url: string | null
          status: string
        }
        Insert: {
          city: string
          created_at?: string | null
          created_by: string
          governorate: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          number_of_hookahs?: number
          number_of_tables?: number
          owner_name: string
          owner_number: string
          photo_url?: string | null
          status?: string
        }
        Update: {
          city?: string
          created_at?: string | null
          created_by?: string
          governorate?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          number_of_hookahs?: number
          number_of_tables?: number
          owner_name?: string
          owner_number?: string
          photo_url?: string | null
          status?: string
        }
        Relationships: []
      }
      kpi_settings: {
        Row: {
          basic_salary_percentage: number
          bonus_large_cafe: number
          bonus_medium_cafe: number
          bonus_small_cafe: number
          contract_threshold_percentage: number
          created_at: string | null
          id: string
          target_contracts_large: number
          target_contracts_medium: number
          target_contracts_small: number
          target_visits_large: number
          target_visits_medium: number
          target_visits_small: number
          total_package: number
          updated_at: string | null
          visit_kpi_percentage: number
          visit_threshold_percentage: number
        }
        Insert: {
          basic_salary_percentage?: number
          bonus_large_cafe?: number
          bonus_medium_cafe?: number
          bonus_small_cafe?: number
          contract_threshold_percentage?: number
          created_at?: string | null
          id?: string
          target_contracts_large?: number
          target_contracts_medium?: number
          target_contracts_small?: number
          target_visits_large?: number
          target_visits_medium?: number
          target_visits_small?: number
          total_package?: number
          updated_at?: string | null
          visit_kpi_percentage?: number
          visit_threshold_percentage?: number
        }
        Update: {
          basic_salary_percentage?: number
          bonus_large_cafe?: number
          bonus_medium_cafe?: number
          bonus_small_cafe?: number
          contract_threshold_percentage?: number
          created_at?: string | null
          id?: string
          target_contracts_large?: number
          target_contracts_medium?: number
          target_contracts_small?: number
          target_visits_large?: number
          target_visits_medium?: number
          target_visits_small?: number
          total_package?: number
          updated_at?: string | null
          visit_kpi_percentage?: number
          visit_threshold_percentage?: number
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          password: string | null
          role: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          name: string
          password?: string | null
          role: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          password?: string | null
          role?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      tobacco_brand: "Al Fakher" | "Adalya" | "Fumari" | "Star Buzz"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      tobacco_brand: ["Al Fakher", "Adalya", "Fumari", "Star Buzz"],
    },
  },
} as const
