import React, { useState } from 'react'
import Head from 'next/head'
import LoginScreen from '../components/LoginScreen'
import WalletDashboard from '../components/WalletDashboard'
import SendModal from '../components/SendModal'
import ReceiveModal from '../components/ReceiveModal'
import Notification from '../components/Notification'
import { useDarkMode } from '../hooks/useDarkMode'
import { useAlchemyWallet } from '../hooks/useAlchemyWallet'

export default function Home() {
  const [showSendModal, setShowSendModal] = useState(false)
  const [showReceiveModal, setShowReceiveModal] = useState(false)
  const [notification, setNotification] = useState({ message: '', isVisible: false })

  // Initialize dark mode
  useDarkMode()

  // Use Alchemy wallet hook
  const {
    isConnected,
    isLoading,
    walletInfo,
    tokenBalances,
    user,
    error,
    loginWithGoogle,
    loginWithFacebook,
    logout,
    refreshBalance,
    sendETH,
    sendToken,
  } = useAlchemyWallet()

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle()
    } catch (error) {
      showNotification('Login dengan Google gagal')
    }
  }

  const handleFacebookLogin = async () => {
    try {
      await loginWithFacebook()
    } catch (error) {
      showNotification('Login dengan Facebook gagal')
    }
  }

  const handleLogout = () => {
    logout()
  }

  const showNotification = (message: string) => {
    setNotification({ message, isVisible: true })
  }

  const hideNotification = () => {
    setNotification({ message: '', isVisible: false })
  }

  return (
    <>
      <Head>
        <title>CryptoWallet</title>
        <meta name="description" content="Kelola aset kripto Anda dengan aman" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors">
        {!isConnected ? (
          <LoginScreen
            onGoogleLogin={handleGoogleLogin}
            onFacebookLogin={handleFacebookLogin}
            isLoading={isLoading}
            loadingMessage={isLoading ? 'Menghubungkan wallet...' : ''}
          />
        ) : (
          <WalletDashboard
            userName={user?.name || 'User'}
            walletAddress={walletInfo?.address || ''}
            balance={walletInfo?.balance || '0'}
            isDeployed={walletInfo?.isDeployed || false}
            tokenBalances={tokenBalances}
            onLogout={handleLogout}
            onShowSendModal={() => setShowSendModal(true)}
            onShowReceiveModal={() => setShowReceiveModal(true)}
            onShowNotification={showNotification}
            onRefreshBalance={refreshBalance}
          />
        )}

        <SendModal
          isOpen={showSendModal}
          onClose={() => setShowSendModal(false)}
          onSend={sendETH}
          onSendToken={sendToken}
          onShowNotification={showNotification}
        />

        <ReceiveModal
          isOpen={showReceiveModal}
          onClose={() => setShowReceiveModal(false)}
          walletAddress={walletInfo?.address || ''}
          onShowNotification={showNotification}
        />

        <Notification
          message={notification.message}
          isVisible={notification.isVisible}
          onHide={hideNotification}
        />

        {error && (
          <div className="fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg">
            {error}
          </div>
        )}
      </div>
    </>
  )
}