import React, { useState } from 'react'
import Head from 'next/head'
import LoginScreen from '../components/LoginScreen'
import WalletDashboard from '../components/WalletDashboard'
import SendModal from '../components/SendModal'
import ReceiveModal from '../components/ReceiveModal'
import Notification from '../components/Notification'
import NetworkSelector from '../components/NetworkSelector'
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
    currentNetwork,
    supportedNetworks,
    loginWithGoogle,
    loginWithFacebook,
    logout,
    switchNetwork,
    refreshBalance,
    sendNativeToken,
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

  const handleNetworkSwitch = async (networkKey: string) => {
    try {
      await switchNetwork(networkKey)
      const networkName = supportedNetworks[networkKey]?.name || networkKey
      showNotification(`Switched to ${networkName}`)
    } catch (error) {
      showNotification('Failed to switch network')
    }
  }

  // Wrapper function to adapt sendToken for SendModal component
  const handleSendToken = async (tokenAddress: string, to: string, amount: string, decimals: number) => {
    // Get token symbol from tokenBalances if available, otherwise use a default
    const token = tokenBalances.find(t => t.contractAddress?.toLowerCase() === tokenAddress.toLowerCase())
    const symbol = token?.symbol || 'TOKEN'
    
    return await sendToken({
      tokenAddress,
      symbol,
      to,
      amount,
      decimals
    })
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
            currentNetwork={currentNetwork}
            tokenBalances={tokenBalances}
            onLogout={handleLogout}
            onShowSendModal={() => setShowSendModal(true)}
            onShowReceiveModal={() => setShowReceiveModal(true)}
            onShowNotification={showNotification}
            onRefreshBalance={refreshBalance}
            networkSelector={
              <NetworkSelector
                currentNetwork={currentNetwork}
                supportedNetworks={supportedNetworks}
                onNetworkChange={handleNetworkSwitch}
                isLoading={isLoading}
              />
            }
          />
        )}

        <SendModal
          isOpen={showSendModal}
          onClose={() => setShowSendModal(false)}
          onSend={sendNativeToken}
          onSendToken={handleSendToken}
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