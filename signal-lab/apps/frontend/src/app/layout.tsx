import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Signal Lab',
  description: 'Scenario runner platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <header className="border-b">
            <div className="mx-auto flex h-14 max-w-5xl items-center px-4">
              <span className="font-semibold tracking-tight">⚡ Signal Lab</span>
            </div>
          </header>
          <main className="mx-auto max-w-5xl px-4 py-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
