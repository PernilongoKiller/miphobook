'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSupabase } from '@/lib/SupabaseProvider'
import Header from '@/components/Header'
import Skeleton from '@/components/Skeleton'

export default function EditProfilePage() {
  const router = useRouter()
  const { id } = useParams();
  const supabase = useSupabase()
  
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [links, setLinks] = useState<{ label: string, url: string }[]>([])
  const [avatarUrl, setAvatarUrl] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      if (!supabase || !id) return
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser || currentUser.id !== id) {
        router.replace(`/profile/${id}`)
        return
      }

      const { data } = await supabase.from('users').select('*').eq('id', id).single()
      if (data) {
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

  const addLink = () => setLinks([...links, { label: '', url: '' }])
  const removeLink = (index: number) => setLinks(links.filter((_, i) => i !== index))
  const updateLink = (index: number, field: 'label' | 'url', value: string) => {
    const newLinks = [...links]
    newLinks[index][field] = value
    setLinks(newLinks)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <Header />
      <main className="main-container">
        <Skeleton height="40px" width="200px" style={{ marginBottom: '40px' }} />
        <Skeleton height="400px" width="100%" />
      </main>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <Header />

      <main className="main-container" style={{ maxWidth: '600px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '40px', borderBottom: '2px solid var(--border)', paddingBottom: '10px' }}>Configurações de Perfil</h2>
        
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* BANNER EDIT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span className="meta">Banner do Perfil</span>
            <div className="card-border" style={{ height: '120px', backgroundColor: 'var(--border)', position: 'relative', overflow: 'hidden' }}>
              {bannerUrl && <img src={bannerUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              <input type="file" accept="image/*" onChange={async (e) => { if(e.target.files?.[0]) setBannerUrl(await handleUpload(e.target.files[0])) }} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
              <div style={{ position: 'absolute', bottom: '10px', right: '10px', backgroundColor: 'var(--bg)', padding: '4px 8px', fontSize: '9px', fontWeight: '900', border: '1px solid var(--border)' }}>ALTERAR BANNER</div>
            </div>
          </div>

          {/* AVATAR EDIT */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div className="card-border" style={{ width: '80px', height: '80px', backgroundColor: 'var(--bg)', overflow: 'hidden', flexShrink: 0 }}>
              {avatarUrl ? <img src={avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="material-symbols-outlined">person</span></div>}
            </div>
            <div style={{ position: 'relative' }}>
               <button type="button" style={{ height: '30px', fontSize: '10px' }}>ALTERAR FOTO</button>
               <input type="file" accept="image/*" onChange={async (e) => { if(e.target.files?.[0]) setAvatarUrl(await handleUpload(e.target.files[0])) }} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="meta">Nome de Usuário</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text)', outline: 'none', fontSize: '14px' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="meta">Bio / Manifestos</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text)', outline: 'none', fontSize: '14px', resize: 'none' }} />
              <p style={{ fontSize: '10px', color: 'var(--muted)', textAlign: 'left', margin: 0 }}>
                Dica: **negrito**, *itálico*. Quebras de linha funcionam.
              </p>
            </div>
          </div>

          {/* SEÇÃO DE LINKS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="meta">Links Pessoais</label>
              <button type="button" onClick={addLink} style={{ height: '24px', fontSize: '9px' }}>+ ADICIONAR</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {links.map((link, index) => (
                <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input 
                    placeholder="Ex: Instagram" 
                    value={link.label} 
                    onChange={(e) => updateLink(index, 'label', e.target.value)}
                    style={{ flex: 1, padding: '8px', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text)', fontSize: '12px', outline: 'none' }}
                  />
                  <input 
                    placeholder="https://..." 
                    value={link.url} 
                    onChange={(e) => updateLink(index, 'url', e.target.value)}
                    style={{ flex: 2, padding: '8px', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text)', fontSize: '12px', outline: 'none' }}
                  />
                  <button type="button" onClick={() => removeLink(index)} style={{ border: 'none', background: 'none', padding: '5px', color: 'var(--text)', cursor: 'pointer' }}>✕</button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
            <button type="submit" disabled={saving} style={{ flexGrow: 1, backgroundColor: 'var(--text)', color: 'var(--bg)', height: '45px' }}>
              {saving ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
            </button>
            <button type="button" onClick={() => router.back()} style={{ height: '45px' }}>CANCELAR</button>
          </div>
        </form>
      </main>
    </div>
  )
}
