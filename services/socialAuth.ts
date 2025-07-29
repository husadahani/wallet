import alchemyWallet from './alchemyWallet'

export interface UserProfile {
  id: string
  name: string
  email: string
  provider: 'google' | 'facebook' | 'twitter' | 'email' | 'alchemy'
  address: string
  smartAccountAddress: string
  network: string
  chainId: number
}

export interface AuthenticationResult {
  success: boolean
  user?: UserProfile
  error?: string
  isNewAccount?: boolean
}

class SocialAuthService {
  private currentUser: UserProfile | null = null

  // Authenticate with Google using Alchemy Embedded Accounts
  async loginWithGoogle(): Promise<UserProfile> {
    try {
      console.log('🔐 Starting Google authentication with Alchemy Embedded Accounts...')
      
      // Use Alchemy wallet service for social authentication
      const smartAccountAddress = await alchemyWallet.authenticateWithSocial('google')
      const userInfo = await alchemyWallet.getUserInfo()
      const currentNetwork = alchemyWallet.getCurrentNetwork()
      
      if (!userInfo) {
        throw new Error('Failed to get user information after authentication')
      }

      const userProfile: UserProfile = {
        id: userInfo.userId || userInfo.id || 'google_user',
        name: userInfo.name || userInfo.email?.split('@')[0] || 'Google User',
        email: userInfo.email || '',
        provider: 'google',
        address: smartAccountAddress,
        smartAccountAddress: smartAccountAddress,
        network: currentNetwork.name,
        chainId: currentNetwork.chainId
      }
      
      this.currentUser = userProfile
      this.storeUserSession(userProfile)
      
      console.log('✅ Google authentication successful:', userProfile)
      console.log('🎯 Network:', currentNetwork.name)
      console.log('💰 Smart Account:', smartAccountAddress)
      
      return userProfile
    } catch (error) {
      console.error('❌ Google authentication failed:', error)
      throw new Error('Google authentication failed')
    }
  }

  // Authenticate with Facebook using Alchemy Embedded Accounts
  async loginWithFacebook(): Promise<UserProfile> {
    try {
      console.log('🔐 Starting Facebook authentication with Alchemy Embedded Accounts...')
      
      // Use Alchemy wallet service for social authentication
      const smartAccountAddress = await alchemyWallet.authenticateWithSocial('facebook')
      const userInfo = await alchemyWallet.getUserInfo()
      const currentNetwork = alchemyWallet.getCurrentNetwork()
      
      if (!userInfo) {
        throw new Error('Failed to get user information after authentication')
      }

      const userProfile: UserProfile = {
        id: userInfo.userId || userInfo.id || 'facebook_user',
        name: userInfo.name || userInfo.email?.split('@')[0] || 'Facebook User',
        email: userInfo.email || '',
        provider: 'facebook',
        address: smartAccountAddress,
        smartAccountAddress: smartAccountAddress,
        network: currentNetwork.name,
        chainId: currentNetwork.chainId
      }
      
      this.currentUser = userProfile
      this.storeUserSession(userProfile)
      
      console.log('✅ Facebook authentication successful:', userProfile)
      console.log('🎯 Network:', currentNetwork.name)
      console.log('💰 Smart Account:', smartAccountAddress)
      
      return userProfile
    } catch (error) {
      console.error('❌ Facebook authentication failed:', error)
      throw new Error('Facebook authentication failed')
    }
  }

  // Authenticate with email using Alchemy Embedded Accounts
  async loginWithEmail(email: string): Promise<UserProfile> {
    try {
      console.log('🔐 Starting email authentication with Alchemy Embedded Accounts...')
      
      // Use Alchemy wallet service for email authentication
      const smartAccountAddress = await alchemyWallet.authenticateWithSocial('email')
      const userInfo = await alchemyWallet.getUserInfo()
      const currentNetwork = alchemyWallet.getCurrentNetwork()
      
      if (!userInfo) {
        throw new Error('Failed to get user information after authentication')
      }

      const userProfile: UserProfile = {
        id: userInfo.userId || userInfo.id || email.replace('@', '_'),
        name: userInfo.name || email.split('@')[0],
        email: email,
        provider: 'email',
        address: smartAccountAddress,
        smartAccountAddress: smartAccountAddress,
        network: currentNetwork.name,
        chainId: currentNetwork.chainId
      }
      
      this.currentUser = userProfile
      this.storeUserSession(userProfile)
      
      console.log('✅ Email authentication successful:', userProfile)
      console.log('🎯 Network:', currentNetwork.name)
      console.log('💰 Smart Account:', smartAccountAddress)
      
      return userProfile
    } catch (error) {
      console.error('❌ Email authentication failed:', error)
      throw new Error('Email authentication failed')
    }
  }

