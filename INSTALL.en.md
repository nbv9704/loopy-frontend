# Loopy Frontend Installation

This guide explains how to run the Loopy frontend locally.

## Requirements

- Node.js 22.x recommended to match the current backend runtime.
- Yarn.
- Loopy Backend running at `http://localhost:3000` or an equivalent API URL.

## 1. Install dependencies

Run inside the `loopy-frontend` directory:

```powershell
yarn install
```

## 2. Configure environment variables

Create or update `.env.local`:

```env
VITE_API_URL=http://localhost:3000
```

Notes:

- `VITE_API_URL` must point to the Loopy backend.
- In production, set this variable to the public backend URL.

## 3. Run development server

```powershell
yarn dev
```

Vite usually serves the app at:

```txt
http://localhost:5173
```

## 4. Verify before committing

```powershell
yarn lint:strict && yarn build
```

## 5. Build for production

```powershell
yarn build
```

The production output is generated in `dist/`.

## Common issues

### Login fails or requests are blocked by CORS

Check that:

- The backend is running.
- `VITE_API_URL` points to the correct backend URL.
- The backend has `FRONTEND_URL=http://localhost:5173` configured.

### PvP socket cannot connect

Check that:

- The user is authenticated.
- Backend Socket.IO is running with the API server.
- Auth cookies are sent with requests (`withCredentials`).
