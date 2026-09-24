export interface AppItem {
  id: string;
  name: string;
  category: "android" | "apple" | "windows" | "mac" | "linux";
  badge?: string;
  isRecommended?: boolean;
  downloaderCode?: string;
  providerId?: string;
  directDownloadUrl?: string;
  appStoreUrl?: string;
  description: string;
  targetDevice: string;
}

export interface DeviceTutorial {
  id: string;
  name: string;
  shortName: string;
  badge: string;
  iconType: "firestick" | "samsung" | "lg" | "roku" | "android" | "apple" | "desktop";
  recommendedApp: {
    name: string;
    downloaderCode?: string;
    providerId?: string;
    downloadUrl?: string;
    appStoreUrl?: string;
  };
  steps: {
    title: string;
    description: string;
    tip?: string;
    highlight?: string;
  }[];
  videoTutorial?: {
    title: string;
    url: string;
  };
  alternatives?: string[];
  ctaMessage: string;
}

export interface VideoTutorialItem {
  id: string;
  title: string;
  category: string;
  duration?: string;
  url: string;
  description: string;
}

export const DEVICE_TUTORIALS: DeviceTutorial[] = [
  {
    id: "firestick",
    name: "Amazon Fire TV Stick",
    shortName: "Fire Stick",
    badge: "⭐ Mais Popular (2 Minutos)",
    iconType: "firestick",
    recommendedApp: {
      name: "HD Player (Oficial OnStream)",
      downloaderCode: "2621880",
      providerId: "4100",
      downloadUrl: "https://loja.toptv.app/shared_assets/apk/hd-player.apk",
    },
    steps: [
      {
        title: "1. Instale o aplicativo Downloader",
        description: "Na tela inicial da Amazon, vá na barra de Pesquisa (lupa), digite Downloader e faça a instalação gratuita.",
      },
      {
        title: "2. Ative o Modo Desenvolvedor no Fire Stick",
        description: "Vá em Configurações (engrenagem) ➔ Meu Fire TV ➔ Informações. Clique 7 vezes seguidas no botão central do controle sobre o nome do seu Fire TV até aparecer a mensagem 'Você já é um desenvolvedor'.",
        tip: "Esse passo é obrigatório uma única vez para permitir a instalação do HD Player.",
      },
      {
        title: "3. Habilite a permissão de Apps Desconhecidos",
        description: "Volte uma tela para 'Opções para Desenvolvedores' ➔ 'Instalar apps desconhecidos' e marque o Downloader como PERMITIDO (Ativado).",
      },
      {
        title: "4. Baixe o HD Player com o código rápido",
        description: "Abra o Downloader, selecione o campo de URL/código e digite exatamente o código abaixo. Depois clique em GO e em seguida em INSTALL.",
        highlight: "2621880",
      },
      {
        title: "5. Faça login com o Provider ID 4100",
        description: "Abra o HD Player. No campo Provider ID (Código do Servidor), digite 4100. Em seguida, digite o Usuário e Senha recebidos no WhatsApp e clique em Entrar.",
        highlight: "Provider ID: 4100",
        tip: "Caso o campo de Provider ID não apareça de imediato, clique na Engrenagem no canto superior direito ➔ Switch Profile ➔ Add User.",
      },
    ],
    videoTutorial: {
      title: "Como liberar Desenvolvedor e Instalar no Fire Stick",
      url: "https://loja.toptv.app/shared_assets/videos_tutoriais/aparelhos/desenvolvedor_fire_stick.mp4",
    },
    alternatives: ["XCIPTV v7 (Código Downloader: 6885576)", "TP PRO (Código Downloader: 4558350)"],
    ctaMessage: "Olá Max! Acabei de ver o tutorial do Fire TV Stick e quero liberar meu teste grátis de 6 horas!",
  },
  {
    id: "samsung",
    name: "Samsung Smart TV",
    shortName: "Samsung TV",
    badge: "Tizen & Modelos Antigos",
    iconType: "samsung",
    recommendedApp: {
      name: "HD Player ou IBO Player",
      providerId: "4100",
    },
    steps: [
      {
        title: "1. Acesse a Samsung Apps Store",
        description: "No controle remoto da sua TV Samsung, pressione o botão Home/Smart Hub e vá na loja de aplicativos (Samsung Apps).",
      },
      {
        title: "2. Busque pelo aplicativo HD Player",
        description: "Pesquise por 'HD Player'. Se estiver disponível na sua região/modelo, instale-o. Ao abrir, use o Provider ID 4100 e seus dados de acesso.",
        highlight: "Provider ID: 4100",
      },
      {
        title: "3. Alternativa para TVs sem HD Player (IBO Player)",
        description: "Se o HD Player não aparecer na loja da sua Samsung, busque e instale o IBO Player, SmartOne IPTV ou ClouDDy.",
      },
      {
        title: "4. Ativação Rápida via Device ID",
        description: "Ao abrir o IBO Player na sua TV Samsung, surgirão na tela o 'Device ID' e a 'Device Key'. Basta tirar uma foto da tela e nos enviar no WhatsApp para ativarmos sua lista instantaneamente!",
        tip: "A ativação é 100% remota por nós, você não precisa digitar URLs longas no controle!",
      },
    ],
    alternatives: ["IBO Player", "SmartOne IPTV", "ClouDDy", "Bay IPTV"],
    ctaMessage: "Olá Max! Quero testar na minha Samsung Smart TV por 6 horas grátis!",
  },
  {
    id: "lg",
    name: "LG Smart TV",
    shortName: "LG webOS",
    badge: "webOS (Todas as Versões)",
    iconType: "lg",
    recommendedApp: {
      name: "HD Player ou IBO Player",
      providerId: "4100",
    },
    steps: [
      {
        title: "1. Abra a LG Content Store",
        description: "No menu da sua LG TV, acesse a LG Content Store (ou a aba 'Apps' nas versões mais recentes do webOS).",
      },
      {
        title: "2. Localize o aplicativo HD Player",
        description: "Na lupa de busca da LG, digite 'HD Player' e clique em Instalar. Abra o app, digite o Provider ID 4100 e entre com seu Usuário e Senha.",
        highlight: "Provider ID: 4100",
      },
      {
        title: "3. Se o HD Player não estiver visível (IBO Player)",
        description: "Pesquise e instale o IBO Player na loja LG.",
      },
      {
        title: "4. Envie o Device ID e Device Key",
        description: "Abra o IBO Player e copie o Device ID e o Device Key exibidos na tela. Envie esses códigos para nosso WhatsApp e liberamos seu acesso em menos de 1 minuto!",
      },
    ],
    alternatives: ["IBO Player", "SmartOne IPTV", "ClouDDy", "Bay IPTV"],
    ctaMessage: "Olá Max! Gostaria de fazer o teste grátis de 6 horas na minha LG Smart TV!",
  },
  {
    id: "roku",
    name: "Roku TV & Roku Express",
    shortName: "Roku TV",
    badge: "AOC, TCL, Philco, Semp",
    iconType: "roku",
    recommendedApp: {
      name: "HD Player (Roku Channel Store)",
      providerId: "4100",
    },
    steps: [
      {
        title: "1. Acesse Pesquisar Canais",
        description: "Na tela inicial da sua Roku TV ou do aparelho Roku Express, selecione a opção 'Pesquisar Canais' (Search Streaming Channels).",
      },
      {
        title: "2. Busque por HD Player",
        description: "Digite 'HD Player' e adicione o canal à sua televisão.",
      },
      {
        title: "3. Conecte com o Provider ID 4100",
        description: "Abra o HD Player e insira o código de provedor oficial 4100. Depois insira as credenciais que enviamos no WhatsApp.",
        highlight: "Provider ID: 4100",
      },
      {
        title: "4. Alternativa caso o HD Player não conste",
        description: "Instale o app ClouDDy ou utilize a transmissão via celular Android/iPhone com o aplicativo Web Video Caster.",
      },
    ],
    alternatives: ["ClouDDy", "Espelhamento via Web Video Caster"],
    ctaMessage: "Olá Max! Vi o guia da Roku TV e quero liberar meu teste grátis de 6 horas!",
  },
  {
    id: "android",
    name: "TV Box / Android TV / Xiaomi",
    shortName: "TV Box / Mi Stick",
    badge: "Google TV & Xiaomi",
    iconType: "android",
    recommendedApp: {
      name: "HD Player (APK Oficial)",
      downloaderCode: "2621880",
      providerId: "4100",
      downloadUrl: "https://loja.toptv.app/shared_assets/apk/hd-player.apk",
    },
    steps: [
      {
        title: "1. Instale o Downloader ou baixe o APK",
        description: "Instale o app Downloader pela Google Play Store da sua TV Box / Android TV ou abra o navegador Chrome.",
      },
      {
        title: "2. Digite o código no Downloader",
        description: "Digite o código rápido abaixo no Downloader para baixar o HD Player diretamente.",
        highlight: "2621880",
      },
      {
        title: "3. Aparelhos antigos ou com pouca memória (512MB RAM)",
        description: "Se sua TV Box for de modelo simples ou antiga (Philco, Aquário, etc.), use o aplicativo ultraleve TXS Ultra Lite no Downloader.",
        highlight: "Código TXS: 1724805",
      },
      {
        title: "4. Entre com o Provider ID 4100",
        description: "Abra o aplicativo, digite o Provider ID 4100 e entre com seu Usuário e Senha.",
        highlight: "Provider ID: 4100",
      },
    ],
    alternatives: [
      "XCIPTV v7 (Código: 6885576)",
      "TXS Ultra Lite para TV fraca (Código: 1724805)",
      "PassPlus TV Anti-Bloqueio (Código: 138530)",
    ],
    ctaMessage: "Olá Max! Quero um teste de 6 horas para minha TV Box / Android TV!",
  },
  {
    id: "apple",
    name: "Apple (iPhone, iPad e Apple TV)",
    shortName: "Apple iOS",
    badge: "App Store Oficial",
    iconType: "apple",
    recommendedApp: {
      name: "XP IPTV ou 9Xtream",
      appStoreUrl: "https://apps.apple.com/us/app/xp-iptv/id6744047936",
    },
    steps: [
      {
        title: "1. Abra a App Store no seu dispositivo Apple",
        description: "No iPhone, iPad ou na Apple TV, abra a App Store oficial da Apple.",
      },
      {
        title: "2. Baixe um dos aplicativos homologados",
        description: "Recomendamos o 'XP IPTV' ou o '9Xtream'. Ambos são rápidos e oferecem excelente interface para filmes, séries e grade ao vivo.",
      },
      {
        title: "3. Conecte via Xtream Codes",
        description: "No app, selecione 'Login with Xtream Codes API'. Digite o Nome da Conexão, a URL do Servidor DNS, Usuário e Senha fornecidos no WhatsApp.",
      },
    ],
    alternatives: [
      "Smarters Player Lite (App Store)",
      "IBO Pro Player (App Store)",
      "IPTV Stream Player (App Store)",
    ],
    ctaMessage: "Olá Max! Quero testar no meu iPhone / Apple TV por 6 horas grátis!",
  },
  {
    id: "desktop",
    name: "Computador (Windows, Mac e Web)",
    shortName: "PC / Web",
    badge: "Sem Instalar ou App Dedicado",
    iconType: "desktop",
    recommendedApp: {
      name: "TOP Player Web ou TOPTV PC Oficial",
      downloadUrl: "https://loja.toptv.app/shared_assets/app_desktop/toptv_pc.exe",
    },
    steps: [
      {
        title: "Opção 1: Assistir direto no Navegador (Web Player)",
        description: "Não quer instalar nada? Acesse https://player.toptv.app no Chrome, Edge ou Safari, insira sua URL DNS, Usuário e Senha e assista instantaneamente.",
        highlight: "https://player.toptv.app",
      },
      {
        title: "Opção 2: Player Dedicado para Windows",
        description: "Baixe o aplicativo TOPTV PC Oficial (.exe) ou o PassPlus TV Windows para aceleração de hardware e estabilidade total.",
      },
      {
        title: "Opção 3: macOS e Linux",
        description: "Para Mac, baixe o Extreme InfiniTV (.dmg) ou IPTVnator ARM64. Para Linux, utilize o pacote AppImage portátil.",
      },
    ],
    alternatives: ["TOP Player Web", "PassPlus Windows", "Extreme InfiniTV Mac/Linux"],
    ctaMessage: "Olá Max! Quero fazer o teste grátis de 6 horas no meu computador / navegador!",
  },
];

