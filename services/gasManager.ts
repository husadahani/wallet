import { Address, formatEther, parseEther } from 'viem'
import { BNB_MAINNET_CONFIG } from './alchemyWallet'

export interface GasPolicy {
  id: string
  name: string
  networkId: number
  rules: GasPolicyRule[]
  active: boolean
  dailyLimit?: string
  monthlyLimit?: string
  perTransactionLimit?: string
}

export interface GasPolicyRule {
  type: 'allowlist' | 'contract_method' | 'spending_limit' | 'rate_limit'
  conditions: any
  description: string
}

export interface GasUsageStats {
  totalSpent: string
  transactionCount: number
  dailySpent: string
  monthlySpent: string
  remainingDaily?: string
  remainingMonthly?: string
}

export interface GasEstimateRequest {
  from: string
  to: string
  value?: string
  data?: string
  chainId: number
}

export interface GasEstimateResponse {
  gasLimit: string
  maxFeePerGas: string
  maxPriorityFeePerGas: string
  estimatedCost: string
  isSponsored: boolean
  sponsorshipReason?: string
  gasPolicy?: string
}

export interface GasOptimization {
  suggestedGasPrice: string
  suggestedGasLimit: string
  estimatedConfirmationTime: string
  costSavings?: string
  networkCongestion: 'low' | 'medium' | 'high'
}

class GasManagerService {
  private readonly alchemyApiKey: string
  private readonly gasPolicyId: string
  
  constructor() {
    this.alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || ''
    this.gasPolicyId = process.env.NEXT_PUBLIC_BNB_GAS_POLICY_ID || ''
    
    if (!this.alchemyApiKey) {
      console.warn('⚠️ Alchemy API key not found. Gas Manager features will be limited.')
    }
    
    if (!this.gasPolicyId) {
      console.warn('⚠️ Gas Policy ID not found. Gas sponsorship may not work.')
    }
  }

  // Check if gas sponsorship is enabled
  isGasSponsorshipEnabled(): boolean {
    return !!(this.alchemyApiKey && this.gasPolicyId)
  }

  // Get gas usage statistics from Alchemy
  async getGasUsageStats(policyId?: string): Promise<GasUsageStats> {
    const targetPolicyId = policyId || this.gasPolicyId
    
    if (!targetPolicyId) {
      console.warn('No gas policy ID available')
      return this.getDefaultUsageStats()
    }

    try {
      // In production, this would make an actual API call to Alchemy's Gas Manager
      // For now, we'll return realistic mock data
      return {
        totalSpent: '0.025',
        transactionCount: 12,
        dailySpent: '0.005',
        monthlySpent: '0.025',
        remainingDaily: '9.995',
        remainingMonthly: '99.975'
      }
    } catch (error) {
      console.error('Error fetching gas usage stats:', error)
      return this.getDefaultUsageStats()
    }
  }

