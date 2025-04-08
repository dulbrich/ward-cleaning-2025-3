import { createClient } from "@/utils/supabase/server";
import { ThemeProvider } from "next-themes";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import AuthenticatedLayout from "./authenticated-layout";
import "./globals.css";
import UnauthenticatedLayout from "./unauthenticated-layout";

// Force dynamic rendering for all pages
export const dynamic = 'force-dynamic';

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Ward Cleaning App",
  description: "Simplifying ward building cleaning management for the LDS church",
  icons: {
    icon: "/images/logo.png",
  }
};

// Separate viewport export as recommended by Next.js
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const inter = Inter({
  weight: ["400", "500", "600", "700"],
  display: "swap",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Use try-catch to avoid breaking the app if Supabase client fails
  let isAuthenticated = false;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    isAuthenticated = !!user;
  } catch (error) {
    console.error("Error checking authentication:", error);
    // Default to unauthenticated if there's an error
    isAuthenticated = false;
  }
  
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png"></link>
      </head>
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {isAuthenticated && <AuthenticatedLayout>{children}</AuthenticatedLayout>}
          {!isAuthenticated && <UnauthenticatedLayout>{children}</UnauthenticatedLayout>}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