export const APPS_CATALOG: AppItem[] = [
  {
    id: "hd-player",
    name: "HD Player Oficial",
    category: "android",
    badge: "⭐ RECOMENDADO #1",
    isRecommended: true,
    downloaderCode: "2621880",
    providerId: "4100",
    directDownloadUrl: "https://loja.toptv.app/shared_assets/apk/hd-player.apk",
    description: "O player mais estável para Fire Stick, TV Box, Xiaomi e Android TV. Ativação gratuita sem taxa de licença anual.",
    targetDevice: "Fire Stick, TV Box, Android TV, Mi Stick",
  },
  {
    id: "xciptv-7",
    name: "XCIPTV v7",
    category: "android",
    badge: "Plano B Robusto",
    downloaderCode: "6885576",
    directDownloadUrl: "https://loja.toptv.app/shared_assets/apk/xciptv-7-0.apk",
    description: "Versão mais atualizada e robusta de um dos players mais consagrados e confiáveis do mercado.",
    targetDevice: "Fire TV Stick, Android TV, TV Box",
  },
  {
    id: "tp-pro",
    name: "TP PRO",
    category: "android",
    badge: "Estilo Cinema",
    downloaderCode: "4558350",
    directDownloadUrl: "https://loja.toptv.app/shared_assets/apk/tppro.apk",
    description: "Interface moderna estilo cinema com excelente reprodutor e suporte a espelhamento VLC.",
    targetDevice: "Android TV, TV Box, Celular",
  },
  {
    id: "txs-ultra-lite",
    name: "TXS Ultra Lite",
    category: "android",
    badge: "Para TVs Fracas (512MB)",
    downloaderCode: "1724805",
    directDownloadUrl: "https://loja.toptv.app/shared_assets/apk/txs.apk",
    description: "O player mais leve de todos. Especial para aparelhos antigos, TVs Philco e boxes de baixa memória.",
    targetDevice: "Aparelhos Básicos e Antigos (512MB RAM)",
  },
  {
    id: "passplus-tv",
    name: "PassPlus TV",
    category: "android",
    badge: "Tecnologia Anti-Bloqueio",
    downloaderCode: "138530",
    directDownloadUrl: "https://loja.toptv.app/shared_assets/apk/passplus-tv.apk",
    description: "Tecnologia avançada desenvolvida para contornar traffic shaping e bloqueios silenciosos de operadoras.",
    targetDevice: "Fire Stick, TV Box, Android",
  },
  {
    id: "xp-iptv",
    name: "XP IPTV",
    category: "apple",
    badge: "⭐ Destaque iOS",
    isRecommended: true,
    appStoreUrl: "https://apps.apple.com/us/app/xp-iptv/id6744047936",
    description: "O reprodutor mais moderno e versátil para o ecossistema Apple com carregamento veloz.",
    targetDevice: "iPhone, iPad, Apple TV",
  },
  {
    id: "9xtream",
    name: "9Xtream Player",
    category: "apple",
    badge: "Gratuito",
    appStoreUrl: "https://apps.apple.com/us/app/9xtream-download-play-iptv/id6504282945",
    description: "Player completo e fluido com suporte a múltiplas listas e interface intuitiva.",
    targetDevice: "iPhone, iPad, Apple TV",
  },
  {
    id: "smarters-lite",
    name: "Smarters Player Lite",
    category: "apple",
    badge: "Clássico",
    appStoreUrl: "https://apps.apple.com/br/app/smarters-player-lite/id1628995509",
    description: "Um dos players mais famosos do mundo. Conexão direta via Xtream Codes API.",
    targetDevice: "iPhone, iPad, Apple TV",
  },
  {
    id: "toptv-pc",
    name: "TOPTV PC Oficial",
    category: "windows",
    badge: "Windows Dedicado",
    isRecommended: true,
    directDownloadUrl: "https://loja.toptv.app/shared_assets/app_desktop/toptv_pc.exe",
    description: "Aplicativo oficial otimizado para Windows com reprodução contínua e atalhos de teclado.",
    targetDevice: "Windows 10 e Windows 11",
  },
  {
    id: "passplus-win",
    name: "PassPlus TV Windows",
    category: "windows",
    badge: "Anti-Travamento",
    directDownloadUrl: "https://loja.toptv.app/shared_assets/app_desktop/passplus-windows.exe",
    description: "Versão para computador com tecnologia exclusiva contra oscilações de rota e bloqueios.",
    targetDevice: "Windows PC",
  },
  {
    id: "top-player-web",
    name: "TOP Player Web",
    category: "windows",
    badge: "Sem Instalação",
    directDownloadUrl: "https://player.toptv.app",
    description: "Acesse e assista diretamente pelo navegador Chrome, Edge ou Safari sem baixar nenhum arquivo.",
    targetDevice: "Qualquer Navegador (PC, Mac, Linux)",
  },
  {
    id: "extreme-mac",
    name: "Extreme InfiniTV Mac",
    category: "mac",
    badge: "Universal DMG",
    isRecommended: true,
    directDownloadUrl: "https://loja.toptv.app/shared_assets/app_desktop/Extreme.InfiniTV_1.6.0_universal.dmg",
    description: "Pacote Universal DMG compatível tanto com Mac Intel quanto Apple Silicon (M1/M2/M3/M4).",
    targetDevice: "macOS (Apple Mac)",
  },
  {
    id: "extreme-linux",
    name: "Extreme InfiniTV Linux",
    category: "linux",
    badge: "AppImage Portátil",
    directDownloadUrl: "https://loja.toptv.app/shared_assets/app_desktop/Extreme.InfiniTV_1.6.0_amd64.AppImage",
    description: "Arquivo executável portátil AppImage que roda em Ubuntu, Debian, Fedora, Mint e derivados.",
    targetDevice: "Linux 64-bit",
  },
];

