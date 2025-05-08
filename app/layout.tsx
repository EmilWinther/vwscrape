import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ArcGIS Map Application',
  description: 'Interactive map application with rectangle drawing and point display',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
} 