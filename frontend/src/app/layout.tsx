import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DB Architect — Natural Language Schema Engine & DDL Designer',
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
      <body className="h-full bg-zinc-950 text-zinc-100 antialiased font-sans selection:bg-blue-500/25 selection:text-white">
        {children}
      </body>
    </html>
  );
}
