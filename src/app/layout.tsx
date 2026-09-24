import type { Metadata, Viewport } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#060913",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "OnStream Catálogo • Canais ao Vivo, Filmes e Séries em 4K",
  description:
    "Explore a vitrine oficial do catálogo OnStream. Milhares de canais esportivos, filmes recém-lançados e séries completas em alta definição. Solicite seu teste grátis de 6 horas pelo WhatsApp!",
  keywords: [
    "OnStream",
    "catálogo",
    "canais ao vivo",
    "filmes 4k",
    "séries completas",
    "futebol ao vivo",
    "streaming",
    "teste grátis",
  ],
  authors: [{ name: "OnStream" }],
  creator: "OnStream",
  publisher: "OnStream",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "OnStream Catálogo Oficial • Canais, Filmes e Séries em 4K",
    description:
      "Acesse a lista completa de conteúdos atualizados em tempo real. Teste gratuito de 6 horas sem compromisso pelo WhatsApp com o Max!",
    url: "https://catalogo.rstibahia.com.br",
    siteName: "OnStream Catálogo",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OnStream Catálogo • Canais, Filmes e Séries em 4K",
    description:
      "Navegue pelos lançamentos e grade ao vivo da OnStream. Ativação imediata de teste grátis no WhatsApp!",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${outfit.variable} ${inter.variable} dark antialiased`}>
      <body className="min-h-screen flex flex-col font-sans bg-[#060913] text-[#f8fafc] selection:bg-cyan-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
