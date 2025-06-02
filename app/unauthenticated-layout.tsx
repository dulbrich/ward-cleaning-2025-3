import HeaderAuth from "@/components/header-auth";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import Image from "next/image";
import Link from "next/link";

// Force dynamic rendering for unauthenticated layout
export const dynamic = 'force-dynamic';

export default function UnauthenticatedLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
        <div className="min-h-screen flex flex-col">
            <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <div className="flex items-center gap-2">
                  <Link href="/" className="flex items-center gap-2">
                    <Image 
                      src="/images/logo.png" 
                      alt="Ward Cleaning App Logo" 
                      width={40} 
                      height={40}
                    />
                    <span className="font-bold text-xl hidden sm:inline-block">Ward Cleaning</span>
                  </Link>
                </div>
                <nav className="hidden md:flex items-center gap-6 text-sm">
                  <Link href="#features" className="font-medium transition-colors hover:text-primary">
                    Features
                  </Link>
                  <Link href="#testimonials" className="font-medium transition-colors hover:text-primary">
                    Testimonials
                  </Link>
                  <Link href="#contact" className="font-medium transition-colors hover:text-primary">
                    Contact
                  </Link>
                </nav>
                <div>
                  {!hasEnvVars ? null : <HeaderAuth />}
                </div>
              </div>
            </header>
            
            <main className="flex-1">
              <div className="container mx-auto px-4 py-8">
                {children}
              </div>
            </main>

            <footer className="border-t bg-muted/40 py-8">
              <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Image 
                        src="/images/logo.png" 
                        alt="Ward Cleaning App Logo" 
                        width={32} 
                        height={32}
                      />
                      <span className="font-bold">Ward Cleaning</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Simplifying ward building cleaning management for the church
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-medium">Links</h3>
                    <ul className="space-y-2 text-sm">
                      <li><Link href="/" className="text-muted-foreground hover:text-foreground">Home</Link></li>
                      <li><Link href="#features" className="text-muted-foreground hover:text-foreground">Features</Link></li>
                      <li><Link href="#testimonials" className="text-muted-foreground hover:text-foreground">Testimonials</Link></li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-medium">Legal</h3>
                    <ul className="space-y-2 text-sm">
                      <li><Link href="/privacy" className="text-muted-foreground hover:text-foreground">Privacy Policy</Link></li>
                      <li><Link href="/terms" className="text-muted-foreground hover:text-foreground">Terms of Service</Link></li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Theme</h3>
                      <ThemeSwitcher />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      © {new Date().getFullYear()} Ward Cleaning App. All rights reserved.
                    </p>
                  </div>
                </div>
              </div>
            </footer>
          </div>
    )
  }