'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from '@/components/theme';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}

export default Providers;
