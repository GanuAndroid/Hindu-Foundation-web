import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK singleton using the Service Account credentials
if (!admin.apps.length) {
  try {
    let serviceAccount: any;
    
    // Check if the service account credentials are provided as a direct environment variable (useful in production clouds)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } else {
      // Fallback: Require the local git-ignored JSON key file
      serviceAccount = require("../../firebase-service-account.json");
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("[FIREBASE ADMIN] SDK successfully initialized using Service Account.");
  } catch (error) {
    console.error("[FIREBASE ADMIN] SDK failed to initialize:", error);
  }
}

/**
 * Cryptographically verifies a client-provided Firebase ID Token.
 * Returns the decoded token containing verified claims (e.g. phone_number) if valid.
 */
export async function verifyIdToken(token: string): Promise<admin.auth.DecodedIdToken> {
  if (!admin.apps.length) {
    throw new Error("Firebase Admin SDK is not initialized.");
  }
  return admin.auth().verifyIdToken(token);
}
