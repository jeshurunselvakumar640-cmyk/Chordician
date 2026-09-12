# 🎹 Chordician

### *Every Chord, For Him.*

**Chordician** is a web-based Christian music platform designed to help musicians quickly find, read, edit, transpose, and manage **Christian song lyrics with piano chords**.

What began as a personal solution for managing songs and piano arrangements evolved into a full-stack application featuring **AI-powered chord and lyric recognition, intelligent text parsing, song importing, authentication, cloud storage, push notifications, and PWA support**.

---

## ✨ Overview

Musicians often have to search through scattered websites, screenshots, notes, PDFs, and messages to find usable chord arrangements for songs.

Chordician brings these workflows together in one place.

The application provides:

* 🎵 A searchable Christian song library
* 🎹 Chord and lyric visualization
* ✏️ Song editing
* 🔄 Chord transposition
* 📋 Intelligent Smart Paste
* 🤖 AI-powered screenshot recognition through **Chordex**
* 🌐 Import from selected online sources
* 📱 Progressive Web App support
* 🔔 Push notifications
* 🔐 Authentication and protected backend operations
* ☁️ Cloud-hosted data and APIs

The goal is simple:

> **Make every song easier to find, understand, and play.**

---

# 🚀 Features

## 🎵 Song Library

Chordician provides a centralized library for Christian songs containing:

* Song titles
* Lyrics
* Chords
* Sections
* Song metadata
* Searchable content

Songs can be viewed in a musician-friendly layout designed for practical use while playing.

---

## 🔎 Fast Song Search

The application includes an optimized search experience for finding songs quickly.

Search supports:

* Song title matching
* Lyric matching
* Flexible/fuzzy matching
* Mobile-friendly input
* Large song-library performance optimization

The search interface is designed to remain responsive even as the song library grows.

---

# 🎹 Chord & Lyrics Viewer

Songs are displayed with chords positioned alongside their corresponding lyrics.

The viewer is designed specifically for musicians, allowing them to:

* Follow lyrics while playing
* Identify chord changes
* Navigate song sections
* Read arrangements comfortably on desktop and mobile devices

---

# 🔄 Chord Transposition

Chordician allows musicians to transpose songs to different keys.

This is particularly useful when:

* A song is outside the vocalist's comfortable range
* A musician prefers another key
* The original arrangement is difficult to play
* Different instruments require different keys

The transposition system preserves chord structure while changing the musical key.

---

# ✏️ Song Editor

Songs can be edited through the built-in editor.

The editor supports structured song content while preserving:

* Lyrics
* Chord placement
* Song sections
* Formatting
* Arrangement structure

This makes it possible to clean up imported arrangements and prepare them for actual use.

---

# 📋 Smart Paste

One of Chordician's core features is **Smart Paste**.

Instead of requiring users to manually format every chord and lyric, Smart Paste analyzes pasted song text and attempts to determine:

* Chords
* Lyrics
* Chord positions
* Line structure
* Song sections
* Repeated sections
* Unicode text
* Tamil and English content

It then converts the input into the structured format used by Chordician.

### Example

Raw input:

```text
G              C
உம்மை நான் பாடுவேன்
Em             D
உம் நாமம் உயர்த்துவேன்
```

Smart Paste interprets the relationship between the chords and lyrics and converts it into structured song data.

---

# 🤖 Chordex — AI Song Recognition

### *Turn a song screenshot into editable chords and lyrics.*

**Chordex** is Chordician's AI-powered song recognition system.

A musician can provide a screenshot containing a song's lyrics and chords.

The system processes the image and attempts to identify:

* Lyrics
* Chords
* Chord positions
* Line relationships
* Song structure

The recognized information is converted into structured data that can then be reviewed and edited inside Chordician.

### Workflow

```text
Song Screenshot
       │
       ▼
   Image Processing
       │
       ▼
   AI Recognition
       │
       ▼
Chord + Lyric Extraction
       │
       ▼
 Structured Song Data
       │
       ▼
      Editor
       │
       ▼
     Chordician
```

Chordex is designed to preserve the musical information detected from the source rather than unnecessarily simplifying chord notation.

For example:

```text
Am
F#m
C#
Bb
G7
```

should remain musically distinct rather than being converted into generic major chords.

---

# 🌐 Import from Internet

Chordician can import songs from **selected supported online sources**.

The import system is intentionally designed around controlled sources rather than unrestricted web crawling.

The import workflow includes:

1. Fetch supported source
2. Extract relevant content
3. Remove unnecessary website noise
4. Identify the song content
5. Normalize the extracted text
6. Pass the result to Smart Paste
7. Generate structured song data

This allows online content to be converted into the same internal structure used by manually pasted songs.

---

# 📱 Progressive Web App

Chordician is built as a **Progressive Web App (PWA)**.

This allows the application to provide a more app-like experience across supported devices.

PWA functionality includes:

* Installable application experience
* Responsive interface
* Mobile-friendly layout
* Cached application shell
* Offline-friendly static resources

Dynamic API requests, authentication, and Firestore operations remain network-dependent and are not incorrectly cached by the service worker.

---

# 🔔 Push Notifications

Chordician includes browser push notifications for registered users and devices.

Notifications can be used for:

* New song announcements
* Owner announcements
* Application updates

The notification system supports multiple registered devices per user.

### New Song Notification

When a new song is successfully added, registered users can receive a personalized notification:

**Title**

```text
Ennai Nadathum Deva
```

**Message**

```text
Hey Jeshurun! new song Ennai Nadathum Deva is added
```

The notification name is derived from the registered user's profile information.

---

# 🔐 Authentication & Security

Chordician uses Firebase Authentication for user authentication.

The application separates:

* Client-side authentication
* Backend authorization
* Firestore data access
* Trusted server-side operations

