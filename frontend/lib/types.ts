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
}
