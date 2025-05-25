# Deploying Reportr to Vercel

This guide provides instructions for deploying the Reportr application to Vercel.

## Prerequisites

- A Vercel account (sign up at [vercel.com](https://vercel.com))
- Git repository with your Reportr project
- Required environment variables:
  - `DATABASE_URL`: Connection string for your PostgreSQL database
  - `VITE_GOOGLE_MAPS_API_KEY`: Google Maps API key for map functionality
  - `RESEND_API_KEY`: API key for sending emails via Resend

## Deployment Steps

1. **Prepare your project**
   - Ensure all changes are committed to your repository
   - Make sure your `vercel.json` configuration is in the root directory

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com) and sign in
   - Click "New Project"
   - Import your Git repository
   - Configure the project:
     - Framework Preset: Other
     - Build Command: `npm run build`
     - Output Directory: `dist`
     - Install Command: `npm ci`
   - Add the required environment variables:
     - Add `DATABASE_URL` with your PostgreSQL connection string
     - Add `VITE_GOOGLE_MAPS_API_KEY` with your Google Maps API key
     - Add `RESEND_API_KEY` with your Resend API key
   - Click "Deploy"

3. **Set up PostgreSQL Database**
   - Create a PostgreSQL database (we recommend using Vercel Postgres, Neon, or Supabase)
   - Update the `DATABASE_URL` environment variable with your database connection string
   - The first time your application runs, the database schema will be automatically created

4. **Verify Deployment**
   - Once deployment is complete, Vercel will provide a URL for your application
   - Visit the URL to ensure everything is working correctly
   - Test both the frontend and API functionality

## Troubleshooting

- **Database Connection Issues**: Ensure your PostgreSQL database allows connections from Vercel's IP addresses
- **API Errors**: Check the Function Logs in the Vercel dashboard for any server-side errors
- **Build Failures**: Review the build logs for any errors during the build process

## Custom Domain Setup

1. Go to your project in the Vercel dashboard
2. Navigate to "Domains"
3. Add your custom domain
4. Follow Vercel's instructions to verify domain ownership and set up DNS records

## Continuous Deployment

Vercel automatically deploys new changes when you push to your repository. To disable this behavior:

1. Go to your project in the Vercel dashboard
2. Navigate to "Settings" > "Git"
3. Under "Ignored Build Step", add a command that will prevent automatic deployments if needed

## Monitoring

Use Vercel Analytics to monitor your application's performance and usage:

1. Go to your project in the Vercel dashboard
2. Navigate to "Analytics"
3. Review metrics like visitors, performance, and API usage