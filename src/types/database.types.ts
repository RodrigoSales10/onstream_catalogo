export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      catalogo_fontes: {
        Row: {
          ativo: boolean
          criado_em: string
          erro_mensagem: string | null
          id: number
          nome: string
          status_sincronizacao: string | null
          total_canais: number | null
          total_filmes: number | null
          total_series: number | null
          ultima_sincronizacao: string | null
          url_m3u: string
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          erro_mensagem?: string | null
          id?: number
          nome: string
          status_sincronizacao?: string | null
          total_canais?: number | null
          total_filmes?: number | null
          total_series?: number | null
          ultima_sincronizacao?: string | null
          url_m3u: string
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          erro_mensagem?: string | null
          id?: number
          nome?: string
          status_sincronizacao?: string | null
          total_canais?: number | null
          total_filmes?: number | null
          total_series?: number | null
          ultima_sincronizacao?: string | null
          url_m3u?: string
        }
        Relationships: []
      }
      catalogo_itens: {
        Row: {
          ano: number | null
          atualizado_em: string
          backdrop_tmdb: string | null
          capa_tmdb: string | null
          criado_em: string
          fonte_id: number | null
          genero_principal: string | null
          generos: string[] | null
          grupo: string
          id: number
          is_adult: boolean
          logo_url: string | null
          nome: string
          sinopse: string | null
          sync_id: string | null
          tipo: string
          tmdb_id: number | null
          tmdb_rating: number | null
          tmdb_sincronizado_em: string | null
          total_episodios: number | null
        }
        Insert: {
          ano?: number | null
          atualizado_em?: string
          backdrop_tmdb?: string | null
          capa_tmdb?: string | null
          criado_em?: string
          fonte_id?: number | null
          genero_principal?: string | null
          generos?: string[] | null
          grupo?: string
          id?: number
          is_adult?: boolean
          logo_url?: string | null
          nome: string
          sinopse?: string | null
          sync_id?: string | null
          tipo: string
          tmdb_id?: number | null
          tmdb_rating?: number | null
          tmdb_sincronizado_em?: string | null
          total_episodios?: number | null
        }
        Update: {
          ano?: number | null
          atualizado_em?: string
          backdrop_tmdb?: string | null
          capa_tmdb?: string | null
          criado_em?: string
          fonte_id?: number | null
          genero_principal?: string | null
          generos?: string[] | null
          grupo?: string
          id?: number
          is_adult?: boolean
          logo_url?: string | null
          nome?: string
          sinopse?: string | null
          sync_id?: string | null
          tipo?: string
          tmdb_id?: number | null
          tmdb_rating?: number | null
          tmdb_sincronizado_em?: string | null
          total_episodios?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "catalogo_itens_fonte_id_fkey"
            columns: ["fonte_id"]
            isOneToOne: false
            referencedRelation: "catalogo_fontes"
            referencedColumns: ["id"]
          },
        ]
      }
      futebol_times: {
        Row: {
          atualizado_em: string
          criado_em: string
          escudo_storage_path: string | null
          escudo_url_origem: string | null
          fonte_id: string | null
          id: number
          nome: string
          nome_normalizado: string
          slug: string | null
          status_imagem: string
          url_origem: string | null
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          escudo_storage_path?: string | null
          escudo_url_origem?: string | null
          fonte_id?: string | null
          id?: number
          nome: string
          nome_normalizado: string
          slug?: string | null
          status_imagem?: string
          url_origem?: string | null
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          escudo_storage_path?: string | null
          escudo_url_origem?: string | null
          fonte_id?: string | null
          id?: number
          nome?: string
          nome_normalizado?: string
          slug?: string | null
          status_imagem?: string
          url_origem?: string | null
        }
        Relationships: []
      }
      futebol_ligas: {
        Row: {
          atualizado_em: string
          criado_em: string
          fonte_id: string | null
          id: number
          logo_storage_path: string | null
          logo_url_origem: string | null
          nome: string
          nome_normalizado: string
          slug: string | null
          status_imagem: string
          url_origem: string | null
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          fonte_id?: string | null
          id?: number
          logo_storage_path?: string | null
          logo_url_origem?: string | null
          nome: string
          nome_normalizado: string
          slug?: string | null
          status_imagem?: string
          url_origem?: string | null
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          fonte_id?: string | null
          id?: number
          logo_storage_path?: string | null
          logo_url_origem?: string | null
          nome?: string
          nome_normalizado?: string
          slug?: string | null
          status_imagem?: string
          url_origem?: string | null
        }
        Relationships: []
      }
      futebol_canais: {
        Row: {
          atualizado_em: string
          criado_em: string
          id: number
          logo_storage_path: string | null
          logo_url_origem: string | null
          nome: string
          nome_normalizado: string
          status_imagem: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          id?: number
          logo_storage_path?: string | null
          logo_url_origem?: string | null
          nome: string
          nome_normalizado: string
          status_imagem?: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          id?: number
          logo_storage_path?: string | null
          logo_url_origem?: string | null
          nome?: string
          nome_normalizado?: string
          status_imagem?: string
        }
        Relationships: []
      }
      futebol_jogos: {
        Row: {
          atualizado_em: string
          coletado_em: string
          data_hora: string
          data_jogo: string
          descricao: string | null
          fonte_id: string
          hora_jogo: string
          id: number
          liga_id: number | null
          placar_casa: number | null
          placar_fora: number | null
          status: string
          time_casa_id: number
          time_fora_id: number
          url_origem: string
        }
        Insert: {
          atualizado_em?: string
          coletado_em?: string
          data_hora: string
          data_jogo: string
          descricao?: string | null
          fonte_id: string
          hora_jogo: string
          id?: number
          liga_id?: number | null
          placar_casa?: number | null
          placar_fora?: number | null
          status?: string
          time_casa_id: number
          time_fora_id: number
          url_origem: string
        }
        Update: {
          atualizado_em?: string
          coletado_em?: string
          data_hora?: string
          data_jogo?: string
          descricao?: string | null
          fonte_id?: string
          hora_jogo?: string
          id?: number
          liga_id?: number | null
          placar_casa?: number | null
          placar_fora?: number | null
          status?: string
          time_casa_id?: number
          time_fora_id?: number
          url_origem?: string
        }
        Relationships: [
          {
            foreignKeyName: "futebol_jogos_liga_id_fkey"
            columns: ["liga_id"]
            isOneToOne: false
            referencedRelation: "futebol_ligas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "futebol_jogos_time_casa_id_fkey"
            columns: ["time_casa_id"]
            isOneToOne: false
            referencedRelation: "futebol_times"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "futebol_jogos_time_fora_id_fkey"
            columns: ["time_fora_id"]
            isOneToOne: false
            referencedRelation: "futebol_times"
            referencedColumns: ["id"]
          },
        ]
      }
      futebol_jogo_canais: {
        Row: {
          canal_id: number
          criado_em: string
          jogo_id: number
        }
        Insert: {
          canal_id: number
          criado_em?: string
          jogo_id: number
        }
        Update: {
          canal_id?: number
          criado_em?: string
          jogo_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "futebol_jogo_canais_canal_id_fkey"
            columns: ["canal_id"]
            isOneToOne: false
            referencedRelation: "futebol_canais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "futebol_jogo_canais_jogo_id_fkey"
            columns: ["jogo_id"]
            isOneToOne: false
            referencedRelation: "futebol_jogos"
            referencedColumns: ["id"]
          },
        ]
      }
      futebol_sync_logs: {
        Row: {
          detalhes: Json | null
          duracao_ms: number | null
          finalizado_em: string | null
          id: number
          iniciado_em: string
          mensagem_erro: string | null
          rotina: string
          status: string
          total_imagens: number | null
          total_jogos: number | null
        }
        Insert: {
          detalhes?: Json | null
          duracao_ms?: number | null
          finalizado_em?: string | null
          id?: number
          iniciado_em?: string
          mensagem_erro?: string | null
          rotina: string
          status: string
          total_imagens?: number | null
          total_jogos?: number | null
        }
        Update: {
          detalhes?: Json | null
          duracao_ms?: number | null
          finalizado_em?: string | null
          id?: number
          iniciado_em?: string
          mensagem_erro?: string | null
          rotina?: string
          status?: string
          total_imagens?: number | null
          total_jogos?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_catalog_filters: {
        Args: {
          p_tipo: string
        }
        Returns: {
          grupos: string[]
          anos: number[]
        }
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
