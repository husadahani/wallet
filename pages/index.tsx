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
          <div className="fixed bottom-4 left-4 right-4 bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg max-w-md mx-auto">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <p className="font-medium">Smart Wallet perlu di-deploy</p>
                <p className="text-sm opacity-90">
                  {isDeploying ? 'Melakukan deployment...' : 'Klik tombol untuk deploy smart wallet'}
                </p>
              </div>
              {!isDeploying && (
                <button
                  onClick={async () => {
                    const success = await deploySmartWallet()
                    if (success) {
                      showNotification('Smart wallet berhasil di-deploy!')
                    } else {
                      showNotification('Gagal deploy smart wallet. Coba lagi.')
                    }
                  }}
                  className="ml-3 bg-white text-blue-500 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  Deploy
                </button>
              )}
              {isDeploying && (
                <div className="ml-3 text-sm">
                  <div className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}