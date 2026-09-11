import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}

