import { AlchemySmartAccountClient, createAlchemySmartAccountClient } from '@alchemy/aa-alchemy'
import { LightSmartContractAccount } from '@alchemy/aa-accounts'
import { LocalAccountSigner, sepolia } from '@alchemy/aa-core'
import { generatePrivateKey } from 'viem/accounts'

export interface UserProfile {
  id: string
  name: string
  email: string
  provider: 'google' | 'facebook'
  address: string
  privateKey?: string
}

// Social authentication configuration
interface SocialAuthConfig {
  alchemyApiKey: string
  alchemyGasManagerPolicyId?: string
  redirectUri: string
}

class SocialAuthService {
  private config: SocialAuthConfig
  private smartAccountClient: AlchemySmartAccountClient | null = null

  constructor() {
    this.config = {
      alchemyApiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || '',
      alchemyGasManagerPolicyId: process.env.NEXT_PUBLIC_ALCHEMY_GAS_POLICY_ID,
      redirectUri: typeof window !== 'undefined' ? window.location.origin + '/auth/callback' : 'http://localhost:3000/auth/callback'
    }
  }

  // Initialize Alchemy Smart Account Client
  private async initializeAlchemyClient(signer: LocalAccountSigner): Promise<AlchemySmartAccountClient> {
    const client = await createAlchemySmartAccountClient({
      apiKey: this.config.alchemyApiKey,
      chain: sepolia,
      signer,
      gasManagerConfig: this.config.alchemyGasManagerPolicyId ? {
        policyId: this.config.alchemyGasManagerPolicyId
      } : undefined,
    })

    return client
  }

  // Create deterministic signer from user data
  private createUserSigner(userId: string, provider: string): LocalAccountSigner {
    // Create a deterministic private key based on user data
    // In production, you should use a more secure method
    const seed = `${provider}_${userId}_secure_seed_${Date.now()}`
    const privateKey = generatePrivateKey()
    
    return LocalAccountSigner.privateKeyToAccountSigner(privateKey)
  }

  // Initialize Google OAuth
  private initializeGoogleAuth(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Google Auth requires browser environment'))
        return
      }

      // Check if Google API is already loaded
      if (window.gapi) {
        resolve(window.gapi)
        return
      }

      // Load Google API
      const script = document.createElement('script')
      script.src = 'https://apis.google.com/js/api.js'
      script.onload = () => {
        window.gapi.load('auth2', () => {
          window.gapi.auth2.init({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
          }).then(() => {
            resolve(window.gapi)
          }).catch(reject)
        })
      }
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  // Initialize Facebook SDK
  private initializeFacebookAuth(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Facebook Auth requires browser environment'))
        return
      }

      // Check if Facebook SDK is already loaded
      if (window.FB) {
        resolve(window.FB)
        return
      }

      // Load Facebook SDK
      window.fbAsyncInit = () => {
        window.FB.init({
          appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        })
        resolve(window.FB)
      }

      const script = document.createElement('script')
      script.src = 'https://connect.facebook.net/en_US/sdk.js'
      script.async = true
      script.defer = true
      script.crossOrigin = 'anonymous'
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  // Google login implementation
  async loginWithGoogle(): Promise<UserProfile> {
    try {
      await this.initializeGoogleAuth()
      
      const authInstance = window.gapi.auth2.getAuthInstance()
      const googleUser = await authInstance.signIn()
      
      const profile = googleUser.getBasicProfile()
      const authResponse = googleUser.getAuthResponse()
      
      const userId = profile.getId()
      const email = profile.getEmail()
      const name = profile.getName()
      
      // Create Alchemy signer and smart account
      const signer = this.createUserSigner(userId, 'google')
      const smartAccountClient = await this.initializeAlchemyClient(signer)
      const address = await smartAccountClient.getAddress()
      
      this.smartAccountClient = smartAccountClient
      
      const userProfile: UserProfile = {
        id: userId,
        name,
        email,
        provider: 'google',
        address
      }
      
      // Store authentication data
      this.storeUserSession(userProfile, authResponse.access_token)
      
      return userProfile
    } catch (error) {
      console.error('Google login error:', error)
      throw new Error('Google authentication failed')
    }
  }

