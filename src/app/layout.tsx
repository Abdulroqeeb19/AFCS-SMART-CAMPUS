import type { Metadata } from "next";
import "./globals.css";

import { Nav } from "@/components/nav";
import { TopNav } from "@/components/top-nav";
import { DevAuthInterceptor } from "@/components/dev-auth-interceptor";
import { AuthGate } from "@/components/auth-gate";
import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "@/providers/theme-provider";
import { SidebarProvider } from "@/providers/sidebar-provider";
import { SuppressExtensionErrors } from "@/components/suppress-extension-errors";
import { APP_NAME, APP_SCHOOL } from "@/lib/constants";

export const metadata: Metadata = {
  title: APP_NAME,
  description: `Smart Campus Operating System - ${APP_SCHOOL}`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body suppressHydrationWarning className="min-h-screen antialiased font-sans">
        <ThemeProvider>
          <AuthProvider>
            <SidebarProvider>
              <SuppressExtensionErrors />
              {process.env.NEXT_PUBLIC_DEV_MODE === 'true' && <DevAuthInterceptor />}
              <div className="flex min-h-screen">
                <Nav />
                <div className="flex flex-1 flex-col min-w-0">
                  <TopNav />
                  <main className="flex-1 overflow-auto p-4 md:p-8">
                    <AuthGate>{children}</AuthGate>
                  </main>
                </div>
              </div>
            </SidebarProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
