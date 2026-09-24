# 📡 03. Contrato de API & Schemas (SDD API Contract)

> **Especificação Técnica do Contrato de Comunicação** entre a Vercel e o Endpoint do Painel OnStream.

---

## 1. Endpoint Base

```http
GET https://onstream.rstibahia.com.br/api_catalogo_publico.php
```

- **Método:** `GET`
- **Formato:** `application/json; charset=utf-8`
- **Autenticação:** Opcional via cabeçalho `X-Catalog-Key: <TOKEN>` (se configurado no `.env`).

---

## 2. Parâmetros de Consulta (Query String)

| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
| :--- | :---: | :---: | :---: | :--- |
| `type` | `string` | **Sim** | - | Tipo de conteúdo: `'canais'`, `'filmes'` ou `'series'`. |
| `page` | `integer` | Não | `1` | Número da página solicitada (1-indexed). |
| `limit` | `integer` | Não | `36` | Quantidade de itens por página (mínimo: 12, máximo: 100). |
| `search` | `string` | Não | `""` | Termo de busca textual por nome do título ou grupo. |
| `filter_grupo`| `string` | Não | `""` | Filtro exato por categoria/gênero (ex: `"Ação"`, `"HBO"`). |
| `filter_ano` | `string` | Não | `""` | Filtro por ano de lançamento (aplicável a filmes). |
| `sort_by` | `string` | Não | `"criado_em"` | Coluna para ordenação: `'nome'`, `'ano'` ou `'criado_em'`. |
| `sort_dir` | `string` | Não | `"desc"` | Direção da ordenação: `'asc'` ou `'desc'`. |

---

## 3. Schemas de Dados (TypeScript Interfaces)

```typescript
// --- ENUMS ---
export type ContentType = 'canais' | 'filmes' | 'series';
export type SortDirection = 'asc' | 'desc';

// --- ITEM: CANAL ---
export interface CanalItem {
  id?: number;
  nome: string;
  logo_url: string | null;
  grupo: string | null;
  criado_em: string;
}

// --- ITEM: FILME ---
export interface FilmeItem {
  id?: number;
  nome: string;
  logo_url: string | null;
  grupo: string | null;
  ano: string | null;
  criado_em: string;
}

// --- ITEM: SÉRIE ---
export interface SerieItem {
  id?: number;
  nome_serie: string;
  logo_url: string | null;
  grupo: string | null;
  total_episodios: number;
  criado_em: string;
}

// --- ITEM UNIFICADO PARA RENDERIZAÇÃO DE CARDS ---
export interface CatalogItem {
  id: string;
  title: string;
  posterUrl: string | null;
  category: string;
  year?: string | null;
  episodeCount?: number;
  type: ContentType;
}

// --- RESPOSTA PAGINADA PADRÃO ---
export interface CatalogApiResponse<T> {
  total_records: number;
  total_pages: number;
  current_page: number;
  limit: number;
  data: T[];
  filters: {
    grupos: string[];
    anos: string[];
  };
  sort: {
    by: string;
    dir: SortDirection;
  };
}
```

---

## 4. Exemplo de Requisição e Resposta

### Requisição:
```http
GET /api_catalogo_publico.php?type=filmes&page=1&limit=2&search=Deadpool HTTP/1.1
Host: onstream.rstibahia.com.br
Accept: application/json
```

### Resposta Sucesso (200 OK):
```json
{
  "total_records": 2,
  "total_pages": 1,
  "current_page": 1,
  "limit": 2,
  "data": [
    {
      "nome": "Deadpool & Wolverine (2024)",
      "ano": "2024",
      "logo_url": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
      "grupo": "LANÇAMENTOS 2024",
      "criado_em": "2024-08-15 03:45:12"
    },
    {
      "nome": "Deadpool 2 (2018)",
      "ano": "2018",
      "logo_url": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/to0spRl1CMDvyUbvdKm3io7Y00A.jpg",
      "grupo": "AÇÃO",
      "criado_em": "2023-11-10 12:20:00"
    }
  ],
  "filters": {
    "grupos": ["AÇÃO", "COMÉDIA", "LANÇAMENTOS 2024"],
    "anos": ["2024", "2018", "2016"]
  },
  "sort": {
    "by": "criado_em",
    "dir": "desc"
  }
}
```

---

## 5. Matriz de Códigos de Status HTTP

| Código | Condição | Ação do Frontend (Next.js) |
| :---: | :--- | :--- |
| **200** | Sucesso na consulta | Renderiza lista e atualiza filtros e paginação. |
| **400** | Parâmetro inválido (ex: `type` desconhecido) | Exibe estado de aviso amigável. |
| **500** | Falha interna no MariaDB | Retorna cache estático da Vercel (*stale fallback*) ou card de indisponibilidade com botão de tentar novamente. |
