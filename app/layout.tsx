import type { Metadata } from 'next'
import { Cinzel, Crimson_Text } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { StoreProvider } from '@/components/providers/store-provider'

const cinzel = Cinzel({
  variable: '--font-cinzel',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700']
})

const crimsonText = Crimson_Text({
  variable: '--font-crimson',
  subsets: ['latin'],
  weight: ['400', '600', '700']
})

export const metadata: Metadata = {
  title: 'Pen & Paper Control Panel',
  description: 'A GM helper app for pen and paper RPG sessions'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${cinzel.variable} ${crimsonText.variable} antialiased font-sans`}
      >
        <StoreProvider>
          <div className="flex min-h-screen bg-background">
            <Sidebar />
            <div className="flex-1 flex flex-col min-h-screen">
              <Header />
              <main className="flex-1 p-4 lg:p-6 overflow-auto">
                {children}
              </main>
            </div>
          </div>
        </StoreProvider>
      </body>
    </html>
  )
}
