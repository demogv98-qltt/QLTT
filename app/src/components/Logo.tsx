import { useState } from 'react'
import { Calculator } from 'lucide-react'

interface LogoProps {
  className?: string
  imageClassName?: string
  showText?: boolean
  title?: string
  subtitle?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Logo({
  className = '',
  imageClassName = '',
  showText = true,
  title = 'HỌC TOÁN CÙNG TLM',
  subtitle = 'Trung tâm Toán học',
  size = 'md',
}: LogoProps) {
  const [imgSrc, setImgSrc] = useState('/logo.png')
  const [hasError, setHasError] = useState(false)

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  }

  const textSizeClasses = {
    sm: { title: 'text-sm font-bold', subtitle: 'text-[10px]' },
    md: { title: 'text-base font-bold', subtitle: 'text-xs' },
    lg: { title: 'text-lg font-extrabold', subtitle: 'text-xs' },
    xl: { title: 'text-xl font-black', subtitle: 'text-sm' },
  }

  const handleImageError = () => {
    if (imgSrc === '/logo.png') {
      setImgSrc('/logo.svg')
    } else {
      setHasError(true)
    }
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`relative flex items-center justify-center shrink-0 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs transition-transform hover:scale-105 ${sizeClasses[size]}`}
      >
        {!hasError ? (
          <img
            src={imgSrc}
            alt={title}
            onError={handleImageError}
            className={`h-full w-full object-contain p-0.5 ${imageClassName}`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-800 text-white">
            <Calculator className="h-5 w-5" />
          </div>
        )}
      </div>

      {showText && (
        <div className="flex flex-col min-w-0">
          <span className={`truncate leading-tight text-slate-900 tracking-tight font-sans ${textSizeClasses[size].title}`}>
            {title}
          </span>
          {subtitle && (
            <span className={`truncate leading-tight text-indigo-600 font-semibold mt-0.5 tracking-normal ${textSizeClasses[size].subtitle}`}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
