import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWallet, faEnvelope } from '@fortawesome/free-solid-svg-icons'
import { faFacebookF, faGoogle } from '@fortawesome/free-brands-svg-icons'

interface LoginScreenProps {
  onGoogleLogin: () => void
  onFacebookLogin: () => void
  onEmailLogin: (email: string) => void
  isLoading: boolean
  loadingMessage: string
}

const LoginScreen: React.FC<LoginScreenProps> = ({
  onGoogleLogin,
  onFacebookLogin,
  onEmailLogin,
  isLoading,
  loadingMessage
}) => {
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [email, setEmail] = useState('')

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) {
      onEmailLogin(email.trim())
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{loadingMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faWallet} className="text-white text-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">CryptoWallet BNB</h1>
          <p className="text-gray-600 dark:text-gray-400">Smart Wallet di BNB Smart Chain dengan Alchemy</p>
        </div>

        <div className="space-y-3">
          {/* Google Login */}
          <button
            onClick={onGoogleLogin}
            className="w-full bg-white border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-3 px-6 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 flex items-center justify-center space-x-3"
          >
            <FontAwesomeIcon icon={faGoogle} className="text-red-500 text-lg" />
            <span>Masuk dengan Google</span>
          </button>

          {/* Facebook Login */}
          <button
            onClick={onFacebookLogin}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-blue-700 transition-all duration-200 flex items-center justify-center space-x-3"
          >
            <FontAwesomeIcon icon={faFacebookF} className="text-lg" />
            <span>Masuk dengan Facebook</span>
          </button>

          {/* Email Login Toggle */}
          <button
            onClick={() => setShowEmailForm(!showEmailForm)}
            className="w-full bg-green-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-green-700 transition-all duration-200 flex items-center justify-center space-x-3"
          >
            <FontAwesomeIcon icon={faEnvelope} className="text-lg" />
            <span>Masuk dengan Email</span>
          </button>

          {/* Email Form */}
          {showEmailForm && (
            <form onSubmit={handleEmailSubmit} className="mt-4 space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Masukkan email Anda"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
              <button
                type="submit"
                className="w-full bg-primary text-white py-3 px-6 rounded-xl font-medium hover:bg-primary-dark transition-all duration-200"
              >
                Lanjutkan dengan Email
              </button>
            </form>
          )}
        </div>

        <div className="mt-6 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Powered by Alchemy Account Kit</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Smart Wallet otomatis dibuat di BNB Smart Chain
          </p>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Dengan masuk, Anda menyetujui{' '}
            <a href="#" className="text-primary hover:underline">Syarat & Ketentuan</a> kami
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginScreen