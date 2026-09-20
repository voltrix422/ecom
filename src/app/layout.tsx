import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrument = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: {
    default: "ayeshaswear — Women’s unstitched suits",
    template: "%s — ayeshaswear",
  },
  description:
    "Women’s unstitched three-piece shalwar kameez suits.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${instrument.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <script
          dangerouslySetInnerHTML={{
            __html:
              "if(!/Mac|iPhone|iPad|iPod/.test(navigator.userAgent))document.documentElement.setAttribute('data-cursor','custom')",
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
