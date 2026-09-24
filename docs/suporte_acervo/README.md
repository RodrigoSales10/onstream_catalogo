# 📚 Acervo Completo de Suporte & Downloads - OnStream

Este diretório contém todo o acervo técnico, documentação operacional, catálogo de aplicativos, códigos de instalação e base de conhecimento extraídos dos portais de suporte para a implementação da central de suporte ao cliente no catálogo web (**https://onstreamcatalogo.vercel.app/**).

---

## 🗂️ Estrutura dos Arquivos

| Arquivo / Diretório | Descrição | Utilidade para o Front-end |
| :--- | :--- | :--- |
| **`CATALOGO_ATIVOS_E_APPS.md`** | Mapeamento exato de todos os 16 APKs, 11 códigos Downloader, executáveis desktop e vídeos tutoriais organizados por dispositivo. | Base para a página de **Downloads / Aplicativos**. |
| **`MANUAL_SUPORTE_COMPLETO.md`** | Guias detalhados passo a passo de instalação em Smart TVs (Samsung, LG, Roku), TV Box, Celulares e Computadores, além de protocolo de solução de travamentos (DNS, Stream Format, Fast.com). | Base para artigos de **Ajuda / Tutoriais Passo a Passo**. |
| **`catalogo_ativos_completo.json`** | Estrutura de dados JSON com categorias, IDs, nomes, versões, links diretos de APK/EXE e códigos Downloader. | Pronto para importação direta no Next.js (`import appsData from '@/docs/suporte_acervo/catalogo_ativos_completo.json'`). |
| **`suporte_nodes_consolidado.json`** | Compilado estruturado dos **217 nós de tópicos de suporte** originais em um único arquivo JSON. | Base para alimentar um sistema de busca ou FAQ avançado. |
| **`raw_nodes/`** | Diretório com os 217 arquivos JSON individuais brutos para consulta granular. | Referência técnica detalhada. |

---

## 🚀 Proposta de Arquitetura no Next.js (`/suporte`)

Você pode expor essas informações no Next.js criando páginas modulares, por exemplo:

1. **`/suporte` (Central de Ajuda):**
   * Grid interativo com seleção de dispositivo (Smart TV Samsung/LG, TV Box / Firestick, Roku, Android, iOS, Computador).
   * Barra de busca rápida por termos ("HD Player", "travando", "DNS", "sem som").
   * Botão de transbordo direto para WhatsApp de Suporte.

2. **`/downloads` ou `/aplicativos`:**
   * Cards com os aplicativos recomendados (**HD Player** como destaque principal com Provider ID `4100`).
   * Exibição clara dos códigos **Downloader** (`2621880`, etc.) com botão de "Copiar Código".
   * Botões de download direto para APKs e executáveis de PC/Mac.

3. **Guia Rápido de Solução de Problemas:**
   * Teste de velocidade integrado (link fast.com com regra dos 80% e ping).
   * Passo a passo para trocar DNS (Google / Cloudflare).
   * Ajuste do formato de transmissão (*Stream Format: MPEGTS/HLS*).
