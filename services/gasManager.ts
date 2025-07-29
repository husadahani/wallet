import { Address, formatEther, parseEther, formatUnits } from 'viem'
import { BNB_MAINNET_CONFIG, SUPPORTED_NETWORKS } from './alchemyWallet'
import alchemyWallet from './alchemyWallet'

export interface GasPolicy {
  id: string
  name: string
  networkId: number
  rules: GasPolicyRule[]
  active: boolean
  dailyLimit?: string
  monthlyLimit?: string
  perTransactionLimit?: string
  sponsorshipType: 'full' | 'partial' | 'conditional'
}

export interface GasPolicyRule {
  type: 'allowlist' | 'contract_method' | 'spending_limit' | 'rate_limit' | 'user_limit'
  conditions: any
  description: string
  enabled: boolean
}

export interface GasUsageStats {
  totalSpent: string
  transactionCount: number
  dailySpent: string
  monthlySpent: string
  remainingDaily?: string
  remainingMonthly?: string
  averageGasPrice: string
  lastUpdated: number
}

export interface GasEstimateRequest {
  from: string
  to: string
  value?: string
  data?: string
  chainId: number
  operation?: 'transfer' | 'token_transfer' | 'contract_call'
}

export interface GasEstimateResponse {
  gasLimit: string
  maxFeePerGas: string
  maxPriorityFeePerGas: string
  estimatedCost: string
  estimatedCostUSD?: string
  isSponsored: boolean
  sponsorshipReason?: string
  gasPolicy?: string
  network: string
  recommendations?: {
    slow: GasPriceRecommendation
    standard: GasPriceRecommendation
    fast: GasPriceRecommendation
  }
}

export interface GasPriceRecommendation {
  maxFeePerGas: string
  maxPriorityFeePerGas: string
  estimatedTime: string
  confidence: number
}

export interface GasOptimization {
  suggestedGasPrice: string
  suggestedGasLimit: string
  optimizationTips: string[]
  potentialSavings: string
  estimatedConfirmationTime: string
}

export interface SponsorshipEligibility {
  eligible: boolean
  reason: string
  policy?: string
  remainingQuota?: string
  resetTime?: number
}

class AlchemyGasManagerService {
  private currentNetwork = BNB_MAINNET_CONFIG
  private gasUsageStats: Map<string, GasUsageStats> = new Map()
  private dailyUsage: Map<string, number> = new Map()
  private monthlyUsage: Map<string, number> = new Map()

  // Initialize gas manager with current network
  constructor() {
    this.loadUsageStats()
    this.currentNetwork = alchemyWallet.getCurrentNetwork()
  }

  // Check if gas sponsorship is available for the current transaction
  async checkSponsorshipEligibility(request: GasEstimateRequest): Promise<SponsorshipEligibility> {
    try {
      const currentNetwork = alchemyWallet.getCurrentNetwork()
      const gasPolicy = currentNetwork.gasPolicy

      if (!gasPolicy || !process.env.NEXT_PUBLIC_GAS_MANAGER_ENABLED) {
        return {
          eligible: false,
          reason: 'Gas sponsorship not configured for this network'
        }
      }

      // Check user's daily usage
      const userAddress = request.from
      const today = this.getTodayKey()
      const dailyUsed = this.dailyUsage.get(`${userAddress}_${today}`) || 0
      const dailyLimit = parseFloat(process.env.NEXT_PUBLIC_DAILY_GAS_LIMIT || '0.1')

      if (dailyUsed >= dailyLimit) {
        return {
          eligible: false,
          reason: 'Daily gas sponsorship limit exceeded',
          remainingQuota: '0',
          resetTime: this.getTomorrowTimestamp()
        }
      }

      // Check monthly usage
      const monthKey = this.getMonthKey()
      const monthlyUsed = this.monthlyUsage.get(`${userAddress}_${monthKey}`) || 0
      const monthlyLimit = parseFloat(process.env.NEXT_PUBLIC_MONTHLY_GAS_LIMIT || '1.0')

      if (monthlyUsed >= monthlyLimit) {
        return {
          eligible: false,
          reason: 'Monthly gas sponsorship limit exceeded',
          remainingQuota: (monthlyLimit - monthlyUsed).toString(),
          resetTime: this.getNextMonthTimestamp()
        }
      }

      // Check transaction type eligibility
      const isEligibleOperation = this.isOperationSponsored(request.operation || 'transfer')
      
      if (!isEligibleOperation) {
        return {
          eligible: false,
          reason: 'Operation type not eligible for gas sponsorship'
        }
      }

      return {
        eligible: true,
        reason: 'Transaction eligible for gas sponsorship',
        policy: gasPolicy,
        remainingQuota: (dailyLimit - dailyUsed).toString()
      }
    } catch (error) {
      console.error('Error checking sponsorship eligibility:', error)
      return {
        eligible: false,
        reason: 'Error checking sponsorship eligibility'
      }
    }
  }

