'use client'

import { useState } from 'react'
import { useSupabase } from '@/lib/SupabaseProvider'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/ThemeProvider'
import { useToast } from '@/lib/ToastProvider'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
        const { data: existingProfile } = await supabase
          .from('users')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle()

        if (!existingProfile) {
          await supabase.from('users').insert([{
            id: data.user.id,
            email: data.user.email,
            username: data.user.email?.split('@')[0] || `user_${data.user.id.substring(0, 8)}`,
          }])
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--bg)', padding: '20px' }}>
      <div style={{ backgroundColor: 'var(--bg)', padding: '40px', border: '1px solid var(--border)', width: '100%', maxWidth: '400px', textAlign: 'center', color: 'var(--text)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '40px' }}>
            <h1 style={{ margin: 0, fontSize: '28px', fontFamily: '"Alfa Slab One", serif', letterSpacing: '-1px' }}>miphobook</h1>
            <button onClick={toggleTheme} style={{ background: 'none', border: '1px solid var(--border)', padding: '5px', cursor: 'pointer', color: 'var(--text)', display: 'flex', alignItems: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{theme === 'light' ? 'dark_mode' : 'light_mode'}</span>
            </button>
        </div>
        
        <h2 style={{ marginBottom: '25px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--muted)' }}>{isSigningUp ? 'Nova Curadoria' : 'Acesso à Ordem'}</h2>
        
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: '12px', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text)', outline: 'none', fontSize: '14px' }}
          />
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', boxSizing: 'border-box', padding: '12px', paddingRight: '45px', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text)', outline: 'none', fontSize: '14px' }}
            />
            <span 
              onClick={() => setShowPassword(!showPassword)}
              className="material-symbols-outlined" 
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '20px', color: 'var(--muted)', userSelect: 'none' }}
            >
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{ 
              background: 'var(--text)', color: 'var(--bg)', border: '1px solid var(--border)', padding: '14px', 
              fontWeight: '900', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', 
              cursor: loading ? 'not-allowed' : 'pointer', marginTop: '10px' 
            }}
          >
            {loading ? 'Processando...' : (isSigningUp ? 'Cadastrar' : 'Entrar')}
          </button>
        </form>

        <p style={{ marginTop: '25px', fontSize: '11px', color: 'var(--muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {isSigningUp ? 'Já tem conta?' : 'Não tem conta?'}
          <span onClick={() => setIsSigningUp(!isSigningUp)} style={{ cursor: 'pointer', marginLeft: '8px', textDecoration: 'underline', color: 'var(--text)' }}>
            {isSigningUp ? 'Fazer login' : 'Criar agora'}
          </span>
        </p>
      </div>
    </div>
  )
}
