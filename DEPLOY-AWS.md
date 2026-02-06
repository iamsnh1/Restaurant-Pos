# Deploying to Amazon Web Services (AWS) 🚀

This guide explains how to host the Voxxera POS system on AWS for high performance and reliability.

## 1. Prerequisites
- An [AWS Account](https://aws.amazon.com/free/)
- Your code pushed to **GitHub**.

---

## 2. Deploy the Backend (AWS App Runner) - *Simplest Option*

AWS App Runner is the fastest way to get your Node.js backend live on AWS.

1. **Open AWS Console**: Search for **"App Runner"** and click **Create service**.
2. **Source**: Select **Source code repository** -> Connect to your GitHub account.
3. **Repository**: Choose `Restaurant-Pos` and the `main` branch.
4. **Deployment Settings**: Select **Automatic** (so it updates when you push code).
5. **Runtime Configuration**:
   - **Runtime**: `Node.js 18` or `Node.js 20`.
   - **Build Command**: `cd backend && npm install && npx prisma generate`
   - **Start Command**: `cd backend && node server.js`
   - **Port**: `5001`
6. **Configuration**:
   - **Environment Variables**:
     - `DATABASE_URL`: (Your MongoDB Atlas Link)
     - `JWT_SECRET`: `your_aws_pos_secret`
7. **Create & Deploy**. Once live, copy your Service URL (e.g., `https://xxxx.us-east-1.awsapprunner.com`).

---

## 3. Deploy the Frontend (AWS Amplify)

AWS Amplify is perfect for hosting Vite/React applications.

1. **Open AWS Console**: Search for **"AWS Amplify"**.
2. **Launch App**: Click **"Get Started"** under **Amplify Hosting**.
3. **Connect**: Select **GitHub** and authorize.
4. **Repository**: Choose `Restaurant-Pos` and `main` branch.
5. **Build Settings**:
   - **App Location**: `/frontend` (Amplify usually detects this).
   - **Build Settings YAML**: Ensure the build command is `npm run build` and the base directory is `dist`.
6. **Environment Variables**:
   Under **Build settings -> Environment variables**, add:
   - `VITE_API_URL`: `https://<your-app-runner-url>/api`
7. **Save and Deploy**.

---

## 4. Why AWS?
- **Global Reach**: Use AWS regions to keep your POS fast in any city.
- **Pay as you go**: AWS Free Tier covers a lot of the initial usage.
- **Security**: Professional-grade encryption and access controls.
