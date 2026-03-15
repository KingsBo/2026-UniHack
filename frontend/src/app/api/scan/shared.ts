import { GoogleAuth, ExternalAccountClient, Impersonated } from "google-auth-library";

export const GITLEAKS_SERVICE_URL =
  process.env.GITLEAKS_SERVICE_URL || "http://localhost:3001";
export const TRIVY_SERVICE_URL =
  process.env.TRIVY_SERVICE_URL || "http://localhost:3002";

let authClient: Impersonated | GoogleAuth | null = null;

export function getGoogleAuth(): Impersonated | GoogleAuth | null {
  if (authClient) return authClient;

  console.log({
    hasOidcToken: !!process.env.VERCEL_OIDC_TOKEN,
    hasProjectNum: !!process.env.GCP_PROJECT_NUMBER,
    hasEmail: !!process.env.GCP_SERVICE_ACCOUNT_EMAIL,
  });

  if (process.env.VERCEL_OIDC_TOKEN && process.env.GCP_PROJECT_NUMBER && process.env.GCP_SERVICE_ACCOUNT_EMAIL) {
    const externalClient = ExternalAccountClient.fromJSON({
      type: "external_account",
      audience: `//iam.googleapis.com/projects/${process.env.GCP_PROJECT_NUMBER}/locations/global/workloadIdentityPools/vercel-pool/providers/vercel-provider`,
      subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
      token_url: "https://sts.googleapis.com/v1/token",
      subject_token_supplier: {
        getSubjectToken: async () => process.env.VERCEL_OIDC_TOKEN!,
      },
    });

    authClient = new Impersonated({
      sourceClient: externalClient as any,
      targetPrincipal: process.env.GCP_SERVICE_ACCOUNT_EMAIL,
      targetScopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    return authClient;
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    authClient = new GoogleAuth();
    return authClient;
  }

  return null;
}

export async function getAuthHeaders(
  serviceUrl: string
): Promise<Record<string, string>> {
  const auth = getGoogleAuth();
  
  if (!auth) {
    console.warn("Auth client is null. Falling back to unauthenticated request.");
    return {};
  }

  if (!serviceUrl.includes(".run.app")) {
    return {};
  }

  try {
    if (auth instanceof Impersonated) {
      const idToken = await auth.fetchIdToken(serviceUrl);
      return { Authorization: `Bearer ${idToken}` };
    } else {
      const client = await auth.getIdTokenClient(serviceUrl);
      const rawHeaders = await client.getRequestHeaders(serviceUrl);
      
      const authorization =
        rawHeaders instanceof Headers
          ? rawHeaders.get("Authorization")
          : (rawHeaders as Record<string, string>).Authorization;
          
      return authorization ? { Authorization: authorization } : {};
    }
  } catch (err) {
    console.error(`Failed to generate GCP ID Token for ${serviceUrl}:`, err);
    return {};
  }
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


