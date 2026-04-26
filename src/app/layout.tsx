import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { Toaster } from 'sonner';
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Open Source Hunter",
  description: "Find the perfect open source issues for your skills",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-[family-name:var(--font-space-grotesk)] text-zinc-100 bg-[#0A0A0A] selection:bg-lime-400 selection:text-black">
        {children}
        <Toaster 
          theme="dark" 
          position="top-center" 
          toastOptions={{
            className: 'font-[family-name:var(--font-space-grotesk)] border border-lime-400/20 bg-black text-zinc-100',
            style: { backdropFilter: 'blur(10px)' }
          }} 
        />
      </body>
    </html>
  );
}
