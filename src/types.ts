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
      chart: {
        Row: {
          charter: string | null
          const_cn: number | null
          const_hdd: number | null
          const_jp: number | null
          diff: number
          id: number
          music_id: number
        }
        Insert: {
          charter?: string | null
          const_cn?: number | null
          const_hdd?: number | null
          const_jp?: number | null
          diff: number
          id?: number
          music_id: number
        }
        Update: {
          charter?: string | null
          const_cn?: number | null
          const_hdd?: number | null
          const_jp?: number | null
          diff?: number
          id?: number
          music_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "chart_music_id_fkey"
            columns: ["music_id"]
            referencedRelation: "music"
            referencedColumns: ["id"]
          }
        ]
      }
      music: {
        Row: {
          artist: string
          available_cn: boolean
          available_hdd: boolean
          available_jp: boolean
          bpm: number
          genre: string
          id: number
          title: string
        }
        Insert: {
          artist: string
          available_cn?: boolean
          available_hdd?: boolean
          available_jp?: boolean
          bpm?: number
          genre: string
          id: number
          title: string
        }
        Update: {
          artist?: string
          available_cn?: boolean
          available_hdd?: boolean
          available_jp?: boolean
          bpm?: number
          genre?: string
          id?: number
          title?: string
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
