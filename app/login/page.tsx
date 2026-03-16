'use client'

import { useState } from 'react'
import { useSupabase } from '@/lib/SupabaseProvider'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/ThemeProvider'
import { useToast } from '@/lib/ToastProvider'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSigningUp, setIsSigningUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = useSupabase()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const { toast } = useToast()

  const translateError = (message: string) => {
    if (message.includes('Invalid login credentials')) return 'E-mail ou senha incorretos. Verifique seus dados.'
    if (message.includes('User already registered')) return 'Este e-mail já está cadastrado. Tente entrar.'
    if (message.includes('Password should be at least')) return 'A senha deve ter pelo menos 6 caracteres.'
    if (message.includes('Email not confirmed')) return 'Por favor, confirme seu e-mail para entrar.'
    return `Erro: ${message}`
  }

  const handleAuth = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)

    if (!supabase) {
      toast('Sistema indisponível no momento.', 'error')
      setLoading(false)
      return
    }

    try {
      let authResponse
      if (isSigningUp) {
        authResponse = await supabase.auth.signUp({ email, password })
      } else {
        authResponse = await supabase.auth.signInWithPassword({ email, password })
      }

      const { data, error } = authResponse

      if (error) {
        toast(translateError(error.message), 'error')
        setLoading(false)
        return
      }

      if (data.user) {
        // Garantir que o perfil exista na tabela 'users'
        const { data: existingProfile } = await supabase
          .from('users')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle()

        if (!existingProfile) {
          const { error: createProfileError } = await supabase
            .from('users')
            .insert([
              {
                id: data.user.id,
                email: data.user.email,
                username: data.user.email?.split('@')[0] || `user_${data.user.id.substring(0, 8)}`,
              },
            ])

          if (createProfileError) {
            console.error('Erro detalhado ao criar perfil:', createProfileError)
            toast('Erro ao configurar seu perfil. Verifique as permissões do banco.', 'error')
            setLoading(false)
            return
          }
        }

        toast('Bem-vindo(a) ao Miphobook!', 'success')
        router.push('/')
      }
    } catch (err: any) {
      toast('Ocorreu um erro inesperado.', 'error')
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--background-color)', padding: '20px' }}>
      <div style={{ backgroundColor: 'var(--background-color)', padding: '40px', border: '1px solid var(--line-color)', width: '100%', maxWidth: '400px', textAlign: 'center', color: 'var(--text-primary-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '30px' }}>
            <h1 style={{ margin: 0, fontSize: '32px', fontFamily: '"Alfa Slab One", serif' }}>miphobook</h1>
            <button onClick={toggleTheme} style={{ background: 'none', border: '1px solid var(--text-primary-color)', padding: '5px', cursor: 'pointer', color: 'var(--text-primary-color)' }}>
                <span className="material-symbols-outlined">{theme === 'light' ? 'dark_mode' : 'light_mode'}</span>
            </button>
        </div>
        
        <h2 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: 'bold' }}>{isSigningUp ? 'Criar conta' : 'Entrar'}</h2>
        
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: '12px', border: '1px solid var(--line-color)', backgroundColor: 'transparent', color: 'var(--text-primary-color)', outline: 'none' }}
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ padding: '12px', border: '1px solid var(--line-color)', backgroundColor: 'transparent', color: 'var(--text-primary-color)', outline: 'none' }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ background: 'var(--text-primary-color)', color: 'var(--background-color)', border: 'none', padding: '12px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '10px' }}
          >
            {loading ? 'Aguarde...' : (isSigningUp ? 'Cadastrar' : 'Acessar')}
          </button>
        </form>

        <p style={{ marginTop: '20px', fontSize: '13px', color: 'var(--text-secondary-color)' }}>
          {isSigningUp ? 'Já tem conta?' : 'Não tem conta?'}
          <button type="button" onClick={() => setIsSigningUp(!isSigningUp)} style={{ background: 'none', border: 'none', color: 'var(--text-primary-color)', cursor: 'pointer', marginLeft: '5px', textDecoration: 'underline', fontWeight: 'bold' }}>
            {isSigningUp ? 'Fazer login' : 'Criar agora'}
          </button>
        </p>
      </div>
    </div>
  )
}
