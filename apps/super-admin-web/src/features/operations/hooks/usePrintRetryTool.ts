import { useMutation } from '@apollo/client/react'
import { useState } from 'react'
import { RUN_PRINT_RETRY } from '../../../graphql/operations'
import type { PrintRetryResult } from '../operations.types'

export function usePrintRetryTool() {
  const [shopId, setShopId] = useState('')
  const [result, setResult] = useState('')
  const [run, state] = useMutation<{ runPrintRetryCycle?: PrintRetryResult }>(RUN_PRINT_RETRY)

  async function execute() {
    const response = await run({ variables: { shopId: shopId.trim() || null } })
    setResult(JSON.stringify(response.data?.runPrintRetryCycle ?? {}, null, 2))
  }

  return {
    execute,
    loading: state.loading,
    result,
    setShopId,
    shopId,
  }
}
