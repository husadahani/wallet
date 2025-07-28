# CryptoWallet - Next.js Application

A modern crypto wallet application built with Next.js, React, TypeScript, and Tailwind CSS.

## Features

- **Login System**: Google and Facebook authentication simulation
- **Wallet Dashboard**: View wallet information and token balances
- **Send Tokens**: Send cryptocurrency to other addresses
- **Receive Tokens**: Display QR code and wallet address for receiving
- **Dark Mode**: Automatic dark mode based on system preferences
- **Responsive Design**: Mobile-first responsive design
- **Local Dependencies**: All assets are local, no CDN dependencies

## Tech Stack

- **Next.js 14**: React framework for production
- **React 18**: UI library
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first CSS framework
- **Font Awesome**: Icon library (local installation)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── components/
│   ├── LoginScreen.tsx       # Login page component
│   ├── WalletDashboard.tsx   # Main wallet dashboard
│   ├── SendModal.tsx         # Send tokens modal
│   ├── ReceiveModal.tsx      # Receive tokens modal
│   └── Notification.tsx      # Notification component
├── hooks/
│   └── useDarkMode.ts        # Dark mode custom hook
├── pages/
│   ├── _app.tsx              # Next.js App component
│   └── index.tsx             # Main page
├── styles/
│   └── globals.css           # Global styles and Tailwind imports
├── package.json              # Dependencies and scripts
├── tailwind.config.js        # Tailwind configuration
├── tsconfig.json             # TypeScript configuration
└── next.config.js            # Next.js configuration
```

## Features Overview

### Login Screen
- Google and Facebook login simulation
- Loading states with spinner
- Responsive design

### Wallet Dashboard
- User greeting with name
- Wallet address display with copy functionality
- Token list showing balances
- Action buttons for send/receive

### Modals
- Send modal with form validation
- Receive modal with QR code placeholder
- Copy address functionality

### Dark Mode
- Automatic detection of system preference
- Smooth transitions between themes

## Original Conversion

This project was refactored from a single HTML file (`wallet.html`) to a modern Next.js application with:

- ✅ Converted CDN dependencies to local npm packages
- ✅ Split monolithic HTML into reusable React components
- ✅ Added TypeScript for type safety
- ✅ Implemented proper state management
- ✅ Added responsive design improvements
- ✅ Maintained all original functionality