import { useState, useEffect } from 'react'
import alchemyWallet, { WalletInfo, TokenBalance, TransactionResult, NetworkConfig } from '../services/alchemyWallet'
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
    gasUsageStats: null,
    gasManagerEnabled: false,
    smartAccountDeployed: false,
    isDeploying: false,
  })

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      setState(prev => ({ ...prev, isLoading: true }))
      
      try {
        // Check if user has valid session and wallet is connected
        const isValid = await socialAuth.validateAuth()
        
        if (isValid) {
          const user = socialAuth.getCurrentUser()
          if (user) {
            await initializeWalletFromSession(user)
            return
          }
        }
        
        // No valid session found
        setState(prev => ({ ...prev, isLoading: false }))
      } catch (error) {
        console.error('Error checking existing session:', error)
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: 'Failed to restore session' 
        }))
      }
    }
    
    checkExistingSession()
  }, [])

  // Initialize wallet from existing session
  const initializeWalletFromSession = async (user: UserProfile) => {
    try {
      const walletInfo = await alchemyWallet.getWalletInfo()
      
      if (!walletInfo) {
        throw new Error('Failed to get wallet information')
      }

      const tokenBalances = await alchemyWallet.getTokenBalances()
      const currentNetwork = alchemyWallet.getCurrentNetwork()
      const gasManagerEnabled = gasManager.isGasSponsorshipEnabled()
      
      let gasUsageStats = null
      if (gasManagerEnabled) {
        try {
          gasUsageStats = await gasManager.getGasUsageStats()
        } catch (error) {
          console.warn('Failed to load gas usage stats:', error)
        }
      }
      
      setState(prev => ({
        ...prev,
        isConnected: true,
        isLoading: false,
        walletInfo,
        tokenBalances,
        user,
        currentNetwork,
        gasUsageStats,
        gasManagerEnabled,
        smartAccountDeployed: walletInfo.isDeployed,
        error: null
      }))
      
    } catch (error) {
      console.error('Failed to initialize wallet from session:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to restore wallet session',
      }))
      // Clear invalid session
      await socialAuth.logout()
    }
  }

  // Initialize wallet after authentication
  const initializeWallet = async (user: UserProfile) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const walletInfo = await alchemyWallet.getWalletInfo()
      
      if (!walletInfo) {
        throw new Error('Failed to get wallet information')
      }

      const tokenBalances = await alchemyWallet.getTokenBalances()
      const currentNetwork = alchemyWallet.getCurrentNetwork()
      const gasManagerEnabled = gasManager.isGasSponsorshipEnabled()
      
      let gasUsageStats = null
      if (gasManagerEnabled) {
        try {
          gasUsageStats = await gasManager.getGasUsageStats()
        } catch (error) {
          console.warn('Failed to load gas usage stats:', error)
        }
      }
      
      setState(prev => ({
        ...prev,
        isConnected: true,
        isLoading: false,
        walletInfo,
        tokenBalances,
        user,
        currentNetwork,
        gasUsageStats,
        gasManagerEnabled,
        smartAccountDeployed: walletInfo.isDeployed,
      }))
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize wallet',
      }))
    }
  }

  // Login with Google
  const loginWithGoogle = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const user = await socialAuth.loginWithGoogle()
      await initializeWallet(user)
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Google login failed',
      }))
    }
  }

  // Login with Facebook
  const loginWithFacebook = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const user = await socialAuth.loginWithFacebook()
      await initializeWallet(user)
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Facebook login failed',
      }))
    }
  }

  // Login with Twitter
  const loginWithTwitter = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const user = await socialAuth.loginWithTwitter()
      await initializeWallet(user)
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Twitter login failed',
      }))
    }
  }

  // Login with Email
  const loginWithEmail = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const user = await socialAuth.loginWithEmail()
      await initializeWallet(user)
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Email login failed',
      }))
    }
  }

  // Logout
  const logout = async () => {
    setState(prev => ({ ...prev, isLoading: true }))
    
    try {
      await socialAuth.logout()
      
      setState({
        isConnected: false,
        isLoading: false,
        walletInfo: null,
        tokenBalances: [],
        user: null,
        error: null,
        currentNetwork: null,
        gasUsageStats: null,
        gasManagerEnabled: false,
        smartAccountDeployed: false,
        isDeploying: false,
      })
    } catch (error) {
      console.error('Error during logout:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to logout properly'
      }))
    }
  }

  // Refresh balance and token information
  const refreshBalance = async () => {
    if (!state.isConnected) return
    
    try {
      const walletInfo = await alchemyWallet.getWalletInfo()
      const tokenBalances = await alchemyWallet.getTokenBalances()
      
      setState(prev => ({
        ...prev,
        walletInfo,
        tokenBalances
      }))
      
    } catch (error) {
      console.error('Failed to refresh balance:', error)
      setState(prev => ({
        ...prev,
        error: 'Failed to refresh balance'
      }))
    }
  }

  // Refresh gas usage statistics
  const refreshGasUsageStats = async () => {
    if (!state.gasManagerEnabled) return
    
    try {
      const gasUsageStats = await gasManager.getGasUsageStats()
      setState(prev => ({ ...prev, gasUsageStats }))
    } catch (error) {
      console.error('Failed to refresh gas usage stats:', error)
    }
  }

  // Estimate gas for transaction
  const estimateGas = async (
    to: string,
    value: string = '0',
    data: string = '0x'
  ): Promise<GasEstimateResponse | null> => {
    if (!state.isConnected || !state.currentNetwork || !state.walletInfo) {
      throw new Error('Wallet not connected')
    }

    try {
      const gasEstimate = await gasManager.estimateGasForTransaction({
        from: state.walletInfo.smartAccountAddress,
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

  // Get gas optimization suggestions
  const getGasOptimization = async (): Promise<GasOptimization | null> => {
    try {
      return await gasManager.getGasOptimization()
    } catch (error) {
      console.error('Failed to get gas optimization:', error)
      return null
    }
  }

  // Send native BNB
  const sendNativeToken = async (to: string, amount: string): Promise<TransactionResult> => {
    if (!state.isConnected) {
      throw new Error('Wallet not connected')
    }

    try {
      const result = await alchemyWallet.sendNativeToken(to, amount)
      
      if (result.success) {
        // Refresh balances and gas stats after successful transaction
        await Promise.all([
          refreshBalance(),
          refreshGasUsageStats()
        ])
      }
      
      return result
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transaction failed'
      }
    }
  }

  // Send BEP-20 tokens
  const sendToken = async (options: SendTokenOptions): Promise<TransactionResult> => {
    if (!state.isConnected) {
      throw new Error('Wallet not connected')
    }

    try {
      const result = await alchemyWallet.sendToken(options)
      
      if (result.success) {
        // Refresh balances and gas stats after successful transaction
        await Promise.all([
          refreshBalance(),
          refreshGasUsageStats()
        ])
      }
      
      return result
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token transfer failed'
      }
    }
  }

  // Get wallet addresses
  const getWalletAddresses = () => {
    return {
      smartAccount: state.walletInfo?.smartAccountAddress || null,
      user: state.user?.address || null
    }
  }

  // Get current network information
  const getCurrentNetwork = () => {
    return state.currentNetwork
  }

  // Get gas manager status
  const getGasManagerStatus = () => {
    return gasManager.getGasManagerStatus()
  }

  // Health check for all services
  const performHealthCheck = async () => {
    try {
      const healthStatus = await alchemyWallet.healthCheck()
      const gasManagerStatus = gasManager.getGasManagerStatus()
      
      return {
        ...healthStatus,
        gasManager: gasManagerStatus
      }
    } catch (error) {
      return {
        status: 'unhealthy' as const,
        error: error instanceof Error ? error.message : 'Health check failed'
      }
    }
  }

  return {
    // State
    ...state,
    
    // Authentication methods
    loginWithGoogle,
    loginWithFacebook,
    loginWithTwitter,
    loginWithEmail,
    logout,
    
    // Wallet operations
    refreshBalance,
    refreshGasUsageStats,
    estimateGas,
    getGasOptimization,
    sendNativeToken,
    sendToken,
    
    // Utility methods
    getWalletAddresses,
    getCurrentNetwork,
    getGasManagerStatus,
    performHealthCheck,
  }
}