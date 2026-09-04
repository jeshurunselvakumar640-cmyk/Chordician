# 🎵 Chordician

<div align="center">

![Chordician Banner](https://img.shields.io/badge/CHORDICIAN-Intelligent_Worship_Song_Platform-6366f1?style=for-the-badge&logo=music)

**The modern, intelligent chord sheet management and reconstruction platform for worship leaders, musicians, and keyboardists.**

[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-Backend-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore_%26_Auth-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Google Gemini AI](https://img.shields.io/badge/Google_Gemini-Chordex_AI-8E75FF?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](./LICENSE)

[Features](#-key-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Chordex AI](#-chordex-ai-engine) • [Architecture](#-architecture) • [License](#-license)

</div>

---

## 🌟 Overview

**Chordician** is an end-to-end music and chord sheet management web application tailored for churches, musicians, and live performance. It bridges the gap between messy web chord charts and performance-ready stage sheets by leveraging **Chordex AI**—an intelligent reconstruction engine that extracts, unbundles, aligns, and structures songs directly into a clean, interactive chord format.

---

## 🚀 Key Features

### 🌐 1. Import from Webpage URL
- Paste any link from song blogs, worship websites, or chord archives (e.g. Tamil Christian songs, Ultimate Guitar, PraiseCharts, Hymnary).
- Server-side secure fetcher strips website noise, ads, footers, and chromatic scales.
- Intelligent parser separates attached chords, detects musical key, and formats structured sections.

### 📋 2. Smart Paste & Chord Restructuring
- Paste messy chord-and-lyrics text from WhatsApp, PDFs, notes, or emails.
- Unbundles glued chord collisions (e.g. `DmMaravaamal` $\to$ chord `Dm` over `Maravaamal`, `NanCRi` $\to$ chord `C` on `Nanri`).
- Converts inline bracketed chords `[Dm]`, `[Am]`, `(C)` into clean two-tier aligned chord sheets.

### 🇮🇳 3. Multi-Language Categorization
- Dedicated language categorization for **Tamil (🇮🇳 தமிழ்)**, **Hindi (🇮🇳 हिन्दी)**, and **English (🌐 English)**.
- Quick filter chips and summary hubs across Dashboard, All Songs, and Song Editor.
- Custom visual gradient badges on song cards.

### 🎹 4. Keyboard & Church Style System
- Curated library of 100+ rhythm styles spanning Indian (Dandiya, Bhajan, Keerthanai), Ballads, Pop, Rock, Gospel, and Latin.
- Direct hardware preset numbers for church organs and arranger keyboards (Yamaha / Roland).
- High-contrast style banner highlight at the top of lyrics viewers (e.g. `142/175 CountryWaltz`).

### 🎼 5. Live Performance Song Viewer & Editor
- Monospace chord-above-lyrics alignment with responsive layout.
- Real-time key transposition, auto-scroll for live stage performance, font scaling, and full-screen view.
- Section management: Verse 1, Verse 2, Chorus, Bridge, Intro, Outro, Tag, Ending.
- Custom row types: `Chords`, `Lyrics`, `Lead notes`, `Bass lines`, and `Notes`.

### 🔒 6. Cloud Sync & Firebase Authentication
- Real-time sync with Google Firebase Firestore database.
- Secure Google OAuth authentication with user-specific song library isolation.
- Offline-ready localStorage fallback so you never lose song edits during a live service.

### 🌓 7. Dual-Theme Modern Design
- High-contrast obsidian Dark Mode and clean frosted Light Mode.
- Glassmorphic segmented tab controls, glowing action inputs, and fluid responsive micro-animations.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend UI** | React 18, Vite 6, Lucide Icons, Vanilla CSS Design System |
| **Backend API** | Node.js, Express, Cheerio, Axios |
| **AI Engine** | Google Gemini Generative AI SDK (`gemini-2.5-flash`, `gemini-2.0-flash`) |
| **Authentication** | Firebase Auth (Google Sign-In & Email) |
| **Database** | Firebase Cloud Firestore |
| **Routing** | React Router DOM v6 |

---

## 🧠 Chordex AI Engine

Chordex AI is the intelligent core powering Chordician's song reconstruction pipeline.

```
Messy Raw Webpage / Text
         │
         ▼
[ Safe Fetch & HTML Cleaner ]  ──►  Strips navigation, ads, cookies & chrome
         │
         ▼
[ Chordex AI (Google Gemini) ] ──►  0-based character horizontal alignment
                               ──►  Attached chord unbundling (DmMaravaamal -> Dm + Maravaamal)
                               ──►  Musical Key & Style detection
                               ──►  Section architecture (Verse, Chorus, Bridge)
         │
         ▼
[ Chordician Song Normalizer ] ──►  Structured song format ready for editor & cloud sync
```

---

## 💻 Getting Started

### Prerequisites
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **Google Gemini API Key**: [Get a Gemini API Key](https://aistudio.google.com/)
- **Firebase Project**: [Firebase Console](https://console.firebase.google.com/)

### 1. Clone the Repository
```bash
git clone https://github.com/jeshurunselvakumar640-cmyk/Chordician.git
cd Chordician
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:

```env
# Gemini AI Configuration
GEMINI_API_KEY=your_google_gemini_api_key_here

# Server Port
PORT=3001

# Firebase Client Configuration (src/firebase/config.js)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Run Locally

Start both the backend server and the frontend dev server:

```bash
# Terminal 1: Start the backend server (Port 3001)
npm run server

# Terminal 2: Start the frontend Vite dev server (Port 5173)
npm run dev
```

Open your browser and navigate to `http://localhost:5173/`.

### 5. Build for Production
```bash
npm run build
```

---

## 📁 Project Structure

```
Chordician/
├── public/                 # Static public assets
├── server/                 # Express backend API
│   ├── parsers/            # HTML & text song parsers
│   ├── routes/             # API routes (/api/import-url, /api/chordex/*)
│   ├── services/           # Gemini AI analyzer, URL fetcher, chord alignment engine
│   └── index.js            # Express server entry point
├── src/                    # Frontend React application
│   ├── components/         # Reusable UI components
│   │   ├── Auth/           # Login & profile modal
│   │   ├── Layout/         # Header, sidebar, navigation
│   │   ├── SongCard/       # Song library card with language badges
│   │   ├── SongEditor/     # Multi-section chord/lyrics editor
│   │   ├── SongView/       # Performance viewer, style highlight banner
│   │   └── UI/             # Key badges, modals, dialogs
│   ├── context/            # AuthContext, ToastContext, SongContext
│   ├── data/               # Keyboard & church song styles database
│   ├── firebase/           # Firebase client configuration & Firestore CRUD
│   ├── pages/              # Dashboard, Songs, ImportSong, SongDetails, Favorites
│   ├── services/           # AI parser clients, URL parser services
│   ├── utils/              # Music theory transposition & chord helpers
│   ├── App.jsx             # Main router & app root
│   ├── index.css           # Global design system & theme variables
│   └── main.jsx            # React entry point
├── .env.example            # Example environment template
├── .gitignore              # Git ignore rules
├── LICENSE                 # MIT License
├── package.json            # Project dependencies & scripts
├── README.md               # Project documentation
└── vite.config.js          # Vite bundler configuration
```

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

---

<div align="center">

**Copyright (c) 2026 Jeshurun Selvakumar. All Rights Reserved.**

*Built with passion for worship teams and musicians worldwide.*

</div>
