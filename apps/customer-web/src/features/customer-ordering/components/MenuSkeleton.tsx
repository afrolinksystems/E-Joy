import { Card, CardContent } from '../../../components/ui/card'
import { Skeleton } from '../../../components/ui/skeleton'

export function MenuSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <Card key={index} size="sm">
          <CardContent className="grid grid-cols-[106px_minmax(0,1fr)] gap-3 p-2 max-[380px]:grid-cols-[88px_minmax(0,1fr)]">
            <Skeleton className="size-[106px] rounded-lg max-[380px]:size-[88px]" />
            <div className="flex min-w-0 flex-col gap-3 py-1">
              <Skeleton className="h-5 w-4/5" />
              <Skeleton className="h-4 w-24" />
              <div className="mt-auto flex items-center justify-between">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="size-9 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
