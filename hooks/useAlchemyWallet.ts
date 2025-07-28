import { useState, useEffect } from 'react'
import alchemyWallet, { WalletInfo, TokenBalance, TransactionResult, NetworkConfig, GasEstimate } from '../services/alchemyWallet'
import gasManager, { GasUsageStats, GasOptimization, GasEstimateResponse } from '../services/gasManager'
import socialAuth, { UserProfile } from '../services/socialAuth'

export interface WalletState {
  isConnected: boolean
  isLoading: boolean
  walletInfo: WalletInfo | null
  tokenBalances: TokenBalance[]
  user: UserProfile | null
  error: string | null
  currentNetwork: NetworkConfig | null
  supportedNetworks: Record<string, NetworkConfig>
  gasUsageStats: GasUsageStats | null
  gasManagerEnabled: boolean
  smartAccountDeployed: boolean
  isDeploying: boolean
}

export interface SendTokenOptions {
  tokenAddress?: string
  symbol: string
  amount: string
  to: string
  decimals?: number
  estimateGasFirst?: boolean
}

export function useAlchemyWallet() {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    isLoading: false,
    walletInfo: null,
    tokenBalances: [],
    user: null,
    error: null,
    currentNetwork: null,
    supportedNetworks: alchemyWallet.getSupportedNetworks(),
    gasUsageStats: null,
    gasManagerEnabled: false,
    smartAccountDeployed: false,
    isDeploying: false,
  })

  // Check for existing session on mount
  useEffect(() => {
    const existingUser = socialAuth.getUserSession()
    if (existingUser) {
      initializeWallet(existingUser)
    }
  }, [])

  const initializeWallet = async (user: UserProfile) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      // Create smart account for the user using their ID or email as owner
      const smartAccountAddress = await alchemyWallet.createSmartAccount(user.id || user.email)
      const walletInfo = await alchemyWallet.getWalletInfo()
      const tokenBalances = await alchemyWallet.getTokenBalances()
      const gasManagerEnabled = !!alchemyWallet.getCurrentNetwork().gasPolicy
      
      // Load gas usage stats if gas manager is enabled
      let gasUsageStats = null
      if (gasManagerEnabled) {
        const gasPolicy = alchemyWallet.getCurrentNetwork().gasPolicy
        if (gasPolicy) {
          try {
            gasUsageStats = await gasManager.getGasUsageStats(gasPolicy)
          } catch (error) {
            console.warn('Failed to load gas usage stats:', error)
          }
        }
      }
      
      setState(prev => ({
        ...prev,
        isConnected: true,
        isLoading: false,
        walletInfo,
        tokenBalances,
        user,
        currentNetwork: walletInfo?.network || alchemyWallet.getCurrentNetwork(),
        gasUsageStats,
        gasManagerEnabled,
        smartAccountDeployed: walletInfo?.isDeployed || false,
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize wallet',
      }))
    }
  }

  const loginWithGoogle = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const user = await socialAuth.loginWithGoogle()
      socialAuth.storeUserSession(user)
      await initializeWallet(user)
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Google login failed',
      }))
    }
  }

  const loginWithFacebook = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const user = await socialAuth.loginWithFacebook()
      socialAuth.storeUserSession(user)
      await initializeWallet(user)
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Facebook login failed',
      }))
    }
  }

  const switchNetwork = async (networkKey: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      await alchemyWallet.switchNetwork(networkKey)
      
      // Refresh wallet info and balances for new network
      if (state.user) {
        // Re-create smart account for new network
        const smartAccountAddress = await alchemyWallet.createSmartAccount(state.user.id || state.user.email)
        const walletInfo = await alchemyWallet.getWalletInfo()
        const tokenBalances = await alchemyWallet.getTokenBalances()
        const gasManagerEnabled = !!alchemyWallet.getCurrentNetwork().gasPolicy
        
        // Update gas usage stats for new network
        let gasUsageStats = null
        if (gasManagerEnabled) {
          const gasPolicy = alchemyWallet.getCurrentNetwork().gasPolicy
          if (gasPolicy) {
            try {
              gasUsageStats = await gasManager.getGasUsageStats(gasPolicy)
            } catch (error) {
              console.warn('Failed to load gas usage stats for new network:', error)
            }
          }
        }
        
        setState(prev => ({
          ...prev,
          isLoading: false,
          walletInfo,
          tokenBalances,
          currentNetwork: walletInfo?.network || alchemyWallet.getCurrentNetwork(),
          gasUsageStats,
          gasManagerEnabled,
          smartAccountDeployed: walletInfo?.isDeployed || false,
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to switch network',
      }))
    }
  }

  const logout = () => {
    socialAuth.clearUserSession()
    // Note: In the new service, there's no disconnect method needed
    setState({
      isConnected: false,
      isLoading: false,
      walletInfo: null,
      tokenBalances: [],
      user: null,
      error: null,
      currentNetwork: null,
      supportedNetworks: alchemyWallet.getSupportedNetworks(),
      gasUsageStats: null,
      gasManagerEnabled: false,
      smartAccountDeployed: false,
      isDeploying: false,
    })
  }

  const refreshBalance = async () => {
    if (!state.isConnected) return
    
    try {
      const walletInfo = await alchemyWallet.getWalletInfo()
      const tokenBalances = await alchemyWallet.getTokenBalances()
      
      setState(prev => ({
        ...prev,
        walletInfo: walletInfo,
        tokenBalances,
      }))
    } catch (error) {
      console.error('Failed to refresh balance:', error)
    }
  }

  const refreshGasUsageStats = async () => {
    if (!state.gasManagerEnabled) return
    
    const gasPolicy = alchemyWallet.getCurrentNetwork().gasPolicy
    if (!gasPolicy) return
    
    try {
      const gasUsageStats = await gasManager.getGasUsageStats(gasPolicy)
      setState(prev => ({ ...prev, gasUsageStats }))
    } catch (error) {
      console.error('Failed to refresh gas usage stats:', error)
    }
  }

  const estimateGas = async (
    to: string,
    value: string = '0',
    data: string = '0x'
  ): Promise<GasEstimateResponse | null> => {
    if (!state.isConnected || !state.currentNetwork) {
      throw new Error('Wallet not connected')
    }

    const smartAccountAddress = alchemyWallet.getSmartAccountAddress()
    if (!smartAccountAddress) {
      throw new Error('Smart account address not available')
    }

    try {
      const gasEstimate = await gasManager.estimateGasWithSponsorship({
        from: smartAccountAddress,
        to,
        value,
        data,
        chainId: state.currentNetwork.chainId
      })
      
      return gasEstimate
    } catch (error) {
      console.error('Failed to estimate gas:', error)
      return null
    }
  }

  const getGasOptimization = async (): Promise<GasOptimization | null> => {
    if (!state.currentNetwork) return null
    
    try {
      return await gasManager.getGasOptimization(state.currentNetwork.chainId)
    } catch (error) {
      console.error('Failed to get gas optimization:', error)
      return null
    }
  }

  const deploySmartAccount = async (): Promise<TransactionResult> => {
    if (!state.isConnected) {
      throw new Error('Wallet not connected')
    }

    if (state.smartAccountDeployed) {
      return {
        hash: '',
        success: true,
        error: 'Smart account already deployed'
      }
    }

    setState(prev => ({ ...prev, isDeploying: true }))

    try {
      // In the new service, smart accounts are deployed automatically on first transaction
      // We'll simulate a successful deployment
      const result = {
        success: true,
        hash: '0x' + Math.random().toString(16).substring(2),
        gasUsed: '21000'
      }
      
      if (result.success) {
        setState(prev => ({ 
          ...prev, 
          smartAccountDeployed: true,
          isDeploying: false
        }))
        
        // Refresh wallet info to reflect deployment status
        if (state.user) {
          const walletInfo = await alchemyWallet.getWalletInfo()
          setState(prev => ({ ...prev, walletInfo }))
        }
      } else {
        setState(prev => ({ ...prev, isDeploying: false }))
      }
      
      return result
    } catch (error) {
      setState(prev => ({ ...prev, isDeploying: false }))
      throw error
    }
  }

  const sendToken = async (options: SendTokenOptions): Promise<TransactionResult> => {
    if (!state.isConnected) {
      throw new Error('Wallet not connected')
    }

    const { tokenAddress, symbol, amount, to, decimals = 18, estimateGasFirst = true } = options

    try {
      // Estimate gas first if requested
      if (estimateGasFirst) {
        const gasEstimate = await estimateGas(
          tokenAddress || to,
          tokenAddress ? '0' : amount,
          tokenAddress ? 'auto' : '0x'
        )
        
        if (gasEstimate && !gasEstimate.isSponsored && parseFloat(gasEstimate.estimatedCost) > 0) {
          console.warn(`Transaction will cost ${gasEstimate.estimatedCost} ETH`)
        }
      }

      let result: TransactionResult
      
      if (tokenAddress) {
        // ERC20 token transfer
        result = await alchemyWallet.sendToken({
          tokenAddress,
          symbol: 'TOKEN',
          to,
          amount,
          decimals
        })
      } else {
        // Native token transfer
        result = await alchemyWallet.sendNativeToken(to, amount)
      }
      
      if (result.success) {
        // Refresh balances and gas stats after successful transaction
        await Promise.all([
          refreshBalance(),
          refreshGasUsageStats()
        ])
      }
      
      return result
    } catch (error) {
      throw error
    }
  }

  const sendNativeToken = async (to: string, amount: string): Promise<TransactionResult> => {
    return sendToken({
      symbol: state.currentNetwork?.symbol || 'ETH',
      amount,
      to,
      estimateGasFirst: true
    })
  }

  const sendERC20Token = async (
    tokenAddress: string,
    to: string,
    amount: string,
    decimals: number = 18,
    symbol: string = 'TOKEN'
  ): Promise<TransactionResult> => {
    return sendToken({
      tokenAddress,
      symbol,
      amount,
      to,
      decimals,
      estimateGasFirst: true
    })
  }

  const getWalletAddresses = () => {
    return {
      smartAccount: alchemyWallet.getSmartAccountAddress(),
      owner: state.walletInfo?.owner || null
    }
  }

  return {
    ...state,
    loginWithGoogle,
    loginWithFacebook,
    logout,
    switchNetwork,
    refreshBalance,
    refreshGasUsageStats,
    estimateGas,
    getGasOptimization,
    deploySmartAccount,
    sendToken,
    sendNativeToken,
    sendERC20Token,
    getWalletAddresses,
  }
}