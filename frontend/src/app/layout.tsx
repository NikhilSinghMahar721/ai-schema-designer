import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Schema Designer — Natural Language to ER Diagram & SQL DDL',
  description:
    'Turn plain English into relational database schemas, interactive ER diagrams, and deterministic PostgreSQL and MySQL scripts.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className="h-full bg-slate-950 text-slate-100 antialiased font-sans selection:bg-indigo-500/30">
        {children}
      </body>
    </html>
  );
}
