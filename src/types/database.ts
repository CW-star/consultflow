export type Database = {
  public: {
    Tables: {
      clients: { Row: any; Insert: any; Update: any }
      sessions: { Row: any; Insert: any; Update: any }
      invoices: { Row: any; Insert: any; Update: any }
      payments: { Row: any; Insert: any; Update: any }
      reminders: { Row: any; Insert: any; Update: any }
    }
    Views: {
      client_payment_summary: { Row: any }
    }
    Functions: {}
    Enums: {}
  }
}