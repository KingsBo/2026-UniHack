import Link from 'next/link'

export default function DocsPage() {
  return (
    <div className="max-w-3xl mx-auto px-8 py-12">
      <div className="mb-12">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>
          Documentation
        </h1>
        <p className="font-mono text-sm" style={{ color: 'var(--text-muted)' }}>
          // Kestrel security scanning for your repositories
        </p>
      </div>

      <nav className="mb-14 flex flex-wrap gap-2">
        {[
          { id: 'getting-started', label: 'Getting started' },
          { id: 'tools', label: 'Scan tools' },
          { id: 'results', label: 'Understanding results' },
          { id: 'api', label: 'API & keys' },
        ].map((item) => (
          <a key={item.id} href={`#${item.id}`} className="px-3 py-1.5 text-xs font-mono rounded-lg transition-colors" style={{ background: 'var(--bg2)', color: 'var(--text-secondary)' }}>
            {item.label}
          </a>
        ))}
      </nav>

      <article className="space-y-14">
        <section id="getting-started">
          <h2 className="text-xl font-bold tracking-tight mb-4" style={{ color: 'var(--text-primary)' }}>Getting started</h2>
          <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
            Kestrel runs security scans on your Git repositories using industry-standard tools. Add a repo from the dashboard, run a scan, and review findings by severity.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
            <li>Connect your repository (GitHub/GitLab or clone URL)</li>
            <li>Choose which tools to run: Semgrep, Gitleaks, Trivy</li>
            <li>Start a scan — results appear in Scan history and on the result page</li>
            <li>Fix or dismiss findings and re-scan as needed</li>
          </ol>
          <p className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>
            Try the <Link href="/result/demo" className="underline" style={{ color: 'var(--accent)' }}>demo result</Link> to see a sample report.
          </p>
        </section>

        <section id="tools">
          <h2 className="text-xl font-bold tracking-tight mb-4" style={{ color: 'var(--text-primary)' }}>Scan tools</h2>
          <div className="space-y-6">
            <div className="rounded-xl p-5" style={{ background: 'var(--bg1)', border: '1px solid var(--border)' }}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Semgrep</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Static analysis for code quality and security (SAST). Detects bugs, vulnerabilities, and policy violations across many languages.
              </p>
            </div>
            <div className="rounded-xl p-5" style={{ background: 'var(--bg1)', border: '1px solid var(--border)' }}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Gitleaks</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Finds secrets and credentials in your repo history: API keys, passwords, tokens, and other sensitive data that shouldn’t be committed.
              </p>
            </div>
            <div className="rounded-xl p-5" style={{ background: 'var(--bg1)', border: '1px solid var(--border)' }}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Trivy</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Scans dependencies and container images for known vulnerabilities (CVEs) and misconfigurations.
              </p>
            </div>
          </div>
        </section>

        <section id="results">
          <h2 className="text-xl font-bold tracking-tight mb-4" style={{ color: 'var(--text-primary)' }}>Understanding results</h2>
          <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
            Findings are grouped by severity: <span className="font-mono" style={{ color: 'var(--red)' }}>Critical</span>, <span className="font-mono" style={{ color: 'var(--amber)' }}>High</span>, <span className="font-mono" style={{ color: 'var(--vc-green)' }}>Medium</span>, and <span className="font-mono" style={{ color: 'var(--text-muted)' }}>Low</span>. Each finding includes location, rule ID, and a short description. Use the result page to filter by tool or severity and to navigate to the relevant file and line.
          </p>
        </section>

        <section id="api">
          <h2 className="text-xl font-bold tracking-tight mb-4" style={{ color: 'var(--text-primary)' }}>API & keys</h2>
          <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
            Manage API keys from <Link href="/dashboard/keys" className="underline" style={{ color: 'var(--accent)' }}>Dashboard → API keys</Link>. Use keys to trigger scans or fetch results from CI/CD or your own scripts. Keys are scoped to your account; rotate them from the dashboard if compromised.
          </p>
        </section>
      </article>

      <footer className="mt-16 pt-8 border-t" style={{ borderColor: 'var(--border)' }}>
        <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
          Need help? Contact support or open an issue in the Kestrel repo.
        </p>
      </footer>
    </div>
  )
}
