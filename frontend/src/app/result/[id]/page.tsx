'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import ScanSummaryBar from '@/components/results/ScanSummaryBar'
import FindingCard from '@/components/results/FindingCard'
import type { ScanTool, ScanResult, Finding, Severity } from '@/types'

const TOOLS: { key: 'all' | ScanTool; label: string }[] = [
  { key: 'all',        label: 'All tools' },
  { key: 'gitleaks',   label: 'Gitleaks' },
  { key: 'trivy',      label: 'Trivy' },
]

const SEV_ORDER: Severity[] = ['critical', 'high', 'medium', 'low', 'info']

/* ---- Beginner-friendly explanation helpers ---- */

function explainGitleaksFinding(f: Finding): string {
  const file = f.file ? `\`${f.file}\`` : 'your codebase'

  // Detect the kind of secret from the rule / title
  const lower = (f.title + ' ' + (f.rule || '')).toLowerCase()
  let secretType = 'a secret or credential'
  let risk = 'If someone gains access to your repository (or it\'s public), they could use this secret to access external services on your behalf.'
  let fix = 'Remove the secret from your code, then rotate (change) it in the service\'s dashboard so the old one no longer works.'

  if (lower.includes('aws')) {
    secretType = 'an AWS access key'
    risk = 'Anyone with this key can spin up servers, read your S3 buckets, or rack up charges on your AWS account. This is one of the most dangerous secrets to leak.'
    fix = 'Go to the AWS IAM console, deactivate or delete this key, and create a new one. Store the new key in an environment variable (e.g. in a `.env` file that\'s git-ignored) or use AWS Secrets Manager.'
  } else if (lower.includes('github') || lower.includes('ghp_')) {
    secretType = 'a GitHub personal access token'
    risk = 'This token lets anyone perform actions as you on GitHub — reading private repos, pushing code, or even deleting repositories depending on the token\'s scopes.'
    fix = 'Revoke the token at github.com → Settings → Developer settings → Personal access tokens. Generate a new one and store it as an environment variable, never in source code.'
  } else if (lower.includes('stripe')) {
    secretType = 'a Stripe API key'
    risk = 'Stripe keys control payment processing. A leaked secret key could let an attacker issue refunds, view customer payment details, or create charges.'
    fix = 'Roll the key in your Stripe Dashboard → Developers → API keys. Use environment variables to inject it at runtime.'
  } else if (lower.includes('database') || lower.includes('db_') || lower.includes('postgres') || lower.includes('mysql')) {
    secretType = 'a database connection string or password'
    risk = 'With database credentials, an attacker could read, modify, or delete all of your application\'s data.'
    fix = 'Change the database password immediately, then store the new credentials in environment variables or a secrets manager — never commit them to Git.'
  } else if (lower.includes('jwt') || lower.includes('token') || lower.includes('bearer')) {
    secretType = 'an authentication token or JWT secret'
    risk = 'If this is a signing secret, anyone with it can forge valid tokens and impersonate any user in your application.'
    fix = 'Regenerate the secret, update your server config, and store it in an environment variable.'
  } else if (lower.includes('api') && lower.includes('key')) {
    secretType = 'an API key'
    risk = 'An exposed API key can be used to make requests to third-party services as if they came from your app, potentially consuming quota or accessing private data.'
    fix = 'Regenerate the key in the provider\'s dashboard and inject it via environment variables.'
  }

  return `The scanner found ${secretType} hardcoded in ${file}.\n\n**Why this is a problem:** ${risk}\n\n**What to do:** ${fix}\n\n**General rule of thumb:** Never commit secrets to Git. Even if you delete them later, they remain in your Git history. Use a \`.env\` file (add it to \`.gitignore\`) or a secrets manager instead.`
}

