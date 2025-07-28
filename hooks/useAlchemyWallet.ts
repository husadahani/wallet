import { useState, useEffect } from 'react'
import alchemyWallet, { WalletInfo, TokenBalance, TransactionResult, NetworkConfig } from '../services/alchemyWallet'
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
      const walletInfo = await alchemyWallet.initializeWallet(user.privateKey)
      const tokenBalances = await alchemyWallet.getTokenBalances()
      
      setState(prev => ({
        ...prev,
        isConnected: true,
        isLoading: false,
        walletInfo,
        tokenBalances,
        user,
        currentNetwork: walletInfo.network,
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
        const walletInfo = await alchemyWallet.initializeWallet(state.user.privateKey)
        const tokenBalances = await alchemyWallet.getTokenBalances()
        
        setState(prev => ({
          ...prev,
          isLoading: false,
          walletInfo,
          tokenBalances,
          currentNetwork: walletInfo.network,
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
    alchemyWallet.disconnect()
    setState({
      isConnected: false,
      isLoading: false,
      walletInfo: null,
      tokenBalances: [],
      user: null,
      error: null,
      currentNetwork: null,
      supportedNetworks: alchemyWallet.getSupportedNetworks(),
    })
  }

  const refreshBalance = async () => {
    if (!state.isConnected) return
    
    try {
      const balance = await alchemyWallet.getBalance()
      const tokenBalances = await alchemyWallet.getTokenBalances()
      
      setState(prev => ({
        ...prev,
        walletInfo: prev.walletInfo ? { ...prev.walletInfo, balance } : null,
        tokenBalances,
      }))
    } catch (error) {
      console.error('Failed to refresh balance:', error)
    }
  }

  const sendNativeToken = async (to: string, amount: string): Promise<TransactionResult> => {
    if (!state.isConnected) {
      throw new Error('Wallet not connected')
    }
    
    try {
      const result = await alchemyWallet.sendNativeToken(to, amount)
      if (result.success) {
        // Refresh balance after successful transaction
        await refreshBalance()
      }
      return result
    } catch (error) {
      throw error
    }
  }

  const sendToken = async (
    tokenAddress: string,
    to: string,
    amount: string,
    decimals: number = 18
  ): Promise<TransactionResult> => {
    if (!state.isConnected) {
      throw new Error('Wallet not connected')
    }
    
    try {
      const result = await alchemyWallet.sendToken(
        tokenAddress,
        to,
        amount,
        decimals
      )
      if (result.success) {
        // Refresh balance after successful transaction
        await refreshBalance()
      }
      return result
    } catch (error) {
      throw error
    }
  }

  return {
    ...state,
    loginWithGoogle,
    loginWithFacebook,
    logout,
    switchNetwork,
    refreshBalance,
    sendNativeToken,
    sendToken,
  }
}