  // Estimate gas for transaction with Alchemy Gas Manager
  async estimateGas(request: GasEstimateRequest): Promise<GasEstimateResponse> {
    try {
      const currentNetwork = alchemyWallet.getCurrentNetwork()
      const sponsorship = await this.checkSponsorshipEligibility(request)

      // Get gas price recommendations for the network
      const gasPrices = await this.getGasPriceRecommendations(currentNetwork.chainId)
      
      // Estimate gas limit based on operation type
      const estimatedGasLimit = this.estimateGasLimit(request.operation || 'transfer', request.data)
      
      // Calculate costs
      const standardGasPrice = gasPrices.standard.maxFeePerGas
      const estimatedCost = (BigInt(estimatedGasLimit) * BigInt(standardGasPrice)).toString()
      const estimatedCostEther = formatEther(BigInt(estimatedCost))

      // Get USD value if available
      const estimatedCostUSD = await this.convertToUSD(estimatedCostEther, currentNetwork.symbol)

      return {
        gasLimit: estimatedGasLimit,
        maxFeePerGas: standardGasPrice,
        maxPriorityFeePerGas: gasPrices.standard.maxPriorityFeePerGas,
        estimatedCost: estimatedCostEther,
        estimatedCostUSD,
        isSponsored: sponsorship.eligible,
        sponsorshipReason: sponsorship.reason,
        gasPolicy: sponsorship.policy,
        network: currentNetwork.name,
        recommendations: gasPrices
      }
    } catch (error) {
      console.error('Error estimating gas:', error)
      throw new Error('Failed to estimate gas costs')
    }
  }

