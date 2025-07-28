# CryptoWallet dengan Alchemy Social Authentication

Aplikasi crypto wallet yang menggunakan layanan **Google Login** dan **Facebook Login** dari **Alchemy Account Kit** untuk autentikasi yang mudah dan aman.

## 🚀 Fitur Utama

- ✅ **Social Authentication**: Login dengan Google dan Facebook menggunakan Alchemy Account Kit
- ✅ **Smart Wallet**: Otomatis membuat smart contract wallet untuk setiap user
- ✅ **Gas Sponsorship**: Transaksi gratis tanpa perlu gas fees (opsional)
- ✅ **Multi-Network**: Support untuk Ethereum, Sepolia, Polygon, dan BSC
- ✅ **Responsive UI**: Interface yang modern dan mobile-friendly
- ✅ **Session Management**: Sesi login yang aman dan persistent

## 🛠️ Teknologi

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Blockchain**: Ethereum, Viem, Account Abstraction (ERC-4337)
- **Authentication**: Alchemy Account Kit, Google OAuth, Facebook Login
- **Smart Wallets**: Alchemy Smart Account Client
- **Gas Management**: Alchemy Gas Manager

## 📋 Prasyarat

- Node.js 18+ dan npm/yarn
- Akun Alchemy (gratis di [dashboard.alchemy.com](https://dashboard.alchemy.com))
- Google Developer Account untuk OAuth
- Facebook Developer Account untuk Login

## 🔧 Setup dan Instalasi

### 1. Clone Repository

```bash
git clone <repository-url>
cd crypto-wallet
npm install
```

### 2. Setup Alchemy Account Kit

1. **Buat Alchemy App**:
   - Kunjungi [Alchemy Dashboard](https://dashboard.alchemy.com/)
   - Buat project baru di Ethereum Sepolia (untuk testing)
   - Copy API Key yang diberikan

2. **Setup Gas Manager** (Opsional):
   - Di Alchemy Dashboard, buka Gas Manager
   - Buat policy baru untuk gas sponsorship
   - Copy Policy ID

### 3. Setup Google OAuth

1. **Buat Google Cloud Project**:
   - Kunjungi [Google Cloud Console](https://console.developers.google.com/)
   - Buat project baru atau pilih yang sudah ada
   - Enable Google+ API

2. **Buat OAuth 2.0 Credentials**:
   - Pergi ke Credentials → Create credentials → OAuth 2.0 Client ID
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:3000`, `https://yourdomain.com`
   - Authorized redirect URIs: `http://localhost:3000/auth/callback`
   - Copy Client ID yang diberikan

### 4. Setup Facebook Login

1. **Buat Facebook App**:
   - Kunjungi [Facebook Developers](https://developers.facebook.com/)
   - Create App → Consumer → Next
   - Isi nama aplikasi dan email kontak

2. **Add Facebook Login Product**:
   - Di dashboard app, klik "Add Product"
   - Pilih "Facebook Login" → Set up
   - Settings → Basic: Copy App ID
   - Facebook Login → Settings:
     - Valid OAuth Redirect URIs: `http://localhost:3000/auth/callback`
     - Use Strict Mode for Redirect URIs: Yes

### 5. Konfigurasi Environment Variables

Buat file `.env.local` dan copy dari `.env.example`:

```bash
cp .env.example .env.local
```

Edit `.env.local` dan isi dengan data yang sudah didapat:

```env
# Alchemy Configuration
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key_here
NEXT_PUBLIC_ALCHEMY_GAS_POLICY_ID=your_gas_policy_id_here

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# Facebook OAuth
NEXT_PUBLIC_FACEBOOK_APP_ID=your_facebook_app_id_here

# Network Configuration
NEXT_PUBLIC_DEFAULT_CHAIN_ID=11155111
NEXT_PUBLIC_ETH_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your_alchemy_api_key
```

### 6. Jalankan Aplikasi

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## 🎯 Cara Menggunakan

### Login dengan Social Media

1. **Login dengan Google**:
   - Klik tombol "Masuk dengan Google"
   - Authorize aplikasi di popup Google
   - Smart wallet akan dibuat otomatis

2. **Login dengan Facebook**:
   - Klik tombol "Masuk dengan Facebook"
   - Authorize aplikasi di popup Facebook
   - Smart wallet akan dibuat otomatis

### Fitur Wallet

1. **Melihat Balance**: Balance ETH dan token akan ditampilkan otomatis
2. **Mengirim Transaksi**: Gunakan modal Send untuk mengirim crypto
3. **Menerima Crypto**: Gunakan modal Receive untuk melihat alamat wallet
4. **Ganti Network**: Pilih network yang tersedia di dropdown

### Smart Account Features

- **Gasless Transactions**: Jika Gas Manager diaktifkan, transaksi gratis
- **Batch Transactions**: Beberapa transaksi dalam satu operasi
- **Account Recovery**: Recovery via email (diatur oleh Alchemy)
- **Session Management**: Login bertahan hingga user logout

## 🔒 Keamanan

### Private Key Management

- Private keys dikelola secara aman oleh Alchemy Account Kit
- User tidak perlu menyimpan atau mengingat private key
- Smart accounts menggunakan secure enclave Turnkey

### Session Security

- Access tokens disimpan di sessionStorage
- Session data disimpan di localStorage dengan timestamp
- Session otomatis expired setelah 24 jam
- Auto-logout dari social providers saat logout

## 🛡️ Smart Account Architecture

```
User (Google/Facebook)
      ↓
Alchemy Signer (Turnkey)
      ↓  
Smart Contract Account (ERC-4337)
      ↓
Alchemy Bundler & Gas Manager
      ↓
Blockchain Network
```

### Benefits:

- **No seed phrases**: User tidak perlu backup seed phrase
- **Social recovery**: Bisa recovery via email
- **Gasless UX**: Transaksi tanpa gas fees
- **Batch operations**: Multiple transactions dalam satu call
- **Programmable**: Custom logic via smart contract

## 📱 Mobile Support

Aplikasi responsive dan mendukung:
- Mobile web browsers
- Progressive Web App (PWA) capabilities
- Touch-friendly interface
- Mobile-optimized modals

## 🌐 Supported Networks

- **Ethereum Mainnet**: Produksi
- **Sepolia Testnet**: Development dan testing
- **Polygon**: Layer 2 scaling
- **BNB Smart Chain**: Alternative network

## 🔄 Development

### Scripts

```bash
npm run dev          # Development server
npm run build        # Production build  
npm run start        # Production server
npm run lint         # ESLint check
```

### Project Structure

```
src/
├── components/          # React components
│   ├── LoginScreen.tsx  # Social login interface
│   ├── WalletDashboard.tsx # Main wallet UI
│   └── modals/         # Modal components
├── hooks/              
│   └── useAlchemyWallet.ts # Main wallet hook
├── services/
│   ├── socialAuth.ts   # Alchemy social auth service
│   ├── alchemyWallet.ts # Wallet operations
│   └── gasManager.ts   # Gas management
└── pages/
    └── index.tsx       # Main page
```

## 🐛 Troubleshooting

### Common Issues

1. **"Google Auth requires browser environment"**:
   - Pastikan kode hanya dijalankan di client-side
   - Check SSR/hydration issues

2. **"Smart account client not available"**:
   - Pastikan Alchemy API Key valid
   - Check network connection
   - Pastikan user sudah login

3. **Facebook login gagal**:
   - Check Facebook App ID
   - Pastikan domain sudah didaftarkan di Facebook App
   - Check Facebook App status (development/live)

4. **Gas estimation fails**:
   - Pastikan Gas Manager Policy ID benar
   - Check network yang dipilih
   - Pastikan ada balance untuk gas

### Debug Mode

Aktifkan debug mode dengan menambahkan di `.env.local`:

```env
NEXT_PUBLIC_DEBUG_MODE=true
NEXT_PUBLIC_LOG_LEVEL=debug
```

## 📚 Resources

- [Alchemy Account Kit Docs](https://docs.alchemy.com/account-kit)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login)
- [ERC-4337 Account Abstraction](https://eips.ethereum.org/EIPS/eip-4337)

## 🤝 Contributing

1. Fork repository
2. Buat feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - lihat file [LICENSE](LICENSE) untuk detail.

## 📞 Support

Jika ada pertanyaan atau butuh bantuan:
- Buka issue di GitHub
- Contact: [email@example.com]

---

**Note**: Untuk production, pastikan untuk:
- Gunakan HTTPS untuk redirect URIs
- Setup proper CORS policies  
- Enable proper security headers
- Use mainnet instead of testnet
- Monitor gas usage dan costs