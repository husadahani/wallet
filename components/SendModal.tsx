import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes, faFire, faCoins, faDollarSign } from '@fortawesome/free-solid-svg-icons'
import { SendTokenOptions } from '../hooks/useAlchemyWallet'

interface TokenBalance {
  symbol: string
  balance: string
  contractAddress?: string
  decimals: number
}

interface SendModalProps {
  walletAddress: string
  tokenBalances: TokenBalance[]
  isDeployed: boolean
  gasManagerEnabled: boolean
  onClose: () => void
  onSend: (data: SendTokenOptions) => Promise<any>
}

const SendModal: React.FC<SendModalProps> = ({ 
  walletAddress,
  tokenBalances, 
  isDeployed,
  gasManagerEnabled,
  onClose, 
  onSend
}) => {
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedToken, setSelectedToken] = useState(tokenBalances[0]?.symbol || 'BNB')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!recipient || !amount) {
      return
    }

    if (!isDeployed) {
      return
    }

    setIsLoading(true)
    
    try {
      const selectedTokenData = tokenBalances.find(token => token.symbol === selectedToken)
      
      const sendData: SendTokenOptions = {
        to: recipient,
        amount: amount,
        tokenAddress: selectedTokenData?.contractAddress,
        symbol: selectedToken,
        decimals: selectedTokenData?.decimals || 18
      }

      await onSend(sendData)
      setRecipient('')
      setAmount('')
    } catch (error) {
      console.error('Send error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const getTokenIcon = (symbol: string) => {
    switch (symbol.toUpperCase()) {
      case 'BNB':
        return faFire
      case 'USDT':
      case 'USDC':
      case 'BUSD':
        return faDollarSign
      default:
        return faCoins
    }
  }

  const getTokenColor = (symbol: string) => {
    switch (symbol.toUpperCase()) {
      case 'BNB':
        return 'text-yellow-500'
      case 'USDT':
        return 'text-green-500'
      case 'USDC':
        return 'text-blue-500'
      case 'BUSD':
        return 'text-yellow-600'
      default:
        return 'text-gray-500'
    }
  }

  const selectedTokenData = tokenBalances.find(token => token.symbol === selectedToken)
  const maxAmount = selectedTokenData ? parseFloat(selectedTokenData.balance) : 0

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl animate-slide-up">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Kirim Token</h3>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <FontAwesomeIcon icon={faTimes} className="text-xl" />
            </button>
          </div>

          {!isDeployed && (
            <div className="mb-4 p-4 bg-yellow-100 dark:bg-yellow-900 rounded-xl">
              <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                ⚠️ Smart Wallet belum di-deploy. Deploy terlebih dahulu untuk mengirim token.
              </p>
            </div>
          )}

          {gasManagerEnabled && (
            <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 rounded-xl">
              <p className="text-green-800 dark:text-green-200 text-sm flex items-center">
                ⚡ Gas Manager aktif - Transaksi gratis!
              </p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Token
              </label>
              <select 
                value={selectedToken}
                onChange={(e) => setSelectedToken(e.target.value)}
                className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={isLoading || !isDeployed}
              >
                {tokenBalances.map((token) => (
                  <option key={token.symbol} value={token.symbol}>
                    {token.symbol} - {parseFloat(token.balance).toFixed(4)} available
                  </option>
                ))}
              </select>
              
              {selectedTokenData && (
                <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <FontAwesomeIcon 
                    icon={getTokenIcon(selectedToken)} 
                    className={getTokenColor(selectedToken)} 
                  />
                  <span>Balance: {parseFloat(selectedTokenData.balance).toFixed(4)} {selectedToken}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Alamat Penerima
              </label>
              <input 
                type="text" 
                placeholder="0x..." 
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent"
                required
                disabled={isLoading || !isDeployed}
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Jumlah ({selectedToken})
                </label>
                {selectedTokenData && (
                  <button
                    type="button"
                    onClick={() => setAmount(selectedTokenData.balance)}
                    className="text-xs text-primary hover:text-primary-dark"
                    disabled={isLoading || !isDeployed}
                  >
                    Max
                  </button>
                )}
              </div>
              <input 
                type="number" 
                placeholder="0.00" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="any"
                min="0"
                max={maxAmount}
                className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent"
                required
                disabled={isLoading || !isDeployed}
              />
            </div>
            
            <button 
              type="submit"
              disabled={isLoading || !isDeployed || !recipient || !amount}
              className="w-full bg-primary text-white py-4 px-6 rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Mengirim...' : 
               !isDeployed ? 'Wallet Belum Di-deploy' :
               `Kirim ${selectedToken}`}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              From: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Network: BNB Smart Chain
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SendModal