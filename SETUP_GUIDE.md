# 🚀 Setup Guide - Smart Wallet BNB dengan Alchemy

Panduan lengkap untuk mengatur smart wallet dengan integrasi Alchemy Account Kit dan BNB Smart Chain.

## 🎯 Fitur Utama

- ✅ **Social Login**: Google, Facebook login melalui Alchemy Embedded Accounts
- ✅ **Smart Wallet**: ERC-4337 smart wallet dengan gas sponsorship
- ✅ **Auto Deploy**: Deployment smart wallet otomatis dengan dummy transaction
- ✅ **Multi Network**: Dukungan BNB Smart Chain, Ethereum, Polygon
- ✅ **Custom Tokens**: Tambah dan kelola BEP-20 tokens
- ✅ **Gas Manager**: Transaksi gasless dengan Alchemy Gas Manager

## 🛠️ Setup Langkah demi Langkah

### 1. Install Dependencies

```bash
npm install
```

### 2. Konfigurasi Alchemy Dashboard

#### a) Buat Alchemy Account & App
1. Kunjungi [Alchemy Dashboard](https://dashboard.alchemy.com/)
2. Buat akun baru atau login
3. Klik "Create new app"
4. Pilih:
   - **Chain**: BNB Smart Chain
   - **Network**: Mainnet
   - **Name**: Smart Wallet BNB (atau sesuai keinginan)

#### b) Enable Embedded Accounts
1. Di dashboard Alchemy, pilih app yang baru dibuat
2. Klik tab "Account Kit" atau "Embedded Accounts"
3. Enable "Embedded Accounts"
4. Catat **App ID** yang diberikan

#### c) Setup Gas Manager (Opsional)
1. Di dashboard Alchemy, buka "Gas Manager"
2. Klik "Create Policy"
3. Konfigurasi:
   - **Network**: BNB Smart Chain Mainnet
   - **Policy Type**: Sponsorship
   - **Rules**: Sesuai kebutuhan (allowlist addresses, spending limits, dll)
4. Catat **Policy ID** yang diberikan

### 3. Konfigurasi Environment Variables

1. Copy file environment template:
   ```bash
   cp .env.local .env.local.backup
   ```

2. Edit `.env.local` dan isi dengan data dari Alchemy:

```env
# WAJIB DIISI
NEXT_PUBLIC_ALCHEMY_API_KEY=alcht_YOUR_API_KEY_HERE
NEXT_PUBLIC_ALCHEMY_APP_ID=YOUR_APP_ID_HERE

# Update URL dengan API key yang sama
NEXT_PUBLIC_BNB_RPC_URL=https://bnb-mainnet.g.alchemy.com/v2/alcht_YOUR_API_KEY_HERE

# Opsional - Gas Policy ID (jika menggunakan gas sponsorship)
NEXT_PUBLIC_BNB_MAINNET_GAS_POLICY_ID=YOUR_GAS_POLICY_ID_HERE
```

### 4. Test Aplikasi

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) dan test:
- Social login dengan Google/Facebook
- Smart wallet creation
- Auto deployment

## 🔧 Troubleshooting

### Error: localStorage is not defined
✅ **Sudah diperbaiki** - Semua localStorage calls sudah dibuat client-side only.

### Error: Alchemy API Key tidak valid
1. Pastikan API key dimulai dengan `alcht_`
2. Copy-paste langsung dari dashboard Alchemy
3. Pastikan app Alchemy dibuat untuk BNB Smart Chain Mainnet

### Error: Social login tidak bekerja
1. Pastikan `NEXT_PUBLIC_ALCHEMY_APP_ID` sudah diisi
2. Pastikan Embedded Accounts sudah enabled di dashboard
3. Test di browser mode incognito (clear cache)

### Error: Smart wallet tidak deploy
1. Pastikan `NEXT_PUBLIC_DUMMY_TRANSACTION_ENABLED=true`
2. Pastikan ada sedikit BNB di wallet untuk gas
3. Check network connection dan RPC URL

## 📱 Penggunaan Aplikasi

### 1. Login
- Klik "Login with Google" atau "Login with Facebook"
- Alchemy akan handle OAuth flow otomatis
- Smart wallet akan dibuat setelah login berhasil

### 2. Deploy Smart Wallet
- Wallet akan auto-deploy dengan dummy transaction
- Atau klik tombol "Deploy Smart Wallet" manual
- Status deployment ditampilkan di UI

### 3. Transaksi
- Kirim BNB atau BEP-20 tokens
- Gas fees di-sponsor oleh Alchemy (jika gas policy aktif)
- Transaksi confirmation real-time

### 4. Custom Tokens
- Tambah token BEP-20 dengan contract address
- Token info di-fetch otomatis dari blockchain
- Balance update real-time

## 🌐 Network Configuration

Aplikasi support multi-network:

- **BNB Smart Chain** (Primary)
- **Ethereum Mainnet** 
- **Ethereum Sepolia** (Testnet)
- **Polygon**

Switch network melalui UI atau programmatically.

## 🏗️ Arsitektur

```
├── services/
│   ├── alchemyWallet.ts     # Core wallet logic
│   ├── gasManager.ts        # Gas estimation & sponsorship
│   └── socialAuth.ts        # Social authentication
├── hooks/
│   └── useAlchemyWallet.ts  # React hook untuk wallet state
├── components/
│   ├── LoginScreen.tsx      # Login interface
│   ├── WalletDashboard.tsx  # Main wallet UI
│   └── ...
└── pages/
    └── index.tsx            # Main application page
```

## 🔒 Security

- Private keys di-handle oleh Alchemy (non-custodial)
- Smart wallet menggunakan ERC-4337 standard
- Social OAuth handled by Alchemy secara secure
- Semua transactions require user confirmation

## 🚀 Production Deployment

Untuk production:

1. Update environment variables:
   ```env
   NEXT_PUBLIC_SECURE_COOKIES=true
   NEXT_PUBLIC_CSP_ENABLED=true
   NEXT_PUBLIC_DEBUG_MODE=false
   ```

2. Setup proper domain untuk OAuth:
   ```env
   NEXT_PUBLIC_APP_DOMAIN=yourdomain.com
   ```

3. Deploy ke Vercel/Netlify:
   ```bash
   npm run build
   ```

## 📞 Support

Jika mengalami kendala:

1. Check console browser untuk error details
2. Verifikasi semua environment variables
3. Test dengan Alchemy Dashboard tools
4. Check network connection dan RPC endpoints

## 📚 Resources

- [Alchemy Account Kit Docs](https://docs.alchemy.com/docs/account-kit-overview)
- [ERC-4337 Standard](https://eips.ethereum.org/EIPS/eip-4337)
- [BNB Smart Chain Docs](https://docs.bnbchain.org/)
- [Viem Documentation](https://viem.sh/)

Happy coding! 🎉