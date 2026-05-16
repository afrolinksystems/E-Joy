import { Card, CardContent } from '../../../components/ui/card'
import { Spinner } from '../../../components/ui/spinner'

export function PanelLoader() {
  return (
    <Card>
      <CardContent className="grid min-h-48 place-items-center text-muted-foreground">
        <Spinner />
      </CardContent>
    </Card>
  )
}
