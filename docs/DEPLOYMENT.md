# Production Deployment Guide

This guide covers deploying Cali Lights to production on Vercel.

## Pre-Deployment Checklist

### 1. Environment Validation

Run the validation script to ensure all required environment variables are set:

```bash
npm run validate-env
# or
npx tsx scripts/validate-env.ts
```

### 2. Database Migration

Ensure your production database is migrated:

```bash
npm run db:migrate
```

### 3. Build Test

Test the production build locally:

```bash
npm run build
npm start
```

## Vercel Deployment

### Step 1: Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your Git repository
4. Configure project settings

### Step 2: Environment Variables

Add all environment variables in Vercel Dashboard → Settings → Environment Variables:

#### Required Variables

```bash
# Database
POSTGRES_URL=your_production_postgres_url

# Admin
ADMIN_EMAIL=your_admin_email

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name

# Google Vision API
GOOGLE_VISION_API_KEY=your_vision_api_key

# App Config
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

#### Optional Variables

```bash
# Google Cloud Veo
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS_JSON=base64_encoded_json
VEO_MODEL_NAME=publishers/google/models/veo-3.0-generate

# Vercel KV
KV_URL=your_kv_url
KV_REST_API_URL=your_kv_rest_url
KV_REST_API_TOKEN=your_kv_token

# Ably
ABLY_API_KEY=your_ably_api_key
NEXT_PUBLIC_ABLY_CLIENT_ID=your_client_id

# OneSignal
ONESIGNAL_APP_ID=your_app_id
ONESIGNAL_API_KEY=your_api_key

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token

# Cron Secret
CRON_SECRET=your_random_secret_string
```

### Step 3: Configure Vercel Services

#### Vercel Postgres

1. Go to Storage → Create Database → Postgres
2. Copy connection strings
3. Add `POSTGRES_URL` to environment variables

#### Vercel KV (Optional)

1. Go to Storage → Create Database → KV
2. Copy connection strings
3. Add KV variables to environment variables

#### Cron Jobs

Cron jobs are automatically configured via `vercel.json`:
- `/api/video/poll` - Runs every 2 minutes
- `/api/admin/schedule/check` - Runs every hour

Make sure `CRON_SECRET` is set for authentication.

### Step 4: Deploy

1. Push to your main branch (or trigger deployment manually)
2. Vercel will automatically build and deploy
3. Monitor the deployment logs

### Step 5: Post-Deployment

1. **Run Migrations**: Visit your deployed URL to trigger migrations, or run:
   ```bash
   vercel env pull .env.production
   npm run db:migrate
   ```

2. **Verify Health Check**: Visit `https://your-domain.com/api/health`
   - Should return `{"status": "healthy"}`

3. **Test Critical Flows**:
   - User registration/login
   - Image upload
   - Mission creation
   - Chapter generation

## Monitoring & Maintenance

### Health Checks

Set up monitoring for:
- `/api/health` endpoint (should return 200)
- Database connectivity
- External service availability

### Logs

Monitor Vercel logs for:
- Error rates
- API response times
- External service failures

### Error Tracking

Consider integrating:
- **Sentry**: For error tracking
- **LogRocket**: For session replay
- **Datadog**: For APM

### Performance Monitoring

- Monitor API response times
- Track video generation costs
- Watch database query performance

## Scaling Considerations

### Database

- Use connection pooling (Vercel Postgres provides this)
- Monitor query performance
- Add indexes as needed

### API Routes

- Vercel automatically scales serverless functions
- Monitor function execution time
- Consider edge functions for static content

### Media Storage

- Cloudinary handles CDN and optimization
- Monitor storage usage
- Set up automatic cleanup for old media

### Video Generation

- Monitor Veo API costs
- Set up alerts for failed generations
- Consider rate limiting for video generation

## Security Checklist

- [ ] All environment variables are set
- [ ] `CRON_SECRET` is set and secure
- [ ] CORS is configured correctly
- [ ] Rate limiting is enabled (via Vercel)
- [ ] Database credentials are secure
- [ ] API keys are restricted (where possible)
- [ ] HTTPS is enforced
- [ ] Security headers are set (via middleware)

## Troubleshooting

### Build Failures

- Check build logs in Vercel dashboard
- Verify all dependencies are in `package.json`
- Ensure TypeScript compiles without errors

### Runtime Errors

- Check Vercel function logs
- Verify environment variables are set
- Check database connectivity

### Cron Job Issues

- Verify `CRON_SECRET` is set
- Check cron job logs in Vercel
- Ensure endpoints return 200 status

### Database Connection Issues

- Verify `POSTGRES_URL` is correct
- Check if using pooled connection string
- Verify database is accessible from Vercel

## Rollback Plan

1. Go to Vercel Dashboard → Deployments
2. Find previous successful deployment
3. Click "..." → "Promote to Production"

## Support

For issues:
1. Check Vercel logs
2. Review error tracking (if configured)
3. Check `/api/health` endpoint
4. Review environment variable configuration

---

**Last Updated:** December 2024

