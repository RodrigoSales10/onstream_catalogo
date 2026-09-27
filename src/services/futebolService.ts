import { supabase } from "@/lib/supabaseClient";
import { FutebolJogo } from "@/types/catalog";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://siooqwcxgmilrtnolyoc.supabase.co";

/**
 * Retorna a URL pública de um asset no bucket futebol-assets com fallback para a URL de origem
 */
export function getAssetUrl(storagePath: string | null | undefined, fallbackUrl?: string | null): string | null {
  if (storagePath) {
    return `${SUPABASE_URL}/storage/v1/object/public/futebol-assets/${storagePath}`;
  }
  if (fallbackUrl && fallbackUrl.startsWith("http")) {
    return fallbackUrl;
  }
  return null;
}

/**
 * Calcula a data de Brasília (YYYY-MM-DD)
 */
export function getBrasiliaDateStr(offsetDays = 0): string {
  const date = new Date();
  if (offsetDays !== 0) {
    date.setDate(date.getDate() + offsetDays);
  }
  // Garante a formatação no fuso America/Sao_Paulo
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Busca partidas de futebol no Supabase
 */
export async function fetchFutebolJogos(params?: {
  dataJogo?: string;
  liga?: string;
  busca?: string;
}): Promise<{ jogos: FutebolJogo[]; ligas: string[] }> {
  try {
    let query = supabase
      .from("futebol_jogos")
      .select(`
        id,
        fonte_id,
        url_origem,
        data_hora,
        data_jogo,
        hora_jogo,
        status,
        placar_casa,
        placar_fora,
        descricao,
        time_casa:futebol_times!time_casa_id(id, nome, slug, escudo_storage_path, escudo_url_origem),
        time_fora:futebol_times!time_fora_id(id, nome, slug, escudo_storage_path, escudo_url_origem),
        liga:futebol_ligas(id, nome),
        transmissoes:futebol_jogo_canais(canal:futebol_canais(nome))
      `)
      .order("data_hora", { ascending: true })
      .order("hora_jogo", { ascending: true });

    if (params?.dataJogo) {
      query = query.eq("data_jogo", params.dataJogo);
    }

    const { data, error } = await query;
    if (error) throw error;

    const ligasSet = new Set<string>();

    const jogos: FutebolJogo[] = (data || []).map((raw: any) => {
      const tc = raw.time_casa;
      const tf = raw.time_fora;
      const ligaNome = raw.liga?.nome || "Futebol Geral";
      ligasSet.add(ligaNome);

      const canais = (raw.transmissoes || [])
        .map((t: any) => t.canal?.nome)
        .filter(Boolean);

      return {
        id: raw.id,
        fonteId: raw.fonte_id,
        urlOrigem: raw.url_origem,
        timeCasa: {
          id: tc?.id,
          nome: tc?.nome || "Time Casa",
          slug: tc?.slug,
          escudoUrl: getAssetUrl(tc?.escudo_storage_path, tc?.escudo_url_origem),
        },
        timeFora: {
          id: tf?.id,
          nome: tf?.nome || "Time Fora",
          slug: tf?.slug,
          escudoUrl: getAssetUrl(tf?.escudo_storage_path, tf?.escudo_url_origem),
        },
        ligaNome,
        dataHora: raw.data_hora,
        dataJogo: raw.data_jogo,
        horaJogo: raw.hora_jogo,
        status: raw.status,
        placarCasa: raw.placar_casa,
        placarFora: raw.placar_fora,
        descricao: raw.descricao,
        canais,
      };
    });

    let filtered = jogos;
    if (params?.liga && params.liga.trim()) {
      filtered = filtered.filter((j) => j.ligaNome === params.liga?.trim());
    }

    if (params?.busca && params.busca.trim()) {
      const q = params.busca.trim().toLowerCase();
      filtered = filtered.filter(
        (j) =>
          j.timeCasa.nome.toLowerCase().includes(q) ||
          j.timeFora.nome.toLowerCase().includes(q) ||
          j.ligaNome.toLowerCase().includes(q) ||
          j.canais.some((c) => c.toLowerCase().includes(q))
      );
    }

    return {
      jogos: filtered,
      ligas: Array.from(ligasSet).sort(),
    };
  } catch (err) {
    console.error("Erro ao carregar jogos de futebol:", err);
    return { jogos: [], ligas: [] };
  }
}
