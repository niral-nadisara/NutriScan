import 'dotenv/config';

export default {
  expo: {
    name: 'NutriScan',
    slug: 'NutriScan',
    version: '1.0.0',
    runtimeVersion: '1.0.0',
    updates: {
      url: 'https://u.expo.dev/8435a902-ae2f-4a41-b84c-bebec3bf406a',
    },
    extra: {
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID,
      eas: {
        projectId: "8435a902-ae2f-4a41-b84c-bebec3bf406a",
      },
    },
  },
};