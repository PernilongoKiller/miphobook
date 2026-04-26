'use client'

import React from 'react'

interface FormattedTextProps {
  text: string
}

const FormattedText: React.FC<FormattedTextProps> = ({ text }) => {
  if (!text) return null

  // Divide o texto por linhas para processar blocos (listas, quotes)
  const lines = text.split('\n')

  return (
    <div style={{ 
      fontFamily: 'Georgia, "Times New Roman", serif', 
      lineHeight: '1.6', 
      fontSize: '16px',
      color: 'var(--text)',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim()
        
        // Blockquote (Citação)
        if (trimmed.startsWith('>')) {
          return (
            <blockquote key={idx} style={{ 
              margin: '10px 0', 
              paddingLeft: '20px', 
              borderLeft: '3px solid var(--text)', 
              fontStyle: 'italic',
              opacity: 0.8
            }}>
              {renderInlineStyles(trimmed.slice(1).trim())}
            </blockquote>
          )
        }

        // List item (Lista)
        if (trimmed.startsWith('- ')) {
          return (
            <div key={idx} style={{ display: 'flex', gap: '10px', paddingLeft: '5px' }}>
              <span>•</span>
              <span>{renderInlineStyles(trimmed.slice(2).trim())}</span>
            </div>
          )
        }

        // Linha vazia (parágrafo)
        if (trimmed === '') return <div key={idx} style={{ height: '10px' }} />

        return <p key={idx} style={{ margin: 0 }}>{renderInlineStyles(line)}</p>
      })}
    </div>
  )
}

// Função auxiliar para processar negrito, itálico e hashtags dentro das linhas
const renderInlineStyles = (text: string) => {
  // Regex para capturar **negrito**, *itálico* e #hashtags
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|#\w+)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ fontWeight: '700' }}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} style={{ fontStyle: 'italic' }}>{part.slice(1, -1)}</em>
    }
    if (part.startsWith('#')) {
      return (
        <span 
          key={i} 
          style={{ 
            fontWeight: '600', 
            cursor: 'pointer',
            opacity: 0.9
          }}
          onClick={(e) => {
            e.stopPropagation();
            console.log(`Buscando hashtag: ${part}`);
          }}
        >
          {part}
        </span>
      )
    }
    return part
  })
}

export default FormattedText
