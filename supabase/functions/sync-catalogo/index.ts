import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { TextLineStream } from "jsr:@std/streams@1/text-line-stream";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-sync-secret",
};

interface ExtinfMeta {
  nome: string;
  logo: string | null;
  grupo: string;
}

interface SerieAggregate {
  nome: string;
  logo: string | null;
  grupo: string;
  ano: number | null;
  total_episodios: number;
}

function sanitizarLogo(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") return null;
  if (trimmed.includes("150466.jpg")) return null;

  if (trimmed.startsWith("http://image.tmdb.org/")) {
    return trimmed.replace("http://image.tmdb.org/", "https://image.tmdb.org/");
  }
  return trimmed;
}

function categorizarConteudo(nome: string, grupo: string): {
  tipo: "canais" | "filmes" | "series";
  titulo: string;
  ano: number | null;
} {
  const upperGrupo = grupo.toUpperCase();
  const seriesTitleRegex = /^(.*?)(?:\sS\d{1,2}E\d{1,2}|\sS\d{1,2}\sE\d{1,2}|\s\d{1,2}x\d{1,2}).*$/i;

  // 1. Filmes (ignora animes/desenhos do filtro exclusivo de filmes se for canal)
  if (
    upperGrupo.includes("FILMES:") ||
    upperGrupo.startsWith("FILMES") ||
    upperGrupo.includes("VOD FILMES")
  ) {
    let movieTitle = nome;
    let movieYear: number | null = null;
    const yearMatch = nome.match(/(.*?) \((\d{4})\)/);
    if (yearMatch) {
      movieTitle = yearMatch[1].trim();
      movieYear = parseInt(yearMatch[2], 10);
    }
    return {
      tipo: "filmes",
      titulo: movieTitle,
      ano: movieYear,
    };
  }

  // 2. Séries (por regex de episódio ou grupo de séries)
  const seriesMatch = nome.match(seriesTitleRegex);
  if (
    seriesMatch ||
    upperGrupo.includes("SÉRIES:") ||
    upperGrupo.includes("SERIES:") ||
    upperGrupo.startsWith("SÉRIES") ||
    upperGrupo.startsWith("SERIES")
  ) {
    let serieNome = seriesMatch ? seriesMatch[1].trim() : nome.trim();
    // Remove tags de ano no final da série se houver ex: Nome da Série (2023)
    let serieAno: number | null = null;
    const serieYearMatch = serieNome.match(/(.*?) \((\d{4})\)/);
    if (serieYearMatch) {
      serieNome = serieYearMatch[1].trim();
      serieAno = parseInt(serieYearMatch[2], 10);
    }

    return {
      tipo: "series",
      titulo: serieNome,
      ano: serieAno,
    };
  }

  // 3. Padrão: canais ao vivo
  return {
    tipo: "canais",
    titulo: nome.trim(),
    ano: null,
  };
}

