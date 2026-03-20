'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/lib/SupabaseProvider'
import { useToast } from '@/lib/ToastProvider'
import Header from '@/components/Header'

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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: 'var(--bg)',
      color: 'var(--text)',
    }}>
      <Header />

      <main className="main-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card-border" style={{
          padding: '30px',
          width: '100%',
          maxWidth: '400px',
          backgroundColor: 'var(--bg)',
        }}>
          <h2 style={{ marginBottom: '20px', fontSize: '14px', fontWeight: '900', textTransform: 'uppercase' }}>Novo Photobook</h2>
          
          <form onSubmit={handleCreatePhotobook} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input
              type="text"
              placeholder="Título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ padding: '10px', border: '1px solid var(--border)', fontSize: '13px', backgroundColor: 'transparent', color: 'var(--text)', outline: 'none' }}
            />
            <textarea
              placeholder="Descrição (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{ padding: '10px', border: '1px solid var(--border)', fontSize: '13px', backgroundColor: 'transparent', color: 'var(--text)', outline: 'none', resize: 'none' }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{ height: '40px', fontSize: '11px' }}
            >
              {loading ? 'Criando...' : 'Criar Photobook'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
