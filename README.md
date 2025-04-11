# 🥗 SafeBites

**SafeBites** is a React Native app built with Expo that empowers users to scan food products, explore clean alternatives, and make healthier eating choices — all powered by OpenFoodFacts and Firebase.

---

## 🚀 Features

- 📷 **Barcode Scanning** using Expo Camera API
- 🧠 **Clean Food Detection** using OpenFoodFacts categorization
- 🌿 **Explore Mode** for discovering healthier alternatives
- 🌤️ Weather-aware UI (uses device location)
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

## 📱 Screenshots

| Home | Scan | Result |
|------|------|--------|
| ![home](screenshots/home.png) | ![scan](screenshots/scan.png) | ![result](screenshots/result.png) |

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
```
4. Start the app
```
npx expo start
```
📜 License

MIT © Safebites
