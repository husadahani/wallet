import alchemyWallet from './alchemyWallet'

export interface UserProfile {
  id: string
  name: string
  email: string
  provider: 'google' | 'facebook' | 'twitter' | 'email' | 'alchemy'
  address: string
}

export interface AuthenticationResult {
  success: boolean
  user?: UserProfile
  error?: string
}

class SocialAuthService {
  private currentUser: UserProfile | null = null

  // Authenticate with Google using Alchemy Embedded Accounts
  async loginWithGoogle(): Promise<UserProfile> {
    try {
      console.log('🔐 Starting Google authentication with Alchemy...')
      
      const address = await alchemyWallet.authenticateWithSocial('google')
      const userInfo = await alchemyWallet.getUserInfo()
      
      if (!userInfo) {
        throw new Error('Failed to get user information after authentication')
      }

      const userProfile: UserProfile = {
        id: userInfo.id || 'google_user',
        name: userInfo.email?.split('@')[0] || 'Google User',
        email: userInfo.email || '',
        provider: 'google',
        address: address
      }
      
      this.currentUser = userProfile
      this.storeUserSession(userProfile)
      
      console.log('✅ Google authentication successful:', userProfile)
      return userProfile
    } catch (error) {
      console.error('❌ Google authentication failed:', error)
      throw new Error('Google authentication failed')
    }
  }

  // Authenticate with Facebook using Alchemy Embedded Accounts
  async loginWithFacebook(): Promise<UserProfile> {
    try {
      console.log('🔐 Starting Facebook authentication with Alchemy...')
      
      const address = await alchemyWallet.authenticateWithSocial('facebook')
      const userInfo = await alchemyWallet.getUserInfo()
      
      if (!userInfo) {
        throw new Error('Failed to get user information after authentication')
      }

      const userProfile: UserProfile = {
        id: userInfo.id || 'facebook_user',
        name: userInfo.email?.split('@')[0] || 'Facebook User',
        email: userInfo.email || '',
        provider: 'facebook',
        address: address
      }
      
      this.currentUser = userProfile
      this.storeUserSession(userProfile)
      
      console.log('✅ Facebook authentication successful:', userProfile)
      return userProfile
    } catch (error) {
      console.error('❌ Facebook authentication failed:', error)
      throw new Error('Facebook authentication failed')
    }
  }

  // Authenticate with Twitter using Alchemy Embedded Accounts
  async loginWithTwitter(): Promise<UserProfile> {
    try {
      console.log('🔐 Starting Twitter authentication with Alchemy...')
      
      const address = await alchemyWallet.authenticateWithSocial('twitter')
      const userInfo = await alchemyWallet.getUserInfo()
      
      if (!userInfo) {
        throw new Error('Failed to get user information after authentication')
      }

      const userProfile: UserProfile = {
        id: userInfo.id || 'twitter_user',
        name: userInfo.email?.split('@')[0] || 'Twitter User',
        email: userInfo.email || '',
        provider: 'twitter',
        address: address
      }
      
      this.currentUser = userProfile
      this.storeUserSession(userProfile)
      
      console.log('✅ Twitter authentication successful:', userProfile)
      return userProfile
    } catch (error) {
      console.error('❌ Twitter authentication failed:', error)
      throw new Error('Twitter authentication failed')
    }
  }

  // Authenticate with Email using Alchemy Embedded Accounts
  async loginWithEmail(): Promise<UserProfile> {
    try {
      console.log('🔐 Starting Email authentication with Alchemy...')
      
      const address = await alchemyWallet.authenticateWithSocial('email')
      const userInfo = await alchemyWallet.getUserInfo()
      
      if (!userInfo) {
        throw new Error('Failed to get user information after authentication')
      }

      const userProfile: UserProfile = {
        id: userInfo.id || 'email_user',
        name: userInfo.email?.split('@')[0] || 'Email User',
        email: userInfo.email || '',
        provider: 'email',
        address: address
      }
      
      this.currentUser = userProfile
      this.storeUserSession(userProfile)
      
      console.log('✅ Email authentication successful:', userProfile)
      return userProfile
    } catch (error) {
      console.error('❌ Email authentication failed:', error)
      throw new Error('Email authentication failed')
    }
  }

