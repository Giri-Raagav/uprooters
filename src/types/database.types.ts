/**
 * UPROOTERS Database Types
 *
 * NOTE: This is a placeholder file reserved for types generated directly from
 * Supabase migrations via the Supabase CLI (e.g. `supabase gen types typescript`).
 *
 * Per Milestone 01 rules, database schema types must NOT be fabricated manually.
 * Authoritative types will be generated after the SQL migration sequence (001-010)
 * is executed.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
