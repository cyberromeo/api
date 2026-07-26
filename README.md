# Universal API Hub & Web Dashboard

A unified React web application hosted on Vercel, backed by Firebase Firestore, designed to view and manage data feeds pushed from external APIs via Cronicle Docker containers.

## 🚀 Key Features

- **Real-time Ingestion Stream**: Subscribes directly to Firebase Firestore `api_feeds` collection.
- **Glassmorphism Dark UI**: Built with custom Vanilla CSS for high aesthetics and responsive layout.
- **API Schema Registry**: Catalog and define contracts for your incoming API feeds.
- **Cronicle Integration Templates**: Copy-paste snippets for Node.js, Python, or cURL workers running in Cronicle Docker containers.
- **Vercel Ready**: Preconfigured with `vercel.json` for single page application routing.
- **Zero-Config Demo Mode**: Displays interactive sample feeds automatically when Firebase credentials are not yet set.

## 🛠️ Setup Instructions

### 1. Local Development

```bash
cmd /c "npm install"
cmd /c "npm run dev"
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Connecting to Firebase

1. Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/).
2. Enable **Firestore Database** in test mode or production rules.
3. Copy your Web App config credentials into `.env.local` or environment variables:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Deploying to Vercel

1. Push this repository to GitHub/GitLab.
2. Import the repository into [Vercel](https://vercel.com).
3. Add the `VITE_FIREBASE_*` environment variables in Vercel Project Settings.
4. Deploy!

### 4. Pushing Data from Cronicle Docker Container

Refer to the **Cronicle Workers** tab inside the dashboard for copy-paste code snippets in Node.js, Python, or cURL.
