import type { Metadata } from 'next'
import './globals.css'
import ThemeProviderClient from '@/components/ThemeProviderClient'
import { AuthProvider } from '@/context/AuthContext'

export const metadata: Metadata = {
  title: 'Kestrel — Security scanning for your codebase',
  description: 'Link your GitHub repositories and run deep security scans.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Syne:wght@400;500;600;700;800&family=Geist+Mono:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('kestrel-theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t);})();`,
          }}
        />
      </head>
      <body>
        <ThemeProviderClient>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProviderClient>
      </body>
    </html>
  )
}
