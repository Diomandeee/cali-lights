# Monitoring & Error Tracking Setup

This guide covers setting up monitoring and error tracking for Cali Lights.

## Sentry Setup

### 1. Install Sentry

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### 2. Configure Environment Variables

Add to `.env.local`:

```bash
SENTRY_DSN=your_sentry_dsn_here
SENTRY_ORG=your_org
SENTRY_PROJECT=cali-lights
SENTRY_AUTH_TOKEN=your_auth_token
```

### 3. Initialize Sentry

The Sentry wizard will create:
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`

### 4. Use Sentry Helpers

```typescript
import { captureException, captureMessage } from "@/lib/utils/sentry";

try {
  // Your code
} catch (error) {
  captureException(error as Error, { context: "mission creation" });
}
```

## Vercel Analytics

Vercel provides built-in analytics:

1. Go to Vercel Dashboard → Your Project → Analytics
2. Enable Web Analytics
3. View metrics in dashboard

## Custom Monitoring

### Health Check Endpoint

Monitor `/api/health` endpoint:
- Set up uptime monitoring (e.g., UptimeRobot, Pingdom)
- Alert on non-200 responses
- Check service status

### Log Aggregation

Consider using:
- **Vercel Logs**: Built-in logging
- **Logtail**: Log aggregation
- **Datadog**: Full APM solution

### Metrics to Monitor

1. **API Response Times**
   - Average response time
   - P95/P99 percentiles
   - Slow endpoints

2. **Error Rates**
   - 4xx errors
   - 5xx errors
   - Error trends

3. **Database Performance**
   - Query times
   - Connection pool usage
   - Slow queries

4. **External Services**
   - Cloudinary upload success rate
   - Vision API success rate
   - Veo API success rate

5. **Business Metrics**
   - Mission completion rate
   - Video generation success rate
   - User engagement

## Alerting

### Critical Alerts

Set up alerts for:
- Health check failures
- High error rates (> 5%)
- Database connection failures
- External service failures

### Warning Alerts

Set up warnings for:
- Slow response times (> 2s)
- High memory usage
- Approaching rate limits

## Example Monitoring Setup

### UptimeRobot

1. Create account at https://uptimerobot.com
2. Add monitor:
   - Type: HTTP(s)
   - URL: `https://your-domain.com/api/health`
   - Interval: 5 minutes
   - Alert contacts: Your email

### Sentry Alerts

1. Go to Sentry → Alerts
2. Create alert rule:
   - Trigger: Error count > 10 in 5 minutes
   - Action: Send email/Slack notification

## Logging Best Practices

1. **Structured Logging**: Use JSON format
2. **Log Levels**: Use appropriate levels (info, warn, error)
3. **Context**: Include relevant context in logs
4. **Sensitive Data**: Never log passwords, tokens, or PII
5. **Performance**: Don't log in hot paths

## Example Logging

```typescript
import { logger } from "@/lib/utils/logger";

// Info log
logger.info("Mission started", {
  missionId: mission.id,
  chainId: mission.chain_id,
});

// Warning log
logger.warn("Metadata extraction slow", {
  entryId: entry.id,
  duration: 5000,
});

// Error log
logger.error("Failed to generate video", error, {
  operationId: op.operation_id,
  chapterId: chapter.id,
});
```

## Performance Monitoring

### Web Vitals

Monitor Core Web Vitals:
- LCP (Largest Contentful Paint)
- FID (First Input Delay)
- CLS (Cumulative Layout Shift)

### API Performance

Track:
- Request duration
- Database query time
- External API call time

## Cost Monitoring

### Veo API Costs

Track video generation costs:
- Monitor `video_operations.cost_usd`
- Set up alerts for high costs
- Review analytics dashboard

### Cloudinary Costs

Monitor:
- Storage usage
- Bandwidth usage
- Transformations

## Dashboard

Create monitoring dashboard with:
- Health status
- Error rates
- Response times
- Active users
- Mission completion rates

---

**Next Steps:**
1. Set up Sentry account
2. Configure environment variables
3. Set up uptime monitoring
4. Configure alerts
5. Review logs regularly

