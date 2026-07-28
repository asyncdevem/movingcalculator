import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from '@/context/AppContext';
import { Navbar } from '@/components/Navbar';
import { QuoteModal } from '@/components/QuoteModal';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DAN - THE MOVING MAN | Moving Quote Calculator",
  description: "Professional long-distance moving quote calculator with real-time pricing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppProvider>
          <div className="min-h-screen flex flex-col bg-[#0b0b0e] text-white font-sans antialiased">
            <Navbar />

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>

            <footer className="border-t border-[#22222a] bg-[#0b0b0e] py-6 no-print">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
                <div>
                  &copy; {new Date().getFullYear()} <strong className="text-white">DAN - <span className="text-[#e62329]">THE MOVING MAN</span></strong>. Compliance & Long Distance Quote Portal.
                </div>
                <div className="flex items-center gap-4 font-bold">
                  <span>Version 1.0</span>
                  <span>•</span>
                  <span className="text-[#e62329]">100% Mobile Responsive</span>
                </div>
              </div>
            </footer>

            {/* Printable Invoice Modal */}
            <QuoteModal />
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
