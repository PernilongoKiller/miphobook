'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSupabase } from '@/lib/SupabaseProvider'
import { useTheme } from '@/lib/ThemeProvider'
import Header from '@/components/Header'
import Skeleton from '@/components/Skeleton'

export default function EditProfilePage() {
  const router = useRouter()
  const { id } = useParams();
  const supabase = useSupabase()
  
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [links, setLinks] = useState<any[]>([])
  const [avatarUrl, setAvatarUrl] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      if (!supabase || !id) return
      
      // SEGURANÇA MÁXIMA: Verifica se o usuário logado é o dono do perfil
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser || currentUser.id !== id) {
        console.error("Acesso negado: Você não é o dono deste perfil.")
        router.replace(`/profile/${id}`)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) {
        setError("Erro ao carregar dados do perfil.")
      } else if (data) {
        setUsername(data.username || '')
        setBio(data.bio || '')
        setLinks(data.links || [])
        setAvatarUrl(data.avatar_url || '')
        setBannerUrl(data.banner_url || '')
      }
      setLoading(false)
    }

    checkAuthAndFetch()
  }, [id, supabase, router])

  const handleUpload = async (file: File) => {
    if (!CLOUDINARY_CLOUD_NAME) return
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'miphobook_unsigned_upload')
    formData.append('cloud_name', CLOUDINARY_CLOUD_NAME)

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData
    })
    const data = await res.json()
    return data.secure_url
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({ username, bio, links, avatar_url: avatarUrl, banner_url: bannerUrl })
        .eq('id', id)
      
      if (error) throw error
      router.push(`/profile/${id}`)
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message)
      setSaving(false)
    }
  }

  const buttonStyle: React.CSSProperties = {
    background: 'transparent',
    border: '1px solid var(--text-primary-color)',
    padding: '10px 20px',
    fontSize: '14px',
    color: 'var(--text-primary-color)',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: '0.2s'
  }

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--background-color)', color: 'var(--text-primary-color)' }}>
      <Header />
      <main style={{ maxWidth: '600px', margin: '40px auto', width: '100%', padding: '0 20px' }}>
        <Skeleton width="200px" height="40px" style={{ marginBottom: '30px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          <div>
            <Skeleton width="80px" height="18px" style={{ marginBottom: '10px' }} />
            <Skeleton width="100%" height="120px" />
          </div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <Skeleton width="80px" height="80px" borderRadius="50%" />
            <Skeleton width="150px" height="20px" />
          </div>
          <div>
            <Skeleton width="80px" height="18px" style={{ marginBottom: '5px' }} />
            <Skeleton width="100%" height="45px" />
          </div>
          <div>
            <Skeleton width="50px" height="18px" style={{ marginBottom: '5px' }} />
            <Skeleton width="100%" height="120px" />
          </div>
        </div>
      </main>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--background-color)', color: 'var(--text-primary-color)' }}>
      <Header />

      <main style={{ maxWidth: '600px', margin: '40px auto', width: '100%', padding: '0 20px' }}>
        <h2 style={{ fontSize: '32px', marginBottom: '30px' }}>Configurações</h2>
        
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: 'bold' }}>Banner</label>
            <div style={{ height: '120px', backgroundColor: 'var(--line-color)', backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', border: '1px solid var(--line-color)' }}>
              <input type="file" accept="image/*" onChange={async (e) => { if(e.target.files?.[0]) setBannerUrl(await handleUpload(e.target.files[0])) }} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
              {!bannerUrl && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '12px' }}>Clique para subir banner</div>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--line-color)', overflow: 'hidden', border: '1px solid var(--line-color)' }}>
              {avatarUrl ? <img src={avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="material-symbols-outlined">person</span></div>}
            </div>
            <input type="file" accept="image/*" onChange={async (e) => { if(e.target.files?.[0]) setAvatarUrl(await handleUpload(e.target.files[0])) }} style={{ fontSize: '12px' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required style={{ width: '100%', padding: '12px', border: '1px solid var(--line-color)', backgroundColor: 'var(--background-color)', color: 'var(--text-primary-color)' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} style={{ width: '100%', padding: '12px', border: '1px solid var(--line-color)', backgroundColor: 'var(--background-color)', color: 'var(--text-primary-color)', resize: 'none' }} />
          </div>

          <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
            <button type="submit" disabled={saving} style={{ ...buttonStyle, background: 'var(--text-primary-color)', color: 'var(--background-color)' }}>{saving ? 'Salvando...' : 'Salvar Alterações'}</button>
            <button type="button" onClick={() => router.back()} style={buttonStyle}>Cancelar</button>
          </div>
        </form>
      </main>
    </div>
  )
}
