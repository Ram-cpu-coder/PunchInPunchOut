# Hour Calculator

A lightweight MERN weekly hour tracker. It stores saved weeks in MongoDB, keeps unpaid and paid weeks separate, tracks shifts with a start/stop timer, calculates daily and weekly hours, and calculates pay from one shared hourly rate.

## Project Shape

This is deployed as one service:

- `server/` runs Express and MongoDB routes.
- `client/` is the React/Vite app.
- `server/index.js` serves `client/dist` in production.

## Run Locally

Install dependencies:

```powershell
npm run install:all
```

Start local MongoDB in one terminal:

```powershell
npm run mongo
```

Start the app in another terminal:

```powershell
npm run dev
```

Open:

```text
http://127.0.0.1:5000
```

## Production Build

```powershell
npm run deploy:build
npm start
```

The production app runs from the root server and serves the built React files from `client/dist`.

## Deploy On Render

Create a MongoDB Atlas database first, then deploy this repo as a Render Web Service.

Render settings:

```text
Runtime: Node
Build Command: npm install && npm run build
Start Command: npm start
Health Check Path: /api/health
```

Environment variables:

```text
NODE_ENV=production
MONGO_URI=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/hour-calculator?retryWrites=true&w=majority
```

Add these values manually in Render when you create the web service.

## Important Notes

- Do not deploy the local `.mongodb-data` folder.
- Do not deploy `.env`.
- The frontend uses same-origin `/api` by default, so it works after deployment without `VITE_API_URL`.
- Saved weeks intentionally store `hourlyRate: null`; the shared rate lives in the `settings` collection.
# PunchInPunchOut
