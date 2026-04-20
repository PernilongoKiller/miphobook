'use client'

import { useState, useRef } from 'react'
import { useSupabase, useUser } from '@/lib/SupabaseProvider'
import { useToast } from '@/lib/ToastProvider'
import { getOptimizedCloudinaryUrl } from '@/lib/cloudinary'

export default function PostComposer({ onPostCreated }: { onPostCreated: () => void }) {
  const supabase = useSupabase()
  const { user } = useUser()
  const { toast } = useToast()
  
  const [content, setContent] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isPosting, setIsPosting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'ml_default') // Certifique-se de que este preset está configurado no seu Cloudinary

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      setImage(data.secure_url)
    } catch (err) {
      toast('Erro ao carregar imagem.', 'error')
    } finally {
      setIsUploading(false)
    }
  }

  const handlePost = async () => {
    if (!supabase || !user || !content.trim()) return
    setIsPosting(true)

    try {
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        content: content.trim(),
        image_url: image
      })

      if (error) throw error

      setContent('')
      setImage(null)
      toast('Postado com sucesso!', 'success')
      onPostCreated()
    } catch (err) {
      toast('Erro ao publicar post.', 'error')
    } finally {
      setIsPosting(false)
    }
  }

  if (!user) return null

  return (
    <div className="social-card" style={{ padding: '16px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0 }}>
          {user.user_metadata?.avatar_url ? (
            <img src={getOptimizedCloudinaryUrl(user.user_metadata.avatar_url, { width: 80, height: 80, crop: 'fill' })} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--border)' }} />
          )}
        </div>
        <div style={{ flexGrow: 1 }}>
          <textarea 
            placeholder="O que você está pensando?" 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{ 
              width: '100%', 
              minHeight: '80px', 
              border: 'none', 
              backgroundColor: 'transparent', 
              color: 'var(--text)', 
              fontSize: '15px', 
              outline: 'none',
              resize: 'none',
              fontFamily: 'inherit'
            }}
          />
          
          {image && (
            <div style={{ position: 'relative', marginTop: '10px', width: 'fit-content' }}>
              <img src={getOptimizedCloudinaryUrl(image, { width: 400 })} style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px', border: '1px solid var(--border)' }} />
              <button 
                onClick={() => setImage(null)}
                style={{ 
                  position: 'absolute', top: '-8px', right: '-8px', 
                  backgroundColor: 'var(--text)', color: 'var(--bg)', 
                  border: 'none', borderRadius: '50%', width: '20px', height: '20px', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' 
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
              </button>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isPosting}
              style={{ border: 'none', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--muted)', padding: '6px' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>image</span>
              <span style={{ fontSize: '12px', fontWeight: '600' }}>{isUploading ? 'CARREGANDO...' : 'FOTO'}</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} accept="image/*" />

            <button 
              onClick={handlePost} 
              disabled={!content.trim() || isPosting || isUploading}
              className="button-primary"
              style={{ padding: '6px 20px', fontSize: '12px' }}
            >
              {isPosting ? 'POSTANDO...' : 'POSTAR'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
