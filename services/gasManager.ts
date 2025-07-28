import { Address, formatEther, parseEther } from 'viem'
import { SUPPORTED_NETWORKS } from './alchemyWallet'

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
  private readonly baseUrl = 'https://dashboard.alchemy.com/api'
  private readonly apiKey: string
  
  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || ''
    if (!this.apiKey) {
      console.warn('Alchemy API key not found. Gas Manager features may be limited.')
    }
  }

  // Create a new gas policy
  async createGasPolicy(
    networkId: number,
    name: string,
    rules: GasPolicyRule[],
    limits?: {
      dailyLimit?: string
      monthlyLimit?: string
      perTransactionLimit?: string
    }
  ): Promise<GasPolicy> {
    try {
      const response = await fetch(`${this.baseUrl}/gas-manager/policies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          name,
          networkId,
          rules,
          ...limits
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to create gas policy: ${response.statusText}`)
      }

      const policy = await response.json()
      return {
        id: policy.id,
        name: policy.name,
        networkId: policy.networkId,
        rules: policy.rules,
        active: policy.active,
        ...limits
      }
    } catch (error) {
      console.error('Error creating gas policy:', error)
      // Return mock policy for development
      return this.createMockPolicy(networkId, name, rules, limits)
    }
  }

  // Get gas policies for a network
  async getGasPolicies(networkId?: number): Promise<GasPolicy[]> {
    try {
      const url = networkId 
        ? `${this.baseUrl}/gas-manager/policies?networkId=${networkId}`
        : `${this.baseUrl}/gas-manager/policies`

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch gas policies: ${response.statusText}`)
      }

      const policies = await response.json()
      return policies.map((policy: any) => ({
        id: policy.id,
        name: policy.name,
        networkId: policy.networkId,
        rules: policy.rules,
        active: policy.active,
        dailyLimit: policy.dailyLimit,
        monthlyLimit: policy.monthlyLimit,
        perTransactionLimit: policy.perTransactionLimit
      }))
    } catch (error) {
      console.error('Error fetching gas policies:', error)
      return this.getMockPolicies(networkId)
    }
  }

  // Update gas policy
  async updateGasPolicy(
    policyId: string,
    updates: Partial<GasPolicy>
  ): Promise<GasPolicy> {
    try {
      const response = await fetch(`${this.baseUrl}/gas-manager/policies/${policyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error(`Failed to update gas policy: ${response.statusText}`)
      }

      const policy = await response.json()
      return policy
    } catch (error) {
      console.error('Error updating gas policy:', error)
      throw error
    }
  }

  // Delete gas policy
  async deleteGasPolicy(policyId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/gas-manager/policies/${policyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      })

      return response.ok
    } catch (error) {
      console.error('Error deleting gas policy:', error)
      return false
    }
  }

  // Get gas usage statistics
  async getGasUsageStats(
    policyId: string,
    period: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<GasUsageStats> {
    try {
      const response = await fetch(
        `${this.baseUrl}/gas-manager/policies/${policyId}/usage?period=${period}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch gas usage stats: ${response.statusText}`)
      }

      const stats = await response.json()
      return {
        totalSpent: formatEther(BigInt(stats.totalSpent || 0)),
        transactionCount: stats.transactionCount || 0,
        dailySpent: formatEther(BigInt(stats.dailySpent || 0)),
        monthlySpent: formatEther(BigInt(stats.monthlySpent || 0)),
        remainingDaily: stats.remainingDaily ? formatEther(BigInt(stats.remainingDaily)) : undefined,
        remainingMonthly: stats.remainingMonthly ? formatEther(BigInt(stats.remainingMonthly)) : undefined
      }
    } catch (error) {
      console.error('Error fetching gas usage stats:', error)
      return this.getMockUsageStats()
    }
  }

  // Estimate gas with sponsorship check
  async estimateGasWithSponsorship(
    request: GasEstimateRequest
  ): Promise<GasEstimateResponse> {
    try {
      const network = Object.values(SUPPORTED_NETWORKS).find(n => n.chainId === request.chainId)
      if (!network) {
        throw new Error(`Unsupported network: ${request.chainId}`)
      }

      // Use Alchemy Gas API for accurate estimation
      const response = await fetch(network.rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_estimateGas',
          params: [
            {
              from: request.from,
              to: request.to,
              value: request.value ? `0x${parseEther(request.value).toString(16)}` : '0x0',
              data: request.data || '0x'
            }
          ],
          id: 1
        })
      })

      const gasEstimate = await response.json()
      
      // Get current gas price
      const gasPriceResponse = await fetch(network.rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_gasPrice',
          params: [],
          id: 2
        })
      })

      const gasPrice = await gasPriceResponse.json()
      
      const gasLimit = gasEstimate.result
      const maxFeePerGas = gasPrice.result
      const estimatedCost = formatEther(BigInt(gasLimit) * BigInt(maxFeePerGas))

      // Check if transaction qualifies for sponsorship
      const isSponsored = await this.checkSponsorship(request, network.gasPolicy)

      return {
        gasLimit: parseInt(gasLimit, 16).toString(),
        maxFeePerGas: parseInt(maxFeePerGas, 16).toString(),
        maxPriorityFeePerGas: parseInt(maxFeePerGas, 16).toString(), // Simplified
        estimatedCost: isSponsored ? '0' : estimatedCost,
        isSponsored,
        sponsorshipReason: isSponsored ? 'Transaction meets gas policy criteria' : undefined,
        gasPolicy: network.gasPolicy
      }
    } catch (error) {
      console.error('Error estimating gas:', error)
      return this.getMockGasEstimate(request)
    }
  }

  // Check if transaction qualifies for gas sponsorship
  private async checkSponsorship(
    request: GasEstimateRequest,
    policyId?: string
  ): Promise<boolean> {
    if (!policyId) {
      return false
    }

    try {
      // Get policy rules
      const policies = await this.getGasPolicies(request.chainId)
      const policy = policies.find(p => p.id === policyId)
      
      if (!policy || !policy.active) {
        return false
      }

      // Check each rule
      for (const rule of policy.rules) {
        switch (rule.type) {
          case 'allowlist':
            if (rule.conditions.addresses && !rule.conditions.addresses.includes(request.from)) {
              return false
            }
            break
          
          case 'spending_limit':
            const stats = await this.getGasUsageStats(policyId)
            if (rule.conditions.dailyLimit && parseFloat(stats.dailySpent) >= parseFloat(rule.conditions.dailyLimit)) {
              return false
            }
            break
          
          case 'contract_method':
            if (request.data && rule.conditions.methods) {
              const methodSelector = request.data.slice(0, 10)
              if (!rule.conditions.methods.includes(methodSelector)) {
                return false
              }
            }
            break
        }
      }

      return true
    } catch (error) {
      console.error('Error checking sponsorship:', error)
      return false
    }
  }

  // Get gas optimization suggestions
  async getGasOptimization(chainId: number): Promise<GasOptimization> {
    try {
      const network = Object.values(SUPPORTED_NETWORKS).find(n => n.chainId === chainId)
      if (!network) {
        throw new Error(`Unsupported network: ${chainId}`)
      }

      // Get current network conditions
      const response = await fetch(network.rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_gasPrice',
          params: [],
          id: 1
        })
      })

      const gasPrice = await response.json()
      const currentGasPrice = parseInt(gasPrice.result, 16)
      
      // Suggest optimized gas settings based on network conditions
      const optimization: GasOptimization = {
        suggestedGasPrice: (currentGasPrice * 1.1).toString(), // 10% above current
        suggestedGasLimit: '21000', // Standard transfer
        estimatedConfirmationTime: '1-2 minutes',
        networkCongestion: this.getNetworkCongestion(currentGasPrice),
        costSavings: '0'
      }

      return optimization
    } catch (error) {
      console.error('Error getting gas optimization:', error)
      return this.getMockOptimization()
    }
  }

  // Determine network congestion level
  private getNetworkCongestion(gasPrice: number): 'low' | 'medium' | 'high' {
    // Simplified congestion detection
    if (gasPrice < 20000000000) return 'low' // < 20 Gwei
    if (gasPrice < 50000000000) return 'medium' // < 50 Gwei
    return 'high'
  }

  // Create common gas policy presets
  async createBasicSponsorshipPolicy(
    networkId: number,
    allowedAddresses: string[],
    dailyLimit: string = '0.1'
  ): Promise<GasPolicy> {
    const rules: GasPolicyRule[] = [
      {
        type: 'allowlist',
        conditions: { addresses: allowedAddresses },
        description: 'Allow specific wallet addresses'
      },
      {
        type: 'spending_limit',
        conditions: { dailyLimit },
        description: `Daily spending limit of ${dailyLimit} ETH`
      }
    ]

    return this.createGasPolicy(
      networkId,
      `Basic Sponsorship Policy - Network ${networkId}`,
      rules,
      { dailyLimit }
    )
  }

  // Mock implementations for development
  private createMockPolicy(
    networkId: number,
    name: string,
    rules: GasPolicyRule[],
    limits?: any
  ): GasPolicy {
    return {
      id: `mock_policy_${Date.now()}`,
      name,
      networkId,
      rules,
      active: true,
      ...limits
    }
  }

  private getMockPolicies(networkId?: number): GasPolicy[] {
    const allPolicies = [
      {
        id: 'sepolia_basic_policy',
        name: 'Sepolia Basic Sponsorship',
        networkId: 11155111,
        rules: [
          {
            type: 'spending_limit' as const,
            conditions: { dailyLimit: '0.05' },
            description: 'Daily limit of 0.05 ETH'
          }
        ],
        active: true,
        dailyLimit: '0.05'
      },
      {
        id: 'mainnet_premium_policy',
        name: 'Mainnet Premium Sponsorship',
        networkId: 1,
        rules: [
          {
            type: 'spending_limit' as const,
            conditions: { dailyLimit: '0.1' },
            description: 'Daily limit of 0.1 ETH'
          }
        ],
        active: true,
        dailyLimit: '0.1'
      }
    ]

    return networkId ? allPolicies.filter(p => p.networkId === networkId) : allPolicies
  }

  private getMockUsageStats(): GasUsageStats {
    return {
      totalSpent: '0.025',
      transactionCount: 12,
      dailySpent: '0.005',
      monthlySpent: '0.025',
      remainingDaily: '0.045',
      remainingMonthly: '0.075'
    }
  }

  private getMockGasEstimate(request: GasEstimateRequest): GasEstimateResponse {
    return {
      gasLimit: '21000',
      maxFeePerGas: '20000000000',
      maxPriorityFeePerGas: '1000000000',
      estimatedCost: '0',
      isSponsored: true,
      sponsorshipReason: 'Mock sponsorship for development',
      gasPolicy: 'mock_policy'
    }
  }

  private getMockOptimization(): GasOptimization {
    return {
      suggestedGasPrice: '20000000000',
      suggestedGasLimit: '21000',
      estimatedConfirmationTime: '1-2 minutes',
      networkCongestion: 'low'
    }
  }
}

export default new GasManagerService()