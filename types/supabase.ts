export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      credits: {
        Row: {
          id: number;
          user_id: string;
          credits: number;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          user_id: string;
          credits: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          user_id?: string;
          credits?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "credits_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      payments: {
        Row: {
          id: number;
          user_id: string;
          amount: number;
          currency: string;
          status: string;
          payment_intent_id: string | null;
          stripe_session_id: string;
          credits_purchased: number;
          package_id: string;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          user_id: string;
          amount: number;
          currency: string;
          status: string;
          payment_intent_id?: string | null;
          stripe_session_id: string;
          credits_purchased: number;
          package_id: string;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          user_id?: string;
          amount?: number;
          currency?: string;
          status?: string;
          payment_intent_id?: string | null;
          stripe_session_id?: string;
          credits_purchased?: number;
          package_id?: string;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          id: string;
          credits: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          credits?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          credits?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      execute_sql: {
        Args: {
          sql: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
