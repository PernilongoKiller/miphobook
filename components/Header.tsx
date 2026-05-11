'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase, useUser } from '@/lib/SupabaseProvider'
import { useTheme } from '@/lib/ThemeProvider'
import { getOptimizedCloudinaryUrl, DEFAULT_AVATAR } from '@/lib/cloudinary'
import Skeleton from '@/components/Skeleton'

export default function Header() {
  const router = useRouter()
  const supabase = useSupabase()
  const { user, loading } = useUser()
  const userId = user?.id || null
  const { theme, toggleTheme } = useTheme()

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const mobileSearchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isMobileSearchOpen && mobileSearchInputRef.current) {
      mobileSearchInputRef.current.focus()
    }
  }, [isMobileSearchOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setShowResults(false)
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setShowNotifications(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!supabase || !userId) return
    const fetchNotifications = async () => {
      const { data } = await supabase.from('notifications').select('*, actor:actor_id(username, avatar_url)').eq('user_id', userId).order('created_at', { ascending: false }).limit(10)
      if (data) { setNotifications(data); setUnreadCount(data.filter(n => !n.read).length) }
    }
    fetchNotifications()
    const channel = supabase.channel('schema-db-changes').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, () => fetchNotifications()).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase, userId])

  const markAsRead = async () => {
    if (!supabase || !userId || unreadCount === 0) return
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId)
    setUnreadCount(0)
  }

  useEffect(() => {
    const handleSearch = async () => {
      if (!supabase || searchQuery.length < 2) { setSearchResults([]); setShowResults(false); return }
      setIsSearching(true)
      try {
        const [usersRes, pbRes] = await Promise.all([
          supabase.from('users').select('id, username, avatar_url').ilike('username', `%${searchQuery}%`).limit(3),
          supabase.from('photobooks').select('id, title, user_id').ilike('title', `%${searchQuery}%`).limit(3)
        ])
        setSearchResults([...(usersRes.data || []).map(u => ({ ...u, type: 'user' })), ...(pbRes.data || []).map(p => ({ ...p, type: 'pb' }))])
        setShowResults(true)
      } catch (err) { console.error(err) } finally { setIsSearching(false) }
    }
    const timer = setTimeout(handleSearch, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, supabase])

  const iconButtonStyle: React.CSSProperties = {
    background: 'none', border: 'none', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text)', position: 'relative'
  }

  return (
    <>
      <nav style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '10px 20px', 
        borderBottom: '1px solid var(--border)', 
        position: 'sticky', 
        top: 0, 
        backgroundColor: 'rgba(var(--bg-rgb), 0.8)', 
        backdropFilter: 'blur(15px)',
        WebkitBackdropFilter: 'blur(15px)',
        zIndex: 100 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <h1 onClick={() => router.push('/')} style={{ 
            margin: 0, 
            fontSize: '18px', 
            fontWeight: '400', 
            cursor: 'pointer', 
            fontFamily: '"Alfa Slab One", serif',
            color: 'var(--text)'
          }}>miphobook</h1>
          
          <div className="hide-on-mobile" ref={searchRef} style={{ position: 'relative', width: '300px' }}>
            <input 
              type="text" 
              placeholder="Pesquisar memórias ou pessoas..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              style={{ 
                width: '100%', 
                padding: '10px 16px 10px 40px',
                backgroundColor: 'rgba(var(--bg-rgb), 0.05)', 
                border: '1px solid var(--border)', 
                borderRadius: '20px',
                color: 'var(--text)', 
                fontSize: '13px', 
                outline: 'none' 
              }} 
            />
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', opacity: 0.5 }}>search</span>
            {showResults && (
              <div style={{ 
                position: 'absolute', 
                top: 'calc(100% + 8px)', 
                left: 0, 
                right: 0, 
                backgroundColor: 'var(--card-bg)', 
                border: '1px solid var(--border)', 
                borderRadius: 'var(--radius)',
                zIndex: 1000, 
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                overflow: 'hidden'
              }}>
                {searchResults.length === 0 ? (
                  <div style={{ padding: '16px', fontSize: '13px', color: 'var(--muted)', textAlign: 'center' }}>Nenhum resultado encontrado.</div>
                ) : searchResults.map(item => (
                  <div 
                    key={item.id + item.type} 
                    onClick={() => { router.push(item.type === 'user' ? `/profile/${item.id}` : `/photobook/${item.id}`); setShowResults(false); setSearchQuery(''); }} 
                    style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px' }}
                  >
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--border)', flexShrink: 0, overflow: 'hidden', backgroundColor: 'var(--border)' }}>
                      <img 
                        src={item.avatar_url ? getOptimizedCloudinaryUrl(item.avatar_url, { width: 56, height: 56 }) : DEFAULT_AVATAR} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        loading="lazy"
                        alt=""
                      />
                    </div>
                    <div style={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: '500' }}>
                      {item.type === 'user' ? item.username : item.title}
                    </div>
                    <span style={{ fontSize: '9px', opacity: 0.5, textTransform: 'uppercase' }}>{item.type === 'user' ? 'membro' : 'álbum'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {loading ? <Skeleton width="40px" height="20px" /> : userId ? (
            <>
              <div ref={notifRef} style={{ position: 'relative' }}>
                <button onClick={() => { setShowNotifications(!showNotifications); markAsRead(); }} style={iconButtonStyle}>
                  <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>notifications</span>
                  {unreadCount > 0 && <span style={{ position: 'absolute', top: '6px', right: '6px', width: '8px', height: '8px', backgroundColor: '#ed4956', borderRadius: '50%', border: '2px solid var(--bg)' }}></span>}
                </button>
                {showNotifications && (
                  <div style={{ 
                    position: 'absolute', 
                    top: 'calc(100% + 15px)', 
                    right: 0, 
                    width: '320px', 
                    backgroundColor: 'var(--card-bg)', 
                    border: '1px solid var(--border)', 
                    borderRadius: 'var(--radius)',
                    zIndex: 1000, 
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    padding: '8px 0',
                    overflow: 'hidden'
                  }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: '700', fontSize: '14px' }}>Notificações</div>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {notifications.length === 0 ? <p style={{ fontSize: '13px', padding: '40px 20px', textAlign: 'center', color: 'var(--muted)' }}>Tudo limpo por aqui.</p> : notifications.map(n => (
                        <div key={n.id} onClick={() => { setShowNotifications(false); router.push(n.type === 'follow' ? `/profile/${n.actor_id}` : `/photobook/${n.entity_id}`); }} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'var(--border)', flexShrink: 0 }}>
                            <img 
                              src={n.actor?.avatar_url ? getOptimizedCloudinaryUrl(n.actor.avatar_url, { width: 72, height: 72 }) : DEFAULT_AVATAR} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                              loading="lazy"
                              alt=""
                            />
                          </div>
                          <div style={{ flexGrow: 1, lineHeight: '1.4' }}>
                            <strong>{n.actor?.username}</strong> {n.type === 'like_pb' ? 'curtiu seu álbum' : n.type === 'follow' ? 'começou a seguir você' : 'interagiu'}
                            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>{new Date(n.created_at).toLocaleDateString()}</div>
                          </div>
                          {!n.read && <div style={{ width: '8px', height: '8px', backgroundColor: '#0095f6', borderRadius: '50%' }}></div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button onClick={toggleTheme} style={iconButtonStyle}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>{theme === 'light' ? 'dark_mode' : 'light_mode'}</span>
              </button>
              <div 
                onClick={() => router.push(`/profile/${userId}`)}
                style={{ width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', overflow: 'hidden', border: '1px solid var(--border)', backgroundColor: 'var(--border)', marginLeft: '8px' }}
              >
                <img 
                  src={user.user_metadata?.avatar_url ? getOptimizedCloudinaryUrl(user.user_metadata.avatar_url, { width: 64, height: 64 }) : DEFAULT_AVATAR} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  alt="Me"
                />
              </div>
            </>
          ) : <button onClick={() => router.push('/login')} className="button-primary" style={{ fontSize: '11px', padding: '8px 20px' }}>Entrar</button>}
        </div>
      </nav>

      {userId && (
        <div className="mobile-bottom-nav">
          <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: 'var(--text)' }}><span className="material-symbols-outlined" style={{ fontSize: '22px' }}>home</span></button>
          <button onClick={() => setIsMobileSearchOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--text)' }}><span className="material-symbols-outlined" style={{ fontSize: '22px' }}>search</span></button>
          <button onClick={() => router.push('/create-photobook')} style={{ background: 'none', border: 'none', color: 'var(--text)' }}><span className="material-symbols-outlined" style={{ fontSize: '22px' }}>add_box</span></button>
          <button onClick={() => router.push('/settings')} style={{ background: 'none', border: 'none', color: 'var(--text)' }}><span className="material-symbols-outlined" style={{ fontSize: '22px' }}>settings</span></button>
          <button onClick={() => router.push(`/profile/${userId}`)} style={{ background: 'none', border: 'none', color: 'var(--text)' }}><span className="material-symbols-outlined" style={{ fontSize: '22px' }}>person</span></button>
        </div>
      )}

      {isMobileSearchOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(var(--bg-rgb), 0.7)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', zIndex: 2000, padding: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
            <input ref={mobileSearchInputRef} type="text" placeholder="O que você está procurando?" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flexGrow: 1, padding: '10px 0', fontSize: '15px', border: 'none', borderBottom: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text)', outline: 'none' }} />
            <button onClick={() => { setIsMobileSearchOpen(false); setSearchQuery(''); }} className="meta" style={{ border: 'none', background: 'none' }}>FECHAR</button>
          </div>
          {searchResults.map(item => (
            <div 
              key={item.id + item.type} 
              onClick={() => { router.push(item.type === 'user' ? `/profile/${item.id}` : `/photobook/${item.id}`); setIsMobileSearchOpen(false); setSearchQuery(''); }} 
              style={{ padding: '15px 0', borderBottom: '1px solid var(--border)', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '15px' }}
            >
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--border)', flexShrink: 0, overflow: 'hidden', backgroundColor: 'var(--border)' }}>
                <img 
                  src={item.avatar_url ? getOptimizedCloudinaryUrl(item.avatar_url, { width: 56, height: 56 }) : DEFAULT_AVATAR} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  loading="lazy"
                  alt=""
                />
              </div>

              <div style={{ flexGrow: 1 }}>
                {item.type === 'user' ? item.username : item.title}
                <div className="meta" style={{ fontSize: '10px', marginTop: '2px' }}>{item.type === 'user' ? 'Membro' : 'Álbum'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
