'use client'

import { useMutation } from '@tanstack/react-query'
import { RelayRequest, RelayResponse } from '@/lib/schemas'

export function useRelayTransaction() {
  const mutation = useMutation<RelayResponse, Error, RelayRequest>({
    mutationFn: async (request: RelayRequest) => {
      const response = await fetch('/api/relay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to relay transaction')
      }
      
      return data
    },
  })

  return {
    relayTransaction: mutation.mutate,
    relayTransactionAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  }
}