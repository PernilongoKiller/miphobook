'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/lib/SupabaseProvider'
import { useToast } from '@/lib/ToastProvider'
import Header from '@/components/Header'
import Navigation from '@/components/Navigation'

export default function CreatePhotobookPage() {
  const router = useRouter()
  const supabase = useSupabase()
  const { toast } = useToast()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleCreatePhotobook = async (event: React.FormEvent) => {
    event.preventDefault()
    setMessage('')
    setLoading(true)

    if (!supabase) {
      toast('Supabase client not initialized.', 'error')
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast('Você precisa estar logado para criar um photobook.', 'error')
      setLoading(false)
      router.push('/login')
      return
    }

    if (!title) {
      toast('O título do photobook não pode ser vazio.', 'error')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('photobooks')
        .insert([
          {
            user_id: user.id,
            title,
            description,
          },
        ])
        .select()

      if (error) {
        console.error('Erro detalhado do Supabase:', error.message, error.details, error.hint)
        toast(`Erro: ${error.message || 'Falha ao salvar no banco.'}`, 'error')
        setLoading(false)
        return
      }

      toast('Photobook criado com sucesso!', 'success')
      setTitle('')
      setDescription('')
      router.push(`/profile/${user.id}`)
    } catch (err: any) {
      console.error('Unexpected error creating photobook:', err)
      toast(`Erro inesperado: ${err.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <Header />

      <div className="app-layout">
        <Navigation />

        <main className="main-feed" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div className="social-card" style={{
            padding: '40px',
            width: '100%',
            maxWidth: '500px',
            backgroundColor: 'var(--card-bg)',
          }}>
            <h2 style={{ marginBottom: '32px', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Novo Photobook</h2>
            
            <form onSubmit={handleCreatePhotobook} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <input
                type="text"
                placeholder="Título da sua história..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={{ padding: '12px 0', border: 'none', borderBottom: '1px solid var(--border)', fontSize: '14px', backgroundColor: 'transparent', color: 'var(--text)', outline: 'none' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <textarea
                  placeholder="Sobre o que é este álbum?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  style={{ padding: '12px 0', border: 'none', borderBottom: '1px solid var(--border)', fontSize: '14px', backgroundColor: 'transparent', color: 'var(--text)', outline: 'none', resize: 'none' }}
                />
                <p style={{ fontSize: '10px', color: 'var(--muted)', textAlign: 'left', margin: 0, opacity: 0.7 }}>
                  Dica: Você pode usar **negrito** e *itálico*.
                </p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="button-primary"
                style={{ height: '44px', fontSize: '11px', marginTop: '20px' }}
              >
                {loading ? 'PUBLICANDO...' : 'CRIAR PHOTOBOOK'}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
