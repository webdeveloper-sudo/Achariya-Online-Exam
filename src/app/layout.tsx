import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ACHARIYA Online Examination Portal",
  description: "ACHARIYA Online Examination and Assessment System",
  metadataBase: new URL('https://achariya-assessment-portal.vercel.app/'),
  openGraph: {
    title: "ACHARIYA Assessment Portal",
    description: "ACHARIYA Online Examination and Assessment System",
    url: 'https://achariya-assessment-portal.vercel.app/',
    siteName: 'ACHARIYA Assessment Portal',
    images: [
      {
        url: '/images/ACHARIYA-lOGO-OUTLINE-01.png',
        width: 1200,
        height: 630,
        alt: 'ACHARIYA Assessment Portal',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "ACHARIYA Assessment Portal",
    description: "ACHARIYA Online Examination and Assessment System",
    images: ['/images/ACHARIYA-lOGO-OUTLINE-01.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

