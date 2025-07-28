import { createPublicClient, http, parseEther, formatEther, Address } from 'viem'
import { sepolia } from 'viem/chains'

export interface WalletInfo {
  address: string
  balance: string
  isDeployed: boolean
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

class AlchemyWalletService {
  private publicClient: any = null
  private privateKey: string | null = null
  private address: string | null = null

  constructor() {
    this.initializePublicClient()
  }

  private initializePublicClient() {
    const rpcUrl = process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL
    if (!rpcUrl) {
      console.warn('Alchemy RPC URL not found in environment variables')
      return
    }

    this.publicClient = createPublicClient({
      chain: sepolia,
      transport: http(rpcUrl)
    })
  }

  // Initialize wallet with user's private key
  async initializeWallet(userPrivateKey: string): Promise<WalletInfo> {
    if (!this.publicClient) {
      throw new Error('Public client not initialized')
    }

    this.privateKey = userPrivateKey
    
    // In a real implementation, derive address from private key
    // For now, we'll use a placeholder address
    this.address = this.generateAddressFromPrivateKey(userPrivateKey)

    const balance = await this.getBalance()
    const isDeployed = await this.isWalletDeployed()

    return {
      address: this.address,
      balance,
      isDeployed
    }
  }

  private generateAddressFromPrivateKey(privateKey: string): string {
    // This is a simplified address generation for demo purposes
    // In production, you would properly derive the address from the private key
    const hash = Array.from(privateKey)
      .reduce((hash, char) => {
        return ((hash << 5) - hash) + char.charCodeAt(0)
      }, 0)
      .toString(16)
      .padStart(40, '0')
    
    return `0x${hash.slice(0, 40)}`
  }

  // Check if smart wallet is deployed (simplified)
  async isWalletDeployed(): Promise<boolean> {
    if (!this.address || !this.publicClient) return false

    try {
      const code = await this.publicClient.getBytecode({
        address: this.address as Address,
      })
      return code && code !== '0x'
    } catch (error) {
      console.error('Error checking wallet deployment:', error)
      return false
    }
  }

  // Get ETH balance
  async getBalance(): Promise<string> {
    if (!this.address || !this.publicClient) return '0'

    try {
      const balance = await this.publicClient.getBalance({
        address: this.address as Address,
      })
      return formatEther(balance)
    } catch (error) {
      console.error('Error getting balance:', error)
      // Return a mock balance for demo purposes
      return '0.123'
    }
  }

  // Get token balances (mock implementation for demo)
  async getTokenBalances(): Promise<TokenBalance[]> {
    const ethBalance = await this.getBalance()
    
    return [
      {
        symbol: 'ETH',
        balance: ethBalance,
        decimals: 18,
      },
      // Mock token balances for demo
      {
        symbol: 'USDC',
        balance: '100.50',
        contractAddress: '0xA0b86a33E6351C9CCdbC53BfFC0bAFC5e9E9F7f3',
        decimals: 6,
      },
      {
        symbol: 'DAI',
        balance: '50.25',
        contractAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        decimals: 18,
      }
    ]
  }

  // Send ETH (simplified implementation)
  async sendETH(to: Address, amount: string): Promise<TransactionResult> {
    if (!this.privateKey || !this.address) {
      throw new Error('Wallet not initialized')
    }

    try {
      // In a real implementation with Alchemy's Account Abstraction, 
      // you would use the smart contract wallet to send transactions
      // For demo purposes, we'll simulate a successful transaction
      
      console.log(`Simulating ETH transfer: ${amount} ETH to ${to}`)
      
      // Simulate transaction hash
      const mockTxHash = '0x' + Math.random().toString(16).slice(2, 66)
      
      return {
        hash: mockTxHash,
        success: true,
      }
    } catch (error) {
      console.error('Error sending ETH:', error)
      return {
        hash: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Send ERC20 tokens (simplified implementation)
  async sendToken(
    tokenAddress: Address,
    to: Address,
    amount: string,
    decimals: number = 18
  ): Promise<TransactionResult> {
    if (!this.privateKey || !this.address) {
      throw new Error('Wallet not initialized')
    }

    try {
      console.log(`Simulating token transfer: ${amount} tokens to ${to}`)
      
      // Simulate transaction hash
      const mockTxHash = '0x' + Math.random().toString(16).slice(2, 66)
      
      return {
        hash: mockTxHash,
        success: true,
      }
    } catch (error) {
      console.error('Error sending token:', error)
      return {
        hash: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Get wallet address
  getAddress(): string {
    return this.address || ''
  }

  // Disconnect wallet
  disconnect() {
    this.privateKey = null
    this.address = null
  }
}

export default new AlchemyWalletService()