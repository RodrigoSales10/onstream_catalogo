# 🎬 OnStream Catálogo Web (Vercel Edge App)

> **Vitrine Pública de Conteúdos OnStream** desenvolvida em **Next.js (App Router)** e hospedada na **Vercel**, consumindo a base de catálogo do MariaDB com cache de borda (*Edge CDN / ISR*), alta performance mobile e conversão direta para o Agente Max no WhatsApp.

---

## 🎯 Visão Geral do Projeto

O **OnStream Catálogo** desacopla a visualização pública de canais, filmes e séries do painel administrativo core, proporcionando:
1. **Isolamento de Segurança:** O domínio e infraestrutura sensível do ERP (`onstream.rstibahia.com.br`) não são expostos diretamente aos leads e tráfego público do WhatsApp.
2. **Performance Instantânea (< 50ms):** Hospedagem na Vercel com Edge Caching e paginação inteligente sob demanda (payloads < 50 KB por requisição).
3. **Experiência Premium de Streaming (UI/UX):** Interface dark mode moderna inspirada em players como Netflix e Apple TV+, com busca em tempo real, filtros por gênero/ano e visualização de capas em alta resolução.
4. **Funil de Conversão Integrado:** Deep linking direto para o robô de atendimento (**Max da OnStream**), permitindo ao cliente solicitar teste gratuito de 6 horas com 1 clique a partir de qualquer conteúdo navegado.

---

## 📚 Documentação SDD (Spec-Driven Development)

A especificação completa do sistema segue o framework **Spec-Driven Development** e está organizada no diretório [`docs/spec/`](docs/spec/):

| Documento | Descrição |
| :--- | :--- |
| [01. Requisitos do Sistema](docs/spec/01-requirements.md) | Regras de negócio, requisitos funcionais (RF), não-funcionais (RNF) e critérios de aceite em Gherkin. |
| [02. Arquitetura e Design](docs/spec/02-architecture-design.md) | Topologia multi-região, diagrama C4, estratégia de cache Edge (SWR/ISR) e segurança do MariaDB. |
| [03. Contrato de API & Schemas](docs/spec/03-api-contract.md) | Contrato OpenAPI/TypeScript entre a Vercel e o endpoint público do ERP, sanitização de `stream_url`. |
| [04. Design System & UI/UX](docs/spec/04-ui-ux-design-system.md) | Paleta de cores, tipografia, componentes de card, badges de resolução, skeleton loading e WhatsApp floating button. |
| [05. Plano de Tarefas Executáveis](docs/spec/05-tasks-implementation.md) | Checklist atômico de implementação passo a passo, desde o backend até o deploy na Vercel. |

---

## 🛠️ Stack Tecnológica

- **Framework:** Next.js 15+ (React 19, App Router)
- **Hospedagem:** Vercel (Edge Network / Serverless Functions)
- **Estilização:** Tailwind CSS + Vanilla CSS Tokens + Lucide Icons
- **Estado & Fetching:** TanStack Query (React Query) / SWR + Server Components
- **Backend Fonte:** Endpoint sanitizado no MariaDB do ERP OnStream (`api_catalogo_publico.php`)

---

## 🚀 Como Executar Localmente

### 1. Clonar e Instalar Dependências
```bash
git clone git@github.com:RodrigoBahia10/onstream_catalogo.git
cd onstream_catalogo
npm install
```

### 2. Configurar Variáveis de Ambiente
Copie o template público e defina os valores de desenvolvimento:
```bash
cp .env.example .env.local
```

### 3. Rodar o Servidor de Desenvolvimento
```bash
npm run dev
```
Acesse em: `http://localhost:3000`