  // Store user session securely
  private storeUserSession(user: UserProfile): void {
    if (typeof window !== 'undefined') {
      const sessionData = {
        id: user.id,
        name: user.name,
        email: user.email,
        provider: user.provider,
        address: user.address,
        timestamp: Date.now()
      }
      
      localStorage.setItem('alchemy_user_session', JSON.stringify(sessionData))
      console.log('💾 User session stored successfully')
    }
  }

  // Retrieve user session
  getUserSession(): UserProfile | null {
    if (typeof window !== 'undefined') {
      const sessionData = localStorage.getItem('alchemy_user_session')
      
      if (sessionData) {
        try {
          const parsed = JSON.parse(sessionData)
          
          // Check if session is still valid (24 hours)
          const isValid = Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000
          
          if (isValid) {
            this.currentUser = parsed
            return parsed
          } else {
            console.log('🕒 Session expired, clearing...')
            this.clearUserSession()
          }
        } catch (error) {
          console.error('Error parsing session data:', error)
          this.clearUserSession()
        }
      }
    }
    return null
  }

  // Get current user
  getCurrentUser(): UserProfile | null {
    return this.currentUser || this.getUserSession()
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const user = this.getCurrentUser()
    const walletConnected = alchemyWallet.isWalletConnected()
    
    return !!(user && walletConnected)
  }

  // Logout and cleanup
  async logout(): Promise<void> {
    try {
      console.log('🚪 Logging out...')
      
      // Clear current user
      this.currentUser = null
      
      // Clear session storage
      this.clearUserSession()
      
      // Logout from Alchemy wallet
      await alchemyWallet.logout()
      
      console.log('✅ Logout successful')
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }

  // Clear user session
  private clearUserSession(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('alchemy_user_session')
      sessionStorage.clear() // Clear any temporary data
    }
    this.currentUser = null
  }

  // Get user's wallet balance
  async getUserBalance(): Promise<string> {
    if (!this.isAuthenticated()) {
      throw new Error('User not authenticated')
    }

    try {
      const walletInfo = await alchemyWallet.getWalletInfo()
      return walletInfo?.balance || '0'
    } catch (error) {
      console.error('Error getting user balance:', error)
      return '0'
    }
  }

  // Get user's smart account address
  getUserAddress(): string | null {
    const user = this.getCurrentUser()
    return user?.address || null
  }

  // Refresh user session with latest data
  async refreshUserSession(): Promise<UserProfile | null> {
    if (!this.isAuthenticated()) {
      return null
    }

    try {
      const userInfo = await alchemyWallet.getUserInfo()
      const walletInfo = await alchemyWallet.getWalletInfo()
      
      if (userInfo && walletInfo && this.currentUser) {
        const updatedUser: UserProfile = {
          ...this.currentUser,
          address: walletInfo.address
        }
        
        this.currentUser = updatedUser
        this.storeUserSession(updatedUser)
        
        return updatedUser
      }
    } catch (error) {
      console.error('Error refreshing user session:', error)
    }
    
    return null
  }

  // Validate authentication status
  async validateAuth(): Promise<boolean> {
    try {
      const user = this.getCurrentUser()
      const walletConnected = alchemyWallet.isWalletConnected()
      
      if (!user || !walletConnected) {
        // Clear invalid session
        this.clearUserSession()
        return false
      }
      
      // Optionally refresh user data
      await this.refreshUserSession()
      
      return true
    } catch (error) {
      console.error('Error validating authentication:', error)
      this.clearUserSession()
      return false
    }
  }

  // Get authentication methods available
  getAvailableAuthMethods(): string[] {
    return ['google', 'facebook', 'twitter', 'email']
  }

  // Get provider-specific authentication URL (for redirect flows)
  getAuthUrl(provider: 'google' | 'facebook' | 'twitter' | 'email'): string {
    // For Alchemy embedded accounts, this is handled internally
    // Return the current domain as the auth happens in popup/iframe
    return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  }
}

export default new SocialAuthService()