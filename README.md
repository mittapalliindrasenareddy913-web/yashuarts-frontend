# YashuArts Frontend

This repository contains the frontend source code for the **YashuArts** application — a platform for art lovers.

## 📁 Project Structure

```
frontend/
├── yashuarts-user-app/     # User-facing mobile app (Vite + React + Capacitor)
└── yashuarts-admin-app/    # Admin panel mobile app (Vite + React + Capacitor)
```

## 🛠️ Tech Stack

- **Framework**: React (Vite)
- **Styling**: TailwindCSS
- **Mobile**: Capacitor (Android)
- **Build Tool**: Vite

## 🚀 Getting Started

### User App
```bash
cd yashuarts-user-app
npm install
npm run dev
```

### Admin App
```bash
cd yashuarts-admin-app
npm install
npm run dev
```

## 📱 Building for Android

```bash
npm run build
npx cap sync android
npx cap open android
```

---

© 2024 YashuArts. All rights reserved.