function explainTrivyFinding(f: Finding): string {
  const pkg = f.pkgName || 'a dependency'
  const version = f.installedVersion ? ` (version ${f.installedVersion})` : ''
  const cve = f.cveId || f.rule || 'a known vulnerability'

  const lower = (f.title + ' ' + f.description).toLowerCase()
  let explanation = `Your project uses the package **${pkg}**${version}, which has a known security vulnerability (${cve}).`
  let whyItMatters = 'Attackers can exploit known vulnerabilities in outdated packages to compromise your application — even if your own code is perfectly secure.'

  if (lower.includes('sql injection')) {
    whyItMatters = 'SQL injection lets attackers run arbitrary database queries through your app. They could steal data, modify records, or even drop entire tables. This is consistently ranked as one of the top web vulnerabilities.'
  } else if (lower.includes('xss') || lower.includes('cross-site scripting')) {
    whyItMatters = 'Cross-Site Scripting (XSS) lets attackers inject malicious JavaScript into pages your users visit. This can steal session cookies, redirect users to phishing sites, or deface your application.'
  } else if (lower.includes('denial of service') || lower.includes('redos') || lower.includes('dos')) {
    whyItMatters = 'A Denial of Service (DoS) vulnerability means an attacker can send a specially crafted request that causes your server to hang or crash, making your app unavailable to real users.'
  } else if (lower.includes('ssrf') || lower.includes('server-side request')) {
    whyItMatters = 'Server-Side Request Forgery (SSRF) lets an attacker trick your server into making HTTP requests to internal services, potentially accessing private APIs, metadata endpoints, or internal databases.'
  } else if (lower.includes('redirect')) {
    whyItMatters = 'Open redirect vulnerabilities let attackers craft a URL on your domain that redirects users to a malicious site. Since the URL starts with your domain, users are more likely to trust it — making it useful for phishing attacks.'
  } else if (lower.includes('remote code') || lower.includes('rce')) {
    whyItMatters = 'Remote Code Execution (RCE) is one of the most severe vulnerability types. It means an attacker can run arbitrary code on your server, giving them full control over the machine.'
  }

  let fix = ''
  if (f.fixedVersion) {
    fix = `\n\n**How to fix it:** Upgrade **${pkg}** to version **${f.fixedVersion}** or later. If you\'re using npm, run \`npm update ${pkg}\` or manually set the version in your \`package.json\`. If it\'s a transitive dependency (installed by another package), you may need to update the parent package instead.`
  } else {
    fix = `\n\n**How to fix it:** There\'s no patched version available yet. Check the CVE link below for workarounds, and consider whether you can replace this package with an alternative. Keep an eye on the package\'s release notes for a fix.`
  }

  const cveLink = f.cveId ? `\n\n**Learn more:** Look up \`${f.cveId}\` on the NVD (National Vulnerability Database) for full technical details and severity scoring.` : ''

  return `${explanation}\n\n**Why this matters:** ${whyItMatters}${fix}${cveLink}`
}

function explainFinding(f: Finding): string {
  if (f.tool === 'gitleaks') return explainGitleaksFinding(f)
  if (f.tool === 'trivy') return explainTrivyFinding(f)
  return f.description
}