Deno.serve(async (req: Request) => {
  // Trata preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Lê parâmetros da requisição
    let body: any = {};
    if (req.method === "POST") {
      try {
        body = await req.json();
      } catch {
        body = {};
      }
    }

    let urlM3u: string | null = body.m3u_url || null;
    let fonteId: number | null = body.fonte_id || null;
    let fonteNome: string = body.nome || "Servidor Principal";

    // Se a URL não foi informada diretamente, busca a fonte ativa no banco
    if (!urlM3u) {
      let query = supabase.from("catalogo_fontes").select("*");
      if (fonteId) {
        query = query.eq("id", fonteId);
      } else {
        query = query.eq("ativo", true).order("id", { ascending: true }).limit(1);
      }

      const { data: fontes, error: fonteErr } = await query;
      if (fonteErr) throw fonteErr;

      if (fontes && fontes.length > 0) {
        urlM3u = fontes[0].url_m3u;
        fonteId = fontes[0].id;
        fonteNome = fontes[0].nome;
      } else {
        // Fallback para variável de ambiente se configurada
        urlM3u = Deno.env.get("DEFAULT_M3U_URL") || null;
      }
    }

    if (!urlM3u) {
      return new Response(
        JSON.stringify({
          error: "Nenhuma URL M3U fornecida ou encontrada em catalogo_fontes.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Se não temos fonte_id, garante o cadastro em catalogo_fontes
    if (!fonteId) {
      const { data: novaFonte, error: createFonteErr } = await supabase
        .from("catalogo_fontes")
        .upsert(
          {
            nome: fonteNome,
            url_m3u: urlM3u,
            ativo: true,
            status_sincronizacao: "processando",
          },
          { onConflict: "id" }
        )
        .select("id")
        .single();

      if (!createFonteErr && novaFonte) {
        fonteId = novaFonte.id;
      }
    } else {
      await supabase
        .from("catalogo_fontes")
        .update({
          status_sincronizacao: "processando",
          erro_mensagem: null,
        })
        .eq("id", fonteId);
    }

    // Inicia download em stream da lista M3U
    console.log(`Baixando M3U de: ${urlM3u}`);
    const m3uRes = await fetch(urlM3u, {
      headers: {
        "User-Agent": "IPTVSmartersPro",
        Accept: "*/*",
      },
    });

    if (!m3uRes.ok || !m3uRes.body) {
      let bodySnippet = "";
      try {
        const text = await m3uRes.text();
        bodySnippet = text.slice(0, 1000);
      } catch (e: any) {
        bodySnippet = `Erro ao ler corpo: ${e.message}`;
      }
      const responseHeaders: Record<string, string> = {};
      m3uRes.headers.forEach((v, k) => { responseHeaders[k] = v; });
      console.error(`Erro M3U HTTP ${m3uRes.status}:`, JSON.stringify({ headers: responseHeaders, snippet: bodySnippet }));

      const errorMsg = `Falha ao baixar M3U: HTTP ${m3uRes.status} ${m3uRes.statusText} - ${bodySnippet.slice(0, 200)}`;
      if (fonteId) {
        await supabase
          .from("catalogo_fontes")
          .update({
            status_sincronizacao: "erro",
            erro_mensagem: errorMsg,
          })
          .eq("id", fonteId);
      }
      return new Response(JSON.stringify({ error: errorMsg, headers: responseHeaders, body: bodySnippet }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const syncId = `sync_${Date.now()}`;
    const BATCH_SIZE = 500;

    let itemsBatch: any[] = [];
    const seriesMap = new Map<string, SerieAggregate>();

    let totalCanais = 0;
    let totalFilmes = 0;

    let pendingMeta: ExtinfMeta | null = null;

    // Processamento de linhas em Stream (baixo consumo de memória)
    const lineStream = m3uRes.body
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new TextLineStream());

    for await (const rawLine of lineStream) {
      const line = rawLine.trim();
      if (!line) continue;

      if (line.startsWith("#EXTINF:")) {
        const commaIdx = line.indexOf(",");
        const nome = commaIdx !== -1 ? line.slice(commaIdx + 1).trim() : "Sem Nome";

        const logoMatch = line.match(/tvg-logo=["']?(.*?)["']?([\s, ]|$)/);
        const logo = logoMatch ? logoMatch[1] : null;

        const grupoMatch = line.match(/group-title=["']?(.*?)["']?([\s, ]|$)/);
        const grupo = grupoMatch ? grupoMatch[1].trim() : "Geral";

        pendingMeta = {
          nome,
          logo: sanitizarLogo(logo),
          grupo: grupo || "Geral",
        };
        continue;
      }

      // Se temos metadados pendentes e a linha não é diretiva (#), é a URL do stream
      if (pendingMeta && !line.startsWith("#")) {
        const { tipo, titulo, ano } = categorizarConteudo(
          pendingMeta.nome,
          pendingMeta.grupo
        );

        if (tipo === "series") {
          // Agrega episódios por série
          const serieKey = `${pendingMeta.grupo}::${titulo}`;
          const existing = seriesMap.get(serieKey);
          if (existing) {
            existing.total_episodios += 1;
            if (!existing.logo && pendingMeta.logo) {
              existing.logo = pendingMeta.logo;
            }
          } else {
            seriesMap.set(serieKey, {
              nome: titulo,
              logo: pendingMeta.logo,
              grupo: pendingMeta.grupo,
              ano,
              total_episodios: 1,
            });
          }
        } else {
          // Canais ou Filmes
          if (tipo === "canais") totalCanais++;
          if (tipo === "filmes") totalFilmes++;

          itemsBatch.push({
            fonte_id: fonteId,
            tipo,
            nome: titulo,
            ano: ano || null,
            logo_url: pendingMeta.logo,
            grupo: pendingMeta.grupo,
            total_episodios: 0,
            sync_id: syncId,
            atualizado_em: new Date().toISOString(),
          });

          if (itemsBatch.length >= BATCH_SIZE) {
            const { error: upsertErr } = await supabase
              .from("catalogo_itens")
              .upsert(itemsBatch, {
                onConflict: "fonte_id,tipo,nome,grupo",
              });
            if (upsertErr) console.error("Erro no upsert em lote:", upsertErr);
            itemsBatch = [];
          }
        }

        pendingMeta = null;
      }
    }

    // Inserir itens restantes do lote de filmes/canais
    if (itemsBatch.length > 0) {
      const { error: upsertErr } = await supabase
        .from("catalogo_itens")
        .upsert(itemsBatch, {
          onConflict: "fonte_id,tipo,nome,grupo",
        });
      if (upsertErr) console.error("Erro no upsert final:", upsertErr);
      itemsBatch = [];
    }

    // Inserir séries agregadas
    const totalSeries = seriesMap.size;
    let seriesBatch: any[] = [];

    for (const serie of seriesMap.values()) {
      seriesBatch.push({
        fonte_id: fonteId,
        tipo: "series",
        nome: serie.nome,
        ano: serie.ano,
        logo_url: serie.logo,
        grupo: serie.grupo,
        total_episodios: serie.total_episodios,
        sync_id: syncId,
        atualizado_em: new Date().toISOString(),
      });

      if (seriesBatch.length >= BATCH_SIZE) {
        const { error: seriesErr } = await supabase
          .from("catalogo_itens")
          .upsert(seriesBatch, {
            onConflict: "fonte_id,tipo,nome,grupo",
          });
        if (seriesErr) console.error("Erro no upsert de séries:", seriesErr);
        seriesBatch = [];
      }
    }

    if (seriesBatch.length > 0) {
      const { error: seriesErr } = await supabase
        .from("catalogo_itens")
        .upsert(seriesBatch, {
          onConflict: "fonte_id,tipo,nome,grupo",
        });
      if (seriesErr) console.error("Erro no upsert de séries restante:", seriesErr);
      seriesBatch = [];
    }

    // Limpeza de itens órfãos (que não estão mais na lista M3U)
    if (fonteId) {
      await supabase
        .from("catalogo_itens")
        .delete()
        .eq("fonte_id", fonteId)
        .neq("sync_id", syncId);
    }

    const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(2);

    // Atualiza status na tabela catalogo_fontes
    if (fonteId) {
      await supabase
        .from("catalogo_fontes")
        .update({
          status_sincronizacao: "concluido",
          total_canais: totalCanais,
          total_filmes: totalFilmes,
          total_series: totalSeries,
          ultima_sincronizacao: new Date().toISOString(),
          erro_mensagem: null,
        })
        .eq("id", fonteId);
    }

    const resultado = {
      success: true,
      fonte_id: fonteId,
      servidor: fonteNome,
      totals: {
        canais: totalCanais,
        filmes: totalFilmes,
        series: totalSeries,
        total_geral: totalCanais + totalFilmes + totalSeries,
      },
      duracao_segundos: Number(durationSeconds),
    };

    return new Response(JSON.stringify(resultado), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Erro fatal durante sincronização:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Erro desconhecido durante a sincronização",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
