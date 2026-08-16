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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      bets: {
        Row: {
          amount: number
          auto_cashout: number | null
          cashout_multiplier: number | null
          created_at: string
          id: string
          payout: number | null
          result: string
          round_id: string
          slot: number
          user_id: string
        }
        Insert: {
          amount: number
          auto_cashout?: number | null
          cashout_multiplier?: number | null
          created_at?: string
          id?: string
          payout?: number | null
          result?: string
          round_id: string
          slot?: number
          user_id: string
        }
        Update: {
          amount?: number
          auto_cashout?: number | null
          cashout_multiplier?: number | null
          created_at?: string
          id?: string
          payout?: number | null
          result?: string
          round_id?: string
          slot?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bets_profile_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bets_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_profile_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_config: {
        Row: {
          id: number
          secret: string
        }
        Insert: {
          id?: number
          secret: string
        }
        Update: {
          id?: number
          secret?: string
        }
        Relationships: []
      }
      operator_sessions: {
        Row: {
          consumed_at: string | null
          created_at: string
          currency: string
          expires_at: string
          id: string
          operator_id: string
          player_id: string
          player_name: string | null
          token_hash: string
          user_id: string | null
        }
        Insert: {
          consumed_at?: string | null
          created_at?: string
          currency?: string
          expires_at: string
          id?: string
          operator_id: string
          player_id: string
          player_name?: string | null
          token_hash: string
          user_id?: string | null
        }
        Update: {
          consumed_at?: string | null
          created_at?: string
          currency?: string
          expires_at?: string
          id?: string
          operator_id?: string
          player_id?: string
          player_name?: string | null
          token_hash?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operator_sessions_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
        ]
      }
      operators: {
        Row: {
          active: boolean
          allowed_origins: string[]
          api_secret: string
          created_at: string
          currency: string
          id: string
          name: string
          slug: string
          wallet_url: string
        }
        Insert: {
          active?: boolean
          allowed_origins?: string[]
          api_secret: string
          created_at?: string
          currency?: string
          id?: string
          name: string
          slug: string
          wallet_url: string
        }
        Update: {
          active?: boolean
          allowed_origins?: string[]
          api_secret?: string
          created_at?: string
          currency?: string
          id?: string
          name?: string
          slug?: string
          wallet_url?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_seed: string
          balance: number
          created_at: string
          external_player_id: string | null
          id: string
          operator_id: string | null
          username: string
        }
        Insert: {
          avatar_seed?: string
          balance?: number
          created_at?: string
          external_player_id?: string | null
          id: string
          operator_id?: string | null
          username: string
        }
        Update: {
          avatar_seed?: string
          balance?: number
          created_at?: string
          external_player_id?: string | null
          id?: string
          operator_id?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
        ]
      }
      rounds: {
        Row: {
          betting_starts_at: string
          crash_at: string
          crash_point: number
          created_at: string
          ends_at: string
          flight_starts_at: string
          id: string
          round_number: number
          seed_hash: string
          server_seed: string
          settled: boolean
        }
        Insert: {
          betting_starts_at: string
          crash_at: string
          crash_point: number
          created_at?: string
          ends_at: string
          flight_starts_at: string
          id?: string
          round_number: number
          seed_hash: string
          server_seed: string
          settled?: boolean
        }
        Update: {
          betting_starts_at?: string
          crash_at?: string
          crash_point?: number
          created_at?: string
          ends_at?: string
          flight_starts_at?: string
          id?: string
          round_number?: number
          seed_hash?: string
          server_seed?: string
          settled?: boolean
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      wallet_transfers: {
        Row: {
          amount: number
          created_at: string
          error: string | null
          external_ref: string | null
          id: string
          kind: string
          operator_id: string
          player_id: string
          status: string
          transaction_id: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          error?: string | null
          external_ref?: string | null
          id?: string
          kind: string
          operator_id: string
          player_id: string
          status?: string
          transaction_id: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          error?: string | null
          external_ref?: string | null
          id?: string
          kind?: string
          operator_id?: string
          player_id?: string
          status?: string
          transaction_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transfers_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancel_bet: { Args: { p_bet_id: string }; Returns: boolean }
      cash_out: {
        Args: { p_bet_id: string }
        Returns: {
          amount: number
          auto_cashout: number | null
          cashout_multiplier: number | null
          created_at: string
          id: string
          payout: number | null
          result: string
          round_id: string
          slot: number
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "bets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      crash_from_seed: { Args: { p_seed: string }; Returns: number }
      ensure_profile: {
        Args: never
        Returns: {
          avatar_seed: string
          balance: number
          created_at: string
          external_player_id: string | null
          id: string
          operator_id: string | null
          username: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      ensure_rounds: { Args: never; Returns: undefined }
      game_feed: {
        Args: never
        Returns: {
          betting_starts_at: string
          crash_at: string
          crash_point: number
          ends_at: string
          flight_starts_at: string
          id: string
          round_number: number
          seed_hash: string
          server_seed: string
          settled: boolean
        }[]
      }
      place_bet: {
        Args: {
          p_amount: number
          p_auto_cashout: number
          p_round_id: string
          p_slot: number
        }
        Returns: {
          amount: number
          auto_cashout: number | null
          cashout_multiplier: number | null
          created_at: string
          id: string
          payout: number | null
          result: string
          round_id: string
          slot: number
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "bets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      server_now: { Args: never; Returns: string }
      settle_rounds: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
