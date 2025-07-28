import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/free-solid-svg-icons'
import { TransactionResult } from '../services/alchemyWallet'

interface SendModalProps {
  isOpen: boolean
  onClose: () => void
  onSend: (to: string, amount: string) => Promise<TransactionResult>
  onSendToken: (tokenAddress: string, to: string, amount: string, decimals: number) => Promise<TransactionResult>
  onShowNotification: (message: string) => void
}

const SendModal: React.FC<SendModalProps> = ({ 
  isOpen, 
  onClose, 
  onSend, 
  onSendToken, 
  onShowNotification 
}) => {
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedToken, setSelectedToken] = useState('ETH')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!recipient || !amount) {
      onShowNotification('Mohon isi semua field')
      return
    }

    setIsLoading(true)
    
    try {
      let result: TransactionResult
      
      if (selectedToken === 'ETH') {
        result = await onSend(recipient, amount)
      } else {
        // For other tokens, you would need token contract addresses
        // This is a placeholder for token sending
        onShowNotification('Token sending belum tersedia')
        setIsLoading(false)
        return
      }

      if (result.success) {
        onShowNotification(`Transaksi berhasil! Hash: ${result.hash.slice(0, 10)}...`)
        setRecipient('')
        setAmount('')
        onClose()
      } else {
        onShowNotification(`Transaksi gagal: ${result.error}`)
      }
    } catch (error) {
      onShowNotification(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

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
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Token
              </label>
              <select 
                value={selectedToken}
                onChange={(e) => setSelectedToken(e.target.value)}
                className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="ETH">ETH</option>
                {/* Add more tokens as needed */}
              </select>
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
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Jumlah ({selectedToken})
              </label>
              <input 
                type="number" 
                placeholder="0.00" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="any"
                min="0"
                className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent"
                required
                disabled={isLoading}
              />
            </div>
            
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white py-4 px-6 rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Mengirim...' : `Kirim ${selectedToken}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default SendModal