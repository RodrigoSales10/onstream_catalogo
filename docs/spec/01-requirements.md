# 📋 01. Especificação de Requisitos (SDD Requirements)

> **Documento de Requisitos de Negócio, Funcionais e Não-Funcionais** para a vitrine pública de catálogo do OnStream na Vercel.

---

## 1. Visão do Produto & Declaração do Problema

### 1.1. Cenário Atual
Atualmente, quando o atendente de IA (**Max**) ou uma campanha de tráfego pago envia o link do catálogo de conteúdos para um lead, o link aponta diretamente para o painel administrativo (`https://onstream.rstibahia.com.br/catalogo_onstream.php`).

### 1.2. Pontos de Fricção e Riscos
1. **Exposição de Infraestrutura Sensível:** O domínio do ERP é exposto publicamente para milhares de contatos desconhecidos do WhatsApp, atraindo tentativas de brute force e varreduras de vulnerabilidades.
2. **Risco de Gargalo no Servidor VPS:** Se uma campanha disparar centenas de acessos simultâneos, as consultas complexas em PHP/MariaDB podem degradar a performance das operações críticas de cobrança e contratos do painel.
3. **Payload e Consumo de Dados:** O catálogo possui dezenas de milhares de itens. Sem um frontend otimizado com lazy-loading e Edge Cache, a experiência em conexões 4G/5G fica lenta.

### 1.3. Proposta de Valor da Nova Aplicação
Construir uma vitrine web desacoplada, hospedada na **Vercel**, rápida, bonita e focada em conversão, que consome os dados do MariaDB através de um endpoint read-only sanitizado com cache de borda.

---

## 2. Personas do Sistema

- **Persona A: Lead Interessado (Prospect do WhatsApp)**
  - Recebeu o link do Max no WhatsApp e quer verificar rapidamente se o OnStream possui seu canal de futebol favorito, seu filme recém-lançado ou sua série preferida antes de pedir o teste.
  - Utiliza majoritariamente celular (smartphone Android ou iOS) via 4G/5G.
- **Persona B: Cliente Ativo da OnStream**
  - Deseja consultar a grade de programação, lançamentos do fim de semana e saber quais filmes novos entraram no servidor.
- **Persona C: Rodrigo (Administrador / Operador)**
  - Deseja manter o catálogo sincronizado com o servidor IPTV (via M3U) sem se preocupar com sobrecarga no banco de dados e sem expor credenciais dos streams.

---

## 3. Requisitos Funcionais (RF)

| ID | Requisito Funcional | Prioridade | Descrição |
| :--- | :--- | :---: | :--- |
| **RF-01** | **Navegação por Abas de Tipo** | Alta | O usuário deve alternar entre 3 categorias principais: **Canais ao Vivo**, **Filmes (VOD)** e **Séries**. |
| **RF-02** | **Busca Instantânea por Título** | Alta | Campo de busca em tempo real com *debounce* (300ms) que pesquisa no banco de dados por nome de canal, filme ou série. |
| **RF-03** | **Filtros por Categoria/Gênero e Ano** | Alta | Seleção dinâmica de grupos/categorias (ex: "Ação", "HBO", "Infantil") e filtro por ano de lançamento para filmes. |
| **RF-04** | **Paginação Infinita (Infinite Scroll)** | Alta | Carregamento progressivo sob demanda (chunks de 30 a 50 itens) à medida que o usuário rola a página, garantindo payload leve. |
| **RF-05** | **Modal de Detalhes do Conteúdo** | Média | Ao clicar em um card, abrir modal com capa ampliada, título, gênero, ano, quantidade de episódios (para séries) e botão de ação. |
| **RF-06** | **Conversão Direta para WhatsApp** | Crítica | Botão de ação (CTA) flutuante e presente nos cards: *"Pedir Teste Grátis no WhatsApp"*, com deep link montando mensagem contextualizada para o Max. |
| **RF-07** | **Sanitização de Streams** | Crítica | A aplicação **nunca** deve receber nem expor `stream_url` ou credenciais técnicas de reprodução. O app é exclusivamente uma vitrine informativa. |

---

## 4. Requisitos Não-Funcionais (RNF)

| ID | Requisito Não-Funcional | Meta / Métrica |
| :--- | :--- | :--- |
| **RNF-01** | **Tempo de Carregamento (LCP)** | < 1.2s no primeiro acesso; < 200ms em requisições com Edge Cache. |
| **RNF-02** | **Tamanho de Payload Inicial** | < 80 KB para a primeira listagem de dados JSON. |
| **RNF-03** | **Disponibilidade (SLA)** | 99.9% através da infraestrutura global da Vercel. |
| **RNF-04** | **Responsividade Total (Mobile-First)** | Layout fluido e otimizado para telas verticais de smartphones (360px a 430px) até monitores 4K. |
| **RNF-05** | **SEO & Metatags Sociais** | Suporte a OpenGraph e Twitter Cards para que o link compartilhado no WhatsApp gere thumbnail e descrição atrativa. |
| **RNF-06** | **Tolerância a Falhas do Backend Core** | Se o servidor MariaDB ficar temporariamente inacessível, a Vercel deve servir o cache em memória (*Stale-While-Revalidate*) sem mostrar tela de erro ao usuário. |

---

## 5. Critérios de Aceite (Gherkin BDD)

### Cenário 1: Lead busca filme no celular
```gherkin
Dado que o lead acessa a vitrine pública pelo link recebido no WhatsApp
Quando ele clica na aba "Filmes" e digita "Divertidamente" no campo de busca
Então a listagem deve exibir os resultados em menos de 500ms
E os cards devem exibir o poster, o título e o ano de lançamento
E nenhum link direto de transmissão (stream_url) deve ser transmitido no tráfego de rede
```

### Cenário 2: Conversão via WhatsApp a partir de um título
```gherkin
Dado que o visitante encontrou o canal "Premiere Clubes"
Quando ele clica no botão "Assistir no Teste Grátis"
Então o navegador deve abrir o WhatsApp com o número oficial preenchido
E a mensagem inicial deve ser: "Olá Max! Vi o Premiere Clubes no catálogo e quero liberar meu teste grátis de 6 horas!"
```

### Cenário 3: Resiliência de Cache Edge
```gherkin
Dado que o servidor PHP/MariaDB entrou em janela de manutenção de 10 minutos
Quando 50 visitantes acessarem a página inicial do catálogo
Então todos os 50 visitantes devem visualizar o catálogo normalmente servido pela Edge CDN da Vercel
E nenhum erro 500 ou mensagem de falha de conexão deve ser exibida ao usuário
```
