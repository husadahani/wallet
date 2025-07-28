import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown, faGlobe, faCheck } from '@fortawesome/free-solid-svg-icons'
import { NetworkConfig } from '../services/alchemyWallet'

interface NetworkSelectorProps {
  currentNetwork: NetworkConfig | null
  supportedNetworks: Record<string, NetworkConfig>
  onNetworkChange: (networkKey: string) => void
  isLoading?: boolean
}

const NetworkSelector: React.FC<NetworkSelectorProps> = ({
  currentNetwork,
  supportedNetworks,
  onNetworkChange,
  isLoading = false
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleNetworkSelect = (networkKey: string) => {
    onNetworkChange(networkKey)
    setIsOpen(false)
  }

  const getNetworkIcon = (networkName: string) => {
    if (networkName.includes('BNB') || networkName.includes('BSC')) {
      return '🟡' // BNB icon
    }
    return '🔹' // Ethereum icon
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center space-x-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
      >
        <FontAwesomeIcon icon={faGlobe} className="text-gray-500 dark:text-gray-400" />
        <span className="hidden sm:inline">
          {currentNetwork ? (
            <span className="flex items-center space-x-2">
              <span>{getNetworkIcon(currentNetwork.name)}</span>
              <span>{currentNetwork.name}</span>
            </span>
          ) : (
            'Select Network'
          )}
        </span>
        <span className="sm:hidden">
          {currentNetwork ? getNetworkIcon(currentNetwork.name) : '🌐'}
        </span>
        <FontAwesomeIcon 
          icon={faChevronDown} 
          className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full mt-1 right-0 w-64 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-20">
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                Available Networks
              </div>
              
              {Object.entries(supportedNetworks).map(([key, network]) => (
                <button
                  key={key}
                  onClick={() => handleNetworkSelect(key)}
                  className="w-full flex items-center justify-between px-3 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getNetworkIcon(network.name)}</span>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {network.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Chain ID: {network.chainId}
                      </div>
                    </div>
                  </div>
                  
                  {currentNetwork?.chainId === network.chainId && (
                    <FontAwesomeIcon 
                      icon={faCheck} 
                      className="text-green-500 text-sm"
                    />
                  )}
                </button>
              ))}
            </div>
            
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Current: {currentNetwork?.name || 'None'}
              </div>
              {currentNetwork && (
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {currentNetwork.symbol} • Chain {currentNetwork.chainId}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default NetworkSelector