Sensitive song write operations are handled through authenticated backend APIs rather than allowing unrestricted client-side writes.

The backend verifies Firebase authentication tokens and determines the user's authoritative identity from the authenticated session.

---

# ☁️ Backend Architecture

Chordician uses a backend API layer for trusted operations.

A simplified architecture looks like:

```text
                    ┌─────────────────┐
                    │     Browser     │
                    │ React + Vite    │
                    └────────┬────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
        Firebase Authentication      Backend API
                                        │
                           ┌────────────┼────────────┐
                           │            │            │
                           ▼            ▼            ▼
                       Firestore       FCM       Import APIs
```

This architecture allows the client to remain lightweight while sensitive operations are handled server-side.

---

# 🛠️ Technology Stack

## Frontend

* **React**
* **Vite**
* JavaScript
* CSS
* Progressive Web App architecture

## Backend

* Node.js
* Express
* REST APIs

## Cloud & Services

* Firebase Authentication
* Cloud Firestore
* Firebase Cloud Messaging
* Firebase Admin SDK
* Vercel

## AI

* Gemini-based AI processing
* Vision/image understanding
* Structured chord and lyric extraction

---

# 📂 Project Structure

A simplified structure of the project:

```text
Chordician/
│
├── api/
│   └── index.js
│
├── server/
│   ├── app.js
│   ├── routes/
│   │   ├── songs.js
│   │   ├── notifications.js
│   │   └── ...
│   │
│   └── services/
│       ├── importUrl/
│       └── ...
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── context/
│   ├── services/
│   │   ├── fcmService.js
│   │   └── ...
│   │
│   ├── sw.js
│   ├── App.jsx
│   └── ...
│
├── public/
│
├── package.json
├── vite.config.js
└── README.md
```

---

# ⚙️ Getting Started

## Prerequisites

Make sure you have installed:

* Node.js
* npm
* Git

---

## 1. Clone the repository

```bash
git clone https://github.com/jeshurunselvakumar640-cmyk/Chordician.git
cd Chordician
```

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Configure environment variables

Create a local environment file according to the variables required by the project.

Example:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Server-side credentials must **never** be committed to the repository.

For example, Firebase Admin SDK credentials should be provided through secure deployment environment variables rather than stored in source control.

---

# ▶️ Running Locally

Start the development server:

```bash
npm run dev
```

If the project uses a separate backend process, start the backend according to the project's server configuration.

The application should then be available through the local development URL displayed by Vite.

---

# 🏗️ Production Build

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

# 🔒 Security

Security is an important part of Chordician's architecture.

### Important rules

Never commit:

```text
.env
.env.local
Firebase service-account JSON files
Private keys
API secrets
Access tokens
Authentication credentials
```

Sensitive credentials should always be stored using environment variables or the deployment platform's secret-management system.

### Firestore

Client-side access to protected song writes is intentionally restricted.

Trusted writes are performed through authenticated backend operations.

---

# 🧠 Design Philosophy

Chordician was not built simply as a demonstration of technologies.

The project was built around a real musician workflow.

The development priorities are:

### 1. Practicality

Features should solve actual problems musicians encounter.

### 2. Musical fidelity

Chord information should not be unnecessarily simplified or altered.

### 3. Speed

Searching and opening songs should be fast enough for real-time use.

### 4. Reliability

Existing working workflows should remain stable when new features are introduced.

### 5. Simplicity

The interface should remain understandable even as the underlying technology becomes more sophisticated.

---

# 🎯 Why Chordician?

Many software projects are built to demonstrate a technology.

Chordician was built the other way around:

> **A real problem came first, and technology was used to solve it.**

The application combines several areas of modern software development:

```text
Frontend Development
        +
Backend Development
        +
Cloud Services
        +
Artificial Intelligence
        +
Authentication
        +
PWA
        +
Real-time Notifications
        +
Music Technology
```

This combination makes Chordician both a software engineering project and a practical music tool.

---

# 📈 Future Improvements

Potential future development includes:

* 🎙️ Voice-based song search
* 🎼 Chord and scale reference tools
* 🎵 More advanced song arrangement tools
* 📄 Improved PDF/export workflows
* 🎹 Additional music-theory utilities
* 🤖 Improved AI chord recognition
* 📱 Further mobile optimizations
* 🔔 More notification types
* 📊 Usage and song-library analytics
* 🎶 Expanded Christian song database

---

# 🧪 Testing

Before production releases, the project is tested across several areas including:

* Song engine functionality
* Authentication and authorization
* API security
* Notification endpoints
* Song creation workflows
* AI-related data processing
* Production builds
* PWA generation

The goal is to ensure that new functionality does not break existing musician workflows.

---

# 🌍 Deployment

Chordician is designed for cloud deployment.

The production architecture uses:

```text
Git Repository
      │
      ▼
   Vercel
      │
      ├──────────────► React/Vite Frontend
      │
      └──────────────► Node/Express API
                           │
                           ├── Firebase Auth
                           ├── Firestore
                           └── Firebase Cloud Messaging
```

---

# 🤝 Contributing

Chordician is primarily developed as a personal/project application.

If the repository is opened for contributions in the future, contributors should:

1. Create a feature branch
2. Keep changes focused
3. Avoid modifying unrelated systems
4. Add appropriate tests
5. Verify the production build
6. Submit a pull request describing the changes

---

# 📜 License

This project is licensed under the [MIT License](./LICENSE).

---

# ❤️ A Personal Note

Chordician was created from a simple need: having reliable chord arrangements available when serving through music.

Over time, that need became an opportunity to explore modern software engineering—from React and Firebase to AI-powered image recognition, APIs, PWA architecture, and cloud deployment.

The project continues to grow, but the purpose remains the same:

## **Every Chord, For Him. 🎹**
