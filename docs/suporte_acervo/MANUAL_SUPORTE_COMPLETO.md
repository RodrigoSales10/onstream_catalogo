# 🛠️ Manual de Suporte Técnico & Base de Conhecimento OnStream

Este manual reúne todos os tutoriais, diagnósticos e procedimentos operacionais extraídos do ecossistema de suporte da plataforma. Ele serve como documentação de referência para a equipe de atendimento, para alimentação do agente inteligente **Max** e como conteúdo para a criação do site de suporte ao cliente.

---

## 1. 🎯 Diretriz de Atendimento: O Aplicativo Recomendado (HD Player)

> [!IMPORTANT]
> **Prioridade Operacional:** O **HD Player** é atualmente o aplicativo nº 1 recomendado para todos os clientes em dispositivos compatíveis (Fire TV Stick, Android TV, TV Box, Xiaomi e Roku TV).
> * **Por que recomendar o HD Player?**
>   1. **Ativação Gratuita via Parceria:** Usando nossos códigos oficiais (`4100`), o cliente não paga nenhuma taxa de ativação anual aos desenvolvedores.
>   2. **Estabilidade de Reprodução:** Excelente gerenciamento de memória em dispositivos compactos.
>   3. **Facilidade de Login:** O cliente só precisa digitar o Provider ID e suas credenciais.

### Como Logar no HD Player:
1. Abra o aplicativo e localize o campo **Provider ID** ou **Código do Servidor**.
2. Digite o código de rota:
   * **`4100`**: Rota Principal (Recomendada Brasil).
   * **`4101`**: Rota Internacional.
   * `4102`, `4103`, `4104`: Rotas Alternativas de Contingência.
3. Insira o **Usuário** e a **Senha** do cliente.
4. Clique em **Entrar / Login**.
5. *Dica caso o campo não apareça:* Se o app já abriu em uma lista vazia, vá em `Settings (Engrenagem)` ➔ `Switch Profile` ➔ `Add User`.

---

## 2. 📺 Instalação por Dispositivo

### 2.1. Amazon Fire TV Stick
1. Na tela inicial da Amazon, vá na aba **Pesquisar** e busque por **Downloader**.
2. Instale o Downloader.
3. **Liberar Desenvolvedor no Fire Stick:**
   * Vá em *Configurações* ➔ *Meu Fire TV* ➔ *Informações*.
   * Clique **7 vezes seguidas** no botão central sobre o nome do seu Fire TV Stick até surgir a mensagem: *"Você já é um desenvolvedor"*.
   * Volte uma tela, entre em *Opções para Desenvolvedores* ➔ *Instalar apps desconhecidos* ➔ ative para o **Downloader** (*Permitido*).
4. Abra o **Downloader** e digite o código do app desejado:
   * **HD Player (Recomendado):** Código `2621880`
   * *XCIPTV v7 (Alternativa):* Código `6885576`
   * *TP PRO:* Código `4558350`
5. Clique em **Install** e conclua a instalação.

---

### 2.2. Android TV / Google TV / TV Box / Mi Stick
* **Opção A (Downloader):**
  * Instale o aplicativo **Downloader** pela Google Play Store.
  * Digite o código **`2621880`** (HD Player) ou `6885576` (XCIPTV).