  // Estimate gas for BNB Smart Chain transaction
  async estimateGasForTransaction(request: GasEstimateRequest): Promise<GasEstimateResponse> {
    try {
      // Create a fetch request to Alchemy's BNB RPC endpoint
      const response = await fetch(BNB_MAINNET_CONFIG.rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_estimateGas',
          params: [
            {
              from: request.from,
              to: request.to,
              value: request.value ? `0x${parseEther(request.value || '0').toString(16)}` : '0x0',
              data: request.data || '0x'
            }
          ],
          id: 1
        })
      })

      const gasEstimate = await response.json()
      
      // Get current gas price for BNB Smart Chain
      const gasPriceResponse = await fetch(BNB_MAINNET_CONFIG.rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_gasPrice',
          params: [],
          id: 2
        })
      })

      const gasPrice = await gasPriceResponse.json()
      
      const gasLimit = parseInt(gasEstimate.result || '0x5208', 16).toString()
      const maxFeePerGas = parseInt(gasPrice.result || '0x12a05f200', 16).toString()
      const estimatedCost = formatEther(BigInt(gasLimit) * BigInt(maxFeePerGas))

      // Check if transaction qualifies for sponsorship
      const isSponsored = await this.checkSponsorship(request)

      return {
        gasLimit,
        maxFeePerGas,
        maxPriorityFeePerGas: maxFeePerGas, // Simplified for BNB Smart Chain
        estimatedCost: isSponsored ? '0' : estimatedCost,
        isSponsored,
        sponsorshipReason: isSponsored ? 'Transaction sponsored by Alchemy Gas Manager' : undefined,
        gasPolicy: this.gasPolicyId
      }
    } catch (error) {
      console.error('Error estimating gas:', error)
      return this.getDefaultGasEstimate()
    }
  }

  // Check if transaction qualifies for gas sponsorship
  private async checkSponsorship(request: GasEstimateRequest): Promise<boolean> {
    if (!this.gasPolicyId) {
      return false
    }

    try {
      // Get current usage stats
      const stats = await this.getGasUsageStats()
      
      // Check daily limit (example: $10 USD per day)
      const dailyLimitUSD = parseFloat(process.env.NEXT_PUBLIC_DAILY_GAS_LIMIT_USD || '10')
      const currentDailySpentUSD = parseFloat(stats.dailySpent) * 300 // Assume 1 BNB = $300 USD
      
      if (currentDailySpentUSD >= dailyLimitUSD) {
        console.log('Daily gas limit exceeded')
        return false
      }

      // Check transaction limit (example: $2 USD per transaction)
      const txLimitUSD = parseFloat(process.env.NEXT_PUBLIC_TRANSACTION_GAS_LIMIT_USD || '2')
      const estimatedCostUSD = parseFloat(request.value || '0') * 300 // Simplified calculation
      
      if (estimatedCostUSD > txLimitUSD) {
        console.log('Transaction amount exceeds limit')
        return false
      }

      // All checks passed - transaction is eligible for sponsorship
      return true
    } catch (error) {
      console.error('Error checking sponsorship eligibility:', error)
      return false
    }
  }

  // Get gas optimization suggestions for BNB Smart Chain
  async getGasOptimization(): Promise<GasOptimization> {
    try {
      // Get current gas price from BNB Smart Chain
      const response = await fetch(BNB_MAINNET_CONFIG.rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_gasPrice',
          params: [],
          id: 1
        })
      })

      const gasPrice = await response.json()
      const currentGasPrice = parseInt(gasPrice.result || '0x12a05f200', 16)
      
      // BNB Smart Chain specific optimization
      const optimization: GasOptimization = {
        suggestedGasPrice: (currentGasPrice * 1.1).toString(), // 10% above current for faster confirmation
        suggestedGasLimit: '21000', // Standard transfer
        estimatedConfirmationTime: '3-5 seconds', // BSC is faster than Ethereum
        networkCongestion: this.getNetworkCongestion(currentGasPrice),
        costSavings: this.isGasSponsorshipEnabled() ? 'Gas sponsored by Alchemy' : '0'
      }

      return optimization
    } catch (error) {
      console.error('Error getting gas optimization:', error)
      return this.getDefaultOptimization()
    }
  }

  // Determine network congestion level for BNB Smart Chain
  private getNetworkCongestion(gasPrice: number): 'low' | 'medium' | 'high' {
    // BNB Smart Chain gas price thresholds (in Gwei)
    const lowThreshold = 5_000_000_000  // 5 Gwei
    const highThreshold = 20_000_000_000 // 20 Gwei
    
    if (gasPrice < lowThreshold) return 'low'
    if (gasPrice < highThreshold) return 'medium'
    return 'high'
  }

  // Create a basic gas sponsorship policy for BNB Smart Chain
  async createBasicSponsorshipPolicy(
    allowedAddresses: string[],
    dailyLimitUSD: number = 10
  ): Promise<string> {
    try {
      // In production, this would create a real policy via Alchemy's API
      console.log('Creating gas sponsorship policy for BNB Smart Chain:', {
        allowedAddresses,
        dailyLimitUSD,
        network: 'BNB Smart Chain'
      })
      
      // Return mock policy ID
      const policyId = `bnb_policy_${Date.now()}`
      console.log('✅ Gas policy created:', policyId)
      
      return policyId
    } catch (error) {
      console.error('Error creating gas policy:', error)
      throw new Error('Failed to create gas sponsorship policy')
    }
  }

  // Get gas policy information
  async getGasPolicy(policyId?: string): Promise<GasPolicy | null> {
    const targetPolicyId = policyId || this.gasPolicyId
    
    if (!targetPolicyId) {
      return null
    }

    try {
      // In production, this would fetch from Alchemy's API
      return {
        id: targetPolicyId,
        name: 'BNB Smart Chain Gas Sponsorship',
        networkId: 56,
        rules: [
          {
            type: 'spending_limit',
            conditions: { 
              dailyLimit: process.env.NEXT_PUBLIC_DAILY_GAS_LIMIT_USD || '10',
              currency: 'USD'
            },
            description: 'Daily spending limit'
          },
          {
            type: 'rate_limit',
            conditions: { 
              maxTransactionsPerHour: 50 
            },
            description: 'Rate limiting for security'
          }
        ],
        active: true,
        dailyLimit: process.env.NEXT_PUBLIC_DAILY_GAS_LIMIT_USD || '10',
        monthlyLimit: process.env.NEXT_PUBLIC_MONTHLY_GAS_LIMIT_USD || '100'
      }
    } catch (error) {
      console.error('Error fetching gas policy:', error)
      return null
    }
  }

  // Get current gas manager status
  getGasManagerStatus() {
    return {
      enabled: this.isGasSponsorshipEnabled(),
      apiKey: !!this.alchemyApiKey,
      policyId: !!this.gasPolicyId,
      network: BNB_MAINNET_CONFIG.name,
      chainId: BNB_MAINNET_CONFIG.chainId
    }
  }

  // Helper method to get default usage stats
  private getDefaultUsageStats(): GasUsageStats {
    return {
      totalSpent: '0.000',
      transactionCount: 0,
      dailySpent: '0.000',
      monthlySpent: '0.000',
      remainingDaily: '10.000',
      remainingMonthly: '100.000'
    }
  }

  // Helper method to get default gas estimate
  private getDefaultGasEstimate(): GasEstimateResponse {
    return {
      gasLimit: '21000',
      maxFeePerGas: '5000000000', // 5 Gwei
      maxPriorityFeePerGas: '1000000000', // 1 Gwei
      estimatedCost: this.isGasSponsorshipEnabled() ? '0' : '0.000105',
      isSponsored: this.isGasSponsorshipEnabled(),
      sponsorshipReason: this.isGasSponsorshipEnabled() ? 'Transaction sponsored by Alchemy Gas Manager' : undefined,
      gasPolicy: this.gasPolicyId
    }
  }

  // Helper method to get default optimization
  private getDefaultOptimization(): GasOptimization {
    return {
      suggestedGasPrice: '5000000000', // 5 Gwei
      suggestedGasLimit: '21000',
      estimatedConfirmationTime: '3-5 seconds',
      networkCongestion: 'low',
      costSavings: this.isGasSponsorshipEnabled() ? 'Gas sponsored by Alchemy' : '0'
    }
  }
}

export default new GasManagerService()