  // Get gas price recommendations for different speeds
  private async getGasPriceRecommendations(chainId: number): Promise<{
    slow: GasPriceRecommendation
    standard: GasPriceRecommendation
    fast: GasPriceRecommendation
  }> {
    try {
      // For BNB Smart Chain, gas prices are more stable
      if (chainId === 56) {
        const baseGasPrice = parseEther('0.000000005') // 5 gwei equivalent for BSC
        
        return {
          slow: {
            maxFeePerGas: baseGasPrice.toString(),
            maxPriorityFeePerGas: (baseGasPrice / 2n).toString(),
            estimatedTime: '30-60 seconds',
            confidence: 95
          },
          standard: {
            maxFeePerGas: (baseGasPrice * 2n).toString(),
            maxPriorityFeePerGas: baseGasPrice.toString(),
            estimatedTime: '15-30 seconds',
            confidence: 98
          },
          fast: {
            maxFeePerGas: (baseGasPrice * 4n).toString(),
            maxPriorityFeePerGas: (baseGasPrice * 2n).toString(),
            estimatedTime: '5-15 seconds',
            confidence: 99
          }
        }
      }

      // For Ethereum and other networks, use higher gas prices
      const baseGasPrice = parseEther('0.00000002') // 20 gwei
      
      return {
        slow: {
          maxFeePerGas: baseGasPrice.toString(),
          maxPriorityFeePerGas: (baseGasPrice / 4n).toString(),
          estimatedTime: '2-5 minutes',
          confidence: 90
        },
        standard: {
          maxFeePerGas: (baseGasPrice * 2n).toString(),
          maxPriorityFeePerGas: (baseGasPrice / 2n).toString(),
          estimatedTime: '30-90 seconds',
          confidence: 95
        },
        fast: {
          maxFeePerGas: (baseGasPrice * 4n).toString(),
          maxPriorityFeePerGas: baseGasPrice.toString(),
          estimatedTime: '15-30 seconds',
          confidence: 99
        }
      }
    } catch (error) {
      console.error('Error getting gas price recommendations:', error)
      // Fallback to default values
      const defaultGasPrice = parseEther('0.00000001')
      return {
        slow: {
          maxFeePerGas: defaultGasPrice.toString(),
          maxPriorityFeePerGas: (defaultGasPrice / 2n).toString(),
          estimatedTime: '60+ seconds',
          confidence: 85
        },
        standard: {
          maxFeePerGas: (defaultGasPrice * 2n).toString(),
          maxPriorityFeePerGas: defaultGasPrice.toString(),
          estimatedTime: '30-60 seconds',
          confidence: 95
        },
        fast: {
          maxFeePerGas: (defaultGasPrice * 3n).toString(),
          maxPriorityFeePerGas: (defaultGasPrice * 2n).toString(),
          estimatedTime: '15-30 seconds',
          confidence: 98
        }
      }
    }
  }

  // Estimate gas limit based on operation type
  private estimateGasLimit(operation: string, data?: string): string {
    switch (operation) {
      case 'transfer':
        return '21000' // Standard ETH/BNB transfer
      case 'token_transfer':
        return '65000' // ERC20/BEP20 transfer
      case 'contract_call':
        // Estimate based on data length
        const dataLength = data ? (data.length - 2) / 2 : 0
        return Math.max(100000, 50000 + dataLength * 68).toString()
      default:
        return '100000' // Safe default
    }
  }

  // Convert gas cost to USD (mock implementation)
  private async convertToUSD(etherAmount: string, symbol: string): Promise<string | undefined> {
    try {
      // Mock conversion rates (in production, use real price API)
      const mockPrices: { [key: string]: number } = {
        'BNB': 300,
        'ETH': 2000,
        'MATIC': 0.8
      }

      const price = mockPrices[symbol] || 0
      const usdValue = parseFloat(etherAmount) * price

      return usdValue > 0.01 ? usdValue.toFixed(2) : '< 0.01'
    } catch (error) {
      console.warn('Failed to convert to USD:', error)
      return undefined
    }
  }

  // Check if operation type is sponsored
  private isOperationSponsored(operation: string): boolean {
    const sponsoredOperations = ['transfer', 'token_transfer']
    return sponsoredOperations.includes(operation)
  }

