import type { Metadata } from "next";
import "./globals.css";

import { Nav } from "@/components/nav";
import { DevAuthInterceptor } from "@/components/dev-auth-interceptor";
import { AuthGate } from "@/components/auth-gate";
import { AuthProvider } from "@/contexts/auth-context";
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
        <AuthProvider>
          <SuppressExtensionErrors />
          <DevAuthInterceptor />
          <div className="flex min-h-screen">
            <Nav />

            <main className="flex-1 overflow-auto bg-zinc-50 p-4 md:p-8">
              <AuthGate>{children}</AuthGate>
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}