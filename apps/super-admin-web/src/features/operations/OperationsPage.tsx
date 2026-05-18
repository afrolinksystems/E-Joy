import { RefreshCw } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Field, FieldLabel } from '../../components/ui/field'
import { Input } from '../../components/ui/input'
import { Spinner } from '../../components/ui/spinner'
import { PrintRetryResult } from './components/PrintRetryResult'
import { usePrintRetryTool } from './hooks/usePrintRetryTool'

export function OperationsPage() {
  const retry = usePrintRetryTool()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Print retry tool</CardTitle>
        <CardDescription>Run the platform print retry cycle globally or for one shop.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Field className="min-w-0 flex-1">
            <FieldLabel htmlFor="retry-shop-id" className="sr-only">Optional shop id</FieldLabel>
            <Input
              id="retry-shop-id"
              value={retry.shopId}
              onChange={(event) => retry.setShopId(event.target.value)}
              placeholder="Optional shop id"
            />
          </Field>
          <Button type="button" onClick={() => void retry.execute()} disabled={retry.loading}>
            {retry.loading ? <Spinner data-icon="inline-start" /> : <RefreshCw data-icon="inline-start" />}
            Run retry
          </Button>
        </div>
        <PrintRetryResult result={retry.result} />
      </CardContent>
    </Card>
  )
}
