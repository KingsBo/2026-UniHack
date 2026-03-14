import Header from '@/components/layout/Header'
import Hero from '@/components/landing/Hero'

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col" style={{ background: 'var(--bg0)' }}>
      <Header variant="landing" />
      <Hero />
    </main>
  )
}
