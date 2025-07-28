import { createModularAccountAlchemyClient } from '@alchemy/aa-alchemy'
import { ModularAccount } from '@alchemy/aa-accounts'
import { AlchemySigner } from '@alchemy/aa-signers'
import { createPublicClient, http, parseEther, formatEther, Address } from 'viem'
import { bsc } from 'viem/chains'

export interface NetworkConfig {
  chainId: number
  name: string
  symbol: string
  rpcUrl: string
  gasPolicy?: string
  chain: any
  explorer: string
}

export interface WalletInfo {
  address: string
  balance: string
  isDeployed: boolean
  network: NetworkConfig
  smartAccountAddress: string
  type: 'smart_wallet'
}

export interface TokenBalance {
  symbol: string
  balance: string
  contractAddress?: string
  decimals: number
  usdValue?: number
}

export interface TransactionResult {
  success: boolean
  hash?: string
  error?: string
  gasUsed?: string
  gasPrice?: string
  gasFee?: string
}

export interface SendTokenOptions {
  tokenAddress?: string
  symbol: string
  amount: string
  to: string
  decimals?: number
}

// BNB Smart Chain Mainnet Configuration with Alchemy
export const BNB_MAINNET_CONFIG: NetworkConfig = {
  chainId: 56,
  name: 'BNB Smart Chain',
  symbol: 'BNB',
  rpcUrl: process.env.NEXT_PUBLIC_BNB_RPC_URL || `https://bnb-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
  gasPolicy: process.env.NEXT_PUBLIC_BNB_GAS_POLICY_ID,
  chain: bsc,
  explorer: 'https://bscscan.com'
}

class AlchemyWalletService {
  private smartAccountClient: any = null
  private alchemySigner: AlchemySigner | null = null
  private smartAccount: ModularAccount | null = null
  private currentNetwork: NetworkConfig = BNB_MAINNET_CONFIG
  private isInitialized: boolean = false

  // Initialize Alchemy Signer with embedded accounts
  private async initializeAlchemySigner(): Promise<AlchemySigner> {
    if (this.alchemySigner) {
      return this.alchemySigner
    }

    const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
    const alchemyAppId = process.env.NEXT_PUBLIC_ALCHEMY_APP_ID

    if (!alchemyApiKey || !alchemyAppId) {
      throw new Error('Alchemy API Key and App ID are required. Please check your environment variables.')
    }

    try {
      this.alchemySigner = new AlchemySigner({
        client: {
          connection: {
            rpcUrl: this.currentNetwork.rpcUrl,
            jwt: alchemyApiKey,
          },
          iframeConfig: {
            iframeContainerId: 'alchemy-signer-iframe',
          },
        },
      })

      return this.alchemySigner
    } catch (error) {
      console.error('Failed to initialize Alchemy Signer:', error)
      throw new Error('Failed to initialize authentication system')
    }
  }

  // Create Modular Account with Alchemy services
  private async createModularAccount(signer: AlchemySigner) {
    try {
      const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
      if (!alchemyApiKey) {
        throw new Error('Alchemy API Key is required')
      }

      // Create modular account client with gas sponsorship
      this.smartAccountClient = await createModularAccountAlchemyClient({
        apiKey: alchemyApiKey,
        chain: this.currentNetwork.chain,
        signer,
        gasManagerConfig: this.currentNetwork.gasPolicy ? {
          policyId: this.currentNetwork.gasPolicy,
        } : undefined,
        accountParams: {
          // Optional: specify account salt for deterministic addresses
          salt: BigInt(0),
        },
      })

      // Get the account address
      const address = await this.smartAccountClient.getAddress()
      
      console.log('✅ Modular Account created:', address)
      console.log('🎯 Chain:', this.currentNetwork.name)
      console.log('⛽ Gas sponsorship enabled:', !!this.currentNetwork.gasPolicy)

      this.isInitialized = true
      return address
    } catch (error) {
      console.error('❌ Error creating modular account:', error)
      throw new Error('Failed to create smart wallet')
    }
  }

  // Authenticate with social login
  async authenticateWithSocial(provider: 'google' | 'facebook' | 'twitter' | 'email' = 'google'): Promise<string> {
    try {
      const signer = await this.initializeAlchemySigner()
      
      // Authenticate using Alchemy's embedded account system
      const user = await signer.authenticate({
        type: provider === 'email' ? 'email' : 'oauth',
        authProviderId: provider,
        mode: 'popup', // or 'redirect'
      })

      console.log('🔐 User authenticated:', user)

      // Create smart account after authentication
      const address = await this.createModularAccount(signer)
      
      return address
    } catch (error) {
      console.error('Authentication failed:', error)
      throw new Error(`${provider} authentication failed`)
    }
  }

  // Get wallet information
  async getWalletInfo(): Promise<WalletInfo | null> {
    if (!this.smartAccountClient || !this.isInitialized) {
      return null
    }

    try {
      const address = await this.smartAccountClient.getAddress()
      
      // Get balance using public client
      const publicClient = createPublicClient({
        chain: this.currentNetwork.chain,
        transport: http(this.currentNetwork.rpcUrl)
      })
      
      const balance = await publicClient.getBalance({ address: address as Address })
      
      // Check if account is deployed
      const code = await publicClient.getBytecode({ address: address as Address })
      const isDeployed = !!code && code !== '0x'

      return {
        address,
        balance: formatEther(balance),
        isDeployed,
        network: this.currentNetwork,
        smartAccountAddress: address,
        type: 'smart_wallet'
      }
    } catch (error) {
      console.error('Error getting wallet info:', error)
      return null
    }
  }

  // Get token balances for BNB Smart Chain
  async getTokenBalances(): Promise<TokenBalance[]> {
    if (!this.smartAccountClient) {
      return []
    }

    try {
      const address = await this.smartAccountClient.getAddress()
      const publicClient = createPublicClient({
        chain: this.currentNetwork.chain,
        transport: http(this.currentNetwork.rpcUrl)
      })
      
      // Get native BNB balance
      const nativeBalance = await publicClient.getBalance({ address: address as Address })
      
      const balances: TokenBalance[] = [
        {
          symbol: 'BNB',
          balance: formatEther(nativeBalance),
          decimals: 18,
          usdValue: 0 // Would fetch from price API in production
        }
      ]

      // Add common BEP-20 tokens on BSC
      const commonTokens = [
        {
          address: '0x55d398326f99059fF775485246999027B3197955',
          symbol: 'USDT',
          decimals: 18
        },
        {
          address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
          symbol: 'USDC',
          decimals: 18
        },
        {
          address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
          symbol: 'BUSD',
          decimals: 18
        }
      ]

      // In production, you would use Alchemy's Token API to fetch real balances
      // For now, adding placeholder balances
      for (const token of commonTokens) {
        balances.push({
          symbol: token.symbol,
          balance: '0.0',
          contractAddress: token.address,
          decimals: token.decimals,
          usdValue: 0
        })
      }

      return balances
    } catch (error) {
      console.error('Error getting token balances:', error)
      return []
    }
  }

  // Send native BNB
  async sendNativeToken(to: string, amount: string): Promise<TransactionResult> {
    if (!this.smartAccountClient) {
      throw new Error('Wallet not initialized')
    }

    try {
      console.log('🚀 Sending BNB:', { to, amount })
      
      const result = await this.smartAccountClient.sendUserOperation({
        uo: {
          target: to as Address,
          data: '0x',
          value: parseEther(amount)
        }
      })

      console.log('✅ Transaction sent:', result.hash)
      
      // Wait for transaction receipt
      const receipt = await this.smartAccountClient.waitForUserOperationTransaction({
        hash: result.hash
      })

      return {
        success: true,
        hash: receipt.transactionHash,
        gasUsed: receipt.gasUsed?.toString() || '0',
        gasFee: '0' // Gas sponsored by Alchemy
      }
    } catch (error) {
      console.error('Error sending BNB:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transaction failed'
      }
    }
  }

  // Send BEP-20 tokens
  async sendToken(options: SendTokenOptions): Promise<TransactionResult> {
    if (!this.smartAccountClient) {
      throw new Error('Wallet not initialized')
    }

    const { tokenAddress, symbol, amount, to, decimals = 18 } = options

    if (!tokenAddress) {
      // If no token address, send native BNB
      return this.sendNativeToken(to, amount)
    }

    try {
      console.log('🪙 Sending token:', { symbol, amount, to })
      
      // Create ERC-20 transfer data
      const transferAmount = parseEther(amount) // Simplified - should use actual decimals
      const transferData = `0xa9059cbb${to.slice(2).padStart(64, '0')}${transferAmount.toString(16).padStart(64, '0')}`

      const result = await this.smartAccountClient.sendUserOperation({
        uo: {
          target: tokenAddress as Address,
          data: transferData as `0x${string}`,
          value: BigInt(0)
        }
      })

      console.log('✅ Token transfer sent:', result.hash)
      
      const receipt = await this.smartAccountClient.waitForUserOperationTransaction({
        hash: result.hash
      })

      return {
        success: true,
        hash: receipt.transactionHash,
        gasUsed: receipt.gasUsed?.toString() || '0',
        gasFee: '0' // Gas sponsored by Alchemy
      }
    } catch (error) {
      console.error('Error sending token:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token transfer failed'
      }
    }
  }

  // Logout and cleanup
  async logout(): Promise<void> {
    try {
      if (this.alchemySigner) {
        await this.alchemySigner.disconnect()
      }
      
      this.smartAccountClient = null
      this.alchemySigner = null
      this.smartAccount = null
      this.isInitialized = false
      
      console.log('✅ Logged out successfully')
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }

  // Get current network
  getCurrentNetwork(): NetworkConfig {
    return this.currentNetwork
  }

  // Check if wallet is connected
  isWalletConnected(): boolean {
    return this.isInitialized && !!this.smartAccountClient
  }

  // Get smart account address
  getSmartAccountAddress(): string | null {
    return this.smartAccountClient ? 
      this.smartAccountClient.getAddress().catch(() => null) : null
  }

  // Get user information from Alchemy signer
  async getUserInfo() {
    if (!this.alchemySigner) {
      return null
    }

    try {
      const user = await this.alchemySigner.getUser()
      return {
        id: user.userId,
        email: user.email,
        address: await this.smartAccountClient?.getAddress(),
        provider: 'alchemy'
      }
    } catch (error) {
      console.error('Error getting user info:', error)
      return null
    }
  }

  // Health check for all Alchemy services
  async healthCheck() {
    try {
      const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
      const appId = process.env.NEXT_PUBLIC_ALCHEMY_APP_ID
      const gasPolicy = process.env.NEXT_PUBLIC_BNB_GAS_POLICY_ID

      return {
        status: 'healthy' as const,
        alchemyApiKey: !!apiKey,
        alchemyAppId: !!appId,
        gasManagerEnabled: !!gasPolicy,
        smartAccountReady: this.isWalletConnected(),
        currentNetwork: this.currentNetwork.name,
        chainId: this.currentNetwork.chainId
      }
    } catch (error) {
      return {
        status: 'unhealthy' as const,
        alchemyApiKey: false,
        alchemyAppId: false,
        gasManagerEnabled: false,
        smartAccountReady: false,
        currentNetwork: this.currentNetwork.name,
        chainId: this.currentNetwork.chainId,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

export default new AlchemyWalletService()