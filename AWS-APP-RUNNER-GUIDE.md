# AWS App Runner Deployment Guide for Reportr

AWS App Runner is the perfect solution for your Reportr civic engagement platform - no Docker complexity, automatic scaling, and direct GitHub integration!

## 🚀 Quick Deployment Steps

### 1. Push Your Code to GitHub
Make sure your Reportr code is in a GitHub repository (public or private).

### 2. Set Environment Variables
```bash
export AWS_REGION="us-east-1"  # or your preferred region
export GITHUB_REPO_URL="https://github.com/your-username/reportr"
export DATABASE_URL="postgresql://user:pass@host:5432/reportr"
export RESEND_API_KEY="re_your_resend_api_key"
export GOOGLE_MAPS_API_KEY="AIzaSy_your_google_maps_key"

# Optional - only for private repositories
export GITHUB_CONNECTION_ARN="arn:aws:apprunner:region:account:connection/name"
```

### 3. Deploy to App Runner
```bash
./deploy-apprunner.sh
```

That's it! Your application will be live in 5-10 minutes.

## ✅ Why App Runner is Perfect for Reportr

- **No Docker hassles** - Builds directly from your source code
- **Automatic scaling** - Handles traffic spikes during crisis reporting
- **Built-in load balancing** - Perfect for your South African multi-municipality system
- **Continuous deployment** - Automatically updates when you push to GitHub
- **HTTPS included** - Secure by default
- **Health monitoring** - Uses your `/api/health` endpoint

## 🔧 App Runner Features for Your Use Case

- **Geographic distribution** - Your municipality routing system works globally
- **Email reliability** - Resend integration works seamlessly
- **Database connectivity** - Direct PostgreSQL connection support
- **Environment secrets** - Secure API key management
- **Auto-scaling** - Handles varying report volumes across different municipalities

## 📊 Monitoring Your Deployment

After deployment, you can:
- View logs in the AWS Console
- Monitor performance metrics
- Set up alerts for your civic reporting system
- Track usage across different South African regions

## 💰 Cost Effective

App Runner pricing is based on usage:
- Pay only for active requests
- No charges when your app is idle
- Perfect for civic applications with variable traffic

Your sophisticated Reportr platform with location-based municipality routing and automated email notifications will run beautifully on App Runner!