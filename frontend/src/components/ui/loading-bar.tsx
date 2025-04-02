"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils.ts"

const loadingBarVariants = cva("relative w-full overflow-hidden rounded-full bg-muted", {
  variants: {
    size: {
      md: "h-2",
    },
    variant: {
      gradient: "",
    },
  },
  defaultVariants: {
    size: "md",
  },
})

const progressVariants = cva("h-full rounded-full transition-all", {
  variants: {
    variant: {
      gradient: "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500",
    },
    animation: {
      shimmer: "animate-shimmer",
    },
  },
})

export interface LoadingBarProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof loadingBarVariants> {
  progress?: number
  animation?: "shimmer"
  showPercentage?: boolean
  percentagePosition?: "outside"
  indeterminate?: boolean
}

const LoadingBar = React.forwardRef<HTMLDivElement, LoadingBarProps>(
  (
    {
      className,
      size,
      variant,
      progress = 0,
      animation = "default",
      showPercentage = false,
      percentagePosition = "outside",
      indeterminate = false,
      ...props
    },
    ref,
  ) => {
    const [currentProgress, setCurrentProgress] = React.useState(progress)

    React.useEffect(() => {
      setCurrentProgress(progress)
    }, [progress])

    return (
      <div className="w-full">
        <div ref={ref} className={cn(loadingBarVariants({ size, variant, className }))} {...props}>
          <div
            className={cn(
              progressVariants({ variant }),
              indeterminate && "animate-indeterminate w-[30%]",
              !indeterminate && "transition-all duration-300 ease-in-out",
            )}
            style={{
              width: indeterminate ? undefined : `${currentProgress}%`,
            }}
          >
          </div>
        </div>
        {showPercentage && percentagePosition === "outside" && !indeterminate && (
          <div className="mt-1 text-right text-sm text-muted-foreground">{Math.round(currentProgress)}%</div>
        )}
      </div>
    )
  },
)
LoadingBar.displayName = "LoadingBar"

export { LoadingBar }

