import type { Metadata } from 'next';
import { Courier_Prime } from 'next/font/google';
import './globals.css';

const courier = Courier_Prime({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono-face',
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
      <body className={`${courier.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
