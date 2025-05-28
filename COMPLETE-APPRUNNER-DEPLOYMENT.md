# Complete AWS App Runner Deployment Package for Reportr

This package contains everything you need to deploy your Reportr civic engagement platform to AWS App Runner with automatic source-based deployment.

## 📦 Package Contents

- `apprunner.yaml` - App Runner build and runtime configuration
- `deploy-apprunner.sh` - Automated deployment script
- `apprunner-service-template.json` - Service configuration template
- Complete deployment documentation

## 🚀 Deployment Methods

### Method 1: Automated Script Deployment (Recommended)

1. **Push code to GitHub:**
   ```bash
   git push origin main
   ```

2. **Set environment variables:**
   ```bash
   export GITHUB_REPO_URL="https://github.com/your-username/reportr"
   export DATABASE_URL="postgresql://user:pass@host:5432/reportr"
   export RESEND_API_KEY="re_your_resend_api_key"
   export GOOGLE_MAPS_API_KEY="AIzaSy_your_google_maps_key"
   ```

3. **Deploy:**
   ```bash
   ./deploy-apprunner.sh
   ```

### Method 2: AWS Console Deployment

1. Go to AWS App Runner in the AWS Console
2. Click "Create service"
3. Choose "Source code repository"
4. Connect your GitHub repository
5. Use the `apprunner.yaml` configuration file
6. Set environment variables:
   - `DATABASE_URL`
   - `RESEND_API_KEY` 
   - `GOOGLE_MAPS_API_KEY`
7. Deploy!

### Method 3: AWS CLI Manual Deployment

1. **Create GitHub connection (for private repos):**
   ```bash
   aws apprunner create-connection --connection-name github-reportr --provider-type GITHUB
   ```

2. **Deploy using service template:**
   ```bash
   # Edit apprunner-service-template.json with your values
   aws apprunner create-service --cli-input-json file://apprunner-service-template.json
   ```

## ✅ Why This Works Perfectly for Reportr

- **Direct source deployment** - No Docker complexity
- **Automatic builds** - Uses your package.json scripts
- **Environment variables** - Secure API key management
- **Health monitoring** - Uses your `/api/health` endpoint
- **Auto-scaling** - Perfect for civic reporting traffic patterns
- **HTTPS included** - Secure by default

## 🔧 Configuration Details

### Build Process
App Runner will automatically:
1. Install dependencies with `npm install`
2. Build your application with `npm run build`
3. Start your server with `npm start`

### Runtime Configuration
- **Runtime:** Node.js 20
- **Port:** 5000 (matches your app)
- **Memory:** 0.5 GB (upgradeable)
- **CPU:** 0.25 vCPU (upgradeable)

### Health Checks
- **Path:** `/api/health`
- **Interval:** 20 seconds
- **Timeout:** 5 seconds
- **Healthy threshold:** 1 success
- **Unhealthy threshold:** 5 failures

## 🌍 Perfect for Your South African Municipalities

Your sophisticated Reportr platform will run beautifully with:
- Geographic municipality routing working globally
- Resend email notifications to different departments
- PostgreSQL database connectivity
- Google Maps integration
- Community voting and issue tracking

## 📊 Expected Performance

- **Cold start:** ~30 seconds
- **Deployment time:** 5-10 minutes
- **Auto-scaling:** Instant based on traffic
- **Availability:** 99.9% uptime SLA

## 💰 Cost Estimate

For a civic application like Reportr:
- **Low traffic:** $5-15/month
- **Medium traffic:** $15-50/month
- **High traffic during emergencies:** Scales automatically

## 🎯 Next Steps After Deployment

1. Test your health endpoint
2. Verify municipality routing works
3. Test email notifications
4. Set up custom domain (optional)
5. Configure monitoring and alerts

Your Reportr civic engagement platform is ready for production deployment!