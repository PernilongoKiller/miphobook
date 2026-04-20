import "./globals.css";
import { SupabaseProvider } from "@/lib/SupabaseProvider";
import { ThemeProvider } from "@/lib/ThemeProvider";
import { ToastProvider } from "@/lib/ToastProvider";
import Footer from "@/components/Footer";

export const metadata = {
  title: "miphobook",
  description: "Nem toda foto é só uma imagem.",
  icons: {
    icon: '/logo.svg',
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
