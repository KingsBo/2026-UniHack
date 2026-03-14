export interface GitleaksFinding {
  RuleID: string;
  Description: string;
  File: string;
  StartLine: number;
  EndLine: number;
  StartColumn: number;
  EndColumn: number;
  Match: string;
  Secret: string;
  Commit: string;
  Author: string;
  Email: string;
  Date: string;
  Message: string;
  Tags: string[];
  Fingerprint: string;
}

export interface GitleaksResult {
  findings: GitleaksFinding[];
  summary: {
    total: number;
    repo: string;
  };
}

export interface TrivyVulnerability {
  VulnerabilityID: string;
  PkgName: string;
  PkgPath?: string;
  InstalledVersion: string;
  FixedVersion?: string;
  Severity: string;
  Title?: string;
  Description?: string;
  PrimaryURL?: string;
}

export interface TrivyResult {
  vulnerabilities: TrivyVulnerability[];
  summary: {
    total: number;
    repo: string;
    CRITICAL?: number;
    HIGH?: number;
    MEDIUM?: number;
    LOW?: number;
    UNKNOWN?: number;
  };
}

export interface ScanResponse {
  gitleaks: GitleaksResult | null;
  trivy: TrivyResult | null;
  repo: string;
}

export interface ScanError {
  error: string;
}

export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
}

export interface GitHubRepo {
  name: string;
  full_name: string;
  owner: string;
  private: boolean;
  html_url: string;
  description: string | null;
  updated_at: string;
}
