import React, { forwardRef } from 'react'

export const ThemedButton = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ children, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`
          bg-transparent border border-transparent 
          text-primary font-inherit text-base 
          px-2.5 py-1 transition-colors
          
          cursor-pointer
          hover:bg-primary hover:text-gray-900
          focus:bg-primary focus:text-gray-900
          
          disabled:opacity-50 
          disabled:cursor-not-allowed 
          disabled:hover:bg-transparent 
          disabled:hover:text-primary
          
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
