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
    isDeploying,
    authenticateWithGoogle,
    authenticateWithFacebook,
    authenticateWithEmail,
    logout,
    sendToken,
    refreshWalletData,
    deploySmartWallet
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
        {/* Alchemy Signer iframe container */}
        <div id="alchemy-signer-iframe" style={{ display: 'none' }}></div>
        
        {!isConnected ? (
          <LoginScreen
            onGoogleLogin={authenticateWithGoogle}
            onFacebookLogin={authenticateWithFacebook}
            onEmailLogin={authenticateWithEmail}
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
            onRefreshBalance={refreshWalletData}
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
                  showNotification(`Transaksi berhasil! Hash: ${result.hash?.slice(0, 10)}...`)
                  setShowSendModal(false)
                  // Auto refresh balance after successful transaction
                  setTimeout(() => refreshWalletData(), 2000)
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
          onHide={() => setNotification({ message: '', isVisible: false })}
        />

        {/* Error Display */}
        {error && !isLoading && (
          <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
            {error}
          </div>
        )}

        {/* Deploy Status */}
        {isConnected && !smartAccountDeployed && !isLoading && (
          <div className="fixed bottom-4 left-4 right-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3 rounded-lg shadow-lg max-w-md mx-auto">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <p className="font-medium flex items-center">
                  <span className="mr-2">🚀</span>
                  {isDeploying ? 'Deploying Smart Wallet...' : 'Smart Wallet Ready to Deploy'}
                </p>
                <p className="text-sm opacity-90">
                  {isDeploying 
                    ? 'Membuat dummy transaksi untuk deploy...' 
                    : 'Deploy otomatis atau manual untuk mulai bertransaksi'
                  }
                </p>
              </div>
              {!isDeploying && (
                <button
                  onClick={async () => {
                    const success = await deploySmartWallet()
                    if (success) {
                      showNotification('🎉 Smart wallet berhasil di-deploy dengan gas sponsorship!')
                    } else {
                      showNotification('❌ Gagal deploy smart wallet. Coba lagi.')
                    }
                  }}
                  className="ml-3 bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-all duration-200 shadow-md"
                >
                  Deploy Now
                </button>
              )}
              {isDeploying && (
                <div className="ml-3 flex items-center text-sm">
                  <div className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  <span>Deploying...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success notification for deployed wallet */}
        {isConnected && smartAccountDeployed && !isLoading && (
          <div className="fixed bottom-4 left-4 right-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg max-w-md mx-auto">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="font-medium flex items-center">
                  <span className="mr-2">✅</span>
                  Smart Wallet Active
                </p>
                <p className="text-sm opacity-90">
                  Gas sponsorship aktif - Transaksi gasless tersedia!
                </p>
              </div>
              <div className="ml-3 text-2xl">
                🎉
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}