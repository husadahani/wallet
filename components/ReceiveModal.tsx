import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes, faQrcode, faCopy } from '@fortawesome/free-solid-svg-icons'

interface ReceiveModalProps {
  isOpen: boolean
  onClose: () => void
  onShowNotification: (message: string) => void
}

const ReceiveModal: React.FC<ReceiveModalProps> = ({ isOpen, onClose, onShowNotification }) => {
  const walletAddress = '0x742d35Cc6e15A2e1c2B3E8B3'

  if (!isOpen) return null

  const copyReceiveAddress = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress)
      onShowNotification('Alamat berhasil disalin!')
      onClose()
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
          
          <div className="bg-white p-6 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 mb-6">
            <div className="w-48 h-48 bg-gray-200 dark:bg-gray-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <FontAwesomeIcon icon={faQrcode} className="text-6xl text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">QR Code untuk alamat wallet Anda</p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg mb-4">
            <p className="text-sm font-mono text-gray-700 dark:text-gray-300">{walletAddress}</p>
          </div>
          
          <button 
            onClick={copyReceiveAddress}
            className="w-full bg-green-500 text-white py-3 px-6 rounded-xl font-medium hover:bg-green-600 transition-colors"
          >
            <FontAwesomeIcon icon={faCopy} className="mr-2" />
            Salin Alamat
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReceiveModal