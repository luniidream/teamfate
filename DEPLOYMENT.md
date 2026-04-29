# 🚀 Deployment Guide - Vercel & GitHub

This guide will help you deploy the Team Fate Tracker to Vercel and set up your GitHub repository.

## 📋 Prerequisites

- Node.js 18+ and npm/pnpm installed
- A Vercel account (free tier works)
- A GitHub account
- A MySQL database (you can use PlanetScale, Railway, or any MySQL hosting)

## 🔄 GitHub Setup

### 1. Initialize Git Repository

```bash
# If not already a git repo
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Team Fate Tracker"

# Add your GitHub remote (replace with your repo)
git remote add origin https://github.com/your-username/team-fate-tracker.git

# Push to GitHub
git push -u origin main
```

### 2. Create .gitignore

A `.gitignore` file is already included. It excludes:
- `node_modules/`
- `dist/` (build output)
- `.env` files
- IDE files
- OS files
- `.vercel/` directory

### 3. Push to GitHub

```bash
git add .
git commit -m "Configure for Vercel deployment"
git push origin main
```

## 🔗 Vercel Deployment

### Option 1: Vercel Dashboard (Recommended)

1. **Go to [Vercel](https://vercel.com)** and log in

2. **Import your GitHub repository**
   - Click "Add New Project"
   - Select "Import Git Repository"
   - Choose your `team-fate-tracker` repository

3. **Configure the project**
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `pnpm install`

4. **Add Environment Variables**
   - In the Vercel dashboard, go to Project Settings > Environment Variables
   - Add the following variables:
     - `DATABASE_URL` - Your MySQL connection string
     - `JWT_SECRET` - A random secret key (generate with `openssl rand -hex 32`)
     - `ADMIN_PASSWORD` - Your admin password
   - Click "Add" for each variable

5. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your project
   - You'll get a live URL like `https://team-fate-tracker.vercel.app`

### Option 2: Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (in your project directory)
vercel

# Follow the prompts:
# - Set up and deploy? Y
# - Which scope? (your account)
# - Link to existing project? N
# - Project name? team-fate-tracker
# - Directory? ./
# - Override settings? N

# Deploy to production
vercel --prod
```

## 🗄️ Database Setup

### Option 1: PlanetScale (Free MySQL)

1. Create a [PlanetScale](https://planetscale.com) account
2. Create a new database
3. Get your connection string from the dashboard
4. Use this as your `DATABASE_URL` in Vercel

### Option 2: Railway

1. Create a [Railway](https://railway.app) account
2. Deploy a MySQL database
3. Get the connection string
4. Use as `DATABASE_URL`

### Option 3: Self-hosted MySQL

If you have your own MySQL server, ensure it's accessible from Vercel's servers and use the connection string.

## 🔧 Post-Deployment Setup

### 1. Initialize Database

After deploying, you need to run migrations:

```bash
# In Vercel, you can use the "Functions" tab to run commands
# Or connect locally and run:
npm run db:push
```

### 2. Set Admin Password

The admin password is set via the `ADMIN_PASSWORD` environment variable. Make sure it's strong!

### 3. Access Admin Panel

- Go to `/admin-login` (not linked in public nav)
- Use the password you set in `ADMIN_PASSWORD`
- From there you can manage members, shinies, bounties, events, and site settings

## 🔄 Automatic Deployments

Vercel automatically deploys when you push to your main branch:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

Vercel will:
1. Detect the push
2. Install dependencies
3. Run the build command
4. Deploy the new version

## 🌐 Custom Domain (Optional)

1. Go to Project Settings > Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Vercel will provision SSL automatically

## 📊 Monitoring

- **Vercel Analytics**: Enable in Project Settings > Analytics
- **Logs**: View deployment logs in the dashboard
- **Functions**: Monitor serverless function usage

## 🛠️ Troubleshooting

### Build Fails

- Check the build logs in Vercel
- Ensure all dependencies are in `package.json`
- Verify the build command is correct

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Ensure your database allows connections from Vercel's IP ranges
- Check if your database requires SSL

### Environment Variables Not Working

- Ensure variables are added in Vercel dashboard
- Redeploy after adding new variables
- Check variable names match exactly

## 📝 Summary

Your deployment checklist:

- [ ] GitHub repository created and code pushed
- [ ] Vercel account connected to GitHub
- [ ] Project imported to Vercel
- [ ] Environment variables configured
- [ ] Database set up and connected
- [ ] Migrations run
- [ ] Admin password set
- [ ] Test deployment live
- [ ] (Optional) Custom domain configured

## 🎉 You're Live!

Your Team Fate Tracker is now deployed and accessible worldwide via Vercel's CDN. Share your URL with your team members!

---

**Need help?** Check the main README.md or the project documentation.