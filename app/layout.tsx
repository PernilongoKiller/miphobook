import "./globals.css";
import { SupabaseProvider } from "@/lib/SupabaseProvider";
import { ThemeProvider } from "@/lib/ThemeProvider";
import { ToastProvider } from "@/lib/ToastProvider";
import Footer from "@/components/Footer";

export const metadata = {
  title: {
    default: "Miphobook | Nem toda foto é só uma imagem",
    template: "%s | Miphobook"
  },
  description: "Miphobook: Onde nem toda foto é só uma imagem. Um espaço aconchegante para criar photobooks e compartilhar as histórias reais por trás dos seus momentos.",
  keywords: ["photobook", "memórias", "álbum de fotos", "storytelling", "fotografia", "diário visual", "miphobook"],
  authors: [{ name: "PernilongoKiller" }],
  creator: "PernilongoKiller",
  publisher: "Miphobook",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: "Miphobook | Sua jornada em memórias",
    description: "Compartilhe as histórias por trás das suas fotos em um espaço feito para durar.",
    url: "https://miphobook.vercel.app",
    siteName: "Miphobook",
    images: [
      {
        url: "/logo.svg",
        width: 800,
        height: 600,
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Miphobook | Sua jornada em memórias",
    description: "Um hub de memórias e momentos focado em contar histórias.",
    images: ["/logo.svg"],
  },
  // Injetando o CSS das fontes de forma oficial via metadados
  other: {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Poppins:wght@400;700&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Fallback caso os metadados demorem a injetar */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Poppins:wght@400;700&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      </head>
      <body>
        <ThemeProvider>
          <ToastProvider>
            <SupabaseProvider>
              {children}
              <Footer />
            </SupabaseProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
