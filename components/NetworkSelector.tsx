import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown, faCheck, faExchangeAlt, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { NetworkConfig } from '../services/alchemyWallet'

interface NetworkSelectorProps {
  currentNetwork: NetworkConfig
  supportedNetworks: { [key: string]: NetworkConfig }
  onNetworkChange: (networkKey: string) => void
  isLoading?: boolean
  className?: string
}

const NetworkSelector: React.FC<NetworkSelectorProps> = ({
  currentNetwork,
  supportedNetworks,
  onNetworkChange,
  isLoading = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const getNetworkIcon = (chainId: number) => {
    switch (chainId) {
      case 56: // BNB Smart Chain
        return '🟡'
      case 1: // Ethereum Mainnet
        return '🔹'
      case 11155111: // Ethereum Sepolia
        return '🔸'
      case 137: // Polygon
        return '🟣'
      default:
        return '⚡'
    }
  }

  const getNetworkColor = (chainId: number) => {
    switch (chainId) {
      case 56: // BNB Smart Chain
        return 'text-yellow-500'
      case 1: // Ethereum Mainnet
        return 'text-blue-500'
      case 11155111: // Ethereum Sepolia
        return 'text-blue-400'
      case 137: // Polygon
        return 'text-purple-500'
      default:
        return 'text-gray-500'
    }
  }

  const isPrimaryNetwork = (chainId: number) => chainId === 56 // BNB mainnet is primary

  const handleNetworkSelect = (networkKey: string) => {
    if (!isLoading && networkKey !== getCurrentNetworkKey()) {
      onNetworkChange(networkKey)
      setIsOpen(false)
    }
  }

  const getCurrentNetworkKey = () => {
    return Object.keys(supportedNetworks).find(
      key => supportedNetworks[key].chainId === currentNetwork.chainId
    ) || 'bnb_mainnet'
  }

  return (
    <div className={`relative ${className}`}>
      {/* Current Network Button */}
      <button
        onClick={() => !isLoading && setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`
          flex items-center space-x-2 px-3 py-2 rounded-lg border
          ${isPrimaryNetwork(currentNetwork.chainId) 
            ? 'border-yellow-500/30 bg-yellow-500/10' 
            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
          }
          hover:bg-opacity-80 transition-all duration-200
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}
          text-sm font-medium
        `}
      >
        {/* Network Icon */}
        <span className="text-lg">
          {getNetworkIcon(currentNetwork.chainId)}
        </span>
        
        {/* Network Info */}
        <div className="flex flex-col items-start">
          <span className={`font-semibold ${getNetworkColor(currentNetwork.chainId)}`}>
            {currentNetwork.name}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Chain ID: {currentNetwork.chainId}
          </span>
        </div>

        {/* Primary Network Badge */}
        {isPrimaryNetwork(currentNetwork.chainId) && (
          <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-full font-medium">
            Primary
          </span>
        )}

        {/* Loading/Dropdown Icon */}
        <div className="ml-auto">
          {isLoading ? (
            <FontAwesomeIcon 
              icon={faSpinner} 
              className="text-gray-400 animate-spin" 
              size="sm"
            />
          ) : (
            <FontAwesomeIcon 
              icon={faChevronDown} 
              className={`text-gray-400 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
              size="sm"
            />
          )}
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && !isLoading && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Content */}
          <div className="absolute top-full left-0 right-0 mt-2 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1 mb-2">
                Select Network
              </div>
              
              {Object.entries(supportedNetworks).map(([networkKey, network]) => {
                const isSelected = network.chainId === currentNetwork.chainId
                const isPrimary = isPrimaryNetwork(network.chainId)
                
                return (
                  <button
                    key={networkKey}
                    onClick={() => handleNetworkSelect(networkKey)}
                    className={`
                      w-full flex items-center space-x-3 px-3 py-2 rounded-lg
                      transition-all duration-200 text-left
                      ${isSelected 
                        ? (isPrimary 
                          ? 'bg-yellow-500/20 border border-yellow-500/30' 
                          : 'bg-blue-500/20 border border-blue-500/30'
                        )
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    {/* Network Icon */}
                    <span className="text-lg">
                      {getNetworkIcon(network.chainId)}
                    </span>
                    
                    {/* Network Details */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium ${getNetworkColor(network.chainId)}`}>
                          {network.name}
                        </span>
                        {isPrimary && (
                          <span className="px-1.5 py-0.5 text-xs bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded font-medium">
                            Primary
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>Chain ID: {network.chainId}</span>
                        <span>Symbol: {network.symbol}</span>
                      </div>
                    </div>

                    {/* Selection Indicator */}
                    {isSelected && (
                      <FontAwesomeIcon 
                        icon={faCheck} 
                        className={isPrimary ? 'text-yellow-500' : 'text-blue-500'} 
                        size="sm"
                      />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Switch Network Info */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-750">
              <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                <FontAwesomeIcon icon={faExchangeAlt} />
                <span>
                  Switching networks will refresh your wallet and token balances
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default NetworkSelector