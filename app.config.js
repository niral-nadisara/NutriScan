import 'dotenv/config';

export default {
  expo: {
    experimental: {
      newArchEnabled: true
    },
    name: "NutriScan",
    slug: "NutriScan",
    owner: "niralsara",
    scheme: "nutriscan",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    platforms: ["ios", "android", "web"],
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.niralsara.NutriScan"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      permissions: [
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO"
      ],
      package: "com.niralsara.NutriScan"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-camera"
    ],
    extra: {
      eas: {
        projectId: "8435a902-ae2f-4a41-b84c-bebec3bf406a"
      },
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID,
      huggingfaceApiKey: process.env.HUGGINGFACE_API_KEY,
      usdaApiKey: process.env.EXPO_PUBLIC_USDA_API_KEY,
      googleClientId: process.env.EXPO_GOOGLE_CLIENT_ID,
      webGoogleClientId: process.env.WEB_GOOGLE_CLIENT_ID,
      iosGoogleClientId: process.env.IOS_GOOGLE_CLIENT_ID,
      androidClientId: process.env.ANDROID_CLIENT_ID,
    },
    runtimeVersion: "1.0.0",
    updates: {
      url: "https://u.expo.dev/8435a902-ae2f-4a41-b84c-bebec3bf406a"
    }
  }
};