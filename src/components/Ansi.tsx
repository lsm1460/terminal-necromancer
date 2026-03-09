import Convert from 'ansi-to-html'
import React, { useMemo } from 'react'

interface AnsiHtmlProps {
  message: string
  className?: string
}

const convert = new Convert({
  newline: true,
  escapeXML: false,
  stream: false,
})

export const AnsiHtml: React.FC<AnsiHtmlProps> = ({ message, className = '' }) => {
  const htmlContent = useMemo(() => {
    if (!message) return ''
    return convert.toHtml(message)
  }, [message])

  return (
    <p
      className={`break-keep whitespace-pre-wrap ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  )
}
