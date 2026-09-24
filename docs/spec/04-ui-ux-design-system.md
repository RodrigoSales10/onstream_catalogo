# 🎨 04. Design System & UI/UX (SDD Design System)

> **Diretrizes de Interface, Design Tokens e Componentes** para o OnStream Catálogo Web.

---

## 1. Princípios de Design

1. **Atmosfera de Streaming Premium:**
   - Visual escuro (*Deep Dark Theme*) com fundos pretos/azuis profundos (`#080b14`), simulando o ambiente imersivo de smart TVs e apps como Netflix, HBO Max e Disney+.
   - Vidro fosco translúcido (*Glassmorphism*) com `backdrop-filter: blur(16px)` para destacar cabeçalhos e modais sobre as capas.
2. **Mobile-First & Touch-Friendly:**
   - 80%+ dos acessos virão de smartphones via WhatsApp. Todos os botões, filtros horizontais (*pills*) e cards possuem alvos de toque generosos (mínimo de 44x44px).
3. **Conversão Onipresente (Lead Gen):**
   - Cada conteúdo visualizado é uma oportunidade de venda. O botão de pedir teste no WhatsApp acompanha a rolagem de forma elegante e não intrusiva.

---

## 2. Design Tokens (Paleta de Cores & Estilo)

```css
:root {
  /* Cores de Fundo */
  --bg-main: #060913;         /* Fundo profundo */
  --bg-card: #0f172a;         /* Fundo do card */
  --bg-glass: rgba(15, 23, 42, 0.75); /* Painéis de vidro */

  /* Cores de Acento & Destaque */
  --neon-cyan: #00e5ff;       /* Acento primário OnStream */
  --electric-blue: #3b82f6;   /* Acento secundário */
  --glow-accent: rgba(0, 229, 255, 0.25);

  /* Ação WhatsApp */
  --whatsapp-green: #25d366;  /* CTA de Conversão */
  --whatsapp-hover: #1ebd56;

  /* Tipografia */
  --text-primary: #f8fafc;
  --text-muted: #94a3b8;
  --text-subtle: #64748b;

  /* Bordas & Raios */
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-active: rgba(0, 229, 255, 0.4);
  --radius-card: 16px;
  --radius-pill: 9999px;
}
```

---

## 3. Tipografia

- **Fonte Primária:** `Outfit` ou `Plus Jakarta Sans` (Google Fonts).
  - Títulos marcantes, modernos, com peso 700/800.
- **Fonte Secundária/Dados:** `Inter` (para textos corridos, categorias e metadados).

---

## 4. Componentes Principais

### 4.1. Navbar Fixa (Header Glass)
- Logo OnStream com brilho ciano suave.
- Seletor de Tipo em abas destacadas:
  - 📺 **Canais ao Vivo**
  - 🍿 **Filmes**
  - 🎬 **Séries**
- Botão CTA superior no desktop: *"Testar Grátis 6h"*.

### 4.2. Barra de Busca e Filtros Rápidos (Pills)
- Campo de busca expansivo com ícone de lupa e atalho para limpar.
- Carrossel horizontal de categorias/gêneros deslizável por toque (*overflow-x-auto scrollbar-none*).

### 4.3. Card de Conteúdo (Poster Card)
- **Aspect Ratio:** `2:3` (padrão de pôster de cinema).
- **Capa com Fallback:** Imagem otimizada (`next/image`). Se a imagem do provedor falhar, exibir gradiente escuro com ícone e o título centralizado.
- **Badges:**
  - Badge no canto superior esquerdo: Ano (ex: `2024`) ou Resolução (`FHD / 4K`).
  - Badge no canto inferior: Categoria (`AÇÃO`, `ESPORTES`).
- **Efeito Hover/Touch:** Leve escala (`scale-105`), borda com brilho ciano e sobreposição com botão *"Ver Detalhes"*.

### 4.4. Modal de Detalhes do Título
- Pôster em alta resolução.
- Nome completo, ano, categoria e tag informativa.
- Chamada para ação: **"Quero assistir esse conteúdo no teste grátis"** (dispara link WhatsApp com o nome do título embutido na mensagem).

### 4.5. Botão Flutuante de WhatsApp (Floating CTA)
- Fixado no canto inferior direito da tela (`bottom-6 right-6 z-50`).
- Ícone oficial do WhatsApp pulsante com badge *"Teste 6h Grátis"*.
- Ao clicar: redireciona para `https://wa.me/5571983831369?text=Ol%C3%A1%20Max!%20Estou%20vendo%20o%20cat%C3%A1logo%20e%20quero%20um%20teste%20gr%C3%A1tis`.

### 4.6. Skeleton Loading (Carregamento Fluido)
- Cards com efeito *shimmer* cinza-escuro animado enquanto os dados são carregados via API, evitando pulos de layout (*Layout Shift - CLS = 0*).
