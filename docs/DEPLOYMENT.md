# Deploying Ward Cleaning App to Vercel

This guide outlines the steps to deploy the Ward Cleaning application to Vercel using GitHub integration.

## Prerequisites

- A GitHub account with the repository `ward-cleaning-2025-3`
- A Vercel account connected to your GitHub
- A Supabase project with the necessary tables and configurations

## Setting Up Vercel Deployment

### 1. Connect GitHub Repository to Vercel

1. Log in to your [Vercel dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Find and select your `ward-cleaning-2025-3` repository
4. Vercel will detect the Next.js application automatically
5. `git config --global user.email "your-github-email@example.com"`

### 2. Configure Environment Variables

The `.env.local` file in your local development environment contains sensitive information that shouldn't be committed to GitHub. You need to add these environment variables to your Vercel project:

1. On the project configuration page before deploying, go to the "Environment Variables" section
2. Add the following variables from your `.env.local` file:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Any other environment variables your application uses

Example values (replace with your actual values):
```
NEXT_PUBLIC_SUPABASE_URL={URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY={ANON-KEY}
```

3. Click "Save" to store these environment variables

### 3. Configure Build and Development Settings

The project already contains a `vercel.json` file with the necessary configuration:

```json
{
  "buildCommand": "npm run build",
  "framework": "nextjs",
  "outputDirectory": ".next",
  "regions": ["iad1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ],
  "build": {
    "env": {
      "NEXT_PUBLIC_FORCE_DYNAMIC": "true"
    }
  }
}
```

This configuration:
- Sets the build command to `npm run build`
- Specifies Next.js as the framework
- Sets `.next` as the output directory
- Deploys to the IAD1 (US East) region
- Adds security headers
- Forces dynamic rendering for all pages

### 4. Deploy Your Application

1. Click "Deploy" to start the deployment process
2. Vercel will build and deploy your application
3. Once deployed, your site will be available at `ward-cleaning-2025-3.vercel.app`

## Supabase Configuration

To ensure your deployed application can connect to Supabase, you need to configure the appropriate security settings:

### 1. Configure Allowed URLs

1. Log in to your [Supabase dashboard](https://app.supabase.com/)
2. Select your project
3. Go to "Authentication" → "URL Configuration"
4. Add your Vercel deployment URL to the allowed list:
   - `https://ward-cleaning-2025-3.vercel.app`
   - (Optional) Add a custom domain if you have one

### 2. Configure CORS (Cross-Origin Resource Sharing)

1. In your Supabase dashboard, go to "API" → "Settings"
2. Under "CORS (Cross-Origin Resource Sharing)", add your Vercel deployment URL:
   - `https://ward-cleaning-2025-3.vercel.app`
   - (Optional) Add a custom domain if you have one

## Continuous Deployment

With the GitHub integration, Vercel will automatically deploy changes when you push to your repository:

1. Any push to the `main` branch will trigger a production deployment
2. Pull requests will create preview deployments automatically
3. You can view the deployment logs in your Vercel dashboard

## Custom Domains (Optional)

To add a custom domain to your Vercel deployment:

1. Go to your project in the Vercel dashboard
2. Click on "Settings" → "Domains"
3. Add your custom domain and follow the instructions to configure DNS settings

## Troubleshooting

### Dynamic Routes Issue

The application has been configured to use dynamic rendering for all routes to prevent issues with authentication and cookies. This is achieved through:

1. `dynamic = 'force-dynamic'` directives in layout files
2. `middleware.ts` that sets Cache-Control headers
3. `vercel.json` configuration for deployment

If you encounter any deployment issues, check:

1. Vercel deployment logs for specific errors
2. Ensure all environment variables are correctly set
3. Verify that your Supabase project is configured to allow requests from your Vercel deployment URL

### Authentication Issues

If users cannot authenticate properly:

1. Check that the Supabase URL and anon key are correctly set in Vercel environment variables
2. Verify that your Vercel deployment URL is added to the allowed URLs in Supabase authentication settings
3. Ensure CORS is properly configured in Supabase to allow requests from your Vercel deployment

## Monitoring and Analytics

Once deployed, you can monitor your application using Vercel Analytics:

1. Navigate to your project in the Vercel dashboard
2. Go to "Analytics" to view performance metrics
3. Set up monitoring and alerting as needed

For more detailed information on Vercel deployments, refer to the [Vercel documentation](https://vercel.com/docs). 