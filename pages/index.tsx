import React, { useState } from 'react'
import Head from 'next/head'
import LoginScreen from '../components/LoginScreen'
import WalletDashboard from '../components/WalletDashboard'
import SendModal from '../components/SendModal'
import ReceiveModal from '../components/ReceiveModal'
import Notification from '../components/Notification'
import { useDarkMode } from '../hooks/useDarkMode'

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [showSendModal, setShowSendModal] = useState(false)
  const [showReceiveModal, setShowReceiveModal] = useState(false)
  const [notification, setNotification] = useState({ message: '', isVisible: false })

  // Initialize dark mode
  useDarkMode()

  const handleGoogleLogin = () => {
    setIsLoading(true)
    setLoadingMessage('Masuk dengan Google...')
    
    setTimeout(() => {
      setIsLoading(false)
      setUserName('John Doe')
      setIsLoggedIn(true)
    }, 2000)
  }

  const handleFacebookLogin = () => {
    setIsLoading(true)
    setLoadingMessage('Masuk dengan Facebook...')
    
    setTimeout(() => {
      setIsLoading(false)
      setUserName('Jane Smith')
      setIsLoggedIn(true)
    }, 2000)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setUserName('')
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
        {!isLoggedIn ? (
          <LoginScreen
            onGoogleLogin={handleGoogleLogin}
            onFacebookLogin={handleFacebookLogin}
            isLoading={isLoading}
            loadingMessage={loadingMessage}
          />
        ) : (
          <WalletDashboard
            userName={userName}
            onLogout={handleLogout}
            onShowSendModal={() => setShowSendModal(true)}
            onShowReceiveModal={() => setShowReceiveModal(true)}
            onShowNotification={showNotification}
          />
        )}

        <SendModal
          isOpen={showSendModal}
          onClose={() => setShowSendModal(false)}
        />

        <ReceiveModal
          isOpen={showReceiveModal}
          onClose={() => setShowReceiveModal(false)}
          onShowNotification={showNotification}
        />

        <Notification
          message={notification.message}
          isVisible={notification.isVisible}
          onHide={hideNotification}
        />
      </div>
    </>
  )
}