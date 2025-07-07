# Single Web Service Deployment Guide

This application is now configured to run as a **single web service** that serves both the API and the React frontend from the same Express server.

## Benefits of Single Service Deployment

✅ **No CORS Issues** - Frontend and API on same origin  
✅ **Simplified Setup** - Only one service to deploy  
✅ **Cost Effective** - Uses fewer resources  
✅ **Easier Management** - Single deployment pipeline  

## Deployment on Render

### 1. Create a Web Service (not Static Site)

- **Service Type**: Web Service
- **Repository**: Connect your GitHub repository
- **Root Directory**: `server`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### 2. Environment Variables

Set these environment variables in your Render dashboard:

```bash
DATABASE_URL=your-postgresql-connection-string
JWT_SECRET=your-jwt-secret-key
REPLICATE_API_TOKEN=your-replicate-api-token
GITHUB_REPO=daveenci-ai/daveenci-ai-avatar-images
GITHUB_TOKEN=your-github-personal-access-token
NODE_ENV=production
PORT=10000
```

**Note**: `CORS_ORIGINS` is not needed since everything runs on the same origin.

### 3. Build Process

The build process:
1. Installs backend dependencies (`npm install`)
2. Builds React frontend (`npm run build`)
3. Serves both API and static files from Express server

### 4. Custom Domain

Point your custom domain (e.g., `avatar.daveenci.ai`) to your single Render web service.

## Local Development

For local development, you can still run frontend and backend separately:

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend  
cd src
npm start
```

The frontend will proxy to the backend during development.

## How It Works

1. **API Routes**: All `/api/*` requests are handled by Express routes
2. **Static Files**: React build files are served from `src/build/`
3. **SPA Routing**: All other requests serve `index.html` for client-side routing
4. **Same Origin**: No CORS issues since everything is on the same domain

## File Structure

```
server/
├── index.js          # Express server (serves API + static files)
├── package.json      # Includes build script for React app
├── routes/           # API routes
└── ...

src/
├── build/            # React build output (created by build process)
├── src/              # React source code
└── package.json      # React dependencies
```

Your application will be available at a single URL serving both the React frontend and the API! 🚀 