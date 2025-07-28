import React, { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faSignOutAlt, 
  faCopy, 
  faPaperPlane, 
  faQrcode,
  faDollarSign,
  faLink
} from '@fortawesome/free-solid-svg-icons'
import { 
  faEthereum, 
  faBitcoin 
} from '@fortawesome/free-brands-svg-icons'

interface Token {
  name: string
  symbol: string
  balance: string
  icon: any
  color: string
}

interface WalletDashboardProps {
  userName: string
  onLogout: () => void
  onShowSendModal: () => void
  onShowReceiveModal: () => void
  onShowNotification: (message: string) => void
}

const WalletDashboard: React.FC<WalletDashboardProps> = ({
  userName,
  onLogout,
  onShowSendModal,
  onShowReceiveModal,
  onShowNotification
}) => {
  const [tokens, setTokens] = useState<Token[]>([])
  const walletAddress = '0x742d...E8B3'

  const tokensData: Token[] = [
    { name: 'Ethereum', symbol: 'ETH', balance: '2.45', icon: faEthereum, color: 'text-blue-500' },
    { name: 'Bitcoin', symbol: 'BTC', balance: '0.0123', icon: faBitcoin, color: 'text-orange-500' },
    { name: 'USD Coin', symbol: 'USDC', balance: '1,250.00', icon: faDollarSign, color: 'text-green-500' },
    { name: 'Chainlink', symbol: 'LINK', balance: '45.67', icon: faLink, color: 'text-blue-600' }
  ]

  useEffect(() => {
    setTokens(tokensData)
  }, [])

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText('0x742d35Cc6e15A2e1c2B3E8B3')
      onShowNotification('Alamat berhasil disalin!')
    } catch (err) {
      console.error('Failed to copy address:', err)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="gradient-bg text-white p-6">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">Halo, {userName}!</h1>
              <p className="text-blue-100">Selamat datang kembali</p>
            </div>
            <button 
              onClick={onLogout}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <FontAwesomeIcon icon={faSignOutAlt} className="text-xl" />
            </button>
          </div>
        </div>
      </div>

      {/* Wallet Info Card */}
      <div className="max-w-md mx-auto px-6 -mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 card-shadow animate-fade-in">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Wallet Utama</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Ethereum Mainnet</p>
            </div>
            <div className="bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 px-3 py-1 rounded-full text-sm font-medium">
              Aktif
            </div>
          </div>
          
          <div className="border-t dark:border-gray-700 pt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Alamat Wallet</p>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg flex items-center justify-between">
              <span className="text-sm font-mono text-gray-700 dark:text-gray-300">{walletAddress}</span>
              <button 
                onClick={copyAddress}
                className="text-primary hover:text-primary-dark transition-colors"
              >
                <FontAwesomeIcon icon={faCopy} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tokens Section */}
      <div className="max-w-md mx-auto px-6 mt-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 card-shadow">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">Token Saya</h3>
          
          <div className="space-y-4">
            {tokens.map((token, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <FontAwesomeIcon icon={token.icon} className={token.color} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">{token.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{token.symbol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-800 dark:text-white">{token.balance}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{token.symbol}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="max-w-md mx-auto px-6 mt-6 mb-8">
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={onShowSendModal}
            className="bg-primary text-white py-4 px-6 rounded-xl font-medium hover:bg-primary-dark transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <FontAwesomeIcon icon={faPaperPlane} />
            <span>Kirim</span>
          </button>
          
          <button 
            onClick={onShowReceiveModal}
            className="bg-green-500 text-white py-4 px-6 rounded-xl font-medium hover:bg-green-600 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <FontAwesomeIcon icon={faQrcode} />
            <span>Terima</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default WalletDashboard