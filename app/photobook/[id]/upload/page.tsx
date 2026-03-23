'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSupabase } from '@/lib/SupabaseProvider'
import Header from '@/components/Header'

export default function UploadPhotoPage() {
  const router = useRouter()
  const { id } = useParams();
  const supabase = useSupabase()
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 })

  const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  const [uploadStatus, setUploadStatus] = useState<Record<number, 'pending' | 'uploading' | 'done' | 'error'>>({})

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const files = Array.from(event.target.files)
      setSelectedFiles(files)
      const initialStatus: Record<number, 'pending'> = {}
      files.forEach((_, i) => initialStatus[i] = 'pending')
      setUploadStatus(initialStatus)
    } else {
      setSelectedFiles([])
      setUploadStatus({})
    }
  }

  const handleUploadPhotos = async (event: React.FormEvent) => {
    event.preventDefault()
    setMessage('')
    setLoading(true)
    setUploadProgress({ current: 0, total: selectedFiles.length })

    if (!supabase || !id || selectedFiles.length === 0 || !CLOUDINARY_CLOUD_NAME) {
      setMessage('Verifique as configurações e selecione arquivos.')
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    try {
      const uploadedPhotos = []

      for (let i = 0; i < selectedFiles.length; i++) {
        setUploadStatus(prev => ({ ...prev, [i]: 'uploading' }))
        const file = selectedFiles[i]
        
        const formData = new FormData()
        formData.append('file', file)
        formData.append('upload_preset', 'miphobook_unsigned_upload')
        formData.append('cloud_name', CLOUDINARY_CLOUD_NAME)

        try {
          const cloudinaryResponse = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData,
          })

          const cloudinaryData = await cloudinaryResponse.json()

          if (cloudinaryData.error) throw new Error(cloudinaryData.error.message)

          uploadedPhotos.push({
            photobook_id: id,
            image_url: cloudinaryData.secure_url,
            description: description,
          })
          
          setUploadStatus(prev => ({ ...prev, [i]: 'done' }))
          setUploadProgress(prev => ({ ...prev, current: i + 1 }))
        } catch (err) {
          setUploadStatus(prev => ({ ...prev, [i]: 'error' }))
          throw err
        }
      }

      const { error: supabaseError } = await supabase.from('photos').insert(uploadedPhotos)
      if (supabaseError) throw supabaseError

      setMessage(`${selectedFiles.length} momentos publicados!`)
      setTimeout(() => router.push(`/photobook/${id}`), 1000)
    } catch (err: any) {
      setMessage(err.message || 'Erro no upload.')
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <Header />

      <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <div style={{ backgroundColor: 'var(--bg)', padding: '40px', border: '1px solid var(--border)', width: '100%', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '10px', fontSize: '28px', fontFamily: '"Alfa Slab One", serif' }}>Adicionar Momentos</h2>
          <p style={{ color: 'var(--muted)', marginBottom: '30px', fontSize: '14px' }}>Selecione uma ou mais fotos para o seu diário visual.</p>
          
          <form onSubmit={handleUploadPhotos} style={{ display: 'flex', flexDirection: 'column', gap: '25px', position: 'relative' }}>
            
            {loading && (
              <div style={{ position: 'absolute', top: '-10px', left: 0, width: '100%', height: '2px', backgroundColor: 'var(--border)' }}>
                <div style={{ 
                  height: '100%', 
                  backgroundColor: 'var(--text)', 
                  width: `${(uploadProgress.current / uploadProgress.total) * 100}%`,
                  transition: 'width 0.3s ease'
                }} />
              </div>
            )}

            <div style={{ border: '2px dashed var(--border)', padding: '40px', position: 'relative', cursor: 'pointer' }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                multiple
                disabled={loading}
                required
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: loading ? 'not-allowed' : 'pointer', width: '100%' }}
              />
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--muted)', marginBottom: '10px' }}>add_a_photo</span>
              <p style={{ margin: 0, fontSize: '14px' }}>{selectedFiles.length > 0 ? `${selectedFiles.length} arquivos selecionados` : 'Clique ou arraste fotos aqui'}</p>
            </div>

            {selectedFiles.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '4px', maxHeight: '400px', overflowY: 'auto', padding: '10px', border: '1px solid var(--border)' }}>
                {selectedFiles.map((file, idx) => (
                  <div key={idx} style={{ aspectRatio: '1/1', backgroundColor: 'var(--border)', overflow: 'hidden', position: 'relative' }}>
                    <img src={URL.createObjectURL(file)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: uploadStatus[idx] === 'uploading' ? 0.5 : 1 }} />
                    
                    {uploadStatus[idx] === 'uploading' && (
                       <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.3)' }}>
                          <div className="spinner" style={{ width: '20px', height: '20px', border: '2px solid var(--text)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                       </div>
                    )}

                    {uploadStatus[idx] === 'done' && (
                       <div style={{ position: 'absolute', top: '5px', right: '5px', backgroundColor: 'var(--text)', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>check</span>
                       </div>
                    )}

                    {uploadStatus[idx] === 'error' && (
                       <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,77,79,0.2)' }}>
                          <span className="material-symbols-outlined" style={{ color: '#ff4d4f' }}>error</span>
                       </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <textarea
                placeholder="Descreva estes momentos..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                disabled={loading}
                style={{ padding: '15px', border: '1px solid var(--border)', fontSize: '14px', backgroundColor: 'transparent', color: 'var(--text)', resize: 'none', outline: 'none' }}
              />
              <p style={{ fontSize: '10px', color: 'var(--muted)', textAlign: 'left', margin: 0 }}>
                Dica: **negrito**, *itálico*. Quebras de linha funcionam.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || selectedFiles.length === 0}
              style={{
                background: loading ? 'transparent' : 'var(--text)',
                border: '1px solid var(--text)',
                padding: '12px',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontWeight: '900',
                color: loading ? 'var(--text)' : 'var(--bg)',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {loading ? `Enviando ${uploadProgress.current}/${uploadProgress.total}` : 'Publicar Momentos'}
            </button>
          </form>

          <style jsx>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>

          {message && (
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'var(--border)', fontSize: '13px' }}>
              {message}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