/** Build a beginner-friendly AI summary from the actual findings */
function buildAiSummary(scan: ScanResult) {
  const findings = scan.findings
  const total = findings.length
  const bySev: Record<string, Finding[]> = {}
  const byTool: Record<string, number> = {}

  for (const f of findings) {
    ;(bySev[f.severity] ??= []).push(f)
    byTool[f.tool] = (byTool[f.tool] || 0) + 1
  }

  const sections: { heading: string; body: string }[] = []

  // No issues
  if (total === 0) {
    sections.push({
      heading: 'No issues found',
      body: `Great news — no security findings were detected in **${scan.repoName}** on the \`${scan.branch}\` branch.\n\nThis means the scanners didn't find any hardcoded secrets or known vulnerable packages. Keep it up! As your project grows, it's a good idea to run scans regularly — new vulnerabilities are published every day, and a dependency that's safe today might have a CVE tomorrow.`,
    })
    return sections
  }

  // Overview — explain what a "finding" is
  const sevBreakdown = SEV_ORDER
    .filter((s) => (bySev[s]?.length ?? 0) > 0)
    .map((s) => `${bySev[s].length} ${s}`)
    .join(', ')

  const toolNames = Object.keys(byTool).join(' and ')

  sections.push({
    heading: 'What we found',
    body: `We scanned **${scan.repoName}** and found **${total} security issue${total > 1 ? 's' : ''}** (${sevBreakdown}).\n\n${byTool['gitleaks'] ? `**Gitleaks** checks for secrets (like API keys or passwords) accidentally committed to your code. It found ${byTool['gitleaks']} issue${byTool['gitleaks'] > 1 ? 's' : ''}.\n\n` : ''}${byTool['trivy'] ? `**Trivy** checks your project's dependencies for known vulnerabilities (CVEs). It found ${byTool['trivy']} issue${byTool['trivy'] > 1 ? 's' : ''}.\n\n` : ''}Severity levels range from **critical** (fix immediately) to **low** (good to know, fix when convenient). Think of it like a hospital triage — critical means "this is actively dangerous", while low means "keep an eye on it."`,
  })

  // Critical / High — explain each one in depth
  const urgent = [...(bySev.critical || []), ...(bySev.high || [])]
  if (urgent.length > 0) {
    sections.push({
      heading: `Fix these first (${urgent.length} critical/high)`,
      body: 'These findings represent the biggest risks to your project. An attacker actively looking at your repository could exploit these. Here\'s what each one means:',
    })

    for (const f of urgent.slice(0, 6)) {
      sections.push({
        heading: f.title,
        body: explainFinding(f),
      })
    }

    if (urgent.length > 6) {
      sections.push({
        heading: `+${urgent.length - 6} more critical/high findings`,
        body: 'The remaining critical/high findings follow similar patterns. Expand individual finding cards on the left to see details for each one.',
      })
    }
  }

  // Medium
  if ((bySev.medium?.length ?? 0) > 0) {
    const mediums = bySev.medium
    sections.push({
      heading: `Worth addressing (${mediums.length} medium)`,
      body: 'These aren\'t emergencies, but they\'re real vulnerabilities that should be fixed soon — especially before deploying to production.',
    })

    for (const f of mediums.slice(0, 3)) {
      sections.push({
        heading: f.title,
        body: explainFinding(f),
      })
    }

    if (mediums.length > 3) {
      sections.push({
        heading: `+${mediums.length - 3} more medium findings`,
        body: 'Check the finding cards on the left for full details on each remaining medium-severity issue.',
      })
    }
  }

  // Low
  if ((bySev.low?.length ?? 0) > 0) {
    const lows = bySev.low
    const examples = lows.slice(0, 2).map((f) => `**${f.title}**`).join(', ')
    sections.push({
      heading: `Good to know (${lows.length} low)`,
      body: `These are minor issues or informational findings: ${examples}${lows.length > 2 ? `, and ${lows.length - 2} more` : ''}.\n\nLow-severity findings are unlikely to be exploited on their own, but they can become more serious when combined with other issues. It's good practice to address these during routine updates or code cleanup.`,
    })
  }

  // Actionable next steps
  const steps: string[] = []
  const hasSecrets = findings.some((f) => f.tool === 'gitleaks')
  const hasFixable = findings.some((f) => f.fixedVersion)

  if (hasSecrets) {
    steps.push('**Rotate your secrets now.** Any key or token found by Gitleaks should be considered compromised. Go to each service\'s dashboard, revoke the old credential, and generate a new one.')
    steps.push('**Add a `.env` file** to store secrets, and make sure `.env` is listed in your `.gitignore` so it never gets committed.')
    steps.push('**Clean your Git history.** Even after deleting a secret from your code, it still lives in previous commits. Use a tool like `git filter-repo` or BFG Repo Cleaner to scrub it from history.')
  }
  if (hasFixable) {
    steps.push('**Update vulnerable packages.** Run `npm update` or `npm audit fix` to automatically upgrade dependencies with known fixes. If that doesn\'t work, manually update versions in `package.json`.')
  }
  steps.push('**Run scans regularly.** New vulnerabilities are disclosed every day. Re-scan your project periodically, especially after adding new dependencies.')

  sections.push({
    heading: 'Next steps',
    body: steps.map((s, i) => `${i + 1}. ${s}`).join('\n\n'),
  })

  return sections
}

