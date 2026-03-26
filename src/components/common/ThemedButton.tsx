import React, { forwardRef } from 'react'

type ButtonAttributes = React.ButtonHTMLAttributes<HTMLButtonElement> & React.RefAttributes<HTMLButtonElement>

interface ThemedButtonComponent extends React.ForwardRefExoticComponent<ButtonAttributes> {
  round: React.ForwardRefExoticComponent<ButtonAttributes>
}

export const ThemedButton = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ children, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`
          text-button has-dot

          ${className} 
        `}
        {...props}
        onClick={(e) => {
          e.stopPropagation()

          props?.onClick?.(e)
        }}
      >
        {children}
      </button>
    )
  }
) as ThemedButtonComponent

ThemedButton.round = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ children, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`
          flex items-center justify-center
          w-8 h-8 rounded-full bg-black/50 text-primary
          hover:bg-primary/20 transition-colors
          ${className} 
        `}
        {...props}
        onClick={(e) => {
          e.stopPropagation()
          props?.onClick?.(e)
        }}
      >
        {children}
      </button>
    )
  }
)
