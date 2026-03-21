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
      admin_action_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string
          details: Json | null
          id: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      banner_views: {
        Row: {
          banner_id: string
          created_at: string
          id: string
          user_id: string | null
        }
        Insert: {
          banner_id: string
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Update: {
          banner_id?: string
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "banner_views_banner_id_fkey"
            columns: ["banner_id"]
            isOneToOne: false
            referencedRelation: "banners"
            referencedColumns: ["id"]
          },
        ]
      }
      banners: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          image_url: string
          is_active: boolean
          link_url: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          link_url?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          link_url?: string | null
        }
        Relationships: []
      }
      brands: {
        Row: {
          brand_description: string | null
          brand_logo_url: string | null
          brand_name: string
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          status: string | null
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          brand_description?: string | null
          brand_logo_url?: string | null
          brand_name: string
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          brand_description?: string | null
          brand_logo_url?: string | null
          brand_name?: string
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      course_documents: {
        Row: {
          course_name: string | null
          created_at: string
          file_type: string | null
          file_url: string
          id: string
          title: string
          tribe: string | null
          user_id: string
        }
        Insert: {
          course_name?: string | null
          created_at?: string
          file_type?: string | null
          file_url: string
          id?: string
          title: string
          tribe?: string | null
          user_id: string
        }
        Update: {
          course_name?: string | null
          created_at?: string
          file_type?: string | null
          file_url?: string
          id?: string
          title?: string
          tribe?: string | null
          user_id?: string
        }
        Relationships: []
      }
      entity_follows: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean
          message: string | null
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          message?: string | null
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          message?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      points_history: {
        Row: {
          created_at: string
          id: string
          points: number
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points: number
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points?: number
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "following_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "hot_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "following_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "hot_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reports: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "following_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "hot_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_views: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
          viewer_tribe: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
          viewer_tribe?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
          viewer_tribe?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "following_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "hot_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          comments_locked: boolean | null
          content: string
          created_at: string
          fire_count: number
          id: string
          is_hidden: boolean
          is_pinned: boolean
          media_type: string | null
          media_url: string | null
          post_tag: string | null
          reach_limited: boolean | null
          report_count: number
          target_tribe: string | null
          updated_at: string
          user_id: string
          view_count: number
          visibility: string
        }
        Insert: {
          comments_locked?: boolean | null
          content: string
          created_at?: string
          fire_count?: number
          id?: string
          is_hidden?: boolean
          is_pinned?: boolean
          media_type?: string | null
          media_url?: string | null
          post_tag?: string | null
          reach_limited?: boolean | null
          report_count?: number
          target_tribe?: string | null
          updated_at?: string
          user_id: string
          view_count?: number
          visibility?: string
        }
        Update: {
          comments_locked?: boolean | null
          content?: string
          created_at?: string
          fire_count?: number
          id?: string
          is_hidden?: boolean
          is_pinned?: boolean
          media_type?: string | null
          media_url?: string | null
          post_tag?: string | null
          reach_limited?: boolean | null
          report_count?: number
          target_tribe?: string | null
          updated_at?: string
          user_id?: string
          view_count?: number
          visibility?: string
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          category_id: string
          id: string
          product_id: string
        }
        Insert: {
          category_id: string
          id?: string
          product_id: string
        }
        Update: {
          category_id?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_clicks: {
        Row: {
          click_type: string | null
          created_at: string
          id: string
          product_id: string
          user_id: string | null
          viewer_tribe: string | null
        }
        Insert: {
          click_type?: string | null
          created_at?: string
          id?: string
          product_id: string
          user_id?: string | null
          viewer_tribe?: string | null
        }
        Update: {
          click_type?: string | null
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string | null
          viewer_tribe?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_clicks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_views: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string | null
          viewer_tribe: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id?: string | null
          viewer_tribe?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string | null
          viewer_tribe?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_views_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand_id: string | null
          buy_link: string | null
          categories: string[] | null
          created_at: string
          description: string | null
          discount_code: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_sold_out: boolean
          is_special_offer: boolean
          price: number
          status: string
          target_tribe: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_id?: string | null
          buy_link?: string | null
          categories?: string[] | null
          created_at?: string
          description?: string | null
          discount_code?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_sold_out?: boolean
          is_special_offer?: boolean
          price?: number
          status?: string
          target_tribe?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_id?: string | null
          buy_link?: string | null
          categories?: string[] | null
          created_at?: string
          description?: string | null
          discount_code?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_sold_out?: boolean
          is_special_offer?: boolean
          price?: number
          status?: string
          target_tribe?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          academic_level: string | null
          avatar_url: string | null
          bio: string | null
          brand_description: string | null
          brand_logo_url: string | null
          brand_name: string | null
          created_at: string
          id: string
          is_verified: boolean
          nickname: string
          points: number
          role: string | null
          social_links: Json | null
          student_id_url: string | null
          tribe: string | null
          tribe_id: string | null
          tribe_type: string | null
          updated_at: string
          user_id: string
          verification_code: string | null
          website_url: string | null
          whatsapp_number: string | null
        }
        Insert: {
          academic_level?: string | null
          avatar_url?: string | null
          bio?: string | null
          brand_description?: string | null
          brand_logo_url?: string | null
          brand_name?: string | null
          created_at?: string
          id?: string
          is_verified?: boolean
          nickname: string
          points?: number
          role?: string | null
          social_links?: Json | null
          student_id_url?: string | null
          tribe?: string | null
          tribe_id?: string | null
          tribe_type?: string | null
          updated_at?: string
          user_id: string
          verification_code?: string | null
          website_url?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          academic_level?: string | null
          avatar_url?: string | null
          bio?: string | null
          brand_description?: string | null
          brand_logo_url?: string | null
          brand_name?: string | null
          created_at?: string
          id?: string
          is_verified?: boolean
          nickname?: string
          points?: number
          role?: string | null
          social_links?: Json | null
          student_id_url?: string | null
          tribe?: string | null
          tribe_id?: string | null
          tribe_type?: string | null
          updated_at?: string
          user_id?: string
          verification_code?: string | null
          website_url?: string | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tribe_id_fkey"
            columns: ["tribe_id"]
            isOneToOne: false
            referencedRelation: "active_tribes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_tribe_id_fkey"
            columns: ["tribe_id"]
            isOneToOne: false
            referencedRelation: "trending_tribes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_tribe_id_fkey"
            columns: ["tribe_id"]
            isOneToOne: false
            referencedRelation: "tribes"
            referencedColumns: ["id"]
          },
        ]
      }
      promoted_posts: {
        Row: {
          content: string
          created_at: string
          id: string
          is_active: boolean
          target_link: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          target_link?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          target_link?: string | null
          user_id?: string
        }
        Relationships: []
      }
      room_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          room_id: string
          status: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          room_id: string
          status?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          room_id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_lifecycle_stats"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          last_activity_at: string | null
          post_id: string | null
          title: string
          tribe: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          last_activity_at?: string | null
          post_id?: string | null
          title: string
          tribe?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          last_activity_at?: string | null
          post_id?: string | null
          title?: string
          tribe?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "following_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "hot_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          link_url: string | null
          media_type: string
          media_url: string
          text_overlay: string | null
          tribe: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          link_url?: string | null
          media_type?: string
          media_url: string
          text_overlay?: string | null
          tribe?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          link_url?: string | null
          media_type?: string
          media_url?: string
          text_overlay?: string | null
          tribe?: string | null
          user_id?: string
        }
        Relationships: []
      }
      student_shops: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          shop_name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          shop_name: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          shop_name?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tribes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_visible: boolean
          logo_url: string | null
          member_count: number
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_visible?: boolean
          logo_url?: string | null
          member_count?: number
          name: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_visible?: boolean
          logo_url?: string | null
          member_count?: number
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          tribe: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tribe?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tribe?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      active_tribes: {
        Row: {
          description: string | null
          id: string | null
          is_visible: boolean | null
          logo_url: string | null
          member_count: number | null
          name: string | null
          type: string | null
        }
        Relationships: []
      }
      following_feed: {
        Row: {
          content: string | null
          created_at: string | null
          fire_count: number | null
          follower_user: string | null
          id: string | null
          is_hidden: boolean | null
          media_type: string | null
          media_url: string | null
          report_count: number | null
          target_tribe: string | null
          user_id: string | null
          visibility: string | null
        }
        Relationships: []
      }
      hot_posts: {
        Row: {
          content: string | null
          created_at: string | null
          fire_count: number | null
          hot_score: number | null
          id: string | null
          tribe_id: string | null
          user_id: string | null
          view_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tribe_id_fkey"
            columns: ["tribe_id"]
            isOneToOne: false
            referencedRelation: "active_tribes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_tribe_id_fkey"
            columns: ["tribe_id"]
            isOneToOne: false
            referencedRelation: "trending_tribes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_tribe_id_fkey"
            columns: ["tribe_id"]
            isOneToOne: false
            referencedRelation: "tribes"
            referencedColumns: ["id"]
          },
        ]
      }
      room_lifecycle_stats: {
        Row: {
          created_at: string | null
          is_active: boolean | null
          last_activity_at: string | null
          message_count: number | null
          room_id: string | null
          title: string | null
          tribe: string | null
        }
        Relationships: []
      }
      trending_tribes: {
        Row: {
          id: string | null
          name: string | null
          post_count: number | null
          type: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      award_points: {
        Args: { _points: number; _reason: string; _user_id: string }
        Returns: undefined
      }
      get_room_message_counts: {
        Args: { room_ids: string[] }
        Returns: {
          message_count: number
          room_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      is_verified: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "user" | "tribe_admin" | "super_admin" | "vip_brand"
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
      app_role: ["user", "tribe_admin", "super_admin", "vip_brand"],
    },
  },
} as const
