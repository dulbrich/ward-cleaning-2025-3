import { createClient } from "@/utils/supabase/server";
import { ThemeProvider } from "next-themes";
import { Inter } from "next/font/google";
import AuthenticatedLayout from "./authenticated-layout";
import "./globals.css";
import UnauthenticatedLayout from "./unauthenticated-layout";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Ward Cleaning App",
  description: "Simplifying ward building cleaning management for the LDS church",
  icons: {
    icon: "/images/logo.png",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  }
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
  // Get auth status from Supabase
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAuthenticated = !!user;
  
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
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
        </ThemeProvider>
      </body>
    </html>
  );
}
