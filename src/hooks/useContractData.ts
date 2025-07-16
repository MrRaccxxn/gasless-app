'use client'

import { useQuery } from '@tanstack/react-query'

interface ContractData {
  contractAddress: string
  chainId: number
  isPaused: boolean
  maxTransferAmount: string
  maxFeeAmount: string
  feeWallet: string
}

interface UserData {
  nonce: string
  usageStats: {
    requestCount: number
    gasUsed: string
    resetTime: number
    gasResetTime: number
  } | null
  isBanned: boolean
}

export function useContractData(userAddress?: string) {
  return useQuery<ContractData>({
    queryKey: ['contractData'],
    queryFn: async () => {
      const response = await fetch('/api/status')
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch contract data')
      }
      
      return data.data
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}

export function useUserData(userAddress?: string) {
  return useQuery<UserData>({
    queryKey: ['userData', userAddress],
    queryFn: async () => {
      if (!userAddress) throw new Error('User address required')
      
      const response = await fetch(`/api/user/${userAddress}`)
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch user data')
      }
      
      return data.data
    },
    enabled: !!userAddress,
    refetchInterval: 10000, // Refetch every 10 seconds
  })
}

export function useTokenData(tokenAddress?: string, userAddress?: string) {
  return useQuery({
    queryKey: ['tokenData', tokenAddress, userAddress],
    queryFn: async () => {
      if (!tokenAddress) throw new Error('Token address required')
      
      const url = userAddress 
        ? `/api/token/${tokenAddress}?user=${userAddress}`
        : `/api/token/${tokenAddress}`
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch token data')
      }
      
      return data.data
    },
    enabled: !!tokenAddress,
    refetchInterval: 15000, // Refetch every 15 seconds
  })
}