  // Generic authentication method
  async authenticate(provider: 'google' | 'facebook' | 'email', email?: string): Promise<AuthenticationResult> {
    try {
      let user: UserProfile

      switch (provider) {
        case 'google':
          user = await this.loginWithGoogle()
          break
        case 'facebook':
          user = await this.loginWithFacebook()
          break
        case 'email':
          if (!email) {
            throw new Error('Email is required for email authentication')
          }
          user = await this.loginWithEmail(email)
          break
        default:
          throw new Error(`Unsupported provider: ${provider}`)
      }

      // Check if this is a new account (smart account deployment status)
      const walletInfo = await alchemyWallet.getWalletInfo()
      const isNewAccount = walletInfo ? !walletInfo.isDeployed : true

      return {
        success: true,
        user,
        isNewAccount
      }
    } catch (error) {
      console.error(`Authentication failed for ${provider}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      }
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.currentUser && alchemyWallet.isReady()
  }

  // Get current user
  getCurrentUser(): UserProfile | null {
    return this.currentUser
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      // Clear from Alchemy wallet
      await alchemyWallet.logout()
      
      // Clear local state
      this.currentUser = null
      this.clearUserSession()
      
      console.log('✅ Logout successful')
    } catch (error) {
      console.error('❌ Logout failed:', error)
      throw new Error('Logout failed')
    }
  }

  // Store user session in localStorage
  private storeUserSession(user: UserProfile): void {
    try {
      const sessionData = {
        user,
        timestamp: Date.now(),
        chainId: user.chainId,
        network: user.network
      }
      localStorage.setItem('alchemy_user_session', JSON.stringify(sessionData))
      console.log('💾 User session stored')
    } catch (error) {
      console.warn('Failed to store user session:', error)
    }
  }

  // Restore user session from localStorage
  async restoreUserSession(): Promise<UserProfile | null> {
    try {
      const stored = localStorage.getItem('alchemy_user_session')
      if (!stored) {
        return null
      }

      const sessionData = JSON.parse(stored)
      const user = sessionData.user as UserProfile
      
      // Check if session is still valid (24 hours)
      const sessionAge = Date.now() - sessionData.timestamp
      const maxAge = 24 * 60 * 60 * 1000 // 24 hours
      
      if (sessionAge > maxAge) {
        console.log('🕰️ Session expired, clearing...')
        this.clearUserSession()
        return null
      }

      // Try to restore wallet connection
      if (alchemyWallet.isReady()) {
        this.currentUser = user
        console.log('🔄 User session restored:', user.email)
        return user
      } else {
        console.log('🔌 Wallet not ready, session invalid')
        this.clearUserSession()
        return null
      }
    } catch (error) {
      console.warn('Failed to restore user session:', error)
      this.clearUserSession()
      return null
    }
  }

  // Clear user session
  private clearUserSession(): void {
    try {
      localStorage.removeItem('alchemy_user_session')
      console.log('🗑️ User session cleared')
    } catch (error) {
      console.warn('Failed to clear user session:', error)
    }
  }

  // Get authentication status and user info
  getAuthStatus(): {
    isAuthenticated: boolean
    user: UserProfile | null
    wallet: {
      isReady: boolean
      network: string
      chainId: number
    }
  } {
    const currentNetwork = alchemyWallet.getCurrentNetwork()
    
    return {
      isAuthenticated: this.isAuthenticated(),
      user: this.currentUser,
      wallet: {
        isReady: alchemyWallet.isReady(),
        network: currentNetwork.name,
        chainId: currentNetwork.chainId
      }
    }
  }

  // Switch network for authenticated user
  async switchNetwork(networkKey: string): Promise<boolean> {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated')
      }

      const success = await alchemyWallet.switchNetwork(networkKey)
      
      if (success && this.currentUser) {
        // Update user profile with new network info
        const newNetwork = alchemyWallet.getCurrentNetwork()
        this.currentUser.network = newNetwork.name
        this.currentUser.chainId = newNetwork.chainId
        
        // Update stored session
        this.storeUserSession(this.currentUser)
        
        console.log('🔄 Network switched successfully:', newNetwork.name)
      }
      
      return success
    } catch (error) {
      console.error('Network switch failed:', error)
      return false
    }
  }

  // Health check for authentication system
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy'
    details: {
      alchemyWallet: boolean
      userAuthenticated: boolean
      sessionValid: boolean
      networkSupported: boolean
      environment: {
        googleEnabled: boolean
        facebookEnabled: boolean
        alchemyConfigured: boolean
      }
    }
  }> {
    try {
      const googleEnabled = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN === 'true'
      const facebookEnabled = process.env.NEXT_PUBLIC_ENABLE_FACEBOOK_LOGIN === 'true'
      const alchemyApiKey = !!process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
      const alchemyAppId = !!process.env.NEXT_PUBLIC_ALCHEMY_APP_ID

      const currentNetwork = alchemyWallet.getCurrentNetwork()
      const networkSupported = currentNetwork.chainId === 56 // BNB mainnet

      return {
        status: 'healthy',
        details: {
          alchemyWallet: alchemyWallet.isReady(),
          userAuthenticated: this.isAuthenticated(),
          sessionValid: !!this.currentUser,
          networkSupported,
          environment: {
            googleEnabled,
            facebookEnabled,
            alchemyConfigured: alchemyApiKey && alchemyAppId
          }
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          alchemyWallet: false,
          userAuthenticated: false,
          sessionValid: false,
          networkSupported: false,
          environment: {
            googleEnabled: false,
            facebookEnabled: false,
            alchemyConfigured: false
          }
        }
      }
    }
  }
}

const socialAuth = new SocialAuthService()
export default socialAuth