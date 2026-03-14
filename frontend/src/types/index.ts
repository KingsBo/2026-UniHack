// types/repo.ts
export interface Repo {
  id: string
  name: string
  description: string
  language: string
  languageColor: string
  visibility: 'public' | 'private'
  updatedAt: string
  defaultBranch: string
  fileCount: number
  lastScan?: {
    id: string
    completedAt: string
    findingCount: number
  }
}

// types/finding.ts
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'
export type ScanTool = 'semgrep' | 'gitleaks' | 'trivy' | 'bandit' | 'gosec'

export interface Finding {
  id: string
  tool: ScanTool
  severity: Severity
  title: string
  description: string
  file: string
  line: number
  rule?: string
  snippet?: string
}

// types/scan.ts
export type ScanStatus = 'pending' | 'running' | 'complete' | 'failed'

export interface ScanResult {
  id: string
  repoId: string
  repoName: string
  status: ScanStatus
  branch: string
  commitSha: string
  startedAt: string
  completedAt?: string
  durationMs?: number
  fileCount: number
  findings: Finding[]
}

export interface ScanStep {
  id: string
  label: string
  tool?: ScanTool
  status: 'pending' | 'running' | 'done' | 'failed'
}

export interface ScanHistoryEntry {
  id: string
  repoId: string
  repoName: string
  branch: string
  status: ScanStatus
  startedAt: string
  completedAt?: string
  durationMs?: number
  findingCount: number
}
