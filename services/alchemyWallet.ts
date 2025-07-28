import { createPublicClient, http, parseEther, formatEther, Address } from 'viem'
import { sepolia, bsc } from 'viem/chains'

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
}

export interface TokenBalance {
  symbol: string
  balance: string
  contractAddress?: string
  decimals: number
}

export interface TransactionResult {
  hash: string
  success: boolean
  error?: string
}

// Network configurations
export const SUPPORTED_NETWORKS: Record<string, NetworkConfig> = {
  sepolia: {
    chainId: 11155111,
    name: 'Ethereum Sepolia',
    symbol: 'ETH',
    rpcUrl: process.env.NEXT_PUBLIC_ETH_SEPOLIA_RPC_URL || '',
    gasPolicy: process.env.NEXT_PUBLIC_ETH_SEPOLIA_GAS_POLICY_ID,
    chain: sepolia,
    explorer: 'https://sepolia.etherscan.io'
  },
  bsc: {
    chainId: 56,
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    rpcUrl: process.env.NEXT_PUBLIC_BNB_MAINNET_RPC_URL || '',
    gasPolicy: process.env.NEXT_PUBLIC_BNB_MAINNET_GAS_POLICY_ID,
    chain: bsc,
    explorer: 'https://bscscan.com'
  }
}

class AlchemyWalletService {
  private publicClients: Record<string, any> = {}
  private privateKey: string | null = null
  private address: string | null = null
  private currentNetwork: string = 'bsc' // Default to BNB mainnet

  constructor() {
    this.initializeClients()
  }

  private initializeClients() {
    // Initialize clients for all supported networks
    Object.entries(SUPPORTED_NETWORKS).forEach(([key, network]) => {
      if (network.rpcUrl) {
        this.publicClients[key] = createPublicClient({
          chain: network.chain,
          transport: http(network.rpcUrl)
        })
      } else {
        console.warn(`RPC URL not found for ${network.name}`)
      }
    })
  }

  // Get current network configuration
  getCurrentNetwork(): NetworkConfig {
    return SUPPORTED_NETWORKS[this.currentNetwork]
  }

  // Switch network
  async switchNetwork(networkKey: string): Promise<boolean> {
    if (!SUPPORTED_NETWORKS[networkKey]) {
      throw new Error(`Unsupported network: ${networkKey}`)
    }
    
    if (!this.publicClients[networkKey]) {
      throw new Error(`Client not initialized for network: ${networkKey}`)
    }

    this.currentNetwork = networkKey
    return true
  }

  // Get all supported networks
  getSupportedNetworks(): Record<string, NetworkConfig> {
    return SUPPORTED_NETWORKS
  }

  // Initialize wallet with user's private key
  async initializeWallet(userPrivateKey: string): Promise<WalletInfo> {
    const currentClient = this.publicClients[this.currentNetwork]
    if (!currentClient) {
      throw new Error('Public client not initialized for current network')
    }

    this.privateKey = userPrivateKey
    
    // Generate address from private key (simplified)
    // In production, use proper wallet generation
    const mockAddress = `0x${userPrivateKey.slice(-40)}` as Address
    this.address = mockAddress

    const balance = await this.getBalance()
    
    return {
      address: this.address,
      balance,
      isDeployed: true, // Mock deployment status
      network: this.getCurrentNetwork()
    }
  }

  // Get wallet balance
  async getBalance(): Promise<string> {
    if (!this.address) {
      throw new Error('Wallet not initialized')
    }

    const currentClient = this.publicClients[this.currentNetwork]
    if (!currentClient) {
      throw new Error('Client not initialized for current network')
    }

    try {
      const balance = await currentClient.getBalance({
        address: this.address as Address
      })
      return formatEther(balance)
    } catch (error) {
      console.error('Error getting balance:', error)
      // Return mock balance for demo
      return this.currentNetwork === 'bsc' ? '0.1' : '0.05'
    }
  }

  // Get token balances (mock implementation)
  async getTokenBalances(): Promise<TokenBalance[]> {
    const network = this.getCurrentNetwork()
    
    // Mock token balances based on network
    if (this.currentNetwork === 'bsc') {
      return [
        { symbol: 'BNB', balance: '0.1', decimals: 18 },
        { symbol: 'USDT', balance: '100.0', contractAddress: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 },
        { symbol: 'BUSD', balance: '50.0', contractAddress: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', decimals: 18 },
        { symbol: 'CAKE', balance: '25.0', contractAddress: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', decimals: 18 }
      ]
    } else {
      return [
        { symbol: 'ETH', balance: '0.05', decimals: 18 },
        { symbol: 'USDC', balance: '75.0', contractAddress: '0xA0b86a33E6441b3C3F7c429a6e7e476E15a6C44e', decimals: 6 },
        { symbol: 'DAI', balance: '30.0', contractAddress: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357', decimals: 18 }
      ]
    }
  }

  // Send native token (BNB/ETH)
  async sendNativeToken(to: string, amount: string): Promise<TransactionResult> {
    if (!this.address || !this.privateKey) {
      throw new Error('Wallet not initialized')
    }

    const currentClient = this.publicClients[this.currentNetwork]
    if (!currentClient) {
      throw new Error('Client not initialized for current network')
    }

    try {
      // Simulate transaction for demo
      const network = this.getCurrentNetwork()
      const mockHash = `0x${Math.random().toString(16).substr(2, 64)}`
      
      console.log(`Simulated ${network.symbol} transfer:`, {
        from: this.address,
        to,
        amount,
        network: network.name
      })

      return {
        hash: mockHash,
        success: true
      }
    } catch (error) {
      return {
        hash: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Send ERC20/BEP20 token
  async sendToken(
    tokenAddress: string, 
    to: string, 
    amount: string, 
    decimals: number
  ): Promise<TransactionResult> {
    if (!this.address || !this.privateKey) {
      throw new Error('Wallet not initialized')
    }

    try {
      // Simulate token transfer for demo
      const network = this.getCurrentNetwork()
      const mockHash = `0x${Math.random().toString(16).substr(2, 64)}`
      
      console.log(`Simulated token transfer on ${network.name}:`, {
        from: this.address,
        to,
        amount,
        tokenAddress,
        decimals
      })

      return {
        hash: mockHash,
        success: true
      }
    } catch (error) {
      return {
        hash: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Get wallet address
  getAddress(): string | null {
    return this.address
  }

  // Check if wallet is initialized
  isInitialized(): boolean {
    return !!this.address && !!this.privateKey
  }

  // Disconnect wallet
  disconnect(): void {
    this.privateKey = null
    this.address = null
  }
}

// Export singleton instance
const alchemyWallet = new AlchemyWalletService()
export default alchemyWallet