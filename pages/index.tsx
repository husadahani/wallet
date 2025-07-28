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

  const {
    isConnected,
    isLoading,
    walletInfo,
    tokenBalances,
    user,
    error,
    currentNetwork,
    gasManagerEnabled,
    smartAccountDeployed,
    loginWithGoogle,
    loginWithFacebook,
    loginWithTwitter,
    loginWithEmail,
    logout,
    sendToken,
    refreshBalance,
    deploySmartAccount
  } = useAlchemyWallet()

  const showNotification = (message: string) => {
    setNotification({ message, isVisible: true })
    setTimeout(() => setNotification({ message: '', isVisible: false }), 3000)
  }

  const loadingMessage = 
    isLoading && !isConnected ? 'Menghubungkan dengan Alchemy...' :
    isLoading && !smartAccountDeployed ? 'Menyiapkan Smart Wallet...' :
    'Memuat...'

  return (
    <>
      <Head>
        <title>CryptoWallet BNB - Smart Wallet dengan Alchemy</title>
        <meta name="description" content="Smart Wallet di BNB Smart Chain dengan Alchemy Account Kit" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {!isConnected ? (
          <LoginScreen
            onGoogleLogin={loginWithGoogle}
            onFacebookLogin={loginWithFacebook}
            onTwitterLogin={loginWithTwitter}
            onEmailLogin={loginWithEmail}
            isLoading={isLoading}
            loadingMessage={loadingMessage}
          />
        ) : (
          <WalletDashboard
            userName={user?.name || 'User'}
            walletAddress={walletInfo?.address || ''}
            balance={walletInfo?.balance || '0'}
            isDeployed={smartAccountDeployed}
            currentNetwork={currentNetwork}
            tokenBalances={tokenBalances}
            gasManagerEnabled={gasManagerEnabled}
            onLogout={logout}
            onShowSendModal={() => setShowSendModal(true)}
            onShowReceiveModal={() => setShowReceiveModal(true)}
            onShowNotification={showNotification}
            onRefreshBalance={refreshBalance}
          />
        )}

        {/* Send Modal */}
        {showSendModal && (
          <SendModal
            walletAddress={walletInfo?.address || ''}
            tokenBalances={tokenBalances}
            onClose={() => setShowSendModal(false)}
            onSend={async (data) => {
              try {
                const result = await sendToken(data)
                if (result.success) {
                  showNotification(`Transaksi berhasil! Hash: ${result.transactionHash?.slice(0, 10)}...`)
                  setShowSendModal(false)
                  // Auto refresh balance after successful transaction
                  setTimeout(() => refreshBalance(), 2000)
                } else {
                  showNotification(`Transaksi gagal: ${result.error}`)
                }
              } catch (error) {
                showNotification(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
              }
            }}
            isDeployed={smartAccountDeployed}
            gasManagerEnabled={gasManagerEnabled}
          />
        )}

        {/* Receive Modal */}
        {showReceiveModal && (
          <ReceiveModal
            walletAddress={walletInfo?.address || ''}
            networkName={currentNetwork?.name || 'BNB Smart Chain'}
            onClose={() => setShowReceiveModal(false)}
          />
        )}

        {/* Notification */}
        <Notification
          message={notification.message}
          isVisible={notification.isVisible}
          onClose={() => setNotification({ message: '', isVisible: false })}
        />

        {/* Error Display */}
        {error && !isLoading && (
          <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
            {error}
          </div>
        )}

        {/* Deploy Prompt */}
        {isConnected && !smartAccountDeployed && !isLoading && (
          <div className="fixed bottom-4 left-4 right-4 bg-yellow-500 text-white px-4 py-3 rounded-lg shadow-lg max-w-md mx-auto">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Smart Wallet belum di-deploy</p>
                <p className="text-sm opacity-90">Deploy untuk mulai bertransaksi</p>
              </div>
              <button
                onClick={deploySmartAccount}
                className="bg-white text-yellow-600 px-3 py-1 rounded font-medium hover:bg-gray-100 transition-colors"
              >
                Deploy
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}