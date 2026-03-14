export interface Finding {
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

export interface ScanResponse {
  findings: Finding[];
  summary: {
    total: number;
    repo: string;
  };
}

export interface ScanError {
  error: string;
  errorType?: "REPO_NOT_FOUND" | "REPO_NOT_FOUND_OR_PRIVATE" | "PRIVATE_REPO" | "AUTH_FAILED";
}

export interface Repo {
  id: number;
  name: string;
  fullName: string;
  url: string;
  cloneUrl: string;
  private: boolean;
  description: string | null;
  updatedAt: string;
}
