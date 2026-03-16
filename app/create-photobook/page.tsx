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
        console.error('Full Supabase Error object:', error)
        toast(`Erro: ${error.message}`, 'error')
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
      backgroundColor: 'var(--background-color)',
      color: 'var(--text-primary-color)',
    }}>
      <Header />

      <main style={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        maxWidth: '600px',
        margin: 'auto',
      }}>
        <div style={{
          backgroundColor: 'var(--background-color)',
          padding: '40px',
          border: '1px solid var(--line-color)',
          width: '100%',
          textAlign: 'center',
        }}>
          <h2 style={{ marginBottom: '20px', fontSize: '28px', color: 'var(--text-primary-color)' }}>Criar Novo Photobook</h2>
          <form onSubmit={handleCreatePhotobook} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input
              type="text"
              placeholder="Título do Photobook"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{
                padding: '12px',
                border: '1px solid var(--line-color)',
                borderRadius: '0px',
                fontSize: '14px',
                backgroundColor: 'var(--background-color)',
                color: 'var(--text-primary-color)'
              }}
            />
            <textarea
              placeholder="Descrição (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              style={{
                padding: '12px',
                border: '1px solid var(--line-color)',
                borderRadius: '0px',
                fontSize: '14px',
                backgroundColor: 'var(--background-color)',
                color: 'var(--text-primary-color)'
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                background: 'transparent',
                border: '1px solid var(--text-primary-color)',
                padding: '6px 12px',
                fontSize: '14px',
                color: 'var(--text-primary-color)',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.1s ease-in-out, color 0.1s ease-in-out',
                opacity: loading ? 0.6 : 1,
              }}
              onMouseOver={(e) => { if (!loading) { e.currentTarget.style.backgroundColor = 'var(--text-primary-color)'; e.currentTarget.style.color = 'var(--background-color)'; }}}
              onMouseOut={(e) => { if (!loading) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-primary-color)'; }}}
            >
              {loading ? 'Criando...' : 'Criar Photobook'}
            </button>
          </form>
          {message && (
            <p style={{ marginTop: '20px', color: 'var(--text-secondary-color)' }}>
              {message}
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