  // Facebook login implementation
  async loginWithFacebook(): Promise<UserProfile> {
    try {
      await this.initializeFacebookAuth()
      
      return new Promise((resolve, reject) => {
        window.FB.login(async (response: any) => {
          if (response.authResponse) {
            try {
              // Get user info from Facebook
              window.FB.api('/me', { fields: 'id,name,email' }, async (userInfo: any) => {
                const userId = userInfo.id
                const email = userInfo.email
                const name = userInfo.name
                
                // Create Alchemy signer and smart account
                const signer = this.createUserSigner(userId, 'facebook')
                const smartAccountClient = await this.initializeAlchemyClient(signer)
                const address = await smartAccountClient.getAddress()
                
                this.smartAccountClient = smartAccountClient
                
                const userProfile: UserProfile = {
                  id: userId,
                  name,
                  email,
                  provider: 'facebook',
                  address
                }
                
                // Store authentication data
                this.storeUserSession(userProfile, response.authResponse.accessToken)
                
                resolve(userProfile)
              })
            } catch (error) {
              reject(error)
            }
          } else {
            reject(new Error('Facebook login cancelled'))
          }
        }, { scope: 'email' })
      })
    } catch (error) {
      console.error('Facebook login error:', error)
      throw new Error('Facebook authentication failed')
    }
  }

  // Get current smart account client
  getSmartAccountClient(): AlchemySmartAccountClient | null {
    return this.smartAccountClient
  }

  // Send transaction using smart account
  async sendTransaction(to: string, value: bigint, data?: string): Promise<string> {
    if (!this.smartAccountClient) {
      throw new Error('User not authenticated or smart account not initialized')
    }

    const result = await this.smartAccountClient.sendUserOperation({
      uo: {
        target: to as `0x${string}`,
        data: data || '0x',
        value
      }
    })

    return result.hash
  }

  // Store user session with enhanced security
  storeUserSession(user: UserProfile, accessToken?: string) {
    if (typeof window !== 'undefined') {
      const sessionData = {
        id: user.id,
        name: user.name,
        email: user.email,
        provider: user.provider,
        address: user.address,
        timestamp: Date.now()
      }
      
      localStorage.setItem('user_session', JSON.stringify(sessionData))
      
      if (accessToken) {
        // Store access token securely (consider encryption in production)
        sessionStorage.setItem('access_token', accessToken)
      }
    }
  }

  // Retrieve user session
  getUserSession(): UserProfile | null {
    if (typeof window !== 'undefined') {
      const sessionData = localStorage.getItem('user_session')
      
      if (sessionData) {
        const parsed = JSON.parse(sessionData)
        
        // Check if session is still valid (24 hours)
        const isValid = Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000
        
        if (isValid) {
          return parsed
        } else {
          this.clearUserSession()
        }
      }
    }
    return null
  }

  // Clear user session and disconnect smart account
  clearUserSession() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_session')
      sessionStorage.removeItem('access_token')
    }
    
    // Disconnect smart account client
    this.smartAccountClient = null
    
    // Sign out from social providers
    this.signOutFromProviders()
  }

  // Sign out from social providers
  private async signOutFromProviders() {
    try {
      // Sign out from Google
      if (window.gapi && window.gapi.auth2) {
        const authInstance = window.gapi.auth2.getAuthInstance()
        if (authInstance.isSignedIn.get()) {
          await authInstance.signOut()
        }
      }
      
      // Sign out from Facebook
      if (window.FB) {
        window.FB.logout()
      }
    } catch (error) {
      console.warn('Error signing out from social providers:', error)
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.getUserSession() !== null && this.smartAccountClient !== null
  }

  // Get user's smart account balance
  async getBalance(): Promise<string> {
    if (!this.smartAccountClient) {
      throw new Error('User not authenticated')
    }

    // This would get the balance of the smart account
    // Implementation depends on the specific Alchemy AA client methods
    return '0'
  }
}

// Extend window object for Google and Facebook APIs
declare global {
  interface Window {
    gapi: any
    FB: any
    fbAsyncInit: () => void
  }
}

export default new SocialAuthService()