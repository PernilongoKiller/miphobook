'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/lib/SupabaseProvider'
import { useTheme } from '@/lib/ThemeProvider'
import { useToast } from '@/lib/ToastProvider'
import Header from '@/components/Header'

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
            const publicId = photo.image_url.split('/').pop()?.split('.')[0];
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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <Header />

      <main style={{ flexGrow: 1, maxWidth: '600px', margin: '60px auto', width: '100%', padding: '0 20px' }}>
        <h2 style={{ fontSize: '32px', marginBottom: '40px', fontWeight: 'bold' }}>Configurações</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ padding: '20px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px' }}>Tema do Sistema</h3>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: 'var(--muted)' }}>Alterne entre modo claro e escuro</p>
            </div>
            <button onClick={toggleTheme} style={{ background: 'none', border: '1px solid var(--text)', padding: '10px', display: 'flex', cursor: 'pointer', color: 'var(--text)' }}>
              <span className="material-symbols-outlined">{theme === 'light' ? 'dark_mode' : 'light_mode'}</span>
            </button>
          </div>

          <div style={{ padding: '20px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px' }}>Sair da Conta</h3>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: 'var(--muted)' }}>Encerra sua sessão atual</p>
            </div>
            <button onClick={handleLogout} style={{ background: 'none', border: '1px solid var(--text)', padding: '10px 20px', cursor: 'pointer', color: 'var(--text)', fontWeight: 'bold' }}>Sair</button>
          </div>

          <div style={{ padding: '20px', border: '1px solid #ff4d4f', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#ff4d4f' }}>Excluir Conta</h3>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: 'var(--muted)' }}>Ação irreversível. Apaga todos os seus dados.</p>
            </div>
            <button onClick={handleDeleteAccount} disabled={loading} style={{ background: '#ff4d4f', border: 'none', padding: '10px 20px', cursor: 'pointer', color: 'white', fontWeight: 'bold', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Processando...' : 'Excluir'}
            </button>
          </div>

        </div>
      </main>
    </div>
  )
}
