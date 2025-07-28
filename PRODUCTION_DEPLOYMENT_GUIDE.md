# 🚀 Production Deployment Guide - Alchemy Smart Wallet

Panduan lengkap untuk deploy crypto wallet dengan integrasi Alchemy Gas Manager dan Smart Wallet (ERC4337) ke production.

## 📋 Prerequisites

### 1. Alchemy Account Setup
1. **Daftar di Alchemy Dashboard**
   - Buka [dashboard.alchemy.com](https://dashboard.alchemy.com/)
   - Buat akun atau login
   - Verify email dan lengkapi profile

2. **Buat App untuk Production Networks**
   ```bash
   # Mainnet (Ethereum)
   - Network: Ethereum Mainnet
   - Name: YourApp-Mainnet
   - Description: Production smart wallet

   # Sepolia (Testing)
   - Network: Ethereum Sepolia  
   - Name: YourApp-Sepolia
   - Description: Testing smart wallet

   # Polygon (Optional)
   - Network: Polygon Mainnet
   - Name: YourApp-Polygon
   - Description: Production polygon wallet
   ```

3. **Copy API Keys**
   - Mainnet API Key: `ak_xxxxxxxxxxxxxxxxxxxxxxxx`
   - Sepolia API Key: `ak_yyyyyyyyyyyyyyyyyyyyyyyy`
   - Polygon API Key: `ak_zzzzzzzzzzzzzzzzzzzzzzzz`

### 2. Gas Manager Setup

#### Setup Gas Sponsorship Policies
1. **Buka Gas Manager di Alchemy Dashboard**
   ```
   Dashboard → Account Abstraction → Gas Manager
   ```

2. **Buat Policy untuk Sepolia (Testing)**
   ```json
   {
     "name": "Sepolia Test Policy",
     "network": "Ethereum Sepolia",
     "rules": [
       {
         "type": "spending_limit",
         "daily_limit": "0.05 ETH",
         "monthly_limit": "0.5 ETH"
       },
       {
         "type": "allowlist",
         "addresses": ["0xYourTestWalletAddress"]
       }
     ]
   }
   ```

3. **Buat Policy untuk Mainnet (Production)**
   ```json
   {
     "name": "Mainnet Production Policy",
     "network": "Ethereum Mainnet", 
     "rules": [
       {
         "type": "spending_limit",
         "daily_limit": "0.1 ETH",
         "monthly_limit": "2.0 ETH"
       },
       {
         "type": "contract_method",
         "allowed_methods": [
           "0xa9059cbb", // ERC20 transfer
           "0x", // ETH transfer
           "0x095ea7b3"  // ERC20 approve
         ]
       }
     ]
   }
   ```

4. **Copy Policy IDs**
   - Sepolia Policy ID: `pol_sepolia_xxxxxxxxxxxx`
   - Mainnet Policy ID: `pol_mainnet_xxxxxxxxxxxx`

### 3. Social OAuth Setup

#### Google OAuth
1. **Google Cloud Console**
   - Buka [console.cloud.google.com](https://console.cloud.google.com/)
   - Buat project baru atau pilih existing
   - Enable Google+ API

2. **OAuth Consent Screen**
   ```
   Application name: YourApp Crypto Wallet
   User support email: support@yourdomain.com
   Authorized domains: yourdomain.com
   ```

3. **Create Credentials**
   ```
   Type: OAuth 2.0 Client ID
   Application type: Web application
   Name: YourApp Web Client
   Authorized redirect URIs:
   - https://yourdomain.com/auth/google/callback
   - http://localhost:3000/auth/google/callback (development)
   ```

#### Facebook OAuth
1. **Facebook Developers**
   - Buka [developers.facebook.com](https://developers.facebook.com/)
   - Buat app baru atau pilih existing

2. **Add Facebook Login Product**
   ```
   Valid OAuth Redirect URIs:
   - https://yourdomain.com/auth/facebook/callback
   - http://localhost:3000/auth/facebook/callback (development)
   ```

## ⚙️ Environment Configuration

### 1. Copy Template
```bash
cp template.env.txt .env.local
```

### 2. Configure Production Environment
```bash
# ==================================================
# ALCHEMY PRODUCTION CONFIGURATION
# ==================================================
NEXT_PUBLIC_ALCHEMY_API_KEY=ak_your_production_api_key

# Network RPC URLs
NEXT_PUBLIC_ETH_MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/ak_your_mainnet_key
NEXT_PUBLIC_ETH_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/ak_your_sepolia_key
NEXT_PUBLIC_POLYGON_MAINNET_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/ak_your_polygon_key

# Gas Manager Policies
NEXT_PUBLIC_ETH_MAINNET_GAS_POLICY_ID=pol_mainnet_xxxxxxxxxxxx
NEXT_PUBLIC_ETH_SEPOLIA_GAS_POLICY_ID=pol_sepolia_xxxxxxxxxxxx
NEXT_PUBLIC_POLYGON_MAINNET_GAS_POLICY_ID=pol_polygon_xxxxxxxxxxxx

# Gas Manager Settings
NEXT_PUBLIC_GAS_MANAGER_ENABLED=true
NEXT_PUBLIC_ENABLE_GAS_SPONSORSHIP=true
NEXT_PUBLIC_DAILY_GAS_LIMIT=0.1
NEXT_PUBLIC_MONTHLY_GAS_LIMIT=2.0

# Smart Wallet Configuration
NEXT_PUBLIC_ENTRYPOINT_ADDRESS=0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789
NEXT_PUBLIC_AUTO_DEPLOY_WALLET=true

# Social OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXT_PUBLIC_FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Production Network (mainnet for production, sepolia for staging)
NEXT_PUBLIC_DEFAULT_CHAIN_ID=1
NEXT_PUBLIC_DEFAULT_CHAIN_NAME=Ethereum Mainnet
NEXT_PUBLIC_DEFAULT_NETWORK_SYMBOL=ETH

# Security
NEXT_PUBLIC_ENCRYPT_PRIVATE_KEYS=true
ENCRYPTION_SECRET=your_strong_encryption_secret_here
NEXT_PUBLIC_SESSION_TIMEOUT=3600

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_ENABLE_ERROR_REPORTING=true
```

## 🏗️ Build & Deploy

### 1. Install Dependencies
```bash
npm install
```

### 2. Build Production
```bash
npm run build
```

### 3. Test Production Build Locally
```bash
npm start
```

### 4. Deploy to Production

#### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_ALCHEMY_API_KEY
vercel env add NEXT_PUBLIC_ETH_MAINNET_RPC_URL
vercel env add NEXT_PUBLIC_ETH_MAINNET_GAS_POLICY_ID
# ... add all environment variables

# Deploy production
vercel --prod
```

#### Netlify Deployment
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build and deploy
netlify deploy --prod --dir=.next

# Set environment variables
netlify env:set NEXT_PUBLIC_ALCHEMY_API_KEY your_key
# ... set all environment variables
```

#### Docker Deployment
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t crypto-wallet .
docker run -p 3000:3000 --env-file .env.local crypto-wallet
```

## 🔐 Security Checklist

### 1. Environment Variables
- [ ] API keys tidak di-commit ke git
- [ ] Environment variables ter-set di production
- [ ] Encryption secret menggunakan string random yang kuat
- [ ] OAuth secrets aman disimpan

### 2. Domain Security
- [ ] HTTPS enabled untuk production domain
- [ ] Domain whitelist di OAuth providers
- [ ] CORS configuration benar
- [ ] CSP headers ter-setup

### 3. Smart Contract Security
- [ ] Gas policies ter-configure dengan limit yang aman
- [ ] Allowlist addresses untuk testing
- [ ] Spending limits ter-set sesuai kebutuhan
- [ ] Regular monitoring gas usage

### 4. Application Security
- [ ] Rate limiting enabled
- [ ] Input validation di semua forms
- [ ] Error handling tidak expose sensitive data
- [ ] Session management secure

## 📊 Monitoring & Analytics

### 1. Alchemy Dashboard Monitoring
- **Gas Manager Usage**
  - Daily/monthly gas consumption
  - Policy violations
  - Transaction success rates

- **Smart Account Analytics**
  - Account creation rates
  - Transaction volumes
  - Error rates

### 2. Application Monitoring
```bash
# Sentry for error tracking
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn

# Google Analytics
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=your_ga_id
```

### 3. Performance Monitoring
- Transaction confirmation times
- Gas price optimization
- Network switching latency
- User experience metrics

## 🧪 Testing Production Setup

### 1. Test dengan Sepolia Testnet
```bash
# Set Sepolia sebagai default untuk testing
NEXT_PUBLIC_DEFAULT_CHAIN_ID=11155111
NEXT_PUBLIC_DEFAULT_CHAIN_NAME=Sepolia
```

### 2. Functional Testing Checklist
- [ ] Social login (Google/Facebook)
- [ ] Wallet initialization
- [ ] Smart account deployment
- [ ] Native token transfer (ETH)
- [ ] ERC20 token transfer
- [ ] Gas sponsorship working
- [ ] Network switching
- [ ] Balance updates
- [ ] Error handling

### 3. Load Testing
```bash
# Test high transaction volume
# Monitor gas policy limits
# Check API rate limits
```

## 🔄 Maintenance & Updates

### 1. Regular Tasks
- **Weekly**: Monitor gas usage dan policy limits
- **Monthly**: Review transaction volumes dan costs
- **Quarterly**: Update dependencies dan security patches

### 2. Gas Policy Management
```bash
# Monitor daily gas spending
curl -H "Authorization: Bearer $ALCHEMY_API_KEY" \
  "https://dashboard.alchemy.com/api/gas-manager/policies/$POLICY_ID/usage"

# Update policy limits jika diperlukan
curl -X PATCH \
  -H "Authorization: Bearer $ALCHEMY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"dailyLimit": "0.2"}' \
  "https://dashboard.alchemy.com/api/gas-manager/policies/$POLICY_ID"
```

### 3. Smart Contract Updates
- Monitor ERC4337 standard updates
- Update EntryPoint address jika ada versi baru
- Test compatibility dengan network upgrades

## 🚨 Troubleshooting

### Common Issues

#### "Gas Policy Not Found"
```bash
# Check policy ID di environment variables
echo $NEXT_PUBLIC_ETH_MAINNET_GAS_POLICY_ID

# Verify policy active di Alchemy dashboard
```

#### "Smart Account Deployment Failed"
```bash
# Check gas limits
# Verify EntryPoint address
# Check network connectivity
```

#### "Social Login Failed"
```bash
# Verify OAuth redirect URLs
# Check client IDs dan secrets
# Validate domain whitelist
```

#### High Gas Costs
```bash
# Review gas policies
# Optimize transaction batching
# Consider network switching
```

## 📞 Support Contacts

- **Alchemy Support**: [docs.alchemy.com](https://docs.alchemy.com/)
- **ERC4337 Docs**: [eips.ethereum.org/EIPS/eip-4337](https://eips.ethereum.org/EIPS/eip-4337)
- **Technical Issues**: Create GitHub issue

## 🎯 Production Checklist Summary

- [ ] ✅ Alchemy accounts configured
- [ ] ✅ Gas Manager policies created
- [ ] ✅ OAuth providers setup
- [ ] ✅ Environment variables configured
- [ ] ✅ Production build successful
- [ ] ✅ Security measures implemented
- [ ] ✅ Monitoring setup
- [ ] ✅ Testing completed
- [ ] ✅ Domain deployed with HTTPS
- [ ] ✅ Documentation complete

---

🎉 **Congratulations!** Your Alchemy-powered smart wallet is now ready for production use with full gas management and ERC4337 capabilities!