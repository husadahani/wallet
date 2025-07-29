import { createModularAccountAlchemyClient } from '@alchemy/aa-alchemy'
import { ModularAccount } from '@alchemy/aa-accounts'
import { AlchemySigner } from '@alchemy/aa-signers'
import { createPublicClient, http, parseEther, formatEther, Address, parseUnits, formatUnits } from 'viem'
import { bsc, sepolia, mainnet, polygon } from 'viem/chains'
import axios from 'axios'

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
  isCustomToken?: boolean
}

export interface CustomToken {
  address: string
  symbol: string
  decimals: number
  name: string
  logoURI?: string
  verified: boolean
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

// BNB Smart Chain Mainnet Configuration (PRIMARY NETWORK)
export const BNB_MAINNET_CONFIG: NetworkConfig = {
  chainId: 56,
  name: 'BNB Smart Chain',
  symbol: 'BNB',
  rpcUrl: process.env.NEXT_PUBLIC_BNB_RPC_URL || `https://bnb-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
  gasPolicy: process.env.NEXT_PUBLIC_BNB_MAINNET_GAS_POLICY_ID,
  chain: bsc,
  explorer: 'https://bscscan.com'
}

// Secondary networks for optional multi-chain support
export const SUPPORTED_NETWORKS: { [key: string]: NetworkConfig } = {
  bnb_mainnet: BNB_MAINNET_CONFIG,
  sepolia: {
    chainId: 11155111,
    name: 'Ethereum Sepolia',
    symbol: 'ETH',
    rpcUrl: process.env.NEXT_PUBLIC_ETH_SEPOLIA_RPC_URL || `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
    gasPolicy: process.env.NEXT_PUBLIC_ETH_SEPOLIA_GAS_POLICY_ID,
    chain: sepolia,
    explorer: 'https://sepolia.etherscan.io'
  },
  eth_mainnet: {
    chainId: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    rpcUrl: process.env.NEXT_PUBLIC_ETH_MAINNET_RPC_URL || `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
    gasPolicy: process.env.NEXT_PUBLIC_ETH_MAINNET_GAS_POLICY_ID,
    chain: mainnet,
    explorer: 'https://etherscan.io'
  },
  polygon: {
    chainId: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    rpcUrl: process.env.NEXT_PUBLIC_POLYGON_MAINNET_RPC_URL || `https://polygon-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
    gasPolicy: process.env.NEXT_PUBLIC_POLYGON_MAINNET_GAS_POLICY_ID,
    chain: polygon,
    explorer: 'https://polygonscan.com'
  }
}

class AlchemyWalletService {
  private smartAccountClient: any = null
  private alchemySigner: AlchemySigner | null = null
  private smartAccount: ModularAccount | null = null
  private currentNetwork: NetworkConfig = BNB_MAINNET_CONFIG
  private isInitialized: boolean = false
  private customTokens: CustomToken[] = []
  private userInfo: any = null

  // Initialize Alchemy Signer with embedded accounts for social login
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

