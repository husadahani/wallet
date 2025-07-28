import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes, faQrcode, faCopy, faFire } from '@fortawesome/free-solid-svg-icons'

interface ReceiveModalProps {
  walletAddress: string
  networkName: string
  onClose: () => void
}

const ReceiveModal: React.FC<ReceiveModalProps> = ({ 
  walletAddress, 
  networkName,
  onClose
}) => {
  const [copySuccess, setCopySuccess] = useState(false)

  const copyReceiveAddress = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy address:', err)
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
        <div className="p-6 text-center">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Terima Token</h3>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <FontAwesomeIcon icon={faTimes} className="text-xl" />
            </button>
          </div>

          <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900 rounded-xl">
            <div className="flex items-center justify-center space-x-2">
              <FontAwesomeIcon icon={faFire} className="text-yellow-500" />
              <span className="text-yellow-800 dark:text-yellow-200 text-sm font-medium">
                {networkName}
              </span>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 mb-6">
            <div className="w-48 h-48 bg-gray-200 dark:bg-gray-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <FontAwesomeIcon icon={faQrcode} className="text-6xl text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">QR Code untuk alamat Smart Wallet Anda</p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Alamat Smart Wallet:</p>
            <p className="text-sm font-mono text-gray-700 dark:text-gray-300 break-all">{walletAddress}</p>
          </div>
          
          <button 
            onClick={copyReceiveAddress}
            className={`w-full py-3 px-6 rounded-xl font-medium transition-all duration-200 ${
              copySuccess 
                ? 'bg-green-600 text-white' 
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            <FontAwesomeIcon icon={faCopy} className="mr-2" />
            {copySuccess ? 'Alamat Disalin!' : 'Salin Alamat'}
          </button>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              ⚠️ Hanya kirim token dari {networkName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Mengirim dari network lain akan menyebabkan kehilangan dana
            </p>
          </div>

          <div className="mt-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Smart Wallet powered by Alchemy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReceiveModal