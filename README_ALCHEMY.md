# Crypto Wallet with Alchemy Integration

Proyek crypto wallet yang terintegrasi dengan layanan Alchemy, menampilkan login sosial (Google/Facebook), ERC4337 smart wallet, dan fitur kirim/terima token.

## Fitur Utama

### 🔐 Autentikasi Sosial
- Login dengan Google OAuth
- Login dengan Facebook OAuth
- Generasi private key deterministik dari user ID

### 💼 Smart Wallet (ERC4337)
- Wallet abstraksi menggunakan teknologi Alchemy
- Address generation otomatis
- Support untuk gas sponsorship policies
- Deployment detection

### 💸 Manajemen Token
- Kirim dan terima ETH
- Support ERC20 tokens (USDC, DAI, dll)
- Real-time balance tracking
- Transaction history

### 🎨 User Interface
- Design modern dengan Tailwind CSS
- Dark/Light mode support
- Responsive design
- Icons dari FontAwesome

## Setup & Installation

### 1. Clone & Install Dependencies

```bash
git clone <repository-url>
cd crypto-wallet
npm install
```

### 2. Environment Configuration

Salin `template.env.txt` ke `.env.local`:

```bash
cp template.env.txt .env.local
```

Edit `.env.local` dengan konfigurasi Alchemy Anda:

```env
# Alchemy Configuration
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key_here
NEXT_PUBLIC_ALCHEMY_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your_api_key
NEXT_PUBLIC_ALCHEMY_GAS_POLICY_ID=your_gas_sponsor_policy_id_here

# Social Login Configuration (optional - for production)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
NEXT_PUBLIC_FACEBOOK_APP_ID=your_facebook_app_id_here

# Network Configuration
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_CHAIN_NAME=Sepolia
```

### 3. Alchemy Setup

#### Mendapatkan API Key:
1. Daftar di [Alchemy Dashboard](https://dashboard.alchemy.com/)
2. Buat aplikasi baru
3. Pilih network Ethereum Sepolia (testnet)
4. Copy API key

#### Gas Sponsorship Policy (Optional):
1. Buka Alchemy Dashboard > Account Abstraction
2. Buat Gas Manager Policy baru
3. Konfigurasi rules sesuai kebutuhan
4. Copy Policy ID

### 4. Social OAuth Setup (Production)

#### Google OAuth:
1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru atau pilih existing
3. Enable Google+ API
4. Buat OAuth 2.0 credentials
5. Add authorized domains

#### Facebook OAuth:
1. Buka [Facebook Developers](https://developers.facebook.com/)
2. Buat aplikasi baru
3. Add Facebook Login product
4. Konfigurasi redirect URLs

## Menjalankan Aplikasi

### Development Mode
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

## Struktur Project

```
├── components/           # React components
│   ├── LoginScreen.tsx
│   ├── WalletDashboard.tsx
│   ├── SendModal.tsx
│   └── ReceiveModal.tsx
├── hooks/               # Custom React hooks
│   ├── useAlchemyWallet.ts
│   └── useDarkMode.ts
├── services/            # Business logic
│   ├── alchemyWallet.ts
│   └── socialAuth.ts
├── pages/               # Next.js pages
│   ├── _app.tsx
│   └── index.tsx
└── styles/              # CSS styles
```

## Arsitektur

### Service Layer

#### `alchemyWallet.ts`
- Core wallet functionality
- Balance management
- Transaction processing
- Alchemy SDK integration

#### `socialAuth.ts`
- Social login handling
- Private key generation
- Session management

### Hook Layer

#### `useAlchemyWallet.ts`
- State management untuk wallet
- React integration
- Error handling

### Component Layer
- UI components untuk setiap fitur
- Responsive design
- Accessibility support

## API Integration

### Alchemy Services Used

1. **RPC Endpoint**: Blockchain interaction
2. **Account Abstraction**: Smart wallet functionality
3. **Gas Manager**: Transaction sponsorship
4. **Enhanced APIs**: Token balances, NFTs

### Mock Implementation

Untuk development dan testing, beberapa fungsi menggunakan mock data:
- Transaction simulation
- Token balance mock
- Address generation simplified

## Security Considerations

### Private Key Management
- Keys dihasilkan secara deterministik dari social login
- Tidak disimpan dalam localStorage
- Session-based storage

### Smart Contract Security
- ERC4337 standard compliance
- Alchemy-audited contracts
- Gas optimization

### Network Security
- HTTPS only
- API key protection
- Rate limiting considerations

## Deployment

### Environment Variables
Pastikan semua environment variables ter-set di production:

```bash
# Vercel
vercel env add NEXT_PUBLIC_ALCHEMY_API_KEY

# Netlify
netlify env:set NEXT_PUBLIC_ALCHEMY_API_KEY your_key

# Manual
export NEXT_PUBLIC_ALCHEMY_API_KEY=your_key
```

### Production Checklist
- [ ] Alchemy API keys configured
- [ ] Social OAuth credentials set
- [ ] Domain whitelisting configured
- [ ] SSL certificate active
- [ ] Error monitoring setup

## Testing

### Unit Testing
```bash
npm run test
```

### Integration Testing
```bash
npm run test:integration
```

### E2E Testing
```bash
npm run test:e2e
```

## Troubleshooting

### Common Issues

#### "Wallet not initialized"
- Pastikan environment variables ter-set
- Check Alchemy API key validity
- Verify network connectivity

#### "Transaction failed"
- Check gas limits
- Verify contract addresses
- Ensure sufficient balance

#### Social login errors
- Verify OAuth configuration
- Check redirect URLs
- Validate client IDs

### Debug Mode
Set environment variable untuk debugging:
```bash
NEXT_PUBLIC_DEBUG=true npm run dev
```

## Kontribusi

1. Fork repository
2. Buat feature branch
3. Commit changes
4. Push to branch
5. Buat Pull Request

## License

MIT License - lihat file LICENSE untuk detail.

## Support

- [Alchemy Documentation](https://docs.alchemy.com/)
- [ERC4337 Specification](https://eips.ethereum.org/EIPS/eip-4337)
- [Next.js Documentation](https://nextjs.org/docs)

## Roadmap

### Phase 1 ✅
- [x] Basic wallet functionality
- [x] Social login integration
- [x] Alchemy SDK integration
- [x] UI components

### Phase 2 🚧
- [ ] Real ERC4337 implementation
- [ ] Multi-chain support
- [ ] NFT management
- [ ] Advanced transaction features

### Phase 3 📋
- [ ] Mobile app
- [ ] Hardware wallet support
- [ ] DeFi integrations
- [ ] Analytics dashboard