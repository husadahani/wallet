import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faTimes, 
  faPlus, 
  faSpinner, 
  faCheckCircle, 
  faExclamationTriangle,
  faTrash,
  faExternalLinkAlt
} from '@fortawesome/free-solid-svg-icons'
import { CustomToken } from '../services/alchemyWallet'
import alchemyWallet from '../services/alchemyWallet'

interface CustomTokenModalProps {
  isOpen: boolean
  onClose: () => void
  onTokenAdded?: (token: CustomToken) => void
  currentNetwork: {
    name: string
    chainId: number
    explorer: string
  }
}

const CustomTokenModal: React.FC<CustomTokenModalProps> = ({
  isOpen,
  onClose,
  onTokenAdded,
  currentNetwork
}) => {
  const [tokenAddress, setTokenAddress] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [customTokens, setCustomTokens] = useState<CustomToken[]>([])

  // Load custom tokens when modal opens
  useState(() => {
    if (isOpen) {
      setCustomTokens(alchemyWallet.getCustomTokens())
    }
  })

  const validateTokenAddress = (address: string): boolean => {
    // Basic Ethereum address validation
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  }

  const handleAddToken = async () => {
    setError('')
    setSuccess('')

    if (!tokenAddress.trim()) {
      setError('Please enter a token contract address')
      return
    }

    if (!validateTokenAddress(tokenAddress)) {
      setError('Invalid contract address format')
      return
    }

    setIsLoading(true)

    try {
      const token = await alchemyWallet.addCustomToken(tokenAddress.trim())
      
      if (token) {
        setSuccess(`Successfully added ${token.symbol} (${token.name})`)
        setTokenAddress('')
        setCustomTokens(alchemyWallet.getCustomTokens())
        
        if (onTokenAdded) {
          onTokenAdded(token)
        }

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add token')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveToken = async (tokenAddress: string) => {
    try {
      const success = alchemyWallet.removeCustomToken(tokenAddress)
      if (success) {
        setCustomTokens(alchemyWallet.getCustomTokens())
        setSuccess('Token removed successfully')
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (error) {
      setError('Failed to remove token')
    }
  }

  const getExplorerUrl = (address: string) => {
    return `${currentNetwork.explorer}/address/${address}`
  }

  const getTokenStandard = () => {
    switch (currentNetwork.chainId) {
      case 56:
        return 'BEP-20'
      case 1:
      case 11155111:
        return 'ERC-20'
      case 137:
        return 'ERC-20 (Polygon)'
      default:
        return 'ERC-20'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Custom Tokens
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Add {getTokenStandard()} tokens on {currentNetwork.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Add Token Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Add New Token
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Token Contract Address
                </label>
                <input
                  type="text"
                  value={tokenAddress}
                  onChange={(e) => setTokenAddress(e.target.value)}
                  placeholder={`Enter ${getTokenStandard()} contract address`}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm">
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                  <span>{error}</span>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="flex items-center space-x-2 text-green-600 dark:text-green-400 text-sm">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>{success}</span>
                </div>
              )}

              <button
                onClick={handleAddToken}
                disabled={isLoading || !tokenAddress.trim()}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 
                         bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600
                         text-white rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                    <span>Adding Token...</span>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faPlus} />
                    <span>Add Token</span>
                  </>
                )}
              </button>
            </div>

            {/* Token Info */}
            <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <div className="space-y-1">
                <p>• Only add tokens you trust and verify the contract address</p>
                <p>• Custom tokens are stored locally for this network</p>
                <p>• Make sure the contract address is correct to avoid scams</p>
              </div>
            </div>
          </div>

          {/* Custom Tokens List */}
          {customTokens.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Your Custom Tokens ({customTokens.length})
              </h3>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {customTokens.map((token) => (
                  <div
                    key={token.address}
                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {token.symbol}
                        </span>
                        {!token.verified && (
                          <span className="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded">
                            Unverified
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {token.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 font-mono">
                        {token.address.substring(0, 10)}...{token.address.slice(-8)}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* View on Explorer */}
                      <a
                        href={getExplorerUrl(token.address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-blue-500 transition-colors"
                        title="View on Explorer"
                      >
                        <FontAwesomeIcon icon={faExternalLinkAlt} size="sm" />
                      </a>

                      {/* Remove Token */}
                      <button
                        onClick={() => handleRemoveToken(token.address)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Remove Token"
                      >
                        <FontAwesomeIcon icon={faTrash} size="sm" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Custom Tokens */}
          {customTokens.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-400 dark:text-gray-500 mb-2">
                <FontAwesomeIcon icon={faPlus} size="2x" />
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                No custom tokens added yet
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Add tokens by entering their contract address above
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default CustomTokenModal