'use client'

import { useState } from 'react'
import { useSupabase } from '@/lib/SupabaseProvider'
import { useToast } from '@/lib/ToastProvider'

interface MuralItemFormProps {
  onClose: () => void
  onSuccess: () => void
}

export default function MuralItemForm({ onClose, onSuccess }: MuralItemFormProps) {
  const supabase = useSupabase()
  const { toast } = useToast()
  
  const [type, setType] = useState<'text' | 'photo' | 'link'>('text')
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [isSubmitting, setIsPosting] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'miphobook_unsigned_upload')
    if (cloudName) formData.append('cloud_name', cloudName)

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (data.secure_url) {
        setContent(data.secure_url)
      } else {
        throw new Error(data.error?.message || "Erro no upload")
      }
    } catch (err: any) {
      toast(err.message, 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase || !content.trim()) return

    setIsPosting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Não autenticado")

      const { error } = await supabase.from('mural_items').insert({
        user_id: user.id,
        type,
        content: content.trim(),
        title: title.trim() || null
      })

      if (error) throw error

      toast("Preso no mural!", "success")
      onSuccess()
    } catch (err: any) {
      toast(err.message, 'error')
    } finally {
      setIsPosting(false)
    }
  }

  return (
    <div style={{ 
      backgroundColor: 'var(--card-bg)', 
      border: '1px solid var(--border)', 
      padding: '24px', 
      borderRadius: 'var(--radius)',
      marginBottom: '30px',
      boxShadow: 'var(--shadow)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '900' }}>O QUE VOCÊ QUER PRENDER?</h3>
        <button onClick={onClose} style={{ border: 'none', padding: '0', background: 'none', cursor: 'pointer' }}>
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          {(['text', 'photo', 'link'] as const).map((t) => (
            <button 
              key={t}
              type="button"
              onClick={() => { setType(t); setContent(''); }}
              style={{ 
                flex: 1, 
                backgroundColor: type === t ? 'var(--text)' : 'transparent',
                color: type === t ? 'var(--bg)' : 'var(--text)',
                fontSize: '10px'
              }}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {type === 'text' && (
          <textarea 
            placeholder="Escreva algo para o seu mural..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={4}
            style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text)', outline: 'none', resize: 'none' }}
          />
        )}

        {type === 'photo' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ border: '2px dashed var(--border)', padding: '20px', textAlign: 'center', borderRadius: 'var(--radius-sm)', position: 'relative' }}>
              <input type="file" accept="image/*" onChange={handleFileUpload} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
              {content ? (
                <img src={content} style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: 'var(--radius-sm)' }} />
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--muted)' }}>add_a_photo</span>
                  <p className="meta" style={{ margin: '5px 0 0 0' }}>{uploading ? 'ENVIANDO...' : 'CARREGAR FOTO'}</p>
                </>
              )}
            </div>
            <input 
              placeholder="Legenda (opcional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text)', outline: 'none' }}
            />
          </div>
        )}

        {type === 'link' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
             <input 
              placeholder="https://..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text)', outline: 'none' }}
            />
            <input 
              placeholder="Título do link"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text)', outline: 'none' }}
            />
          </div>
        )}

        {type === 'text' && (
          <input 
            placeholder="Título (opcional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text)', outline: 'none' }}
          />
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            type="submit" 
            disabled={isSubmitting || uploading || !content.trim()} 
            className="button-primary"
            style={{ flex: 1 }}
          >
            {isSubmitting ? 'PRENDENDO...' : 'PRENDER NO MURAL'}
          </button>
          <button type="button" onClick={onClose} style={{ flex: 1 }}>CANCELAR</button>
        </div>
      </form>
    </div>
  )
}