export const TROUBLESHOOTING_GUIDES = [
  {
    id: "chuveiro",
    title: "Por que o IPTV trava e a Netflix/YouTube não?",
    summary: "Entenda a diferença técnica entre streaming gravado com buffer e transmissão ao vivo em tempo real.",
    content: `
A Netflix e o YouTube trabalham com **Buffer prolongado**: eles baixam minutos à frente do que você está assistindo. Se a sua internet oscilar por 5 segundos, você nem percebe, pois o vídeo continua rodando do armazenamento temporário.

Já o **IPTV é transmissão ao vivo em tempo real**, exatamente como uma chamada de vídeo do WhatsApp ou um jogo de futebol ao vivo. 

**A Analogia do Chuveiro:**
Imagine que a Netflix é uma banheira cheia: você pode abrir e fechar a torneira que a água continua disponível. O IPTV é como um chuveiro de alta pressão ligado na hora: se passar uma bolha de ar no cano (oscilação na rota da sua operadora), a água espirra e para imediatamente, mesmo que a caixa d'água esteja cheia.
    `,
  },
  {
    id: "teste-80",
    title: "Diagnóstico Rápido: O Teste dos 80% e Latência (Ping)",
    summary: "Como usar o Fast.com para descobrir se a sua operadora está saturando o sinal de streaming.",
    content: `
Faça o teste de conexão agora pelo navegador do seu aparelho (ou celular conectado no mesmo Wi-Fi):

1. Acesse **fast.com** e aguarde o cálculo da velocidade.
2. Clique no botão **"Mais informações"**.
3. **A Regra dos 80% (Upload vs Download):** O seu Upload deve ser de pelo menos **80% do valor do Download**. Se o seu download estiver em 100 Mbps e o upload em 5 Mbps, a rota internacional da sua operadora está saturada e causará travamentos.
4. **Latência Máxima Tolerada (Ping):**
   * **Smart TVs (Samsung/LG/Roku):** O Ping deve estar **abaixo de 30ms**. Placas de rede de TV são frágeis.
   * **TV Box / Android:** O Ping deve estar **abaixo de 100ms**.
5. **Cabo de Rede (RJ45):** Conectar sua TV ou TV Box via cabo de rede em vez do Wi-Fi elimina mais de **90% de todas as queixas de instabilidade**.
    `,
  },
  {
    id: "dns",
    title: "Otimização e Troca de DNS (Google e Cloudflare)",
    summary: "Elimine o bloqueio silencioso (Traffic Shaping) e acelere o carregamento da grade de canais.",
    content: `
**A Analogia da Lista Telefônica:**
O DNS é a lista telefônica da sua conexão. Toda vez que você abre um canal, o aparelho consulta o DNS para encontrar o servidor. Muitas operadoras (Claro, Vivo, Oi) usam servidores DNS lentos ou aplicam filtros que atrasam a resposta.

Ao mudar o DNS da sua TV ou roteador para os servidores globais do Google ou da Cloudflare, seu aparelho encontra os canais instantaneamente sem intermediários:

* **DNS do Google (Máxima Estabilidade):**
  * Primário: \`8.8.8.8\`
  * Secundário: \`8.8.4.4\`
* **DNS da Cloudflare (Menor Latência / Mais Rápido):**
  * Primário: \`1.1.1.1\`
  * Secundário: \`1.0.0.1\`

**Quando usar:**
* Quando o app diz "Erro de Conexão" ou "Erro de Login".
* Quando a grade de canais demora muito para carregar.
* Quando funciona no 4G do celular, mas não abre no Wi-Fi de casa.
    `,
  },
  {
    id: "stream-format",
    title: "Canal sem som ou sem imagem no HD Player?",
    summary: "Resolva problemas de codecs mudando o Stream Format entre HLS e MPEGTS em 2 cliques.",
    content: `
Algumas Smart TVs e TV Boxes não possuem suporte nativo a certos formatos de compressão de áudio ou vídeo.

**Como resolver no HD Player em 10 segundos:**
1. Abra o aplicativo **HD Player**.
2. Clique no ícone de **Configurações (Engrenagem)** no topo da tela.
3. Localize a opção **Stream Format** (Formato de Fluxo).
4. Alterne de **HLS** para **MPEGTS** (ou vice-versa).
5. Volte para a lista de canais e teste novamente. O som e a imagem sincronizarão perfeitamente!
    `,
  },
  {
    id: "operadora",
    title: "O que falar no suporte da sua operadora de internet?",
    summary: "Script pronto para solicitar o reset de rota caso o upload esteja saturado ou ocorra perda de pacotes.",
    content: `
Se o seu teste no Fast.com indicou latência muito alta ou upload abaixo dos 80%, ligue para a sua provedora e diga exatamente a frase técnica abaixo:

> *"Olá! Estou com lentidão em transmissões contínuas em tempo real e testes indicam alta perda de pacotes UDP na minha rota. Por favor, realizem um **Reset de Sinal na Porta do meu modem** e verifiquem se há uma **Atualização de Firmware** remota disponível."*

Isso fará com que o técnico de nível 2 force uma nova alocação de rota para o seu roteador, limpando tabelas NAT corrompidas e restaurando o fluxo de dados em tempo real.
    `,
  },
];

