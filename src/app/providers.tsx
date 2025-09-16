'use client';
import { CookiesProvider } from 'react-cookie';
import { LanguageProvider } from '../lib/LanguageContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CookiesProvider>
      <LanguageProvider>
        {children}
      </LanguageProvider>
    </CookiesProvider>
  );
}
