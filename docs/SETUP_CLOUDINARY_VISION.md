# 🔧 Cloudinary & Google Vision API Setup Guide

**Time Required:** ~35 minutes total  
**Difficulty:** Easy (just following steps)

---

## 📋 Prerequisites

- A Google account (for Vision API)
- An email address (for Cloudinary signup)
- Access to your `.env.local` file

---

## Part 1: Cloudinary Setup (15 minutes)

### Step 1: Sign Up for Cloudinary

1. Go to https://cloudinary.com/users/register/free
2. Click **"Start for free"**
3. Fill in:
   - Email address
   - Password
   - Company/Project name: `Cali Lights`
4. Click **"Create Account"**
5. Verify your email if prompted

### Step 2: Get Your Credentials

1. After logging in, you'll see your **Dashboard**
2. Look for the **"Account Details"** section (usually on the right sidebar)
3. You'll see:
   - **Cloud Name** (e.g., `dxyz123abc`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (click "Reveal" to show it)

**⚠️ Important:** Copy these values - you'll need them in Step 4!

### Step 3: Create Upload Preset (Optional but Recommended)

1. Go to **Settings** → **Upload** → **Upload presets**
2. Click **"Add upload preset"**
3. Configure:
   - **Preset name:** `cali_lights_unsigned`
   - **Signing mode:** Select **"Unsigned"**
   - **Folder:** `cali-lights/`
   - **Upload manipulation:** Leave default
   - **Access mode:** **Public**
4. Click **"Save"**

**Note:** The unsigned preset allows client-side uploads without exposing your API secret.

### Step 4: Add to Environment Variables

Open your `.env.local` file (create it if it doesn't exist) and add:

```bash
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
```

**Replace** `your_cloud_name_here`, `your_api_key_here`, and `your_api_secret_here` with your actual values from Step 2.

### Step 5: Verify Cloudinary Setup

Run this command to test:

```bash
npm run validate-env
```

Or test manually:

```bash
curl -X POST http://localhost:3000/api/cloudinary/signature \
  -H "Content-Type: application/json" \
  -d '{"folder": "cali-lights"}'
```

You should get a response with `signature`, `timestamp`, `apiKey`, etc.

---

## Part 2: Google Vision API Setup (20 minutes)

### Step 1: Create Google Cloud Project

1. Go to https://console.cloud.google.com
2. Click the project dropdown at the top
3. Click **"New Project"**
4. Fill in:
   - **Project name:** `cali-lights` (or any name you prefer)
   - **Organization:** (leave default if you have one)
   - **Location:** (leave default)
5. Click **"Create"**
6. Wait for project creation (usually 10-30 seconds)
7. Select your new project from the dropdown

### Step 2: Enable Vision API

1. In the Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for **"Cloud Vision API"**
3. Click on **"Cloud Vision API"**
4. Click **"Enable"**
5. Wait for enabling to complete (usually 10-20 seconds)

**Note:** You may see a billing warning. The Vision API has a free tier:
- **Free:** 1,000 requests/month
- **Paid:** $1.50 per 1,000 requests after free tier

### Step 3: Create API Key

1. Go to **APIs & Services** → **Credentials**
2. Click **"+ CREATE CREDENTIALS"** → **"API key"**
3. A popup will show your new API key - **copy it immediately!**
4. (Optional but recommended) Click **"Restrict key"**:
   - Under **"API restrictions"**, select **"Restrict key"**
   - Check **"Cloud Vision API"**
   - Click **"Save"**
5. (Optional) Under **"Application restrictions"**, you can restrict by IP or HTTP referrer for extra security

**⚠️ Important:** Copy your API key - you'll need it in Step 4!

### Step 4: Add to Environment Variables

Add this to your `.env.local` file:

```bash
# Google Vision API Configuration
GOOGLE_VISION_API_KEY=your_api_key_here
```

**Replace** `your_api_key_here` with your actual API key from Step 3.

### Step 5: Verify Vision API Setup

Run this command to test:

```bash
npm run validate-env
```

Or test manually with a simple image:

```bash
curl -X POST "https://vision.googleapis.com/v1/images:annotate?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "requests": [{
      "image": {
        "source": {
          "imageUri": "https://storage.googleapis.com/gcp-public-data-aiplatform/example-images/vision/landmark.jpg"
        }
      },
      "features": [{
        "type": "LABEL_DETECTION",
        "maxResults": 5
      }]
    }]
  }'
```

Replace `YOUR_API_KEY` with your actual API key. You should get a JSON response with labels.

---

## ✅ Verification Checklist

After completing both setups, verify everything works:

### 1. Check Environment Variables

```bash
npm run validate-env
```

You should see:
- ✅ `CLOUDINARY_CLOUD_NAME` - configured
- ✅ `CLOUDINARY_API_KEY` - configured
- ✅ `CLOUDINARY_API_SECRET` - configured
- ✅ `GOOGLE_VISION_API_KEY` - configured

### 2. Test Cloudinary Upload

```bash
# Start your dev server first
npm run dev

# In another terminal, test upload signature
curl -X POST http://localhost:3000/api/cloudinary/signature \
  -H "Content-Type: application/json" \
  -d '{"folder": "cali-lights"}'
```

Should return: `{"signature": "...", "timestamp": ..., "apiKey": "...", ...}`

### 3. Test Vision API

```bash
# Test with a public image URL
curl -X POST http://localhost:3000/api/metadata/analyse \
  -H "Content-Type: application/json" \
  -d '{
    "mediaUrl": "https://storage.googleapis.com/gcp-public-data-aiplatform/example-images/vision/landmark.jpg",
    "mediaType": "photo"
  }'
```

Should return metadata with `palette`, `sceneTags`, `objectTags`, etc.

### 4. Test Complete Flow

1. Start a mission via admin panel
2. Join the mission
3. Upload an image
4. Check that:
   - Image uploads successfully
   - Metadata is extracted (tags, colors)
   - Entry is saved to database

---

## 🐛 Troubleshooting

### Cloudinary Issues

**Problem:** "Invalid API key" or "Authentication failed"
- **Solution:** Double-check your `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` in `.env.local`
- Make sure there are no extra spaces or quotes

**Problem:** "Cloud name not found"
- **Solution:** Verify your `CLOUDINARY_CLOUD_NAME` matches exactly what's in your Cloudinary dashboard

**Problem:** Upload works but images don't appear
- **Solution:** Check that `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` matches `CLOUDINARY_CLOUD_NAME`

### Vision API Issues

**Problem:** "API key not valid"
- **Solution:** 
  - Verify your API key is correct
  - Make sure Vision API is enabled in your Google Cloud project
  - Check if API key restrictions are blocking your requests

**Problem:** "API not enabled"
- **Solution:** Go to APIs & Services → Library → Enable "Cloud Vision API"

**Problem:** "Quota exceeded"
- **Solution:** You've hit the free tier limit (1,000 requests/month). Wait for next month or enable billing.

**Problem:** "Permission denied"
- **Solution:** Check API key restrictions - make sure Vision API is allowed

### General Issues

**Problem:** Environment variables not loading
- **Solution:** 
  - Make sure file is named `.env.local` (not `.env`)
  - Restart your dev server after changing `.env.local`
  - Check for typos in variable names

**Problem:** "Module not found" errors
- **Solution:** Run `npm install` to ensure all dependencies are installed

---

## 📚 Additional Resources

### Cloudinary
- Documentation: https://cloudinary.com/documentation
- Upload presets: https://cloudinary.com/documentation/upload_presets
- Free tier limits: https://cloudinary.com/pricing

### Google Vision API
- Documentation: https://cloud.google.com/vision/docs
- Pricing: https://cloud.google.com/vision/pricing
- Free tier: 1,000 requests/month

---

## 🎉 Next Steps

Once both services are configured:

1. ✅ Test image upload in a mission
2. ✅ Verify metadata extraction works
3. ✅ Check that entries are saved with metadata
4. ✅ Test complete mission flow: start → join → upload → recap

**You're all set!** 🚀

---

## 💰 Cost Estimate

### Free Tier (MVP)
- **Cloudinary:** Free (25GB storage, 25GB bandwidth/month)
- **Google Vision API:** Free (1,000 requests/month)
- **Total:** $0/month

### With Usage
- **Cloudinary:** Free tier usually sufficient
- **Google Vision API:** ~$5-10/month (assuming 5,000 requests)
- **Total:** ~$5-10/month

---

**Need help?** Check the troubleshooting section or run `npm run setup` for interactive help.