* **Opção B (Navegador/Pen Drive):**
  * Baixe o APK diretamente: [Download HD Player APK](https://loja.toptv.app/shared_assets/apk/hd-player.apk).
* **Aparelhos Fracos / Antigos (512MB RAM / Philco):**
  * Use o **TXS Ultra Lite** (Downloader: `1724805`) ou **PassPlus TV** (Downloader: `138530`).

---

### 2.3. Samsung Smart TV (Tizen & Modelos Antigos)
1. **Samsung Tizen (2015 a 2026):**
   * Abra a **Samsung Apps Store** na TV.
   * Pesquise por **HD Player** (se disponível na sua região).
   * Se não encontrar o HD Player, instale **IBO Player**, **SmartOne IPTV** ou **ClouDDy**.
   * *No IBO Player:* Anote o **Device ID** e **Device Key** que surgem na tela para ativação da lista.
2. **Samsung Antigas (Séries D, E, F, H, J - Modo Develop):**
   * Pressione *Menu* no controle remoto ➔ *Recursos Smart* ➔ *Conta Samsung* ➔ *Entrar*.
   * Crie/entre com usuário: `develop` (senha em branco ou `111111` dependendo da série).
   * Abra o Smart Hub, segure o botão OK sobre qualquer app até abrir o menu secundário.
   * Selecione *Configuração de IP* e digite o IP do servidor fornecido pela revenda.
   * Clique em *Sincronizar Aplicativos do Usuário*.

---

### 2.4. LG Smart TV (webOS)
1. Abra a **LG Content Store** (ou aba *Apps* no webOS novo).
2. Busque por **HD Player** ou **IBO Player**.
3. Se usar o IBO Player:
   * Copie o `Device ID` e o `Device Key` na tela.
   * Cadastre a URL DNS/M3U do cliente no portal de ativação do app.
4. Alternativas na LG: **SmartOne IPTV**, **ClouDDy**, **Bay IPTV**.

---

### 2.5. Roku TV (AOC, TCL, Philco, Semp)
1. Na tela inicial da Roku, acerte em *Pesquisar Canais*.
2. Procure por **HD Player**.
3. Instale e abra o aplicativo.
4. Digite o Provider ID **`4100`** e depois o usuário e senha do cliente.
5. Se não estiver disponível: Instale **ClouDDy** ou utilize espelhamento via celular.

---

### 2.6. Apple (iPhone, iPad, Apple TV)
1. Acesse a **App Store** oficial.
2. Baixe um dos players homologados:
   * **XP IPTV** ou **9Xtream** (Mais versáteis).
   * **Smarters Player Lite** ([Baixar na App Store](https://apps.apple.com/br/app/smarters-player-lite/id1628995509)).
   * **IBO Pro Player** ([Baixar na App Store](https://apps.apple.com/br/app/ibo-pro-player/id6449647925)).
3. Insira os dados no formato Xtream Codes (Servidor/URL DNS, Usuário e Senha).

---

### 2.7. Computadores (Windows, macOS, Linux)
* **Sem Instalação (Web Player):** Acesse diretamente no navegador: [player.toptv.app](https://player.toptv.app).
* **Windows (Player Dedicado):** [Download TOPTV PC Oficial (.exe)](https://loja.toptv.app/shared_assets/app_desktop/toptv_pc.exe) ou [PassPlus TV Windows](https://loja.toptv.app/shared_assets/app_desktop/passplus-windows.exe).
* **Mac (Apple):** [Download Extreme InfiniTV Mac (.dmg)](https://loja.toptv.app/shared_assets/app_desktop/Extreme.InfiniTV_1.6.0_universal.dmg).

---

## 3. 🔬 Diagnóstico e Resolução de Problemas Técnicos

### 3.1. Por que o IPTV trava e o YouTube/Netflix não?
> [!NOTE]
> **A Analogia do Chuveiro:**
> "O YouTube e a Netflix trabalham com **Buffer**: eles baixam minutos à frente do que você está assistindo. Se a sua internet oscilar, eles reduzem a resolução sem você perceber para não pausar o vídeo.
> Já o **IPTV é transmissão ao vivo em tempo real**: não existe buffer prolongado. É como um chuveiro ligado: se entrar uma bolha de ar no cano, o fluxo de água espirra e para imediatamente, mesmo que a caixa d'água esteja cheia."

### 3.2. Teste dos 80% e Latência (Diagnóstico Rápido)
Peça ao cliente para abrir o navegador no aparelho (ou celular no mesmo Wi-Fi) e acessar **fast.com** (clicando em *"Mais informações"*):
1. **Regra dos 80% (Upload vs Download):**
   * O Upload deve ser de pelo menos **80% do Download**.
   * Se o download estiver em 100 Mbps e o upload em 5 Mbps, a rota da operadora está saturada e o vídeo sofrerá interrupções constantes.
2. **Latência Máxima Tolerada (Ping):**
   * **Smart TVs (Samsung/LG/Roku):** O Ping deve estar **abaixo de 30ms**. Placas de rede de TV são frágeis.
   * **TV Box / Android:** O Ping deve estar **abaixo de 100ms**.
   * *Acima disso, travamentos são inevitáveis.*
3. **Cabo de Rede (RJ45):** O uso de cabo de rede elimina mais de 90% das queixas de instabilidade em Smart TVs.

### 3.3. Otimização e Troca de DNS (Google e Cloudflare)
> [!NOTE]
> **A Analogia do Catálogo Telefônico:**
> "O DNS é a lista telefônica da sua internet. Muitas operadoras (Claro, Vivo, Oi) colocam bloqueios silenciosos ou entregam uma lista desatualizada para desacelerar o sinal (Traffic Shaping). Ao mudar para o DNS do Google ou Cloudflare, você passa a usar uma agenda global livre de bloqueios e muito mais rápida."

* **Servidores DNS Primários e Secundários:**
  * **Google:** `8.8.8.8` / `8.8.4.4` (Maior estabilidade).
  * **Cloudflare:** `1.1.1.1` / `1.0.0.1` (Menor latência).
* **Quando aplicar:**
  * App diz "Erro de Login" com dados corretos.
  * O app demora uma eternidade para carregar a grade de canais.
  * Funciona no 4G do celular, mas não abre no Wi-Fi da casa.

### 3.4. Canais sem Som ou sem Imagem no HD Player
1. Abra as **Configurações (ícone de engrenagem)** no topo do HD Player.
2. Acesse a opção **Stream Format** (Formato de Fluxo).
3. Mude de **HLS** para **MPEGTS** (ou vice-versa).
4. Volte ao canal e teste novamente.

### 3.5. Orientação com a Operadora
Se o Upload estiver desproporcional ou o Ping muito alto:
* Instrua o cliente a ligar para o suporte da operadora e solicitar:
  > *"Por favor, façam um **Reset de Sinal na Porta** do meu modem e uma **Atualização de Firmware** remoto, pois estou com perda massiva de pacotes UDP."*
