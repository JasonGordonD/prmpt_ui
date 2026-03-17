import type { Metadata } from 'next';
import { Cormorant_Garamond, Courier_Prime, Inter } from 'next/font/google';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-display-face',
});

const courier = Courier_Prime({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono-face',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body-face',
});

export const metadata: Metadata = {
  title: 'PRMPT',
  description: 'Voice AI Agent Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${cormorant.variable} ${courier.variable} ${inter.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
