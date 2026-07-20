export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      departments: {
        Row: {
          id: string
          name: string
          code: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          created_at?: string
        }
        Relationships: []
      }
      staff: {
        Row: {
          id: string
          staff_id: string
          full_name: string
          email: string
          phone: string | null
          department_id: string | null
          role: string
          avatar_url: string | null
          is_active: boolean
          telegram_chat_id: string | null
          notification_preferences: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          staff_id: string
          full_name: string
          email: string
          phone?: string | null
          department_id?: string | null
          role?: string
          avatar_url?: string | null
          is_active?: boolean
          telegram_chat_id?: string | null
          notification_preferences?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          staff_id?: string
          full_name?: string
          email?: string
          phone?: string | null
          department_id?: string | null
          role?: string
          avatar_url?: string | null
          is_active?: boolean
          telegram_chat_id?: string | null
          notification_preferences?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          }
        ]
      }
      staff_attendance: {
        Row: {
          id: string
          staff_id: string
          date: string
          check_in: string | null
          check_out: string | null
          status: string
          check_in_method: string
          notes: string | null
          overridden_by: string | null
          override_reason: string | null
          overridden_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          staff_id: string
          date?: string
          check_in?: string | null
          check_out?: string | null
          status?: string
          check_in_method?: string
          notes?: string | null
          overridden_by?: string | null
          override_reason?: string | null
          overridden_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          staff_id?: string
          date?: string
          check_in?: string | null
          check_out?: string | null
          status?: string
          check_in_method?: string
          notes?: string | null
          overridden_by?: string | null
          override_reason?: string | null
          overridden_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_attendance_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_attendance_overridden_by_fkey"
            columns: ["overridden_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          }
        ]
      }
      classes: {
        Row: {
          id: string
          name: string
          arm: string
          class_teacher_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          arm?: string
          class_teacher_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          arm?: string
          class_teacher_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_class_teacher_id_fkey"
            columns: ["class_teacher_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          }
        ]
      }
      students: {
        Row: {
          id: string
          student_id: string
          full_name: string
          class_id: string
          parent_name: string | null
          parent_phone: string | null
          parent_email: string | null
          parent_whatsapp: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          full_name: string
          class_id: string
          parent_name?: string | null
          parent_phone?: string | null
          parent_email?: string | null
          parent_whatsapp?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          full_name?: string
          class_id?: string
          parent_name?: string | null
          parent_phone?: string | null
          parent_email?: string | null
          parent_whatsapp?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          }
        ]
      }
      student_attendance: {
        Row: {
          id: string
          student_id: string
          date: string
          check_in: string | null
          check_out: string | null
          status: string
          check_in_method: string
          period: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          date?: string
          check_in?: string | null
          check_out?: string | null
          status?: string
          check_in_method?: string
          period?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          date?: string
          check_in?: string | null
          check_out?: string | null
          status?: string
          check_in_method?: string
          period?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          }
        ]
      }
      student_activity_reports: {
        Row: {
          id: string
          staff_id: string
          class_id: string
          date: string
          activities_done: string
          challenges: string | null
          notes: string | null
          submitted_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          staff_id: string
          class_id: string
          date?: string
          activities_done: string
          challenges?: string | null
          notes?: string | null
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          staff_id?: string
          class_id?: string
          date?: string
          activities_done?: string
          challenges?: string | null
          notes?: string | null
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_activity_reports_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_activity_reports_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          }
        ]
      }
      duty_types: {
        Row: {
          id: string
          name: string
          description: string | null
          color: string
          icon: string
          sort_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          color?: string
          icon?: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          color?: string
          icon?: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      duty_rosters: {
        Row: {
          id: string
          staff_id: string
          duty_type_id: string
          date: string
          status: string
          notes: string | null
          completed_by: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          staff_id: string
          duty_type_id: string
          date: string
          status?: string
          notes?: string | null
          completed_by?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          staff_id?: string
          duty_type_id?: string
          date?: string
          status?: string
          notes?: string | null
          completed_by?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "duty_rosters_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duty_rosters_duty_type_id_fkey"
            columns: ["duty_type_id"]
            isOneToOne: false
            referencedRelation: "duty_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duty_rosters_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          }
        ]
      }
      daily_reports: {
        Row: {
          id: string
          staff_id: string
          date: string
          activities_done: string
          challenges: string | null
          notes: string | null
          submitted_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          staff_id: string
          date?: string
          activities_done: string
          challenges?: string | null
          notes?: string | null
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          staff_id?: string
          date?: string
          activities_done?: string
          challenges?: string | null
          notes?: string | null
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_reports_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          }
        ]
      }
      report_summaries: {
        Row: {
          id: string
          date: string
          summary: string
          ai_insights: Json
          generated_at: string
        }
        Insert: {
          id?: string
          date: string
          summary: string
          ai_insights?: Json
          generated_at?: string
        }
        Update: {
          id?: string
          date?: string
          summary?: string
          ai_insights?: Json
          generated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          id: string
          cutoff_hour: number
          cutoff_minute: number
          closing_hour: number
          closing_minute: number
          school_name: string
          enable_whatsapp_notifications: boolean
          enable_qr_checkin: boolean
          telegram_bot_token: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cutoff_hour?: number
          cutoff_minute?: number
          closing_hour?: number
          closing_minute?: number
          school_name?: string
          enable_whatsapp_notifications?: boolean
          enable_qr_checkin?: boolean
          telegram_bot_token?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cutoff_hour?: number
          cutoff_minute?: number
          closing_hour?: number
          closing_minute?: number
          school_name?: string
          enable_whatsapp_notifications?: boolean
          enable_qr_checkin?: boolean
          telegram_bot_token?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      parade_sessions: {
        Row: {
          id: string
          date: string
          start_time: string | null
          end_time: string | null
          conducted_by: string | null
          type: string
          status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          date?: string
          start_time?: string | null
          end_time?: string | null
          conducted_by?: string | null
          type?: string
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          date?: string
          start_time?: string | null
          end_time?: string | null
          conducted_by?: string | null
          type?: string
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parade_sessions_conducted_by_fkey"
            columns: ["conducted_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          }
        ]
      }
      parade_briefings: {
        Row: {
          id: string
          parade_id: string
          title: string
          content: string
          priority: string
          category: string
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          parade_id: string
          title: string
          content: string
          priority?: string
          category?: string
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          parade_id?: string
          title?: string
          content?: string
          priority?: string
          category?: string
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parade_briefings_parade_id_fkey"
            columns: ["parade_id"]
            isOneToOne: false
            referencedRelation: "parade_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parade_briefings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          }
        ]
      }
      parade_tasks: {
        Row: {
          id: string
          parade_id: string
          briefing_id: string | null
          assigned_to: string | null
          description: string
          priority: string
          deadline: string | null
          status: string
          completed_by: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          parade_id: string
          briefing_id?: string | null
          assigned_to?: string | null
          description: string
          priority?: string
          deadline?: string | null
          status?: string
          completed_by?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          parade_id?: string
          briefing_id?: string | null
          assigned_to?: string | null
          description?: string
          priority?: string
          deadline?: string | null
          status?: string
          completed_by?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parade_tasks_parade_id_fkey"
            columns: ["parade_id"]
            isOneToOne: false
            referencedRelation: "parade_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parade_tasks_briefing_id_fkey"
            columns: ["briefing_id"]
            isOneToOne: false
            referencedRelation: "parade_briefings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parade_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parade_tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          }
        ]
      }
      parade_acknowledgements: {
        Row: {
          id: string
          parade_id: string
          staff_id: string
          acknowledged_at: string
        }
        Insert: {
          id?: string
          parade_id: string
          staff_id: string
          acknowledged_at?: string
        }
        Update: {
          id?: string
          parade_id?: string
          staff_id?: string
          acknowledged_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parade_acknowledgements_parade_id_fkey"
            columns: ["parade_id"]
            isOneToOne: false
            referencedRelation: "parade_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parade_acknowledgements_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          }
        ]
      }
      notification_logs: {
        Row: {
          id: string
          recipient_id: string | null
          recipient_phone: string | null
          recipient_name: string | null
          channel: string
          message_type: string
          message_body: string
          status: string
          provider_response: Json | null
          sent_at: string | null
          is_read: boolean | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          recipient_id?: string | null
          recipient_phone?: string | null
          recipient_name?: string | null
          channel: string
          message_type: string
          message_body: string
          status?: string
          provider_response?: Json | null
          sent_at?: string | null
          is_read?: boolean | null
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          recipient_id?: string | null
          recipient_phone?: string | null
          recipient_name?: string | null
          channel?: string
          message_type?: string
          message_body?: string
          status?: string
          provider_response?: Json | null
          sent_at?: string | null
          is_read?: boolean | null
          read_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          }
        ]
      }
      academic_sessions: {
        Row: {
          id: string
          name: string
          start_date: string
          end_date: string
          is_current: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          start_date: string
          end_date: string
          is_current?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          start_date?: string
          end_date?: string
          is_current?: boolean
          created_at?: string
        }
        Relationships: []
      }
      academic_terms: {
        Row: {
          id: string
          session_id: string
          name: string
          start_date: string
          end_date: string
          is_current: boolean
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          name: string
          start_date: string
          end_date: string
          is_current?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          name?: string
          start_date?: string
          end_date?: string
          is_current?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_terms_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      subjects: {
        Row: {
          id: string
          name: string
          code: string
          department_id: string | null
          class_level: string | null
          periods_per_week: number
          is_compulsory: boolean
          is_active: boolean
          difficulty_tier: number
          needs_double_period: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          department_id?: string | null
          class_level?: string | null
          periods_per_week?: number
          is_compulsory?: boolean
          is_active?: boolean
          difficulty_tier?: number
          needs_double_period?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          department_id?: string | null
          class_level?: string | null
          periods_per_week?: number
          is_compulsory?: boolean
          is_active?: boolean
          difficulty_tier?: number
          needs_double_period?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          }
        ]
      }
      teacher_subjects: {
        Row: {
          id: string
          teacher_id: string
          subject_id: string
          is_primary: boolean
          max_periods_per_day: number
          created_at: string
        }
        Insert: {
          id?: string
          teacher_id: string
          subject_id: string
          is_primary?: boolean
          max_periods_per_day?: number
          created_at?: string
        }
        Update: {
          id?: string
          teacher_id?: string
          subject_id?: string
          is_primary?: boolean
          max_periods_per_day?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          }
        ]
      }
      time_slots: {
        Row: {
          id: string
          day_of_week: number
          period_number: number
          start_time: string
          end_time: string
          is_break: boolean
          is_assembly: boolean
          period_label: string | null
          created_at: string
        }
        Insert: {
          id?: string
          day_of_week: number
          period_number: number
          start_time: string
          end_time: string
          is_break?: boolean
          is_assembly?: boolean
          period_label?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          day_of_week?: number
          period_number?: number
          start_time?: string
          end_time?: string
          is_break?: boolean
          is_assembly?: boolean
          period_label?: string | null
          created_at?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          id: string
          name: string
          capacity: number
          room_type: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          capacity?: number
          room_type?: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          capacity?: number
          room_type?: string
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      timetable_entries: {
        Row: {
          id: string
          term_id: string
          class_id: string
          subject_id: string
          teacher_id: string
          day_of_week: number
          period_number: number
          room_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          term_id: string
          class_id: string
          subject_id: string
          teacher_id: string
          day_of_week: number
          period_number: number
          room_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          term_id?: string
          class_id?: string
          subject_id?: string
          teacher_id?: string
          day_of_week?: number
          period_number?: number
          room_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "timetable_entries_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "academic_terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_entries_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_entries_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_entries_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_entries_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          }
        ]
      }
      timetable_generations: {
        Row: {
          id: string
          term_id: string
          status: string
          algorithm_used: string
          total_periods: number
          assigned_periods: number
          conflict_count: number
          conflicts: Json | null
          generated_by: string | null
          generated_at: string
          published_at: string | null
        }
        Insert: {
          id?: string
          term_id: string
          status?: string
          algorithm_used?: string
          total_periods?: number
          assigned_periods?: number
          conflict_count?: number
          conflicts?: Json | null
          generated_by?: string | null
          generated_at?: string
          published_at?: string | null
        }
        Update: {
          id?: string
          term_id?: string
          status?: string
          algorithm_used?: string
          total_periods?: number
          assigned_periods?: number
          conflict_count?: number
          conflicts?: Json | null
          generated_by?: string | null
          generated_at?: string
          published_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timetable_generations_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "academic_terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_generations_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          }
        ]
      }
      class_subjects: {
        Row: {
          id: string
          class_id: string
          subject_id: string
          periods_per_week: number | null
          created_at: string
        }
        Insert: {
          id?: string
          class_id: string
          subject_id: string
          periods_per_week?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          class_id?: string
          subject_id?: string
          periods_per_week?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_subjects_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          }
        ]
      }
      audit_logs: {
        Row: {
          id: string
          staff_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          changes: Json | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          staff_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          changes?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          staff_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string | null
          changes?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          }
        ]
      }
      notification_queue: {
        Row: {
          id: string
          recipient_id: string | null
          recipient_phone: string | null
          recipient_name: string | null
          channel: string
          message_type: string
          message_body: string
          status: string
          retry_count: number
          max_retries: number
          last_error: string | null
          next_attempt_at: string | null
          created_at: string
          sent_at: string | null
        }
        Insert: {
          id?: string
          recipient_id?: string | null
          recipient_phone?: string | null
          recipient_name?: string | null
          channel: string
          message_type: string
          message_body: string
          status?: string
          retry_count?: number
          max_retries?: number
          last_error?: string | null
          next_attempt_at?: string | null
          created_at?: string
          sent_at?: string | null
        }
        Update: {
          id?: string
          recipient_id?: string | null
          recipient_phone?: string | null
          recipient_name?: string | null
          channel?: string
          message_type?: string
          message_body?: string
          status?: string
          retry_count?: number
          max_retries?: number
          last_error?: string | null
          next_attempt_at?: string | null
          created_at?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_queue_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          }
        ]
      }
      notification_rules: {
        Row: {
          id: string
          key: string
          label: string
          description: string | null
          channel: string
          is_active: boolean
          cron_schedule: string | null
          config: Json
          last_run_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          key: string
          label: string
          description?: string | null
          channel?: string
          is_active?: boolean
          cron_schedule?: string | null
          config?: Json
          last_run_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          key?: string
          label?: string
          description?: string | null
          channel?: string
          is_active?: boolean
          cron_schedule?: string | null
          config?: Json
          last_run_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      scheduled_broadcasts: {
        Row: {
          id: string
          title: string | null
          content: string
          target_roles: string[] | null
          scheduled_for: string
          status: string
          created_by: string | null
          sent_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title?: string | null
          content: string
          target_roles?: string[] | null
          scheduled_for: string
          status?: string
          created_by?: string | null
          sent_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string | null
          content?: string
          target_roles?: string[] | null
          scheduled_for?: string
          status?: string
          created_by?: string | null
          sent_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_broadcasts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          }
        ]
      }
      system_prompts: {
        Row: {
          id: string
          key: string
          category: string
          label: string
          description: string | null
          prompt_text: string
          default_text: string | null
          is_active: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          key: string
          category?: string
          label: string
          description?: string | null
          prompt_text: string
          default_text?: string | null
          is_active?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          key?: string
          category?: string
          label?: string
          description?: string | null
          prompt_text?: string
          default_text?: string | null
          is_active?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_prompts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          }
        ]
      }
      broadcast_messages: {
        Row: {
          id: string
          title: string | null
          content: string
          priority: string
          target_roles: string[] | null
          status: string
          created_by: string | null
          created_at: string
          published_at: string | null
        }
        Insert: {
          id?: string
          title?: string | null
          content: string
          priority?: string
          target_roles?: string[] | null
          status?: string
          created_by?: string | null
          created_at?: string
          published_at?: string | null
        }
        Update: {
          id?: string
          title?: string | null
          content?: string
          priority?: string
          target_roles?: string[] | null
          status?: string
          created_by?: string | null
          created_at?: string
          published_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_messages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          }
        ]
      }
      task_templates: {
        Row: {
          id: string
          title: string
          description: string | null
          default_priority: string
          default_deadline_days: number
          auto_assign_duty_type_id: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          default_priority?: string
          default_deadline_days?: number
          auto_assign_duty_type_id?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          default_priority?: string
          default_deadline_days?: number
          auto_assign_duty_type_id?: string | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_templates_auto_assign_duty_type_id_fkey"
            columns: ["auto_assign_duty_type_id"]
            isOneToOne: false
            referencedRelation: "duty_types"
            referencedColumns: ["id"]
          }
        ]
      }
      task_responses: {
        Row: {
          id: string
          task_id: string
          staff_id: string
          response_type: string
          message: string | null
          telegram_message_id: number | null
          responded_at: string
        }
        Insert: {
          id?: string
          task_id: string
          staff_id: string
          response_type: string
          message?: string | null
          telegram_message_id?: number | null
          responded_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          staff_id?: string
          response_type?: string
          message?: string | null
          telegram_message_id?: number | null
          responded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_responses_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "parade_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_responses_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          }
        ]
      }
      telegram_task_messages: {
        Row: {
          id: string
          telegram_message_id: number
          task_id: string
          chat_id: string
          created_at: string
        }
        Insert: {
          id?: string
          telegram_message_id: number
          task_id: string
          chat_id: string
          created_at?: string
        }
        Update: {
          id?: string
          telegram_message_id?: number
          task_id?: string
          chat_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "telegram_task_messages_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "parade_tasks"
            referencedColumns: ["id"]
          }
        ]
      }
      rate_limits: {
        Row: {
          key_hash: string
          attempts: number
          window_start: string
          expires_at: string
        }
        Insert: {
          key_hash: string
          attempts?: number
          window_start?: string
          expires_at?: string
        }
        Update: {
          key_hash?: string
          attempts?: number
          window_start?: string
          expires_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Legacy type exports for client components
export interface Staff {
  id: string
  staff_id: string
  full_name: string
  email: string
  phone: string | null
  department_id: string | null
  role: string
  avatar_url: string | null
  is_active: boolean
  telegram_chat_id: string | null
  created_at: string
  updated_at: string
  notification_preferences: Json | null
  department?: { id: string; name: string }
}

export interface StaffAttendance {
  id: string
  staff_id: string
  date: string
  check_in: string | null
  check_out: string | null
  status: string
  check_in_method: string
  notes: string | null
  created_at: string
  updated_at: string
  staff?: Staff
}

export type AttendanceStatus = 'present' | 'late' | 'absent'

export interface DailyReport {
  date: string
  total_staff: number
  present: number
  late: number
  absent: number
  department_breakdown: DepartmentReport[]
}

export interface DepartmentReport {
  department: string
  total: number
  present: number
  late: number
  absent: number
}

export interface Class {
  id: string
  name: string
  arm: string
  class_teacher_id: string | null
  created_at: string
}

export interface Student {
  id: string
  student_id: string
  full_name: string
  class_id: string
  parent_name: string | null
  parent_phone: string | null
  parent_email: string | null
  parent_whatsapp: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  class?: Class
}

export interface StudentAttendance {
  id: string
  student_id: string
  date: string
  check_in: string | null
  check_out: string | null
  status: string
  check_in_method: string
  period: string
  notes: string | null
  created_at: string
  updated_at: string
  student?: Student
}

export interface DutyType {
  id: string
  name: string
  description: string | null
  color: string
  icon: string
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface DutyRoster {
  id: string
  staff_id: string
  duty_type_id: string
  date: string
  status: string
  notes: string | null
  completed_by: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  staff?: Staff
  duty_type?: DutyType
}

export interface DailyReportEntry {
  id: string
  staff_id: string
  date: string
  activities_done: string
  challenges: string | null
  notes: string | null
  submitted_at: string
  updated_at: string
  staff?: Staff
}

export interface ReportSummary {
  id: string
  date: string
  summary: string
  ai_insights: Json
  generated_at: string
}

export interface ParadeSession {
  id: string
  date: string
  start_time: string | null
  end_time: string | null
  conducted_by: string | null
  type: string
  status: string
  notes: string | null
  created_at: string
  updated_at: string
  conductor?: Staff
  briefings?: ParadeBriefing[]
  tasks?: ParadeTask[]
  acknowledgements?: ParadeAcknowledgement[]
}

export interface ParadeBriefing {
  id: string
  parade_id: string
  title: string
  content: string
  priority: string
  category: string
  created_by: string | null
  created_at: string
  author?: Staff
}

export interface ParadeTask {
  id: string
  parade_id: string
  briefing_id: string | null
  assigned_to: string | null
  description: string
  priority: string
  deadline: string | null
  status: string
  completed_by: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  assignee?: Staff
}

export interface ParadeAcknowledgement {
  id: string
  parade_id: string
  staff_id: string
  acknowledged_at: string
  staff?: Staff
}

export interface NotificationLog {
  id: string
  recipient_id: string | null
  recipient_phone: string | null
  recipient_name: string | null
  channel: string
  message_type: string
  message_body: string
  status: string
  provider_response: Json | null
  sent_at: string | null
  is_read: boolean | null
  read_at: string | null
  created_at: string
}

export interface AcademicSession {
  id: string
  name: string
  start_date: string
  end_date: string
  is_current: boolean
  created_at: string
}

export interface AcademicTerm {
  id: string
  session_id: string
  name: string
  start_date: string
  end_date: string
  is_current: boolean
  created_at: string
}

export interface Subject {
  id: string
  name: string
  code: string
  department_id: string | null
  class_level: string | null
  periods_per_week: number
  is_compulsory: boolean
  is_active: boolean
  difficulty_tier: number
  needs_double_period: boolean
  created_at: string
  department?: { id: string; name: string }
}

export interface TeacherSubject {
  id: string
  teacher_id: string
  subject_id: string
  is_primary: boolean
  max_periods_per_day: number
  created_at: string
  teacher?: Staff
  subject?: Subject
}

export interface TimeSlot {
  id: string
  day_of_week: number
  period_number: number
  start_time: string
  end_time: string
  is_break: boolean
  is_assembly: boolean
  period_label: string | null
  created_at: string
}

export interface Room {
  id: string
  name: string
  capacity: number
  room_type: string
  is_active: boolean
  created_at: string
}

export interface TimetableEntry {
  id: string
  term_id: string
  class_id: string
  subject_id: string
  teacher_id: string
  day_of_week: number
  period_number: number
  room_id: string | null
  created_at: string
  class?: Class
  subject?: Subject
  teacher?: Staff
  room?: Room
}

export interface TimetableGeneration {
  id: string
  term_id: string
  status: string
  algorithm_used: string
  total_periods: number
  assigned_periods: number
  conflict_count: number
  conflicts: Json | null
  generated_by: string | null
  generated_at: string
  published_at: string | null
}

export interface ClassSubject {
  id: string
  class_id: string
  subject_id: string
  periods_per_week: number | null
  created_at: string
  class?: Class
  subject?: Subject
}

export interface NotificationQueue {
  id: string
  recipient_id: string | null
  recipient_phone: string | null
  recipient_name: string | null
  channel: string
  message_type: string
  message_body: string
  status: string
  retry_count: number
  max_retries: number
  last_error: string | null
  next_attempt_at: string | null
  created_at: string
  sent_at: string | null
}

export interface NotificationRule {
  id: string
  key: string
  label: string
  description: string | null
  channel: string
  is_active: boolean
  cron_schedule: string | null
  config: Json
  created_at: string
}
