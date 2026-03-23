'use client'

import React from 'react'

interface FormattedTextProps {
  text: string
}

const FormattedText: React.FC<FormattedTextProps> = ({ text }) => {
  if (!text) return null

  // Divide o texto por negrito (**...**) e itálico (*...*)
  // O regex captura os delimitadores para que eles sejam mantidos no array após o split
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g)

  return (
    <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} style={{ fontWeight: '800' }}>
              {part.slice(2, -2)}
            </strong>
          )
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return (
            <em key={i} style={{ fontStyle: 'italic', opacity: 0.9 }}>
              {part.slice(1, -1)}
            </em>
          )
        }
        return part
      })}
    </span>
  )
}

export default FormattedText
