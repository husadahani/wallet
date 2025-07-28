import React, { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faSignOutAlt, 
  faCopy, 
  faPaperPlane, 
  faQrcode,
  faDollarSign,
  faLink,
  faFire,
  faCoins
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
  contractAddress?: string
  decimals: number
}

import { NetworkConfig } from '../services/alchemyWallet'

interface WalletDashboardProps {
  userName: string
  walletAddress: string
  balance: string
  isDeployed: boolean
  currentNetwork: NetworkConfig | null
  tokenBalances: Array<{
    symbol: string
    balance: string
    contractAddress?: string
    decimals: number
  }>
  gasManagerEnabled: boolean
  onLogout: () => void
  onShowSendModal: () => void
  onShowReceiveModal: () => void
  onShowNotification: (message: string) => void
  onRefreshBalance: () => void
}

const WalletDashboard: React.FC<WalletDashboardProps> = ({
  userName,
  walletAddress,
  balance,
  isDeployed,
  currentNetwork,
  tokenBalances,
  gasManagerEnabled,
  onLogout,
  onShowSendModal,
  onShowReceiveModal,
  onShowNotification,
  onRefreshBalance
}) => {
  const [tokens, setTokens] = useState<Token[]>([])
  const displayAddress = walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : ''

  const getTokenIcon = (symbol: string) => {
    switch (symbol.toUpperCase()) {
      case 'BNB':
        return { icon: faFire, color: 'text-yellow-500' }
      case 'ETH':
        return { icon: faEthereum, color: 'text-blue-500' }
      case 'BTC':
        return { icon: faBitcoin, color: 'text-orange-500' }
      case 'USDT':
        return { icon: faDollarSign, color: 'text-green-500' }
      case 'USDC':
        return { icon: faDollarSign, color: 'text-blue-500' }
      case 'BUSD':
        return { icon: faDollarSign, color: 'text-yellow-600' }
      case 'CAKE':
        return { icon: faCoins, color: 'text-orange-400' }
      case 'LINK':
        return { icon: faLink, color: 'text-blue-600' }
      default:
        return { icon: faCoins, color: 'text-gray-500' }
    }
  }

  useEffect(() => {
    const formattedTokens: Token[] = tokenBalances.map(token => {
      const { icon, color } = getTokenIcon(token.symbol)
      const tokenName = token.symbol === 'BNB' ? 'BNB Smart Chain' : 
                       token.symbol === 'ETH' ? 'Ethereum' : 
                       token.symbol === 'USDT' ? 'Tether USD' :
                       token.symbol === 'USDC' ? 'USD Coin' :
                       token.symbol === 'BUSD' ? 'Binance USD' :
                       token.symbol === 'CAKE' ? 'PancakeSwap' :
                       token.symbol
      return {
        name: tokenName,
        symbol: token.symbol,
        balance: parseFloat(token.balance).toFixed(4),
        icon,
        color,
        contractAddress: token.contractAddress,
        decimals: token.decimals
      }
    })
    setTokens(formattedTokens)
  }, [tokenBalances])

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress)
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
              <p className="text-blue-100">Smart Wallet di BNB Smart Chain</p>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={onLogout}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <FontAwesomeIcon icon={faSignOutAlt} className="text-xl" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Info Card */}
      <div className="max-w-md mx-auto px-6 -mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 card-shadow animate-fade-in">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Smart Wallet</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {currentNetwork?.name || 'BNB Smart Chain'}
              </p>
            </div>
            <div className="flex space-x-2">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                isDeployed 
                  ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400' 
                  : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400'
              }`}>
                {isDeployed ? 'Deployed' : 'Not Deployed'}
              </div>
              {gasManagerEnabled && (
                <div className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                  Gasless
                </div>
              )}
            </div>
          </div>
          
          <div className="border-t dark:border-gray-700 pt-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">Alamat Wallet</p>
              <button 
                onClick={onRefreshBalance}
                className="text-primary hover:text-primary-dark transition-colors text-sm"
              >
                Refresh
              </button>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg flex items-center justify-between">
              <span className="text-sm font-mono text-gray-700 dark:text-gray-300">{displayAddress}</span>
              <button 
                onClick={copyAddress}
                className="text-primary hover:text-primary-dark transition-colors"
              >
                <FontAwesomeIcon icon={faCopy} />
              </button>
            </div>
          </div>

          {/* Alchemy Integration Info */}
          <div className="border-t dark:border-gray-700 pt-4 mt-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Powered by Alchemy Account Kit</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tokens Section */}
      <div className="max-w-md mx-auto px-6 mt-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 card-shadow">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Token Saya</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">BNB Smart Chain</span>
          </div>
          
          <div className="space-y-4">
            {tokens.length > 0 ? tokens.map((token, index) => (
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
            )) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FontAwesomeIcon icon={faCoins} className="text-4xl mb-4 opacity-50" />
                <p>Belum ada token di wallet</p>
                <p className="text-sm">Wallet akan terisi setelah deployment</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="max-w-md mx-auto px-6 mt-6 mb-8">
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={onShowSendModal}
            disabled={!isDeployed}
            className={`py-4 px-6 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
              isDeployed 
                ? 'bg-primary text-white hover:bg-primary-dark' 
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
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

        {gasManagerEnabled && (
          <div className="mt-4 text-center">
            <p className="text-xs text-green-600 dark:text-green-400">
              ⚡ Transaksi gasless aktif - Tidak perlu bayar gas fee!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default WalletDashboard