export const OFFICIAL_VIDEOS: VideoTutorialItem[] = [
  {
    id: "como-logar-hd-player",
    title: "Como Fazer Login no HD Player",
    category: "HD Player",
    duration: "1 min",
    url: "https://suporte.toptv.app/shared_assets/videos_tutoriais/apps/como_logar_hd_player.mp4",
    description: "Aprenda a inserir o Provider ID 4100 e suas credenciais no aplicativo recomendado oficial.",
  },
  {
    id: "desenvolvedor-fire-stick",
    title: "Liberar Modo Desenvolvedor no Fire Stick",
    category: "Amazon Fire TV",
    duration: "1 min",
    url: "https://loja.toptv.app/shared_assets/videos_tutoriais/aparelhos/desenvolvedor_fire_stick.mp4",
    description: "Passo a passo dos 7 cliques para permitir a instalação de aplicativos pelo Downloader no Fire TV.",
  },
  {
    id: "como-usar-hd-player",
    title: "Como Navegar e Usar o HD Player",
    category: "HD Player",
    duration: "2 min",
    url: "https://suporte.toptv.app/shared_assets/videos_tutoriais/apps/como-usar-hd-player.mp4",
    description: "Visão geral de interface: filmes, séries, grade ao vivo, busca e atalhos.",
  },
];

/**
 * Gera link do WhatsApp contextualizado para suporte e ativação de leads
 */
export function buildSupportWhatsAppLink(context?: string, device?: string): string {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5571983831369";
  let message = "Olá Max! Estou na Central de Suporte OnStream e gostaria de ajuda para configurar meu acesso!";

  if (device && context) {
    message = `Olá Max! Vi o guia de instalação para ${device} (${context}) no site e gostaria de solicitar meu teste grátis de 6 horas!`;
  } else if (device) {
    message = `Olá Max! Quero testar o OnStream no meu ${device}! Pode me liberar um teste grátis de 6 horas?`;
  } else if (context) {
    message = `Olá Max! Estou com dúvidas sobre "${context}" na Central de Ajuda e gostaria de suporte!`;
  }

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

