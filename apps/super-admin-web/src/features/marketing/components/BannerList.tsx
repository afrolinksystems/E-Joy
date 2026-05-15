import { DataList } from '../../platform-console/components/DataList'
import type { Banner } from '../marketing.types'

type BannerListProps = {
  banners: Banner[]
  onCreate: () => void
  onDisable: (index: number) => void
}

export function BannerList({ banners, onCreate, onDisable }: BannerListProps) {
  return (
    <DataList
      title="Banners"
      actionLabel="New banner"
      onAction={onCreate}
      rows={banners.map((banner) => [banner.title, banner.status, banner.linkUrl ?? 'No link'])}
      rowAction={onDisable}
    />
  )
}
