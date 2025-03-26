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
      credit_usage: {
        Row: {
          amount: number;
          created_at: string | null;
          description: string | null;
          headshot_job_id: string | null;
          id: string;
          payment_id: string | null;
          team_lead_id: string | null;
          type: string | null;
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string | null;
          description?: string | null;
          headshot_job_id?: string | null;
          id?: string;
          payment_id?: string | null;
          team_lead_id?: string | null;
          type?: string | null;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string | null;
          description?: string | null;
          headshot_job_id?: string | null;
          id?: string;
          payment_id?: string | null;
          team_lead_id?: string | null;
          type?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "credit_usage_headshot_job_id_fkey";
            columns: ["headshot_job_id"];
            referencedRelation: "headshot_jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "credit_usage_payment_id_fkey";
            columns: ["payment_id"];
            referencedRelation: "payments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "credit_usage_team_lead_id_fkey";
            columns: ["team_lead_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "credit_usage_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      headshot_jobs: {
        Row: {
          astria_generation_id: string;
          background: string;
          created_at: string | null;
          id: string;
          input_image_url: string;
          outfit: string;
          output_image_urls: string[] | null;
          status: string;
          team_lead_id: string | null;
          user_id: string;
          completed_at: string | null;
          error_message: string | null;
        };
        Insert: {
          astria_generation_id: string;
          background: string;
          created_at?: string | null;
          id?: string;
          input_image_url: string;
          outfit: string;
          output_image_urls?: string[] | null;
          status?: string;
          team_lead_id?: string | null;
          user_id: string;
          completed_at?: string | null;
          error_message?: string | null;
        };
        Update: {
          astria_generation_id?: string;
          background?: string;
          created_at?: string | null;
          id?: string;
          input_image_url?: string;
          outfit?: string;
          output_image_urls?: string[] | null;
          status?: string;
          team_lead_id?: string | null;
          user_id?: string;
          completed_at?: string | null;
          error_message?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "headshot_jobs_team_lead_id_fkey";
            columns: ["team_lead_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "headshot_jobs_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      invitations: {
        Row: {
          accepted_at: string | null;
          created_at: string | null;
          email: string;
          expires_at: string | null;
          id: string;
          team_lead_id: string;
          token: string;
        };
        Insert: {
          accepted_at?: string | null;
          created_at?: string | null;
          email: string;
          expires_at: string | null;
          id?: string;
          team_lead_id: string;
          token: string;
        };
        Update: {
          accepted_at?: string | null;
          created_at?: string | null;
          email?: string;
          expires_at?: string | null;
          id?: string;
          team_lead_id?: string;
          token?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invitations_team_lead_id_fkey";
            columns: ["team_lead_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      payments: {
        Row: {
          amount: number;
          created_at: string | null;
          credits_purchased: number;
          currency: string;
          id: string;
          metadata: Json | null;
          package_id: string;
          payment_intent_id: string | null;
          status: string;
          stripe_session_id: string | null;
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string | null;
          credits_purchased: number;
          currency?: string;
          id?: string;
          metadata?: Json | null;
          package_id: string;
          payment_intent_id?: string | null;
          status?: string;
          stripe_session_id?: string | null;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string | null;
          credits_purchased?: number;
          currency?: string;
          id?: string;
          metadata?: Json | null;
          package_id?: string;
          payment_intent_id?: string | null;
          status?: string;
          stripe_session_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          credits: number | null;
          full_name: string | null;
          id: string;
          updated_at: string | null;
          username: string | null;
          website: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          credits?: number | null;
          full_name?: string | null;
          id: string;
          updated_at?: string | null;
          username?: string | null;
          website?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          credits?: number | null;
          full_name?: string | null;
          id?: string;
          updated_at?: string | null;
          username?: string | null;
          website?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      team_members: {
        Row: {
          created_at: string | null;
          id: string;
          member_id: string;
          team_lead_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          member_id: string;
          team_lead_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          member_id?: string;
          team_lead_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_members_member_id_fkey";
            columns: ["member_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_members_team_lead_id_fkey";
            columns: ["team_lead_id"];
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
      accept_invitation: {
        Args: {
          p_token: string;
          p_member_id: string;
          p_accepted_at: string;
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
