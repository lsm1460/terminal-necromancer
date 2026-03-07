import React, { forwardRef } from 'react'

export const ThemedButton = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ children, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`
        bg-transparent border border-transparent 
        text-primary cursor-pointer font-inherit text-base 
        px-2.5 py-1 transition-colors
        hover:bg-primary hover:text-gray-900
        focus:bg-primary focus:text-gray-900
        ${className} 
        `}
        {...props}
      >
        {children}
      </button>
    )
  }
)

ThemedButton.displayName = 'ThemedButton'