  // Create Modular Account with Alchemy services and gas sponsorship
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
          // Deterministic addresses with salt
          salt: BigInt(0),
        },
      })

      // Get the account address
      const address = await this.smartAccountClient.getAddress()
      
      console.log('✅ Modular Account created:', address)
      console.log('🎯 Chain:', this.currentNetwork.name)
      console.log('⛽ Gas sponsorship enabled:', !!this.currentNetwork.gasPolicy)

      this.isInitialized = true
      
      // Check if account needs deployment and create dummy transaction if needed
      await this.ensureAccountDeployment(address)
      
      return address
    } catch (error) {
      console.error('❌ Error creating modular account:', error)
      throw new Error('Failed to create smart wallet')
    }
  }

  // Ensure smart account is deployed with dummy transaction if needed
  private async ensureAccountDeployment(address: string): Promise<void> {
    try {
      const publicClient = createPublicClient({
        chain: this.currentNetwork.chain,
        transport: http(this.currentNetwork.rpcUrl)
      })
      
      // Check if account is deployed
      const code = await publicClient.getBytecode({ address: address as Address })
      const isDeployed = !!code && code !== '0x'

      if (!isDeployed && process.env.NEXT_PUBLIC_DUMMY_TRANSACTION_ENABLED === 'true') {
        console.log('🚀 Account not deployed, creating dummy transaction...')
        
        // Create a small dummy transaction to deploy the account
        const dummyTx = await this.smartAccountClient.sendUserOperation({
          uo: {
            target: address as Address,
            data: '0x',
            value: parseEther('0.00001'), // Very small amount
          },
        })

        console.log('⏳ Dummy transaction sent:', dummyTx.hash)
        
        // Wait for transaction to be mined
        const receipt = await this.smartAccountClient.waitForUserOperationTransaction({
          hash: dummyTx.hash
        })
        
        console.log('✅ Smart account deployed with dummy transaction:', receipt.transactionHash)
      } else if (isDeployed) {
        console.log('✅ Smart account already deployed')
      }
    } catch (error) {
      console.warn('⚠️ Could not deploy smart account with dummy transaction:', error)
      // Don't throw error, deployment will happen on first transaction
    }
  }

  // Authenticate with social login (Google, Facebook)
  async authenticateWithSocial(provider: 'google' | 'facebook' | 'twitter' | 'email' = 'google'): Promise<string> {
    try {
      console.log(`🔐 Starting ${provider} authentication with Alchemy...`)
      
      const signer = await this.initializeAlchemySigner()
      
      // Authenticate using Alchemy's embedded account system
      const user = await signer.authenticate({
        type: provider === 'email' ? 'email' : 'oauth',
        authProviderId: provider,
        mode: 'popup', // or 'redirect'
      })

      console.log('🔐 User authenticated:', user)
      this.userInfo = user

      // Create smart account after authentication
      const address = await this.createModularAccount(signer)
      
      // Load user's custom tokens
      await this.loadCustomTokens()
      
      return address
    } catch (error) {
      console.error('Authentication failed:', error)
      throw new Error(`${provider} authentication failed`)
    }
  }

  // Switch to different network
  async switchNetwork(networkKey: string): Promise<boolean> {
    try {
      const network = SUPPORTED_NETWORKS[networkKey]
      if (!network) {
        throw new Error(`Unsupported network: ${networkKey}`)
      }

      this.currentNetwork = network
      
      // Reinitialize with new network
      if (this.alchemySigner) {
        this.smartAccountClient = null
        this.isInitialized = false
        
        // Recreate account client with new network
        const address = await this.createModularAccount(this.alchemySigner)
        console.log('🔄 Switched to network:', network.name)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Network switch failed:', error)
      return false
    }
  }

  // Get current network info
  getCurrentNetwork(): NetworkConfig {
    return this.currentNetwork
  }

  // Get supported networks
  getSupportedNetworks(): { [key: string]: NetworkConfig } {
    return SUPPORTED_NETWORKS
  }

  // Get user information
  getUserInfo(): any {
    return this.userInfo
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

  // Get token balances including custom tokens
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
      
      // Get native token balance
      const nativeBalance = await publicClient.getBalance({ address: address as Address })
      
      const balances: TokenBalance[] = [
        {
          symbol: this.currentNetwork.symbol,
          balance: formatEther(nativeBalance),
          decimals: 18,
          usdValue: 0 // Would fetch from price API in production
        }
      ]

      // Get common tokens based on network
      const commonTokens = this.getCommonTokensForNetwork()
      
      // Get custom tokens
      const allTokens = [...commonTokens, ...this.customTokens]
      
      // Fetch balances for all tokens
      for (const token of allTokens) {
        try {
          const balance = await this.getTokenBalance(token.address, token.decimals, address)
          balances.push({
            symbol: token.symbol,
            balance: balance,
            contractAddress: token.address,
            decimals: token.decimals,
            usdValue: 0,
            isCustomToken: this.customTokens.some(ct => ct.address === token.address)
          })
        } catch (error) {
          // Skip tokens that fail to load
          console.warn(`Failed to load balance for ${token.symbol}:`, error)
        }
      }

      return balances
    } catch (error) {
      console.error('Error getting token balances:', error)
      return []
    }
  }

  // Get common tokens for current network
  private getCommonTokensForNetwork(): CustomToken[] {
    switch (this.currentNetwork.chainId) {
      case 56: // BNB Smart Chain
        return [
          {
            address: '0x55d398326f99059fF775485246999027B3197955',
            symbol: 'USDT',
            decimals: 18,
            name: 'Tether USD',
            verified: true
          },
          {
            address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
            symbol: 'USDC',
            decimals: 18,
            name: 'USD Coin',
            verified: true
          },
          {
            address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
            symbol: 'BUSD',
            decimals: 18,
            name: 'Binance USD',
            verified: true
          },
          {
            address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
            symbol: 'CAKE',
            decimals: 18,
            name: 'PancakeSwap Token',
            verified: true
          }
        ]
      case 1: // Ethereum Mainnet
        return [
          {
            address: '0xA0b86a33E6441b3C3F7c429a6e7e476E15a6C44e',
            symbol: 'USDC',
            decimals: 6,
            name: 'USD Coin',
            verified: true
          },
          {
            address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
            symbol: 'USDT',
            decimals: 6,
            name: 'Tether USD',
            verified: true
          }
        ]
      default:
        return []
    }
  }

  // Get token balance using ERC20 interface
  private async getTokenBalance(tokenAddress: string, decimals: number, walletAddress: string): Promise<string> {
    const publicClient = createPublicClient({
      chain: this.currentNetwork.chain,
      transport: http(this.currentNetwork.rpcUrl)
    })

    try {
      const balance = await publicClient.readContract({
        address: tokenAddress as Address,
        abi: [
          {
            constant: true,
            inputs: [{ name: '_owner', type: 'address' }],
            name: 'balanceOf',
            outputs: [{ name: 'balance', type: 'uint256' }],
            type: 'function',
          },
        ],
        functionName: 'balanceOf',
        args: [walletAddress as Address],
      })

      return formatUnits(balance as bigint, decimals)
    } catch (error) {
      console.warn(`Failed to get balance for token ${tokenAddress}:`, error)
      return '0'
    }
  }

  // Add custom token
  async addCustomToken(tokenAddress: string): Promise<CustomToken | null> {
    try {
      // Validate token address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) {
        throw new Error('Invalid token address format')
      }

      // Check if token already exists
      if (this.customTokens.some(token => token.address.toLowerCase() === tokenAddress.toLowerCase())) {
        throw new Error('Token already added')
      }

      // Get token information
      const tokenInfo = await this.getTokenInfo(tokenAddress)
      
      if (!tokenInfo) {
        throw new Error('Could not fetch token information')
      }

      // Add to custom tokens list
      const customToken: CustomToken = {
        address: tokenAddress,
        symbol: tokenInfo.symbol,
        decimals: tokenInfo.decimals,
        name: tokenInfo.name,
        verified: false
      }

      this.customTokens.push(customToken)
      
      // Save to localStorage
      this.saveCustomTokens()
      
      console.log('✅ Custom token added:', customToken)
      return customToken
    } catch (error) {
      console.error('Failed to add custom token:', error)
      throw error
    }
  }

  // Get token information from contract
  private async getTokenInfo(tokenAddress: string): Promise<{symbol: string, name: string, decimals: number} | null> {
    const publicClient = createPublicClient({
      chain: this.currentNetwork.chain,
      transport: http(this.currentNetwork.rpcUrl)
    })

    try {
      const [symbol, name, decimals] = await Promise.all([
        publicClient.readContract({
          address: tokenAddress as Address,
          abi: [
            {
              constant: true,
              inputs: [],
              name: 'symbol',
              outputs: [{ name: '', type: 'string' }],
              type: 'function',
            },
          ],
          functionName: 'symbol',
        }),
        publicClient.readContract({
          address: tokenAddress as Address,
          abi: [
            {
              constant: true,
              inputs: [],
              name: 'name',
              outputs: [{ name: '', type: 'string' }],
              type: 'function',
            },
          ],
          functionName: 'name',
        }),
        publicClient.readContract({
          address: tokenAddress as Address,
          abi: [
            {
              constant: true,
              inputs: [],
              name: 'decimals',
              outputs: [{ name: '', type: 'uint8' }],
              type: 'function',
            },
          ],
          functionName: 'decimals',
        }),
      ])

      return {
        symbol: symbol as string,
        name: name as string,
        decimals: decimals as number
      }
    } catch (error) {
      console.error('Failed to get token info:', error)
      return null
    }
  }

  // Remove custom token
  removeCustomToken(tokenAddress: string): boolean {
    const index = this.customTokens.findIndex(token => 
      token.address.toLowerCase() === tokenAddress.toLowerCase()
    )
    
    if (index > -1) {
      this.customTokens.splice(index, 1)
      this.saveCustomTokens()
      console.log('✅ Custom token removed:', tokenAddress)
      return true
    }
    return false
  }

  // Get custom tokens
  getCustomTokens(): CustomToken[] {
    return this.customTokens
  }

  // Save custom tokens to localStorage
  private saveCustomTokens(): void {
    try {
      const key = `custom_tokens_${this.currentNetwork.chainId}`
      localStorage.setItem(key, JSON.stringify(this.customTokens))
    } catch (error) {
      console.warn('Failed to save custom tokens:', error)
    }
  }

  // Load custom tokens from localStorage
  private async loadCustomTokens(): Promise<void> {
    try {
      const key = `custom_tokens_${this.currentNetwork.chainId}`
      const saved = localStorage.getItem(key)
      if (saved) {
        this.customTokens = JSON.parse(saved)
        console.log('📦 Loaded custom tokens:', this.customTokens.length)
      }
    } catch (error) {
      console.warn('Failed to load custom tokens:', error)
      this.customTokens = []
    }
  }

  // Send native token (BNB, ETH, etc.)
  async sendNativeToken(to: string, amount: string): Promise<TransactionResult> {
    if (!this.smartAccountClient) {
      return { success: false, error: 'Wallet not initialized' }
    }

    try {
      const amountWei = parseEther(amount)
      
      const userOp = await this.smartAccountClient.sendUserOperation({
        uo: {
          target: to as Address,
          data: '0x',
          value: amountWei,
        },
      })

      console.log('⏳ Native token transaction sent:', userOp.hash)
      
      const receipt = await this.smartAccountClient.waitForUserOperationTransaction({
        hash: userOp.hash
      })

      console.log('✅ Native token transaction confirmed:', receipt.transactionHash)
      
      return {
        success: true,
        hash: receipt.transactionHash,
        gasUsed: receipt.gasUsed?.toString(),
        gasFee: receipt.effectiveGasPrice ? 
          formatEther(receipt.effectiveGasPrice * receipt.gasUsed!) : undefined
      }
    } catch (error) {
      console.error('Native token transfer failed:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Transfer failed' 
      }
    }
  }

  // Send ERC20/BEP20 token
  async sendToken(options: SendTokenOptions): Promise<TransactionResult> {
    if (!this.smartAccountClient) {
      return { success: false, error: 'Wallet not initialized' }
    }

    if (!options.tokenAddress) {
      return { success: false, error: 'Token address is required' }
    }

    try {
      const decimals = options.decimals || 18
      const amountWei = parseUnits(options.amount, decimals)
      
      // ERC20 transfer function data
      const transferData = `0xa9059cbb${options.to.slice(2).padStart(64, '0')}${amountWei.toString(16).padStart(64, '0')}`
      
      const userOp = await this.smartAccountClient.sendUserOperation({
        uo: {
          target: options.tokenAddress as Address,
          data: transferData,
          value: 0n,
        },
      })

      console.log('⏳ Token transaction sent:', userOp.hash)
      
      const receipt = await this.smartAccountClient.waitForUserOperationTransaction({
        hash: userOp.hash
      })

      console.log('✅ Token transaction confirmed:', receipt.transactionHash)
      
      return {
        success: true,
        hash: receipt.transactionHash,
        gasUsed: receipt.gasUsed?.toString(),
        gasFee: receipt.effectiveGasPrice ? 
          formatEther(receipt.effectiveGasPrice * receipt.gasUsed!) : undefined
      }
    } catch (error) {
      console.error('Token transfer failed:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Transfer failed' 
      }
    }
  }

  // Logout and cleanup
  async logout(): Promise<void> {
    try {
      if (this.alchemySigner) {
        // Logout from Alchemy signer
        await this.alchemySigner.disconnect()
      }
      
      // Clear state
      this.smartAccountClient = null
      this.alchemySigner = null
      this.smartAccount = null
      this.isInitialized = false
      this.userInfo = null
      
      console.log('✅ Logout successful')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Check if wallet is ready
  isReady(): boolean {
    return this.isInitialized && !!this.smartAccountClient
  }
}

const alchemyWallet = new AlchemyWalletService()
export default alchemyWallet