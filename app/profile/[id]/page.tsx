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
    
    await new Promise(resolve => setTimeout(resolve, 100));
    setLoading(true)
    setError(null)

    try {
      const authId = currentUser?.id || null

      const { data: pData, error: pError } = await supabase.from('users').select('*').eq('id', id).maybeSingle()
      if (pError) throw pError
      if (!pData) {
        setError("Perfil não encontrado.")
        setLoading(false)
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
      console.error("Erro na busca:", err)
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

  const buttonStyle: React.CSSProperties = {
    background: 'transparent', border: '1px solid var(--text-primary-color)', padding: '10px 24px',
    fontSize: '13px', color: 'var(--text-primary-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
    transition: 'all 0.2s', fontWeight: 'bold'
  }

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--background-color)', color: 'var(--text-primary-color)' }}>
      <Header />
      <main style={{ flexGrow: 1, width: '100%' }}>
        <Skeleton height="320px" width="100%" borderRadius={0} style={{ borderBottom: '1px solid var(--line-color)' }} />
        
        <div style={{ maxWidth: '1200px', margin: '-80px auto 0 auto', padding: '0 60px 80px 60px' }}>
          <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-end', marginBottom: '50px' }}>
            <Skeleton width="160px" height="140px" borderRadius={0} style={{ flexShrink: 0, border: '4px solid var(--background-color)' }} />
            <div style={{ flexGrow: 1, paddingBottom: '5px' }}>
              <Skeleton height="56px" width="300px" style={{ marginBottom: '20px' }} />
              <div style={{ display: 'flex', gap: '25px' }}>
                <Skeleton height="20px" width="100px" />
                <Skeleton height="20px" width="100px" />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', marginBottom: '80px' }}>
             <div style={{ flex: '2 1 400px' }}>
                <Skeleton height="20px" width="100%" style={{ marginBottom: '10px' }} />
                <Skeleton height="20px" width="90%" style={{ marginBottom: '10px' }} />
                <Skeleton height="20px" width="60%" />
             </div>
             <div style={{ flex: '1 1 200px' }}>
                <Skeleton height="15px" width="100px" style={{ marginBottom: '15px' }} />
                <Skeleton height="20px" width="150px" style={{ marginBottom: '10px' }} />
                <Skeleton height="20px" width="150px" />
             </div>
          </div>

          <div style={{ borderTop: '1px solid var(--line-color)', paddingTop: '60px' }}>
            <Skeleton height="28px" width="200px" style={{ marginBottom: '50px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '50px' }}>
               {Array.from({ length: 4 }).map((_, i) => (
                 <div key={i}>
                   <Skeleton height="260px" width="100%" style={{ marginBottom: '25px' }} />
                   <Skeleton height="24px" width="80%" style={{ marginBottom: '10px' }} />
                   <Skeleton height="15px" width="100%" style={{ marginBottom: '10px' }} />
                   <Skeleton height="15px" width="40%" />
                 </div>
               ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )

  if (error || !profile) return <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--background-color)', color: 'var(--text-primary-color)', padding: '20px', textAlign: 'center' }}>
    <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: '20px' }}>person_off</span>
    <p>{error}</p>
    <button onClick={() => router.push('/')} style={buttonStyle}>Voltar</button>
  </div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--background-color)', color: 'var(--text-primary-color)' }}>
      <Header />

      <main style={{ flexGrow: 1, width: '100%' }}>
        {/* Banner Section com mais altura */}
        <div style={{ width: '100%', height: '320px', backgroundColor: 'var(--line-color)', backgroundImage: profile.banner_url ? `url(${getOptimizedCloudinaryUrl(profile.banner_url, { width: 1200 })})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', borderBottom: '1px solid var(--line-color)' }} />
        
        {/* Content Container mais largo */}
        <div style={{ maxWidth: '1200px', margin: '-80px auto 0 auto', padding: '0 60px 80px 60px' }}>
          
          {/* Profile Header */}
          <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-end', marginBottom: '50px' }}>
            <div style={{ width: '140px', height: '140px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', flexShrink: 0 }}>
              <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                {profile.avatar_url ? <img src={getOptimizedCloudinaryUrl(profile.avatar_url, { width: 300, height: 300, crop: 'fill' })} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="material-symbols-outlined" style={{ fontSize: '40px' }}>person</span></div>}
              </div>
            </div>
            
            <div style={{ flexGrow: 1, paddingBottom: '5px' }}>
              <h2 style={{ margin: 0, fontSize: '56px', fontWeight: 'bold', lineHeight: 1, letterSpacing: '-2px' }}>{profile.username}</h2>
              <div style={{ display: 'flex', gap: '25px', marginTop: '20px', fontSize: '15px', color: 'var(--text-secondary-color)' }}>
                <span><strong style={{ color: 'var(--text-primary-color)' }}>{social.followers}</strong> seguidores</span>
                <span><strong style={{ color: 'var(--text-primary-color)' }}>{social.following}</strong> seguindo</span>
              </div>
            </div>

            <div style={{ paddingBottom: '5px' }}>
              {isOwner ? (
                <button onClick={() => router.push(`/profile/${id}/edit`)} style={buttonStyle}>Configurações de Perfil</button>
              ) : (
                <button onClick={handleFollow} disabled={followLoading} style={{ ...buttonStyle, background: social.isFollowing ? 'transparent' : 'var(--text-primary-color)', color: social.isFollowing ? 'var(--text-primary-color)' : 'var(--background-color)' }}>
                  {followLoading ? '...' : (social.isFollowing ? 'Seguindo' : 'Seguir')}
                </button>
              )}
            </div>
          </div>

          {/* Links e Bio com mais espaço */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', marginBottom: '80px' }}>
            {profile.bio && (
              <div style={{ flex: '2 1 400px' }}>
                <p style={{ fontSize: '20px', lineHeight: '1.6', whiteSpace: 'pre-wrap', color: 'var(--text-primary-color)' }}>{profile.bio}</p>
              </div>
            )}
            
            {profile.links && profile.links.length > 0 && (
              <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary-color)' }}>Links Pessoais</span>
                {profile.links.map((link: any, i: number) => (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-primary-color)', textDecoration: 'none', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--line-color)', paddingBottom: '8px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>link</span>
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Grid de Photobooks */}
          <div style={{ borderTop: '1px solid var(--line-color)', paddingTop: '60px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '50px' }}>
              <h3 style={{ fontSize: '28px', margin: 0, fontWeight: 'bold' }}>Photobooks <span style={{ color: 'var(--text-secondary-color)', fontSize: '18px', fontWeight: 'normal' }}>— {photobooks.length}</span></h3>
            </div>

            {photobooks.length === 0 ? (
              <div style={{ padding: '100px 20px', border: '1px dashed var(--line-color)', textAlign: 'center', color: 'var(--text-secondary-color)', fontSize: '18px' }}>
                Nenhum photobook publicado ainda.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '50px' }}>
                {photobooks.map((pb) => {
                  const cover = pb.photos?.[0]?.image_url;
                  const count = pb.photos?.length || 0;
                  return (
                    <div key={pb.id} style={{ display: 'flex', flexDirection: 'column', group: 'true' }}>
                      <div 
                        onClick={() => router.push(`/photobook/${pb.id}`)} 
                        style={{ cursor: 'pointer', aspectRatio: '4/3', backgroundColor: 'var(--line-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', border: '1px solid var(--line-color)' }}
                      >
                        {cover ? (
                          <img src={getOptimizedCloudinaryUrl(cover, { width: 700, height: 525, crop: 'fill' })} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }} />
                        ) : (
                          <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--text-secondary-color)' }}>photo_library</span>
                        )}
                        <div style={{ position: 'absolute', top: '15px', right: '15px', backgroundColor: 'var(--background-color)', color: 'var(--text-primary-color)', padding: '5px 10px', fontSize: '11px', fontWeight: 'bold', border: '1px solid var(--line-color)' }}>
                          {count} {count === 1 ? 'FOTO' : 'FOTOS'}
                        </div>
                      </div>
                      
                      <div style={{ marginTop: '25px' }}>
                        <h4 
                          onClick={() => router.push(`/photobook/${pb.id}`)} 
                          style={{ margin: '0 0 10px 0', fontSize: '24px', fontWeight: 'bold', cursor: 'pointer', lineHeight: '1.1', letterSpacing: '-0.5px' }}
                        >
                          {pb.title}
                        </h4>
                        <p style={{ fontSize: '15px', color: 'var(--text-secondary-color)', margin: '0 0 20px 0', lineHeight: '1.5', height: '45px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {pb.description || 'Sem descrição.'}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '15px', borderTop: '1px solid var(--line-color)' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary-color)', fontWeight: 'bold', textTransform: 'uppercase' }}>{new Date(pb.created_at).toLocaleDateString()}</span>
                          {isOwner && (
                            <button onClick={() => router.push(`/photobook/${pb.id}/edit`)} style={{ background: 'none', border: 'none', fontSize: '12px', fontWeight: 'bold', textDecoration: 'underline', cursor: 'pointer', color: 'var(--text-primary-color)' }}>Editar Álbum</button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
