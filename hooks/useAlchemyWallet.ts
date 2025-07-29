import { useState, useEffect } from 'react'
import alchemyWallet, { WalletInfo, TokenBalance, TransactionResult, NetworkConfig, CustomToken } from '../services/alchemyWallet'
import gasManager, { GasUsageStats, GasOptimization, GasEstimateResponse, SponsorshipEligibility } from '../services/gasManager'
import socialAuth, { UserProfile, AuthenticationResult } from '../services/socialAuth'

export interface WalletState {
  isConnected: boolean
  isLoading: boolean
  walletInfo: WalletInfo | null
  tokenBalances: TokenBalance[]
  user: UserProfile | null
  error: string | null
  currentNetwork: NetworkConfig | null
  supportedNetworks: { [key: string]: NetworkConfig }
  gasUsageStats: GasUsageStats | null
  gasManagerEnabled: boolean
  smartAccountDeployed: boolean
  isDeploying: boolean
  isNetworkSwitching: boolean
  customTokens: CustomToken[]
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
    supportedNetworks: {},
    gasUsageStats: null,
    gasManagerEnabled: false,
    smartAccountDeployed: false,
    isDeploying: false,
    isNetworkSwitching: false,
    customTokens: [],
  })

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      setState(prev => ({ ...prev, isLoading: true }))
      
      try {
        // Get supported networks first
        const supportedNetworks = alchemyWallet.getSupportedNetworks()
        const currentNetwork = alchemyWallet.getCurrentNetwork()
        
        setState(prev => ({ 
          ...prev, 
          supportedNetworks, 
          currentNetwork 
        }))

        // Try to restore user session
        const restoredUser = await socialAuth.restoreUserSession()
        
        if (restoredUser && alchemyWallet.isReady()) {
          await initializeWalletFromSession(restoredUser)
        } else {
          setState(prev => ({ ...prev, isLoading: false }))
        }
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
      const customTokens = alchemyWallet.getCustomTokens()
      
      // Check gas manager status
      const gasHealthCheck = await gasManager.healthCheck()
      const gasManagerEnabled = gasHealthCheck.gasManagerEnabled
      
      let gasUsageStats = null
      if (gasManagerEnabled && user.address) {
        gasUsageStats = gasManager.getGasUsageStats(user.address)
      }
      
      setState(prev => ({
        ...prev,
        isConnected: true,
        isLoading: false,
        walletInfo,
        tokenBalances,
        user,
        currentNetwork,
        gasManagerEnabled,
        gasUsageStats,
        smartAccountDeployed: walletInfo.isDeployed,
        customTokens,
        error: null
      }))
      
      console.log('✅ Wallet initialized from session:', {
        user: user.email,
        network: currentNetwork.name,
        deployed: walletInfo.isDeployed,
        tokensLoaded: tokenBalances.length,
        customTokens: customTokens.length
      })
    } catch (error) {
      console.error('Error initializing wallet from session:', error)
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Failed to initialize wallet' 
      }))
    }
  }

  // Authenticate with social provider
  const authenticateWithSocial = async (provider: 'google' | 'facebook' | 'email', email?: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const result: AuthenticationResult = await socialAuth.authenticate(provider, email)
      
      if (!result.success || !result.user) {
        throw new Error(result.error || 'Authentication failed')
      }

      const user = result.user
      
      // Get wallet info and token balances
      const walletInfo = await alchemyWallet.getWalletInfo()
      if (!walletInfo) {
        throw new Error('Failed to get wallet information')
      }

      const tokenBalances = await alchemyWallet.getTokenBalances()
      const currentNetwork = alchemyWallet.getCurrentNetwork()
      const customTokens = alchemyWallet.getCustomTokens()
      
      // Check gas manager and get usage stats
      const gasHealthCheck = await gasManager.healthCheck()
      const gasManagerEnabled = gasHealthCheck.gasManagerEnabled
      let gasUsageStats = null
      
      if (gasManagerEnabled) {
        gasUsageStats = gasManager.getGasUsageStats(user.address)
      }

      setState(prev => ({
        ...prev,
        isConnected: true,
        isLoading: false,
        walletInfo,
        tokenBalances,
        user,
        currentNetwork,
        gasManagerEnabled,
        gasUsageStats,
        smartAccountDeployed: walletInfo.isDeployed,
        customTokens,
        error: null
      }))

      console.log('✅ Authentication successful:', {
        provider,
        user: user.email,
        network: currentNetwork.name,
        smartAccountDeployed: walletInfo.isDeployed,
        isNewAccount: result.isNewAccount
      })

      return true
    } catch (error) {
      console.error('Authentication failed:', error)
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Authentication failed' 
      }))
      return false
    }
  }

  // Switch network
  const switchNetwork = async (networkKey: string): Promise<boolean> => {
    if (!state.isConnected) {
      setState(prev => ({ ...prev, error: 'Please connect wallet first' }))
      return false
    }

    setState(prev => ({ ...prev, isNetworkSwitching: true, error: null }))
    
    try {
      // Switch network in wallet service
      const walletSuccess = await alchemyWallet.switchNetwork(networkKey)
      if (!walletSuccess) {
        throw new Error('Failed to switch network in wallet')
      }

      // Switch network in gas manager
      await gasManager.switchNetwork(networkKey)
      
      // Switch network in social auth
      await socialAuth.switchNetwork(networkKey)

      // Refresh wallet data for new network
      const walletInfo = await alchemyWallet.getWalletInfo()
      const tokenBalances = await alchemyWallet.getTokenBalances()
      const currentNetwork = alchemyWallet.getCurrentNetwork()
      const customTokens = alchemyWallet.getCustomTokens()
      
      // Update gas usage stats for new network
      let gasUsageStats = null
      if (state.gasManagerEnabled && state.user) {
        gasUsageStats = gasManager.getGasUsageStats(state.user.address)
      }

      setState(prev => ({
        ...prev,
        currentNetwork,
        walletInfo,
        tokenBalances,
        customTokens,
        gasUsageStats,
        smartAccountDeployed: walletInfo?.isDeployed || false,
        isNetworkSwitching: false
      }))

      console.log('🔄 Network switched successfully:', currentNetwork.name)
      return true
    } catch (error) {
      console.error('Network switch failed:', error)
      setState(prev => ({ 
        ...prev, 
        isNetworkSwitching: false,
        error: error instanceof Error ? error.message : 'Network switch failed' 
      }))
      return false
    }
  }

  // Add custom token
  const addCustomToken = async (tokenAddress: string): Promise<CustomToken | null> => {
    try {
      const token = await alchemyWallet.addCustomToken(tokenAddress)
      
      if (token) {
        // Refresh token balances and custom tokens list
        const tokenBalances = await alchemyWallet.getTokenBalances()
        const customTokens = alchemyWallet.getCustomTokens()
        
        setState(prev => ({
          ...prev,
          tokenBalances,
          customTokens
        }))
        
        console.log('✅ Custom token added:', token.symbol)
      }
      
      return token
    } catch (error) {
      console.error('Failed to add custom token:', error)
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to add token' 
      }))
      return null
    }
  }

  // Remove custom token
  const removeCustomToken = (tokenAddress: string): boolean => {
    try {
      const success = alchemyWallet.removeCustomToken(tokenAddress)
      
      if (success) {
        // Refresh token balances and custom tokens list
        const refreshData = async () => {
          const tokenBalances = await alchemyWallet.getTokenBalances()
          const customTokens = alchemyWallet.getCustomTokens()
          
          setState(prev => ({
            ...prev,
            tokenBalances,
            customTokens
          }))
        }
        
        refreshData()
        console.log('✅ Custom token removed')
      }
      
      return success
    } catch (error) {
      console.error('Failed to remove custom token:', error)
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to remove token' 
      }))
      return false
    }
  }

  // Send native token (BNB, ETH, etc.)
  const sendNativeToken = async (to: string, amount: string): Promise<TransactionResult> => {
    if (!state.isConnected) {
      return { success: false, error: 'Wallet not connected' }
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await alchemyWallet.sendNativeToken(to, amount)
      
      if (result.success && state.user && result.gasFee) {
        // Record gas usage for tracking
        await gasManager.recordGasUsage(
          state.user.address, 
          result.gasUsed || '0', 
          result.gasFee
        )
        
        // Refresh balances and gas stats
        await refreshWalletData()
      }
      
      setState(prev => ({ ...prev, isLoading: false }))
      return result
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }))
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Transaction failed' 
      }
    }
  }

  // Send token (ERC20/BEP20)
  const sendToken = async (options: SendTokenOptions): Promise<TransactionResult> => {
    if (!state.isConnected) {
      return { success: false, error: 'Wallet not connected' }
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await alchemyWallet.sendToken(options)
      
      if (result.success && state.user && result.gasFee) {
        // Record gas usage for tracking
        await gasManager.recordGasUsage(
          state.user.address, 
          result.gasUsed || '0', 
          result.gasFee
        )
        
        // Refresh balances and gas stats
        await refreshWalletData()
      }
      
      setState(prev => ({ ...prev, isLoading: false }))
      return result
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }))
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Transaction failed' 
      }
    }
  }

  // Get gas estimate
  const getGasEstimate = async (
    to: string, 
    amount?: string, 
    tokenAddress?: string
  ): Promise<GasEstimateResponse | null> => {
    if (!state.user || !state.currentNetwork) {
      return null
    }

    try {
      const request = {
        from: state.user.address,
        to,
        value: amount || '0',
        chainId: state.currentNetwork.chainId,
        operation: tokenAddress ? 'token_transfer' : 'transfer'
      }

      return await gasManager.estimateGas(request)
    } catch (error) {
      console.error('Failed to get gas estimate:', error)
      return null
    }
  }

  // Check gas sponsorship eligibility
  const checkGasSponsorship = async (
    to: string, 
    amount?: string, 
    tokenAddress?: string
  ): Promise<SponsorshipEligibility | null> => {
    if (!state.user || !state.currentNetwork) {
      return null
    }

    try {
      const request = {
        from: state.user.address,
        to,
        value: amount || '0',
        chainId: state.currentNetwork.chainId,
        operation: tokenAddress ? 'token_transfer' : 'transfer'
      }

      return await gasManager.checkSponsorshipEligibility(request)
    } catch (error) {
      console.error('Failed to check gas sponsorship:', error)
      return null
    }
  }

  // Get gas optimization suggestions
  const getGasOptimizations = async (
    to: string, 
    amount?: string, 
    tokenAddress?: string
  ): Promise<GasOptimization | null> => {
    if (!state.user || !state.currentNetwork) {
      return null
    }

    try {
      const request = {
        from: state.user.address,
        to,
        value: amount || '0',
        chainId: state.currentNetwork.chainId,
        operation: tokenAddress ? 'token_transfer' : 'transfer'
      }

      return await gasManager.getGasOptimizations(request)
    } catch (error) {
      console.error('Failed to get gas optimizations:', error)
      return null
    }
  }

  // Refresh wallet data
  const refreshWalletData = async (): Promise<void> => {
    if (!state.isConnected) return

    try {
      const [walletInfo, tokenBalances] = await Promise.all([
        alchemyWallet.getWalletInfo(),
        alchemyWallet.getTokenBalances()
      ])

      let gasUsageStats = null
      if (state.gasManagerEnabled && state.user) {
        gasUsageStats = gasManager.getGasUsageStats(state.user.address)
      }

      const customTokens = alchemyWallet.getCustomTokens()

      setState(prev => ({
        ...prev,
        walletInfo,
        tokenBalances,
        gasUsageStats,
        customTokens,
        smartAccountDeployed: walletInfo?.isDeployed || false
      }))
    } catch (error) {
      console.error('Failed to refresh wallet data:', error)
    }
  }

  // Logout
  const logout = async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }))
      
      await socialAuth.logout()
      
      setState({
        isConnected: false,
        isLoading: false,
        walletInfo: null,
        tokenBalances: [],
        user: null,
        error: null,
        currentNetwork: alchemyWallet.getCurrentNetwork(),
        supportedNetworks: alchemyWallet.getSupportedNetworks(),
        gasUsageStats: null,
        gasManagerEnabled: false,
        smartAccountDeployed: false,
        isDeploying: false,
        isNetworkSwitching: false,
        customTokens: [],
      })
      
      console.log('✅ Logout successful')
    } catch (error) {
      console.error('Logout failed:', error)
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Logout failed' 
      }))
    }
  }

  // Clear error
  const clearError = () => {
    setState(prev => ({ ...prev, error: null }))
  }

  return {
    // State
    ...state,
    
    // Actions
    authenticateWithGoogle: () => authenticateWithSocial('google'),
    authenticateWithFacebook: () => authenticateWithSocial('facebook'),
    authenticateWithEmail: (email: string) => authenticateWithSocial('email', email),
    switchNetwork,
    addCustomToken,
    removeCustomToken,
    sendNativeToken,
    sendToken,
    getGasEstimate,
    checkGasSponsorship,
    getGasOptimizations,
    refreshWalletData,
    logout,
    clearError,
    
    // Computed values
    isConnected: state.isConnected,
    hasCustomTokens: state.customTokens.length > 0,
    isPrimaryNetwork: state.currentNetwork?.chainId === 56, // BNB mainnet
    networkName: state.currentNetwork?.name || 'Unknown',
    networkSymbol: state.currentNetwork?.symbol || 'ETH',
    explorerUrl: state.currentNetwork?.explorer || '',
  }
}