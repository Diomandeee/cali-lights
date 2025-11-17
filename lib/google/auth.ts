import { GoogleAuth } from "google-auth-library";

let cachedAuth: GoogleAuth | null = null;

export async function getGoogleAccessToken(scopes: string[] = [
  "https://www.googleapis.com/auth/cloud-platform",
]) {
  if (!cachedAuth) {
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    if (!credentialsJson) {
      throw new Error("GOOGLE_APPLICATION_CREDENTIALS_JSON missing");
    }
    const decoded = Buffer.from(credentialsJson, "base64").toString("utf-8");
    const credentials = JSON.parse(decoded);
    cachedAuth = new GoogleAuth({
      credentials,
      scopes,
    });
  }

  const client = await cachedAuth.getClient();
  const tokenResponse = await client.getAccessToken();
  if (!tokenResponse || !tokenResponse.token) {
    throw new Error("Unable to obtain Google access token");
  }
  return tokenResponse.token;
}
