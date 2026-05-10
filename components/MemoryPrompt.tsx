'use client'

import { useState, useEffect } from 'react'

const PROMPTS = [
  "Qual é a sua memória de infância mais vívida?",
  "Existe algum cheiro que te transporta imediatamente para o passado?",
  "Qual foi o último momento em que você se sentiu verdadeiramente em paz?",
  "Se você pudesse reviver um único dia da sua vida, qual seria?",
  "Qual objeto na sua casa conta a melhor história?",
  "Uma música que define uma fase importante da sua vida.",
  "Qual foi a viagem que mais mudou quem você é?",
  "Um pequeno detalhe do seu dia de hoje que vale a pena ser lembrado."
]

export default function MemoryPrompt({ onSelectPrompt }: { onSelectPrompt: (prompt: string) => void }) {
  const [prompt, setPrompt] = useState("")
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Seleciona um prompt baseado no dia
    const day = new Date().getDate()
    setPrompt(PROMPTS[day % PROMPTS.length])
  }, [])

  if (!isVisible) return null

  return (
    <div style={{
      backgroundColor: 'var(--card-bg)',
      border: '1px solid var(--border)',
      padding: '24px',
      borderRadius: 'var(--radius)',
      marginBottom: '30px',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      boxShadow: 'var(--shadow)'
    }}>
      {/* Detalhe estético (aspas) */}
      <span className="material-symbols-outlined" style={{
        position: 'absolute',
        top: '-10px',
        right: '10px',
        fontSize: '80px',
        opacity: 0.03,
        pointerEvents: 'none'
      }}>
        auto_stories
      </span>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="meta" style={{ fontSize: '10px', letterSpacing: '2px', fontWeight: '900', color: 'var(--muted)' }}>
          MEMÓRIA DO DIA
        </span>
        <button 
          onClick={() => setIsVisible(false)}
          style={{ border: 'none', padding: '4px', background: 'none', cursor: 'pointer', color: 'var(--muted)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
        </button>
      </div>

      <h3 style={{ 
        fontFamily: '"Alfa Slab One", serif', 
        fontSize: '18px', 
        lineHeight: '1.4',
        margin: 0,
        fontWeight: 'normal'
      }}>
        {prompt}
      </h3>

      <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
        <button 
          onClick={() => onSelectPrompt(prompt)}
          className="button-primary"
          style={{ padding: '8px 20px', fontSize: '11px' }}
        >
          ESCREVER SOBRE ISSO
        </button>
        <button 
          onClick={() => {
            const nextIdx = (PROMPTS.indexOf(prompt) + 1) % PROMPTS.length
            setPrompt(PROMPTS[nextIdx])
          }}
          style={{ padding: '8px 20px', fontSize: '11px' }}
        >
          OUTRA IDEIA
        </button>
      </div>
    </div>
  )
}
