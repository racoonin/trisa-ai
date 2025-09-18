# 🚀 TISH Deployment Guide

## Quick Deploy Options

### 1. Vercel (Recommended) ⚡
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/tish-ai-therapist)

1. Click the button above
2. Sign in with GitHub
3. Import your repository
4. Click "Deploy"
5. Done! 🎉

### 2. Railway 🚄
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

1. Click the button above
2. Sign in with GitHub
3. Select your repository
4. Auto-deploys! ✅

### 3. Netlify 🌐
1. Go to [Netlify.com](https://netlify.com)
2. "New site from Git"
3. Choose your repository
4. Deploy! 🚀

### 4. Heroku 🟣
```bash
# Install Heroku CLI first
heroku create your-tish-app
git push heroku main
```

## Environment Setup

For production, you'll need to secure your API keys:

1. Create `.env` file (not in this repo for security)
2. Move API keys from code to environment variables
3. Update deployment platform with these variables

## API Keys Setup

In your deployment platform, add these environment variables:
- `ELEVEN_API_KEY=your_elevenlabs_key`
- `ASSEMBLY_API_KEY=your_assemblyai_key` 
- `GEMINI_API_KEY=your_gemini_key`

## Custom Domain (Optional)

Once deployed, you can add your custom domain:
- Vercel: Project Settings → Domains
- Netlify: Site Settings → Domain Management
- Railway: Project Settings → Domains

## 🎯 Expected URLs

After deployment, your TISH app will be available at:
- Vercel: `https://tish-ai-therapist.vercel.app`
- Railway: `https://tish-ai-therapist.up.railway.app`
- Netlify: `https://tish-ai-therapist.netlify.app`

## Monitoring

All platforms provide:
- ✅ Automatic deployments on Git push
- ✅ SSL certificates (HTTPS)
- ✅ CDN distribution
- ✅ Analytics and logs
- ✅ Custom domains

## Support

If deployment fails:
1. Check build logs
2. Ensure all dependencies are in `package.json`
3. Verify file paths are correct
4. Check API key configuration

---

**Your TISH app will be live and accessible worldwide! 🌍**