// --- Frontend UI types ---

export interface Repo {
  id: string
  githubId: number
  name: string
  full_name: string
  owner: string
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

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'
export type ScanTool = 'gitleaks' | 'trivy'

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
  commit?: string
  author?: string
  pkgName?: string
  installedVersion?: string
  fixedVersion?: string
  cveId?: string
  primaryUrl?: string
}

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
  aiSummary?: string | null
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

// --- Scanner backend types ---

export interface GitleaksFinding {
  RuleID: string
  Description: string
  File: string
  StartLine: number
  EndLine: number
  StartColumn: number
  EndColumn: number
  Match: string
  Secret: string
  Commit: string
  Author: string
  Email: string
  Date: string
  Message: string
  Tags: string[]
  Fingerprint: string
}

export interface GitleaksResult {
  findings: GitleaksFinding[]
  summary: {
    total: number
    repo: string
  }
}

export interface TrivyVulnerability {
  VulnerabilityID: string
  PkgName: string
  PkgPath?: string
  InstalledVersion: string
  FixedVersion?: string
  Severity: string
  Title?: string
  Description?: string
  PrimaryURL?: string
}

export interface TrivyResult {
  vulnerabilities: TrivyVulnerability[]
  summary: {
    total: number
    repo: string
    CRITICAL?: number
    HIGH?: number
    MEDIUM?: number
    LOW?: number
    UNKNOWN?: number
  }
}

export interface ScanResponse {
  gitleaks: GitleaksResult | null
  trivy: TrivyResult | null
  repo: string
  errors: {
    gitleaks: string | null
    trivy: string | null
  }
}

export interface GitHubUser {
  login: string
  name: string | null
  avatar_url: string
}

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  owner: string
  private: boolean
  html_url: string
  description: string | null
  language: string | null
  default_branch: string
  updated_at: string
}
