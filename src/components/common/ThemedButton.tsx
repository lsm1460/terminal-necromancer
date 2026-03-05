import React from 'react'

interface ThemedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

const ThemedButton = ({ children, onClick, className = '', ...props }: ThemedButtonProps) => {
  return (
    <button
      onClick={onClick}
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

export default ThemedButton
