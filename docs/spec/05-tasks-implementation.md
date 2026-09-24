# 📋 05. Plano de Tarefas Executáveis (SDD Tasks & Roadmap)

> **Checklist Ordenado e Executável** para o desenvolvimento e publicação do OnStream Catálogo Web.

---

## 📌 Fase 1: Backend Core (Endpoint Público Sanitizado)

- [x] **Task 1.1:** Criar `api_catalogo_publico.php` no repositório `onstream_painel_administrativo`.
  - Herdar a lógica performática de paginação de `api_get_catalogo.php`.
  - **Remover terminantemente** a coluna `stream_url` de todas as queries.
  - Implementar cabeçalhos de CORS (`Access-Control-Allow-Origin: *`) e cache HTTP:
    `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`.
  - Testar via cURL local e validar tempo de resposta (< 50ms).
- [x] **Task 1.2:** Commit e deploy da API no repositório do Painel Core.

---

## 📌 Fase 2: Inicialização do Workspace Next.js

- [x] **Task 2.1:** Scaffold da aplicação Next.js 16+ em `/home/rodrigo/onstream_catalogo`:
  - `create-next-app` com TypeScript, Tailwind CSS, App Router e ESLint.
- [x] **Task 2.2:** Instalar dependências de UI e Ícones:
  - `npm install lucide-react clsx tailwind-merge`
- [x] **Task 2.3:** Configurar design tokens no `next.config.ts` e `globals.css` (Deep Dark Theme, Neon Cyan, Glassmorphism, animations).
- [x] **Task 2.4:** Criar `.env.local` a partir do template `.env.example`.

---

## 📌 Fase 3: Camada de Serviços de Dados & Schemas

- [x] **Task 3.1:** Criar tipos TypeScript em `src/types/catalog.ts` conforme especificado no [03-api-contract.md](03-api-contract.md).
- [x] **Task 3.2:** Criar cliente de API em `src/services/catalogService.ts`:
  - Função `fetchCatalog(params)` com tratamento de erros, tipagem estrita e normalização unificada para cards.
  - Suporte a busca, paginação, tipo (canais/filmes/séries) e filtros por categoria e ano.

---

## 📌 Fase 4: Componentes de Interface (UI)

- [x] **Task 4.1:** Desenvolver `Navbar`:
  - Logo estilizado OnStream com badge ciano 4K.
  - Seletor de abas (`Canais ao Vivo`, `Filmes`, `Séries`).
  - Botão de conversão direta "Teste Grátis 6h".
- [x] **Task 4.2:** Desenvolver `SearchBar` & `CategoryFilters`:
  - Input com debounce de 300ms para busca fluida.
  - Carrossel horizontal deslizável de categorias com pills e filtro de anos para filmes.
- [x] **Task 4.3:** Desenvolver `ContentCard`:
  - Aspect ratio 2:3 com efeito hover/touch glow e transições suaves.
  - Otimização de imagem com fallback estilizado para capas indisponíveis.
  - Badges de categoria, ano e episódios (séries).
- [x] **Task 4.4:** Desenvolver `ContentGrid` & `SkeletonLoading`:
  - Grid responsivo (2 colunas no mobile até 6 em telas wide).
  - Shimmer skeleton loading para zero Cumulative Layout Shift (CLS = 0).
  - Botão *"Carregar Mais"* com indicador visual de carregamento.
- [x] **Task 4.5:** Desenvolver `DetailModal`:
  - Visualização expandida ao clicar no card, com capa em alta resolução, metadados e botão de solicitação direta no WhatsApp com o título do conteúdo.

---

## 📌 Fase 5: Conversão WhatsApp & Otimização Mobile

- [x] **Task 5.1:** Desenvolver `WhatsAppFloatButton`:
  - Botão pulsante fixo no canto inferior direito com mensagem direta para o Max:
    `"Olá Max! Estou vendo o catálogo OnStream e quero liberar meu teste grátis de 6 horas!"`
- [x] **Task 5.2:** Configurar Metatags OpenGraph / SEO em `src/app/layout.tsx`:
  - Imagem de preview social para WhatsApp e redes sociais.
  - Título e descrição atrativos com palavras-chave e suporte ao idioma `pt-BR`.

---

## 📌 Fase 6: Deploy na Vercel & Validação Final

- [x] **Task 6.1:** Criar repositório GitHub privado `RodrigoBahia10/onstream_catalogo`.
- [ ] **Task 6.2:** Vincular o projeto na Vercel (CLI ou painel web):
  - Configurar as variáveis de ambiente (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WHATSAPP_NUMBER`).
- [ ] **Task 6.3:** Testes em dispositivos reais:
  - Teste de navegação 4G no Android e iPhone.
  - Teste de clique do botão WhatsApp abrindo diretamente a conversa com o Max.
- [ ] **Task 6.4:** Atualizar o link no prompt v6.2 do Max no repositório `onstream_agente_inteligente` com o novo endereço da Vercel!
