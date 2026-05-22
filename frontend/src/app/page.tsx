import Header from '@/components/layout/Header'
import Hero from '@/components/landing/Hero'

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: 'var(--bg0)' }}>
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 pointer-events-none flex justify-center overflow-hidden">
        {/* Top-left accent glow */}
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[100px] opacity-70"
             style={{ background: 'radial-gradient(circle, var(--accent-dim) 0%, transparent 70%)' }} />
        
        {/* Bottom-right accent glow */}
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px] opacity-70"
             style={{ background: 'radial-gradient(circle, var(--accent-dim) 0%, transparent 70%)' }} />
        
        {/* Subtle full-page grid */}
        <div className="absolute inset-0 opacity-70"
             style={{
               backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
               backgroundSize: '4rem 4rem',
               maskImage: 'linear-gradient(to bottom, black 30%, transparent 100%)',
               WebkitMaskImage: 'linear-gradient(to bottom, black 30%, transparent 100%)'
             }} />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col flex-1 pointer-events-auto w-full">
        <Header variant="landing" />
        <Hero />
      </div>
    </main>
  )
}
