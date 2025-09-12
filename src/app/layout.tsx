import './globals.css';
import { DynaPuff } from 'next/font/google';
import Providers from '../app/providers';

const dynaPuff = DynaPuff({ subsets: ['latin'] });

export const metadata = {
  title: 'Jal Entertainment',
  description: 'JALv Official EFB',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={dynaPuff.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
