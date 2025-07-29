# 🚀 Smart Wallet BNB - Alchemy Integration

Smart wallet application built with Next.js that integrates with Alchemy Account Kit for seamless social login and smart wallet functionality on BNB Smart Chain.

## ✨ Features

- 🔐 **Social Login**: Google, Facebook authentication via Alchemy Embedded Accounts
- 💰 **Smart Wallet**: ERC-4337 compatible smart wallets with gas sponsorship
- ⛽ **Gas Manager**: Gasless transactions with Alchemy Gas Manager
- 🌐 **BNB Smart Chain**: Optimized for BNB mainnet with multi-network support
- 🎯 **Auto Deploy**: Automatic smart wallet deployment with dummy transactions
- 💎 **Custom Tokens**: Add and manage BEP-20 tokens
- 📱 **Responsive UI**: Modern, mobile-friendly interface

## 🛠️ Quick Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd crypto-wallet
npm install
```

### 2. Configure Environment Variables

Copy the environment template:
```bash
cp .env.local .env.local
```

### 3. Get Alchemy Credentials

1. **Create Alchemy Account**
   - Go to [Alchemy Dashboard](https://dashboard.alchemy.com/)
   - Create a new app on **BNB Smart Chain Mainnet**
   - Copy your API Key

2. **Enable Embedded Accounts**
   - In your Alchemy app dashboard
   - Navigate to "Embedded Accounts" section
   - Enable the feature and copy your App ID

3. **Update Environment Variables**
   ```env
   NEXT_PUBLIC_ALCHEMY_API_KEY=your_actual_api_key_here
   NEXT_PUBLIC_ALCHEMY_APP_ID=your_actual_app_id_here
   NEXT_PUBLIC_BNB_RPC_URL=https://bnb-mainnet.g.alchemy.com/v2/your_actual_api_key_here
   ```

### 4. Optional: Setup Gas Manager

1. **Create Gas Policy** (Optional for gasless transactions)
   - In Alchemy Dashboard, go to Gas Manager
   - Create a new policy for BNB Smart Chain
   - Copy the Policy ID

2. **Update Gas Configuration**
   ```env
   NEXT_PUBLIC_BNB_MAINNET_GAS_POLICY_ID=your_gas_policy_id_here
   NEXT_PUBLIC_GAS_MANAGER_ENABLED=true
   ```

### 5. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000`

## 🔧 Key Configuration

### Required Environment Variables

```env
# Essential - Replace with your actual values
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key
NEXT_PUBLIC_ALCHEMY_APP_ID=your_alchemy_app_id
NEXT_PUBLIC_BNB_RPC_URL=https://bnb-mainnet.g.alchemy.com/v2/your_api_key

# Smart Wallet Settings
NEXT_PUBLIC_AUTO_DEPLOY_WALLET=true
NEXT_PUBLIC_DUMMY_TRANSACTION_ENABLED=true

# Social Login
NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN=true
NEXT_PUBLIC_ENABLE_FACEBOOK_LOGIN=true
```

### Optional Configuration

```env
# Gas Manager (for gasless transactions)
NEXT_PUBLIC_BNB_MAINNET_GAS_POLICY_ID=your_policy_id
NEXT_PUBLIC_GAS_MANAGER_ENABLED=true
NEXT_PUBLIC_DAILY_GAS_LIMIT=0.1
NEXT_PUBLIC_MONTHLY_GAS_LIMIT=1.0

# Custom Features
NEXT_PUBLIC_ENABLE_CUSTOM_TOKENS=true
NEXT_PUBLIC_SESSION_TIMEOUT=86400
```

## 🎯 How It Works

### Social Authentication
- Users login with Google/Facebook through Alchemy Embedded Accounts
- No need for separate OAuth setup - handled by Alchemy
- Automatic smart wallet creation upon login

### Smart Wallet Deployment
- Smart wallets are created but not deployed until first transaction
- Optional dummy transaction deployment for immediate activation
- Gasless transactions through Alchemy Gas Manager (if configured)

### Transaction Flow
1. User authenticates via social login
2. Smart wallet address is generated
3. Wallet can be manually deployed or deploys on first transaction
4. All transactions use smart wallet for enhanced security

## 📱 Usage

### Login
1. Click "Login with Google" or "Login with Facebook"
2. Complete OAuth flow in popup window
3. Smart wallet is automatically created

### Deploy Wallet
1. After login, you'll see deployment status
2. Click "Deploy" button to manually deploy with dummy transaction
3. Or deployment happens automatically on first real transaction

### Send Transactions
1. Navigate to wallet dashboard
2. Click "Send" to open transaction modal
3. Enter recipient and amount
4. Transaction uses smart wallet with optional gas sponsorship

### Custom Tokens
1. Click "Add Custom Token" in dashboard
2. Enter BEP-20 token contract address
3. Token information is automatically fetched
4. Token appears in your balance list

## 🔍 Troubleshooting

### Common Issues

**1. localStorage is not defined**
- ✅ Fixed: Added SSR protection for localStorage calls

**2. Social login not working**
- Verify `NEXT_PUBLIC_ALCHEMY_API_KEY` and `NEXT_PUBLIC_ALCHEMY_APP_ID`
- Check Alchemy dashboard for Embedded Accounts status
- Ensure your domain is whitelisted in Alchemy settings

**3. Smart wallet not deploying**
- Check BNB Smart Chain network connection
- Verify sufficient balance for deployment (very small amount needed)
- Enable dummy transaction deployment: `NEXT_PUBLIC_DUMMY_TRANSACTION_ENABLED=true`

**4. Gas sponsorship not working**
- Verify Gas Manager policy is created and active
- Check daily/monthly limits aren't exceeded
- Ensure policy covers your transaction types

### Network Issues
- Ensure you're using BNB Smart Chain Mainnet (Chain ID: 56)
- Verify RPC URL includes your actual Alchemy API key
- Check if your region has access restrictions

## 🏗️ Architecture

### Key Components

- **`services/alchemyWallet.ts`**: Core wallet functionality and Alchemy integration
- **`services/socialAuth.ts`**: Social authentication management
- **`services/gasManager.ts`**: Gas sponsorship and optimization
- **`hooks/useAlchemyWallet.ts`**: React hook for wallet state management

### Smart Wallet Features

- **ERC-4337 Compatible**: Uses Account Abstraction for enhanced UX
- **Gas Sponsorship**: Optional gasless transactions
- **Multi-signature Support**: Enhanced security features
- **Batch Transactions**: Multiple operations in single transaction

## 🛡️ Security

- Smart wallets provide enhanced security vs EOAs
- Social login reduces private key management burden
- Gas policies prevent abuse of sponsored transactions
- Session management with automatic expiry

## 🌐 Supported Networks

- **Primary**: BNB Smart Chain Mainnet (Chain ID: 56)
- **Optional**: Ethereum Mainnet, Sepolia, Polygon (configured but secondary)

## 📊 Gas Optimization

- Automatic gas estimation for all transactions
- Smart routing for optimal fees
- Sponsorship eligibility checking
- Usage tracking and limits

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🔗 Links

- [Alchemy Dashboard](https://dashboard.alchemy.com/)
- [Alchemy Documentation](https://docs.alchemy.com/)
- [Account Kit Docs](https://accountkit.alchemy.com/)
- [BNB Smart Chain](https://www.bnbchain.org/)

## 💡 Support

For issues and questions:

1. Check this README for common solutions
2. Review environment variable configuration
3. Check Alchemy dashboard for service status
4. Open GitHub issue with detailed description

---

**Note**: Make sure to replace all placeholder values in `.env.local` with your actual Alchemy credentials before running the application.