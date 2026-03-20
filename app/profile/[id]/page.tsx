'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSupabase, useUser } from '@/lib/SupabaseProvider'
import Header from '@/components/Header'
import Skeleton from '@/components/Skeleton'
import { getOptimizedCloudinaryUrl } from '@/lib/cloudinary'

export default function UserProfilePage() {
  const router = useRouter()
  const { id } = useParams()
  const supabase = useSupabase()
  const { user: currentUser } = useUser()
  
  const [profile, setProfile] = useState<any>(null)
  const [photobooks, setPhotobooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [social, setSocial] = useState({ isFollowing: false, followers: 0, following: 0 })
  const [followLoading, setFollowLoading] = useState(false)

  const fetchData = useCallback(async () => {
    if (!supabase || !id || id === 'null' || id === 'undefined') return
    setLoading(true)
    setError(null)

    try {
      const authId = currentUser?.id || null
      const { data: pData, error: pError } = await supabase.from('users').select('*').eq('id', id).maybeSingle()
      
      if (pError) throw pError
      if (!pData) {
        setError("Perfil não encontrado.")
        return
      }
      setProfile(pData)

      const [pbRes, followersRes, followingRes, isFollowingRes] = await Promise.allSettled([
        supabase.from('photobooks').select('*, photos(image_url)').eq('user_id', id).order('created_at', { ascending: false }),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', id),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', id),
        authId ? supabase.from('follows').select('*').eq('follower_id', authId).eq('following_id', id).maybeSingle() : Promise.resolve({ data: null })
      ])

      if (pbRes.status === 'fulfilled') setPhotobooks(pbRes.value.data || [])
      
      setSocial({
        followers: (followersRes.status === 'fulfilled' ? followersRes.value.count : 0) || 0,
        following: (followingRes.status === 'fulfilled' ? followingRes.value.count : 0) || 0,
        isFollowing: (isFollowingRes.status === 'fulfilled' ? !!isFollowingRes.value.data : false)
      })

    } catch (err: any) {
      console.error("Erro no Perfil:", err)
      setError("Erro ao carregar dados.")
    } finally {
      setLoading(false)
    }
  }, [supabase, id, currentUser])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleFollow = async () => {
    if (!supabase || !currentUser || followLoading) return
    setFollowLoading(true)
    try {
      if (social.isFollowing) {
        await supabase.from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', id)
        setSocial(s => ({ ...s, isFollowing: false, followers: Math.max(0, s.followers - 1) }))
      } else {
        await supabase.from('follows').insert({ follower_id: currentUser.id, following_id: id })
        setSocial(s => ({ ...s, isFollowing: true, followers: s.followers + 1 }))
      }
    } catch (err) { console.error(err) } finally { setFollowLoading(false) }
  }

  const isOwner = !!(currentUser && profile && currentUser.id === profile.id)

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <Header />
      <main className="main-container">
        <Skeleton height="200px" width="100%" style={{ marginBottom: '20px' }} />
        <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
          <Skeleton width="100px" height="100px" />
          <Skeleton width="200px" height="40px" />
        </div>
        <div className="responsive-grid">
           {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height="240px" width="100%" />)}
        </div>
      </main>
    </div>
  )

  if (error || !profile) return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <Header />
      <main className="main-container" style={{ textAlign: 'center', paddingTop: '100px' }}>
        <p className="meta">{error || "Não encontrado"}</p>
        <button onClick={() => router.push('/')} style={{ marginTop: '20px' }}>Voltar</button>
      </main>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <Header />

      <main className="main-container">
        
        {/* Banner Noir */}
        <div className="card-border" style={{ 
          width: '100%', 
          height: '200px', 
          backgroundColor: 'var(--border)', 
          overflow: 'hidden', 
          marginBottom: '20px',
          borderWidth: '2px'
        }}>
          {profile.banner_url && (
            <img 
              src={getOptimizedCloudinaryUrl(profile.banner_url, { width: 1200 })} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          )}
        </div>

        {/* Informações do Perfil */}
        <div style={{ borderBottom: '2px solid var(--border)', paddingBottom: '40px', marginBottom: '40px' }}>
          <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            
            {/* Avatar Quadrado Are.na */}
            <div className="card-border" style={{ width: '100px', height: '100px', backgroundColor: 'var(--bg)', flexShrink: 0, borderWidth: '2px' }}>
              {profile.avatar_url ? (
                <img src={getOptimizedCloudinaryUrl(profile.avatar_url, { width: 200, height: 200, crop: 'fill' })} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '40px' }}>person</span>
                </div>
              )}
            </div>

            <div style={{ flexGrow: 1, minWidth: '250px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', marginBottom: '15px' }}>
                <h2 style={{ fontSize: '28px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '-1px' }}>{profile.username}</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {isOwner ? (
                    <button onClick={() => router.push(`/profile/${id}/edit`)} style={{ height: '32px', fontSize: '10px' }}>EDITAR PERFIL</button>
                  ) : (                    <button onClick={handleFollow} disabled={followLoading} style={{ height: '32px', fontSize: '10px', backgroundColor: social.isFollowing ? 'transparent' : 'var(--text)', color: social.isFollowing ? 'var(--text)' : 'var(--bg)' }}>
                      {social.isFollowing ? 'SEGUINDO' : 'SEGUIR'}
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <span className="meta">{social.followers} SEGUIDORES</span>
                <span className="meta">{social.following} SEGUINDO</span>
                <span className="meta">{photobooks.length} ÁLBUNS</span>
              </div>

              {profile.bio && (
                <p style={{ fontSize: '13px', lineHeight: '1.4', marginBottom: '20px', maxWidth: '600px' }}>{profile.bio}</p>
              )}

              {/* Links Pessoais Minimalistas */}
              {profile.links && profile.links.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                  {profile.links.map((link: any, i: number) => (
                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="meta" style={{ textDecoration: 'underline', color: 'var(--text)' }}>
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Grade de Álbuns */}
        <div className="responsive-grid">
          {photobooks.map((pb) => {
            const cover = pb.photos?.[0]?.image_url;
            return (
              <div 
                key={pb.id} 
                className="card-border" 
                onClick={() => router.push(`/photobook/${pb.id}`)}
                style={{ position: 'relative', display: 'flex', flexDirection: 'column', cursor: 'pointer', overflow: 'hidden' }}
              >
                <div style={{ aspectRatio: '1/1', overflow: 'hidden' }}>
                  {cover ? (
                    <img src={getOptimizedCloudinaryUrl(cover, { width: 500, height: 500, crop: 'fill' })} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--border)' }}>photo_library</span>
                    </div>
                  )}
                </div>
                <div style={{ padding: '12px', borderTop: '2px solid var(--border)' }}>
                  <h4 style={{ margin: 0, fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', lineHeight: '1.1' }}>{pb.title}</h4>
                  <span className="meta" style={{ marginTop: '4px', fontSize: '9px', opacity: 0.7 }}>{pb.photos?.length || 0} fotos</span>
                </div>
              </div>
            )
          })}
        </div>

        {photobooks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px', border: '2px dashed var(--border)' }}>
            <p className="meta">Nenhum álbum publicado.</p>
          </div>
        )}
      </main>
    </div>
  )
}