  // Record gas usage for tracking limits
  async recordGasUsage(userAddress: string, gasUsed: string, gasCost: string): Promise<void> {
    try {
      const today = this.getTodayKey()
      const month = this.getMonthKey()
      
      const gasCostEther = parseFloat(gasCost)
      
      // Update daily usage
      const dailyKey = `${userAddress}_${today}`
      const currentDaily = this.dailyUsage.get(dailyKey) || 0
      this.dailyUsage.set(dailyKey, currentDaily + gasCostEther)
      
      // Update monthly usage
      const monthlyKey = `${userAddress}_${month}`
      const currentMonthly = this.monthlyUsage.get(monthlyKey) || 0
      this.monthlyUsage.set(monthlyKey, currentMonthly + gasCostEther)
      
      // Update overall stats
      const statsKey = `${userAddress}_${this.currentNetwork.chainId}`
      const currentStats = this.gasUsageStats.get(statsKey) || {
        totalSpent: '0',
        transactionCount: 0,
        dailySpent: '0',
        monthlySpent: '0',
        averageGasPrice: '0',
        lastUpdated: Date.now()
      }
      
      currentStats.totalSpent = (parseFloat(currentStats.totalSpent) + gasCostEther).toString()
      currentStats.transactionCount += 1
      currentStats.dailySpent = (this.dailyUsage.get(dailyKey) || 0).toString()
      currentStats.monthlySpent = (this.monthlyUsage.get(monthlyKey) || 0).toString()
      currentStats.lastUpdated = Date.now()
      
      this.gasUsageStats.set(statsKey, currentStats)
      
      // Save to localStorage
      this.saveUsageStats()
      
      console.log('📊 Gas usage recorded:', {
        user: userAddress,
        gasUsed,
        gasCost,
        dailyTotal: currentStats.dailySpent,
        monthlyTotal: currentStats.monthlySpent
      })
    } catch (error) {
      console.warn('Failed to record gas usage:', error)
    }
  }

  // Get gas usage statistics for user
  getGasUsageStats(userAddress: string): GasUsageStats | null {
    const statsKey = `${userAddress}_${this.currentNetwork.chainId}`
    const stats = this.gasUsageStats.get(statsKey)
    
    if (!stats) {
      return null
    }

    // Add remaining quotas
    const today = this.getTodayKey()
    const month = this.getMonthKey()
    const dailyUsed = this.dailyUsage.get(`${userAddress}_${today}`) || 0
    const monthlyUsed = this.monthlyUsage.get(`${userAddress}_${month}`) || 0
    
    const dailyLimit = parseFloat(process.env.NEXT_PUBLIC_DAILY_GAS_LIMIT || '0.1')
    const monthlyLimit = parseFloat(process.env.NEXT_PUBLIC_MONTHLY_GAS_LIMIT || '1.0')

    return {
      ...stats,
      remainingDaily: Math.max(0, dailyLimit - dailyUsed).toString(),
      remainingMonthly: Math.max(0, monthlyLimit - monthlyUsed).toString()
    }
  }

  // Get gas optimization suggestions
  async getGasOptimizations(request: GasEstimateRequest): Promise<GasOptimization> {
    try {
      const estimate = await this.estimateGas(request)
      const tips: string[] = []

      // Add optimization tips based on network and operation
      if (this.currentNetwork.chainId === 56) {
        tips.push('Use BNB Smart Chain for lower fees compared to Ethereum')
        tips.push('Consider batching multiple transactions together')
      }

      if (request.operation === 'token_transfer') {
        tips.push('Token transfers use more gas than native transfers')
        tips.push('Check if recipient accepts the token to avoid failed transactions')
      }

      if (!estimate.isSponsored) {
        tips.push('This transaction is not eligible for gas sponsorship')
        tips.push('Consider smaller transaction amounts to qualify for sponsorship')
      }

      // Calculate potential savings
      const currentCost = parseFloat(estimate.estimatedCost)
      const optimizedCost = currentCost * 0.8 // Assume 20% savings with optimization
      const potentialSavings = (currentCost - optimizedCost).toString()

      return {
        suggestedGasPrice: estimate.recommendations?.standard.maxFeePerGas || estimate.maxFeePerGas,
        suggestedGasLimit: estimate.gasLimit,
        optimizationTips: tips,
        potentialSavings,
        estimatedConfirmationTime: estimate.recommendations?.standard.estimatedTime || '30-60 seconds'
      }
    } catch (error) {
      console.error('Error getting gas optimizations:', error)
      return {
        suggestedGasPrice: '0',
        suggestedGasLimit: '21000',
        optimizationTips: ['Unable to provide optimizations at this time'],
        potentialSavings: '0',
        estimatedConfirmationTime: 'Unknown'
      }
    }
  }

