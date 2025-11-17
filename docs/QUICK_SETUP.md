# 🚀 Quick Setup Reference

## Quick Start Commands

```bash
# Interactive setup for Cloudinary & Vision API
npm run setup:services

# Validate all environment variables
npm run validate-env

# Full interactive setup (all services)
npm run setup
```

## Required Environment Variables

Add these to your `.env.local` file:

```bash
# Cloudinary (REQUIRED)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name

# Google Vision API (REQUIRED)
GOOGLE_VISION_API_KEY=your_api_key
```

## Quick Links

- **Cloudinary Signup:** https://cloudinary.com/users/register/free
- **Google Cloud Console:** https://console.cloud.google.com
- **Vision API Enable:** https://console.cloud.google.com/apis/library/vision.googleapis.com

## Testing

```bash
# Test Cloudinary
curl -X POST http://localhost:3000/api/cloudinary/signature \
  -H "Content-Type: application/json" \
  -d '{"folder": "cali-lights"}'

# Test Vision API
curl -X POST http://localhost:3000/api/metadata/analyse \
  -H "Content-Type: application/json" \
  -d '{
    "mediaUrl": "https://storage.googleapis.com/gcp-public-data-aiplatform/example-images/vision/landmark.jpg",
    "mediaType": "photo"
  }'
```

## Full Documentation

See `docs/SETUP_CLOUDINARY_VISION.md` for detailed step-by-step instructions.

