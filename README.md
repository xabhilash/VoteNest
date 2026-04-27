# VoteNest

Link to the original [website](https://inmyonion.web.app/).

A public polling website where users can ask questions, share opinions ("onions"), and bookmark interesting polls.

## Tech Stack

This project has been modernized to use a contemporary React stack:

- **React 18** with function components and hooks
- **Vite** as the build tool
- **React Router v6** for client-side routing
- **Firebase v10** (Auth + Firestore) using the compat API
- **react-firebaseui** for Google sign-in
- **react-share** for social sharing

## Project Structure

```
src/
├── main.jsx                    Entry point
├── App.jsx                     Top-level routing
├── styles/                     Global styles
├── lib/
│   └── firebase.js             Firebase initialization
├── context/
│   └── FirebaseContext.jsx     Firebase + Auth context providers and hooks
├── services/                   Firestore data layer (votes, bookmarks)
├── constants/                  Route paths, UI tokens
├── pages/                      Top-level routed pages
├── components/
│   ├── layout/                 Navbar, Footer
│   ├── quest/                  Question card, Onion option, AddQuest, ShareDropdown
│   ├── comments/               Comments and Replies
│   ├── common/                 Reusable UI (ProfilePic, Bookmark, GhostScreen)
│   └── feed/                   Sidebar feed
└── resources/                  Static images and SVGs
```

## Getting Started

### Prerequisites

Create a `.env` file in the project root with your Firebase credentials. The
build accepts both `REACT_APP_*` and `VITE_*` prefixes:

```
REACT_APP_API_KEY="..."
REACT_APP_AUTH_DOMAIN="..."
REACT_APP_DATABASE_URL="..."
REACT_APP_PROJECT_ID="..."
REACT_APP_STORAGE_BUCKET="..."
REACT_APP_MESSAGING_SENDER_ID="..."
REACT_APP_APP_ID="..."
REACT_APP_MEASUREMENT_ID="..."
```

### Install

```
npm install
```

### Develop

```
npm run dev
```

Opens the app at [http://localhost:3000](http://localhost:3000) with hot
module replacement.

### Build

```
npm run build
```

Outputs the production bundle to the `build` folder.

### Preview the Production Build

```
npm run preview
```