  // Get current gas policies for the network
  getCurrentGasPolicies(): GasPolicy[] {
    const currentNetwork = alchemyWallet.getCurrentNetwork()
    
    if (!currentNetwork.gasPolicy) {
      return []
    }

    // Mock policy data (in production, fetch from Alchemy API)
    return [{
      id: currentNetwork.gasPolicy,
      name: `${currentNetwork.name} Gas Sponsorship`,
      networkId: currentNetwork.chainId,
      active: true,
      sponsorshipType: 'conditional',
      dailyLimit: process.env.NEXT_PUBLIC_DAILY_GAS_LIMIT || '0.1',
      monthlyLimit: process.env.NEXT_PUBLIC_MONTHLY_GAS_LIMIT || '1.0',
      rules: [
        {
          type: 'spending_limit',
          conditions: { daily: '0.1', monthly: '1.0' },
          description: 'Daily and monthly spending limits',
          enabled: true
        },
        {
          type: 'allowlist',
          conditions: { operations: ['transfer', 'token_transfer'] },
          description: 'Only transfers are sponsored',
          enabled: true
        },
        {
          type: 'user_limit',
          conditions: { maxUsers: 1000 },
          description: 'Maximum sponsored users per day',
          enabled: true
        }
      ]
    }]
  }

  // Switch network and update gas manager context
  async switchNetwork(networkKey: string): Promise<boolean> {
    try {
      const network = SUPPORTED_NETWORKS[networkKey]
      if (!network) {
        return false
      }

      this.currentNetwork = network
      console.log('🔄 Gas Manager switched to network:', network.name)
      return true
    } catch (error) {
      console.error('Gas Manager network switch failed:', error)
      return false
    }
  }

  // Helper methods for date keys
  private getTodayKey(): string {
    return new Date().toISOString().split('T')[0]
  }

  private getMonthKey(): string {
    const date = new Date()
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  }

  private getTomorrowTimestamp(): number {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    return tomorrow.getTime()
  }

  private getNextMonthTimestamp(): number {
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1, 1)
    nextMonth.setHours(0, 0, 0, 0)
    return nextMonth.getTime()
  }

  // Save usage stats to localStorage
  private saveUsageStats(): void {
    try {
      const statsData = {
        usage: Object.fromEntries(this.gasUsageStats),
        daily: Object.fromEntries(this.dailyUsage),
        monthly: Object.fromEntries(this.monthlyUsage)
      }
      localStorage.setItem('alchemy_gas_usage', JSON.stringify(statsData))
    } catch (error) {
      console.warn('Failed to save gas usage stats:', error)
    }
  }

  // Load usage stats from localStorage
  private loadUsageStats(): void {
    try {
      const stored = localStorage.getItem('alchemy_gas_usage')
      if (stored) {
        const statsData = JSON.parse(stored)
        this.gasUsageStats = new Map(Object.entries(statsData.usage || {}))
        this.dailyUsage = new Map(Object.entries(statsData.daily || {}))
        this.monthlyUsage = new Map(Object.entries(statsData.monthly || {}))
      }
    } catch (error) {
      console.warn('Failed to load gas usage stats:', error)
    }
  }

  // Health check for gas manager
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy'
    gasManagerEnabled: boolean
    currentNetwork: string
    gasSponsorshipAvailable: boolean
    policiesLoaded: number
  }> {
    try {
      const enabled = process.env.NEXT_PUBLIC_GAS_MANAGER_ENABLED === 'true'
      const policies = this.getCurrentGasPolicies()
      const sponsorshipAvailable = !!this.currentNetwork.gasPolicy

      return {
        status: 'healthy',
        gasManagerEnabled: enabled,
        currentNetwork: this.currentNetwork.name,
        gasSponsorshipAvailable: sponsorshipAvailable,
        policiesLoaded: policies.length
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        gasManagerEnabled: false,
        currentNetwork: 'unknown',
        gasSponsorshipAvailable: false,
        policiesLoaded: 0
      }
    }
  }
}

const gasManager = new AlchemyGasManagerService()
export default gasManager