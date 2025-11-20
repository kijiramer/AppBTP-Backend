WebApp - minimal Next.js user-facing web

This is a minimal Next.js frontend (JavaScript) that reproduces the main features of the mobile app: login, notes, effectif, profile. It uses the backend cookie-based auth (HttpOnly token).

Quick start

1. From the repo root run:

```bash
cd WebApp
npm install
npm run dev
```

2. The frontend runs at http://localhost:3001 and the backend is expected at http://localhost:8081. If your backend is at a different origin, set:

```bash
export NEXT_PUBLIC_API_URL=http://192.168.1.89:8081
```

Notes
- The app sends requests with `credentials: 'include'` so HttpOnly cookies are attached automatically.
- This is a minimal implementation for development; for production consider SSR for protected pages and more robust error handling.
