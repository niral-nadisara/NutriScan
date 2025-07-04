# 🥗 SafeBites

**SafeBites** is a React Native app built with Expo that empowers users to scan food products, explore clean alternatives, and make healthier eating choices — all powered by OpenFoodFacts and Firebase.

---

## 🚀 Features

- 📷 **Barcode Scanning** using Expo Camera API
- 🧠 **Clean Food Detection** using OpenFoodFacts categorization
- 🌿 **Explore Mode** for discovering healthier alternatives
- 👤 Guest access — scan and browse without logging in
- 🔐 **Login with Email/Password or Google**
- ⚙️ **Preferences** saved to Firebase (e.g., Vegan-only, Hide Additives)
- 🧾 **Scan History** synced across devices
- 🖼️ Upload custom **profile avatars** via camera, gallery, or preset icons
- ☁️ Deployed with full support for Firebase Auth + Firestore

---

## 🧪 Tech Stack

- **React Native + Expo SDK**
- **Firebase** (Auth + Firestore)
- **OpenFoodFacts API**
- **Expo Camera + Image Picker**
- **AsyncStorage** (for guest mode)
- **Cloud Sync** for preferences & history


---

## 🔧 Local Setup

### 1. Clone the repo

```bash
git clone https://github.com/niralsara/NutriScan.git
cd NutriScan
```
2. Install dependencies
```
npm install
```
3. Setup environment variables

Create a .env file in the root:
```
FIREBASE_API_KEY=your_key
FIREBASE_AUTH_DOMAIN=your_domain
FIREBASE_PROJECT_ID=your_project
FIREBASE_STORAGE_BUCKET=your_bucket
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
HUGGINGFACE_API_KEY=your_hugging_face_apikey
EXPO_PUBLIC_USDA_API_KEY=your_USDA_apikey
EXPO_GOOGLE_CLIENT_ID=your_expo_google_client_id
WEB_GOOGLE_CLIENT_ID=your_web_google_client_id
IOS_GOOGLE_CLIENT_ID=your_ios_google_client_id
ANDROID_CLIENT_ID=your_android_google_client_id
```
4. Start the app
```
npx expo start
```

### 5. Run on Device with Expo Go

You can test the app instantly using the **Expo Go** app:

**a. Install Expo Go:**
- [Android (Play Store)](https://play.google.com/store/apps/details?id=host.exp.exponent)
- [iOS (App Store)](https://apps.apple.com/app/expo-go/id982107779)

**b. Launch the App:**
- After running `npx expo start`, scan the QR code from the terminal or web browser using the **Expo Go** app.
- Make sure your development machine and phone are on the same Wi-Fi network.

This allows you to preview the app live without building a native binary.

📜 License

MIT © Safebites
