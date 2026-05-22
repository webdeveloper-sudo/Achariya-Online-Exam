import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ACHARIYA Assessment Portal",
  description: "ACHARIYA Online Examination and Assessment System",
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

