# Quick Start Guide

This guide will help you get Cali Lights up and running quickly.

## Prerequisites

- Node.js 20+ installed
- PostgreSQL database (Vercel Postgres, Supabase, or self-hosted)
- Accounts for: Cloudinary, Google Cloud (for Vision API)

## Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Setup Helper

```bash
npm run setup
```

This interactive script will help you configure all environment variables.

### 3. Run Database Migration

```bash
npm run db:migrate
```

### 4. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Manual Setup

If you prefer to set up manually:

### 1. Create `.env.local` file

```bash
cp .env.example .env.local
```

### 2. Configure Required Variables

Edit `.env.local` and add:

```bash
# Database (REQUIRED)
POSTGRES_URL=your_postgres_connection_string

# Admin (REQUIRED)
ADMIN_EMAIL=your_email@example.com

# Cloudinary (REQUIRED)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name

# Google Vision API (REQUIRED)
GOOGLE_VISION_API_KEY=your_vision_api_key

# App Config (REQUIRED)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Validate Configuration

```bash
npm run validate-env
```

### 4. Run Migration

```bash
npm run db:migrate
```

### 5. Start Server

```bash
npm run dev
```

## Testing

### Run End-to-End Test

```bash
npm run test:e2e
```

This will test the complete mission flow.

### Run Load Test

```bash
npm run test:load
```

Simulates multiple concurrent users.

### Run Unit Tests

```bash
npm test
```

## First Steps After Setup

1. **Register Admin Account**
   - Visit http://localhost:3000/login
   - Register with your `ADMIN_EMAIL`
   - You'll have admin access automatically

2. **Create a Chain**
   - Go to `/admin` or use API
   - Create your first chain (constellation)

3. **Start a Mission**
   - Use admin panel to start a mission
   - Or use API: `POST /api/mission/start`

4. **Test the Flow**
   - Join mission
   - Upload entries
   - Generate chapter recap

## Troubleshooting

### Database Connection Issues

```bash
# Verify connection string format
echo $POSTGRES_URL
# Should start with: postgresql:// or postgres://

# Test connection
npm run db:migrate
```

### Cloudinary Issues

- Verify cloud name is correct
- Check API key and secret
- Ensure unsigned upload preset is created

### Vision API Issues

- Verify API key is correct
- Check API is enabled in Google Cloud Console
- Verify billing is enabled (free tier available)

## Next Steps

- See `docs/SETUP_CHECKLIST.md` for detailed setup instructions
- See `docs/DEPLOYMENT.md` for production deployment
- See `docs/TESTING.md` for testing guide

## Getting Help

- Check logs: `npm run dev` shows detailed logs
- Health check: Visit `/api/health`
- Validate env: `npm run validate-env`

---

**Ready to go!** 🚀