export default function ResultPage() {
  const params = useParams()
  const scanId = params.id as string
  const [scan, setScan] = useState<ScanResult | null>(null)
  const [activeTool, setActiveTool] = useState<'all' | ScanTool>('all')
  const [showAiSummary, setShowAiSummary] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/scan/${scanId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Scan not found')
        return res.json()
      })
      .then((data) => setScan(data as ScanResult))
      .catch(() => {
        setLoadError('Scan result not found. Please run a new scan from the dashboard.')
      })
  }, [scanId])

  const aiSections = useMemo(() => (scan ? buildAiSummary(scan) : []), [scan])

  if (loadError) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg0)' }}>
        <Header variant="app" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="font-mono text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{loadError}</p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/" className="font-mono text-sm transition-colors hover:underline" style={{ color: 'var(--accent)' }}>
                ← home
              </Link>
              <Link href="/result/demo" className="font-mono text-sm transition-colors hover:underline" style={{ color: 'var(--text-muted)' }}>
                view demo report
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!scan) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg0)' }}>
        <Header variant="app" />
        <div className="flex-1 flex items-center justify-center">
          <p className="font-mono text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</p>
        </div>
      </div>
    )
  }

  const filtered =
    activeTool === 'all'
      ? scan.findings
      : scan.findings.filter((f) => f.tool === activeTool)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg0)' }}>
      <Header variant="app" />

      <div className="px-8 py-10 max-w-[1400px] mx-auto w-full">
        {/* Back */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 font-mono text-xs mb-8 transition-colors hover:opacity-80"
          style={{ color: 'var(--text-muted)' }}
        >
          ← back to dashboard
        </Link>

        <ScanSummaryBar scan={scan} />

        {/* Tool filter tabs and Actions */}
        <div
          className="flex items-center justify-between gap-4 mb-6 pb-5 flex-wrap"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2 flex-wrap">
          {TOOLS.map(({ key, label }) => {
            const count = key === 'all'
              ? scan.findings.length
              : scan.findings.filter((f) => f.tool === key).length
            return (
              <button
                key={key}
                onClick={() => setActiveTool(key)}
                className="flex items-center gap-2 px-4 py-2 font-mono text-[11px] tracking-widest uppercase rounded-lg transition-all"
                style={
                  activeTool === key
                    ? { background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid rgba(123,110,246,0.25)' }
                    : { background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                }
              >
                {label}
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded"
                  style={
                    activeTool === key
                      ? { background: 'rgba(123,110,246,0.2)', color: 'var(--accent)' }
                      : { background: 'var(--bg2)', color: 'var(--text-muted)' }
                  }
                >
                  {count}
                </span>
              </button>
            )
          })}
          </div>

          {/* AI Toggle */}
          <button
            onClick={() => setShowAiSummary(!showAiSummary)}
            className="flex items-center gap-2 px-4 py-2 text-[11px] font-semibold tracking-widest uppercase rounded-lg transition-all"
            style={
              showAiSummary
                ? { background: 'var(--accent)', color: '#fff', border: '1px solid var(--accent)' }
                : { background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid rgba(123,110,246,0.25)' }
            }
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={showAiSummary ? "text-white" : ""}>
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
            {showAiSummary ? 'Hide AI Summary' : 'AI Security Summary'}
          </button>
        </div>

        {/* Main content: side-by-side when AI summary is open */}
        <div className={`flex gap-8 ${showAiSummary ? 'items-start' : ''}`}>
          {/* Findings column */}
          <div className={`flex flex-col gap-3 transition-all duration-300 ${showAiSummary ? 'w-1/2 min-w-0' : 'w-full'}`}>
            {filtered.map((finding) => (
              <FindingCard key={finding.id} finding={finding} />
            ))}
            {filtered.length === 0 && (
              <div className="py-16 text-center font-mono text-sm" style={{ color: 'var(--text-muted)' }}>
                No findings for this tool.
              </div>
            )}
          </div>

          {/* AI Summary panel — takes up half the page */}
          {showAiSummary && (
            <div className="w-1/2 min-w-0 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto animate-fade-in-up">
              <div className="rounded-xl p-8 flex flex-col gap-6" style={{ background: 'var(--bg1)', border: '1px solid var(--border)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
                {/* Header */}
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-10 h-10 rounded-full" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                    </svg>
                  </span>
                  <div>
                    <h3 className="font-bold tracking-tight text-base" style={{ color: 'var(--text-primary)' }}>AI Security Analysis</h3>
                    <p className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      Automated summary of {scan.findings.length} finding{scan.findings.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Summary sections */}
                {aiSections.map((section, idx) => (
                  <div key={idx} className="flex flex-col gap-2">
                    <h4 className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                      {section.heading}
                    </h4>
                    <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-secondary)' }}>
                      {section.body.split(/(\*\*.*?\*\*)/g).map((part, i) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                          return <strong key={i} style={{ color: 'var(--text-primary)' }}>{part.slice(2, -2)}</strong>
                        }
                        // Handle inline code
                        return part.split(/(`.*?`)/g).map((sub, j) => {
                          if (sub.startsWith('`') && sub.endsWith('`')) {
                            return (
                              <code key={`${i}-${j}`} className="font-mono text-[11px] px-1 py-0.5 rounded"
                                style={{ background: 'var(--bg2)', color: 'var(--text-primary)' }}>
                                {sub.slice(1, -1)}
                              </code>
                            )
                          }
                          return sub
                        })
                      })}
                    </div>
                    {idx < aiSections.length - 1 && (
                      <div className="h-px mt-2" style={{ background: 'var(--border)' }} />
                    )}
                  </div>
                ))}

                {/* Severity breakdown */}
                {scan.findings.length > 0 && (
                  <div className="pt-2">
                    <h4 className="text-sm font-semibold tracking-tight mb-3" style={{ color: 'var(--text-primary)' }}>
                      Severity breakdown
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {SEV_ORDER.map((sev) => {
                        const count = scan.findings.filter((f) => f.severity === sev).length
                        if (count === 0) return null
                        const colors: Record<string, { color: string; bg: string }> = {
                          critical: { color: '#F25C5C', bg: 'rgba(242,92,92,0.08)' },
                          high:     { color: '#F58025', bg: 'rgba(245,128,37,0.08)' },
                          medium:   { color: '#F5A623', bg: 'rgba(245,166,35,0.08)' },
                          low:      { color: '#2DD98F', bg: 'rgba(45,217,143,0.08)' },
                          info:     { color: '#7B6EF6', bg: 'rgba(123,110,246,0.08)' },
                        }
                        const c = colors[sev] ?? colors.info
                        return (
                          <div key={sev} className="flex items-center justify-between px-3 py-2 rounded-lg"
                            style={{ background: c.bg }}>
                            <span className="font-mono text-xs capitalize" style={{ color: c.color }}>{sev}</span>
                            <span className="font-mono text-xs font-bold" style={{ color: c.color }}>{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Tool breakdown */}
                {scan.findings.length > 0 && (
                  <div className="pt-2">
                    <h4 className="text-sm font-semibold tracking-tight mb-3" style={{ color: 'var(--text-primary)' }}>
                      By scanner
                    </h4>
                    <div className="flex gap-2">
                      {(['gitleaks', 'trivy'] as ScanTool[]).map((tool) => {
                        const count = scan.findings.filter((f) => f.tool === tool).length
                        if (count === 0) return null
                        return (
                          <div key={tool} className="flex items-center gap-2 px-3 py-2 rounded-lg"
                            style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                            <span className="font-mono text-xs uppercase" style={{ color: 'var(--text-secondary)' }}>{tool}</span>
                            <span className="font-mono text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="pt-4 flex gap-2" style={{ borderTop: '1px dashed var(--border)' }}>
                  <span className="font-mono text-[10px] px-2 py-1 rounded" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>Auto-generated</span>
                  <span className="font-mono text-[10px] px-2 py-1 rounded" style={{ background: 'var(--bg2)', color: 'var(--text-muted)' }}>
                    {scan.findings.length} findings analysed
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
