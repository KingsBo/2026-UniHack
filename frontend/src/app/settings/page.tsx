'use client'

import { useState } from 'react'

const inputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.style.borderColor = 'var(--accent)'
  e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)'
}
const inputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.style.borderColor = ''
  e.target.style.boxShadow = 'none'
}

const inputStyle = { background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }

export default function SettingsPage() {
  const [name, setName] = useState('Jane Smith')
  const [email, setEmail] = useState('jane@company.com')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  return (
    <div className="px-12 py-10">
      <div className="mb-9">
        <h1 className="text-2xl font-extrabold tracking-tight mb-1.5" style={{ color: 'var(--text-primary)' }}>
          Preferences
        </h1>
        <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
          // manage your account and preferences
        </p>
      </div>

      <div className="flex flex-wrap gap-10">
      {/* Account details */}
      <div className="flex-1 min-w-[280px] rounded-2xl p-8" style={{ background: 'var(--bg1)', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <h2 className="text-sm font-semibold tracking-tight mb-5" style={{ color: 'var(--text-primary)' }}>Account details</h2>
        <div className="space-y-6">
          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Full name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 text-sm font-mono rounded-xl outline-none transition-all" style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
          </div>
          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 text-sm font-mono rounded-xl outline-none transition-all placeholder:opacity-60" style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
          </div>
        </div>
        <button type="button" className="mt-8 relative overflow-hidden px-6 py-3 text-sm font-semibold tracking-wide text-white rounded-xl transition-all hover:-translate-y-px" style={{ background: 'var(--accent)' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(123,110,246,0.35)' }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
          <span className="relative z-10">Save account details</span>
          <span className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.12), transparent)' }} />
        </button>
      </div>

      {/* Change password */}
      <div className="flex-1 min-w-[280px] rounded-2xl p-8" style={{ background: 'var(--bg1)', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <h2 className="text-sm font-semibold tracking-tight mb-5" style={{ color: 'var(--text-primary)' }}>Change password</h2>
        <div className="space-y-6">
          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Current password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••••" className="w-full px-4 py-3 text-sm font-mono rounded-xl outline-none transition-all placeholder:opacity-60" style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
          </div>
          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: 'var(--text-muted)' }}>New password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••••" className="w-full px-4 py-3 text-sm font-mono rounded-xl outline-none transition-all placeholder:opacity-60" style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
          </div>
          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Confirm new password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••••" className="w-full px-4 py-3 text-sm font-mono rounded-xl outline-none transition-all placeholder:opacity-60" style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
          </div>
        </div>
        <button type="button" className="mt-8 relative overflow-hidden px-6 py-3 text-sm font-semibold tracking-wide text-white rounded-xl transition-all hover:-translate-y-px" style={{ background: 'var(--accent)' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(123,110,246,0.35)' }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
          <span className="relative z-10">Update password</span>
          <span className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.12), transparent)' }} />
        </button>
      </div>
      </div>
    </div>
  )
}
