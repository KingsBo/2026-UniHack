import { GoogleAuth } from "google-auth-library";
import { getVercelOidcToken } from "@vercel/oidc";

export const GITLEAKS_SERVICE_URL =
  process.env.GITLEAKS_SERVICE_URL || "http://localhost:3001";
export const TRIVY_SERVICE_URL =
  process.env.TRIVY_SERVICE_URL || "http://localhost:3002";

let googleAuth: GoogleAuth | null = null;

export function getGoogleAuth(): GoogleAuth | null {
  if (googleAuth) return googleAuth;

  if (process.env.GCP_PROJECT_NUMBER) {
    googleAuth = new GoogleAuth({
      credentials: {
        type: "external_account",
        audience: `//iam.googleapis.com/projects/${process.env.GCP_PROJECT_NUMBER}/locations/global/workloadIdentityPools/vercel-pool/providers/vercel-provider`,
        subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
        token_url: "https://sts.googleapis.com/v1/token",
        service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${process.env.GCP_SERVICE_ACCOUNT_EMAIL}:generateAccessToken`,
        subject_token_supplier: {
          getSubjectToken: async () => {
            const token = await getVercelOidcToken();
            return token || '';
          },
        },
      } as any, 
    });
    return googleAuth;
  }

  // if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  //   googleAuth = new GoogleAuth();
  //   return googleAuth;
  // }

  return null;
}

export async function getAuthHeaders(
  serviceUrl: string
): Promise<Record<string, string>> {
  console.log("OIDC Token present:", !!process.env.VERCEL_OIDC_TOKEN);

  const auth = getGoogleAuth();
  
  if (!auth) {
    console.warn("Auth client is null. Falling back to unauthenticated request.");
    return {};
  }

  if (!serviceUrl.includes(".run.app")) {
    console.warn(`Service URL ${serviceUrl} does not include '.run.app'. Skipping auth.`);
    return {};
  }

  try {
    const client = await auth.getIdTokenClient(serviceUrl);
    const rawHeaders = await client.getRequestHeaders(serviceUrl);
    
    const authorization =
      rawHeaders instanceof Headers
        ? rawHeaders.get("Authorization")
        : (rawHeaders as Record<string, string>).Authorization;
        
    return authorization ? { Authorization: authorization } : {};
    
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


