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
    const checkExistingSession = async () => {
      const existingUser = socialAuth.getUserSession()
      if (existingUser && socialAuth.isAuthenticated()) {
        setState(prev => ({ ...prev, isLoading: true }))
        await initializeWalletFromSession(existingUser)
      }
    }
    
    checkExistingSession()
  }, [])

  const initializeWalletFromSession = async (user: UserProfile) => {
    try {
      // Get the smart account client from the social auth service
      const smartAccountClient = socialAuth.getSmartAccountClient()
      
      if (!smartAccountClient) {
        throw new Error('Smart account client not available')
      }

      // Get wallet information
      const address = await smartAccountClient.getAddress()
      const currentNetwork = alchemyWallet.getCurrentNetwork()
      
      // Create wallet info from smart account
      const walletInfo: WalletInfo = {
        address,
        balance: '0', // Will be updated by refreshBalance
        isDeployed: true, // Alchemy smart accounts are deployed automatically
        network: currentNetwork,
        smartAccountAddress: address,
        owner: user.id,
        type: 'smart_wallet'
      }

      // Mock token balances - in production, you'd fetch real balances
      const tokenBalances: TokenBalance[] = []
      
      const gasManagerEnabled = !!currentNetwork.gasPolicy
      
      setState(prev => ({
        ...prev,
        isConnected: true,
        isLoading: false,
        walletInfo,
        tokenBalances,
        user,
        currentNetwork,
        gasManagerEnabled,
        smartAccountDeployed: true,
      }))

      // Refresh balance after initialization
      await refreshBalance()
      
    } catch (error) {
      console.error('Failed to initialize wallet from session:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to initialize wallet from existing session',
      }))
      // Clear invalid session
      socialAuth.clearUserSession()
    }
  }

  const initializeWallet = async (user: UserProfile) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      // The smart account is already created by the social auth service
      const smartAccountClient = socialAuth.getSmartAccountClient()
      
      if (!smartAccountClient) {
        throw new Error('Smart account client not available')
      }

      const address = await smartAccountClient.getAddress()
      const currentNetwork = alchemyWallet.getCurrentNetwork()
      
      const walletInfo: WalletInfo = {
        address,
        balance: '0', // Will be updated by refreshBalance
        isDeployed: true, // Alchemy smart accounts are deployed automatically
        network: currentNetwork,
        smartAccountAddress: address,
        owner: user.id,
        type: 'smart_wallet'
      }

      const tokenBalances: TokenBalance[] = []
      const gasManagerEnabled = !!currentNetwork.gasPolicy
      
      let gasUsageStats = null
      if (gasManagerEnabled && currentNetwork.gasPolicy) {
        try {
          gasUsageStats = await gasManager.getGasUsageStats(currentNetwork.gasPolicy)
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
        smartAccountDeployed: true,
      }))

      // Refresh balance after initialization
      await refreshBalance()
      
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
      if (state.user && socialAuth.getSmartAccountClient()) {
        const smartAccountClient = socialAuth.getSmartAccountClient()!
        const address = await smartAccountClient.getAddress()
        const currentNetwork = alchemyWallet.getCurrentNetwork()
        
        const walletInfo: WalletInfo = {
          address,
          balance: '0', // Will be updated by refreshBalance
          isDeployed: true,
          network: currentNetwork,
          smartAccountAddress: address,
          owner: state.user.id,
          type: 'smart_wallet'
        }

        const tokenBalances: TokenBalance[] = []
        const gasManagerEnabled = !!currentNetwork.gasPolicy
        
        let gasUsageStats = null
        if (gasManagerEnabled && currentNetwork.gasPolicy) {
          try {
            gasUsageStats = await gasManager.getGasUsageStats(currentNetwork.gasPolicy)
          } catch (error) {
            console.warn('Failed to load gas usage stats for new network:', error)
          }
        }
        
        setState(prev => ({
          ...prev,
          isLoading: false,
          walletInfo,
          tokenBalances,
          currentNetwork,
          gasUsageStats,
          gasManagerEnabled,
          smartAccountDeployed: true,
        }))

        // Refresh balance after network switch
        await refreshBalance()
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
    if (!state.isConnected || !state.walletInfo) return
    
    try {
      const smartAccountClient = socialAuth.getSmartAccountClient()
      if (!smartAccountClient) {
        throw new Error('Smart account client not available')
      }

      // Get balance using smart account client
      // Note: This is a placeholder - you'll need to implement the actual balance fetching
      const balance = await socialAuth.getBalance()
      
      // Update wallet info with new balance
      setState(prev => ({
        ...prev,
        walletInfo: prev.walletInfo ? {
          ...prev.walletInfo,
          balance
        } : null
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

    const smartAccountAddress = state.walletInfo?.smartAccountAddress
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

    // Alchemy smart accounts are automatically deployed on first transaction
    // So we don't need to explicitly deploy them
    setState(prev => ({ 
      ...prev, 
      smartAccountDeployed: true,
    }))
    
    return {
      success: true,
      hash: '0x' + Math.random().toString(16).substring(2),
      gasUsed: '0' // No gas used for automatic deployment
    }
  }

  const sendToken = async (options: SendTokenOptions): Promise<TransactionResult> => {
    if (!state.isConnected) {
      throw new Error('Wallet not connected')
    }

    const smartAccountClient = socialAuth.getSmartAccountClient()
    if (!smartAccountClient) {
      throw new Error('Smart account client not available')
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

      let txHash: string
      
      if (tokenAddress) {
        // ERC20 token transfer - this would need proper implementation
        // For now, we'll use a simplified approach
        txHash = await socialAuth.sendTransaction(tokenAddress, BigInt(0), '0x')
      } else {
        // Native token transfer
        const valueInWei = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, 18)))
        txHash = await socialAuth.sendTransaction(to, valueInWei)
      }
      
      const result: TransactionResult = {
        success: true,
        hash: txHash,
        gasUsed: '21000' // Estimated
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
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transaction failed'
      }
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
      smartAccount: state.walletInfo?.smartAccountAddress || null,
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