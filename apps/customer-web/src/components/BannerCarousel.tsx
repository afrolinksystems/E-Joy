import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { twMerge } from 'tailwind-merge'

export interface BannerItem {
  id: string
  title: string
  image?: string
  /** 纯色 (#rgb / rgb) 或 Tailwind 渐变片段（以 `from-` 开头，将配合 `bg-gradient-to-br`） */
  bgColor?: string
}

export interface BannerCarouselProps {
  banners: BannerItem[]
  /** 根容器：与默认类合并（twMerge），可覆盖圆角、外边距等 */
  className?: string
  /**
   * Embla 视口（overflow 容器）：默认含 `rounded-2xl shadow-md`，
   * 沉浸式背景可传 `rounded-none shadow-none h-full` 等覆盖。
   */
  viewportClassName?: string
  /** 单张幻灯片内容区类名 */
  slideClassName?: string
  /**
   * 遮罩层：置于幻灯片之上、分页点之下，用于 `bg-gradient-to-t from-black/80 ...`。
   * 传入后分页点会固定叠在底部（与遮罩同栈，z 更高）。
   */
  overlayClassName?: string
  /** 底部分页点容器（在 overlay 模式下为 absolute 定位） */
  dotsClassName?: string
  /**
   * 固定高度内展示（配合根节点 `h-*`）：内部使用 flex 分配轮播区与圆点高度，
   * 文案字号略小，避免占满纵向空间。
   */
  compact?: boolean
  /** 仅作背景时不渲染幻灯片内标题文案（沉浸式店铺头图） */
  hideSlideContent?: boolean
}

const FALLBACK_GRADIENTS = [
  'from-amber-600 via-orange-600 to-red-700',
  'from-slate-800 via-slate-700 to-orange-900',
  'from-emerald-700 via-teal-700 to-cyan-900',
] as const

function resolveSlideBackground(
  banner: BannerItem,
  index: number,
): { className: string; style?: CSSProperties } {
  if (banner.image) {
    return { className: 'relative overflow-hidden bg-slate-800' }
  }
  const c = banner.bgColor?.trim()
  if (c?.startsWith('from-')) {
    return { className: twMerge('bg-gradient-to-br', c) }
  }
  if (c && /^(#|rgb)/.test(c)) {
    return { className: '', style: { backgroundColor: c } }
  }
  if (c) {
    return { className: c }
  }
  return {
    className: twMerge(
      'bg-gradient-to-br',
      FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length],
    ),
  }
}

export function BannerCarousel({
  banners,
  className,
  viewportClassName,
  slideClassName,
  overlayClassName,
  dotsClassName,
  compact = false,
  hideSlideContent = false,
}: BannerCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: banners.length > 1 }, [
    Autoplay({ delay: 4000, stopOnInteraction: false }),
  ])
  const [selectedIndex, setSelectedIndex] = useState(0)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('reInit', onSelect)
    emblaApi.on('select', onSelect)
    return () => {
      emblaApi.off('reInit', onSelect)
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi, onSelect])

  useEffect(() => {
    if (!emblaApi) return
    emblaApi.reInit()
  }, [emblaApi, banners])

  const scrollTo = useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index)
    },
    [emblaApi],
  )

  if (!banners.length) {
    return null
  }

  const defaultSlideClass = hideSlideContent
    ? 'h-full min-h-0 w-full'
    : compact
      ? 'flex h-full min-h-0 flex-col justify-center px-4 py-2 text-white sm:px-5'
      : 'flex aspect-[21/9] flex-col justify-center px-5 py-6 text-white sm:px-10 sm:py-8'

  const overlayMode = Boolean(overlayClassName)

  const slidesTrack = (
    <div className="flex h-full">
      {banners.map((banner, index) => {
        const bg = resolveSlideBackground(banner, index)
        return (
          <div
            key={banner.id}
            className="min-w-0 shrink-0 grow-0 basis-full"
          >
            <div
              className={twMerge(defaultSlideClass, bg.className, slideClassName)}
              style={
                banner.image
                  ? {
                      backgroundImage: `url(${banner.image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      ...bg.style,
                    }
                  : bg.style
              }
            >
              {banner.image ? (
                <div
                  className="absolute inset-0 bg-black/45"
                  aria-hidden
                />
              ) : null}
              {!hideSlideContent ? (
                <p
                  className={twMerge(
                    'text-balance font-bold tracking-tight',
                    banner.image && 'relative z-10',
                    compact
                      ? 'line-clamp-2 text-sm sm:text-base'
                      : 'text-lg sm:text-2xl',
                  )}
                >
                  {banner.title}
                </p>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )

  const dotsEl =
    banners.length > 1 ? (
      <div
        className={twMerge(
          'flex justify-center gap-2',
          overlayMode
            ? 'absolute bottom-3 left-0 right-0 z-20'
            : twMerge('mt-4', compact && 'mt-2 shrink-0'),
          dotsClassName,
        )}
        role="tablist"
        aria-label="Banner pagination"
      >
        {banners.map((b, index) => (
          <button
            key={b.id}
            type="button"
            role="tab"
            aria-selected={selectedIndex === index}
            aria-label={`Banner ${index + 1}`}
            onClick={() => scrollTo(index)}
            className={
              selectedIndex === index
                ? 'h-2 w-6 rounded-full bg-[#e67e22] transition-all'
                : 'h-2 w-2 rounded-full bg-white/50 transition-all hover:bg-white/80'
            }
          />
        ))}
      </div>
    ) : null

  const viewport = (
    <div
      ref={emblaRef}
      className={twMerge(
        'min-h-0 overflow-hidden rounded-2xl shadow-md',
        compact && 'h-full min-h-0',
        viewportClassName,
      )}
    >
      {slidesTrack}
    </div>
  )

  if (overlayMode) {
    return (
      <div
        className={twMerge(
          'w-full',
          compact && 'flex min-h-0 flex-col',
          className,
        )}
      >
        <div
          className={twMerge(
            'relative min-h-0 w-full flex-1',
            compact && 'min-h-0',
          )}
        >
          {viewport}
          <div
            className={twMerge(
              'pointer-events-none absolute inset-0 z-10',
              overlayClassName,
            )}
          />
          {dotsEl}
        </div>
      </div>
    )
  }

  return (
    <div
      className={twMerge(
        'w-full',
        compact && 'flex min-h-0 flex-col',
        className,
      )}
    >
      {viewport}
      {dotsEl}
    </div>
  )
}
