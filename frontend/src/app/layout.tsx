import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'نظام إدارة مكتب الخدمات والاستشارات الحكومية والمالية (SaaS ERP)',
  description: 'منظومة SaaS ERP احترافية لإدارة مكاتب الاستشارات والخدمات الحكومية والمالية والسجلات التجارية والضرائب',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body className="bg-slate-900 text-slate-100 min-h-screen antialiased selection:bg-sky-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
