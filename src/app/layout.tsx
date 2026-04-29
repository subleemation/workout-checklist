import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '개인 코치 앱',
  description: '운동 + 식단 + 타이밍 기반 코칭 앱',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '코치',
  },
}

export const viewport: Viewport = {
  themeColor: '#111827',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-full bg-gray-950 text-gray-100">
        <nav className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex gap-6 text-sm font-medium sticky top-0 z-10">
          <a href="/" className="text-blue-400 hover:text-blue-300">🏠 홈</a>
          <a href="/workout-primary" className="text-gray-300 hover:text-white">💪 1차 운동</a>
          <a href="/workout-secondary" className="text-gray-300 hover:text-white">💪 2차 운동</a>
          <a href="/condition" className="text-gray-300 hover:text-white">⚖️ 상태</a>
          <a href="/analysis" className="text-gray-300 hover:text-white">📊 분석</a>
        </nav>
        <main className="max-w-3xl mx-auto px-4 py-6">
          {children}
        </main>
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js')
            })
          }
        `}} />
      </body>
    </html>
  )
}
