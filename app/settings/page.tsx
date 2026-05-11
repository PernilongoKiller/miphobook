'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/lib/SupabaseProvider'
import { useTheme } from '@/lib/ThemeProvider'
import { useToast } from '@/lib/ToastProvider'
import Header from '@/components/Header'
import Navigation from '@/components/Navigation'
import { extractPublicIdFromUrl } from '@/lib/cloudinary'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = useSupabase()
  const { theme, toggleTheme } = useTheme()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const fetchUser = async () => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setUser(user)
      }
    }
    fetchUser()
  }, [supabase, router])

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleDeleteAccount = async () => {
    if (!supabase || !user) return;

    const confirm1 = window.confirm("ATENÇÃO: Você está prestes a apagar sua conta permanentemente. Todos os seus photobooks e fotos serão perdidos. Deseja continuar?");
    if (!confirm1) return;

    const confirm2 = window.prompt("Para confirmar a exclusão, digite seu e-mail:");
    if (confirm2 !== user.email) {
      toast("E-mail incorreto. Ação cancelada.", "error");
      return;
    }

    setLoading(true);

    try {
      // 1. Buscar e apagar fotos do Cloudinary
      const { data: photobooks } = await supabase.from('photobooks').select('id').eq('user_id', user.id);
      
      if (photobooks && photobooks.length > 0) {
        const pbIds = photobooks.map(pb => pb.id);
        
        // Buscar todas as fotos para pegar os IDs do Cloudinary
        const { data: photos } = await supabase.from('photos').select('image_url').in('photobook_id', pbIds);
        
        if (photos && photos.length > 0) {
          await Promise.all(photos.map(async (photo) => {
            const publicId = extractPublicIdFromUrl(photo.image_url);
            if (publicId) {
              await fetch('/api/cloudinary/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ publicId }),
              });
            }
          }));
        }

        // 2. Apagar dados do Supabase (Ordem: Fotos -> Photobooks -> User)
        // Apagar fotos
        await supabase.from('photos').delete().in('photobook_id', pbIds);
        
        // Apagar photobooks
        await supabase.from('photobooks').delete().eq('user_id', user.id);
      }

      // 3. Apagar perfil do usuário
      const { error: deleteError } = await supabase.from('users').delete().eq('id', user.id);
      
      if (deleteError) {
        throw new Error(deleteError.message);
      }

      // 4. Logout
      await supabase.auth.signOut();
      toast("Sua conta e dados foram excluídos.", "success");
      setTimeout(() => router.push('/login'), 2000);
      
    } catch (err: any) {
      console.error("Erro ao excluir conta:", err);
      toast(`Erro ao excluir conta: ${err.message}`, "error");
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <Header />

      <div className="app-layout">
        <Navigation />

        <main className="main-feed">
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>Configurações</h2>
            <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '8px' }}>Gerencie sua conta e preferências.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div className="social-card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700' }}>Tema do Sistema</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--muted)' }}>Alterne entre modo claro e escuro</p>
              </div>
              <button onClick={toggleTheme} style={{ background: 'none', border: '1px solid var(--border)', padding: '8px', display: 'flex', cursor: 'pointer', color: 'var(--text)', borderRadius: 'var(--radius)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{theme === 'light' ? 'dark_mode' : 'light_mode'}</span>
              </button>
            </div>

            <div className="social-card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700' }}>Sair da Conta</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--muted)' }}>Encerra sua sessão atual</p>
              </div>
              <button onClick={handleLogout} className="button-primary" style={{ padding: '8px 20px', fontSize: '11px' }}>SAIR</button>
            </div>

            <div className="social-card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderColor: 'rgba(255, 77, 79, 0.2)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#ff4d4f' }}>Excluir Conta</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--muted)' }}>Ação irreversível. Apaga todos os seus dados.</p>
              </div>
              <button onClick={handleDeleteAccount} disabled={loading} style={{ background: '#ff4d4f', border: 'none', padding: '8px 20px', cursor: 'pointer', color: 'white', fontWeight: '700', fontSize: '10px', opacity: loading ? 0.6 : 1, borderRadius: 'var(--radius-sm)' }}>
                {loading ? 'PROCESSANDO...' : 'EXCLUIR'}
              </button>
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}
