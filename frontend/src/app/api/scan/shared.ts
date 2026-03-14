import { GoogleAuth } from "google-auth-library";

export const GITLEAKS_SERVICE_URL =
  process.env.GITLEAKS_SERVICE_URL || "http://localhost:3001";
export const TRIVY_SERVICE_URL =
  process.env.TRIVY_SERVICE_URL || "http://localhost:3002";

let googleAuth: GoogleAuth | null = null;

export function getGoogleAuth(): GoogleAuth | null {
  if (googleAuth) return googleAuth;
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    googleAuth = new GoogleAuth();
    return googleAuth;
  }
  if (process.env.GCP_SERVICE_ACCOUNT_KEY) {
    googleAuth = new GoogleAuth({
      credentials: JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY),
    });
    return googleAuth;
  }
  return null;
}

export async function getAuthHeaders(
  serviceUrl: string
): Promise<Record<string, string>> {
  const auth = getGoogleAuth();
  if (!auth || !serviceUrl.includes(".run.app")) return {};
  const client = await auth.getIdTokenClient(serviceUrl);
  const rawHeaders = await client.getRequestHeaders(serviceUrl);
  const authorization =
    rawHeaders instanceof Headers
      ? rawHeaders.get("Authorization")
      : (rawHeaders as Record<string, string>).Authorization;
  return authorization ? { Authorization: authorization } : {};
}

export async function callScanner(serviceUrl: string, body: unknown) {
  const authHeaders = await getAuthHeaders(serviceUrl);

  const res = await fetch(`${serviceUrl}/scan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Scanner returned ${res.status}`);
  }
  return res.json();
}


