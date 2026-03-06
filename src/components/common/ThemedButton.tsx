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
        hover:bg-primary hover:text-black
        ${className} 
        `}
        {...props}
      >
        {children}
      </button>
    )
  }
)

ThemedButton.displayName = 'ThemedButton';
