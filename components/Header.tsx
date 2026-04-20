'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase, useUser } from '@/lib/SupabaseProvider'
import { useTheme } from '@/lib/ThemeProvider'
import { getOptimizedCloudinaryUrl } from '@/lib/cloudinary'
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
        backgroundColor: 'var(--bg)', 
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
          
          <div className="hide-on-mobile" ref={searchRef} style={{ position: 'relative', width: '220px' }}>
            <input 
              type="text" 
              placeholder="Pesquisar..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              style={{ 
                width: '100%', 
                padding: '6px 0',
                backgroundColor: 'transparent', 
                border: 'none', 
                borderBottom: '1px solid var(--border)',
                color: 'var(--text)', 
                fontSize: '13px', 
                outline: 'none' 
              }} 
            />
            {showResults && (
              <div style={{ 
                position: 'absolute', 
                top: '100%', 
                left: 0, 
                right: 0, 
                backgroundColor: 'var(--bg)', 
                border: '1px solid var(--border)', 
                zIndex: 1000, 
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
              }}>
                {searchResults.map(item => (
                  <div 
                    key={item.id + item.type} 
                    onClick={() => { router.push(item.type === 'user' ? `/profile/${item.id}` : `/photobook/${item.id}`); setShowResults(false); setSearchQuery(''); }} 
                    style={{ padding: '10px', borderBottom: '1px solid var(--border)', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}
                  >
                    <div style={{ width: '24px', height: '24px', border: '1px solid var(--border)', flexShrink: 0, overflow: 'hidden' }}>
                      {item.type === 'user' ? (
                        item.avatar_url ? <img src={getOptimizedCloudinaryUrl(item.avatar_url, { width: 48, height: 48, crop: 'fill' })} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ backgroundColor: 'var(--border)', height: '100%' }} />
                      ) : (
                        <div style={{ backgroundColor: 'var(--text)', height: '100%', opacity: 0.1 }} />
                      )}
                    </div>
                    <div style={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.type === 'user' ? item.username : item.title}
                    </div>
                    <span style={{ fontSize: '9px', opacity: 0.5 }}>{item.type === 'user' ? 'membro' : 'álbum'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {loading ? <Skeleton width="40px" height="20px" /> : userId ? (
            <>
              <div className="hide-on-mobile" style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => router.push('/')} style={iconButtonStyle}>
                  <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>home</span>
                </button>
                <button onClick={() => router.push('/users')} style={iconButtonStyle}>
                  <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>group</span>
                </button>
                <button onClick={() => router.push('/create-photobook')} style={iconButtonStyle}>
                  <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>add_box</span>
                </button>
                <button onClick={() => router.push(`/profile/${userId}`)} style={iconButtonStyle}>
                  <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>person</span>
                </button>
              </div>
              <div ref={notifRef} style={{ position: 'relative' }}>
                <button onClick={() => { setShowNotifications(!showNotifications); markAsRead(); }} style={iconButtonStyle}>
                  <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>notifications</span>
                  {unreadCount > 0 && <span style={{ position: 'absolute', top: '6px', right: '6px', width: '6px', height: '6px', backgroundColor: 'red', borderRadius: '50%' }}></span>}
                </button>
                {showNotifications && (
                  <div style={{ position: 'absolute', top: '130%', right: 0, width: '260px', backgroundColor: 'var(--bg)', border: '1px solid var(--border)', zIndex: 1000, padding: '10px' }}>
                    {notifications.length === 0 ? <p style={{ fontSize: '11px', textAlign: 'center' }}>Sem avisos.</p> : notifications.map(n => (
                      <div key={n.id} onClick={() => { setShowNotifications(false); router.push(n.type === 'follow' ? `/profile/${n.actor_id}` : `/photobook/${n.entity_id}`); }} style={{ padding: '8px', borderBottom: '1px solid var(--border)', cursor: 'pointer', fontSize: '11px' }}>
                        <strong>{n.actor?.username}</strong> {n.type === 'like_pb' ? 'apreciou seu álbum' : 'interagiu'}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={toggleTheme} style={iconButtonStyle}>
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>{theme === 'light' ? 'dark_mode' : 'light_mode'}</span>
              </button>
            </>
          ) : <button onClick={() => router.push('/login')} style={{ fontSize: '11px' }}>Entrar</button>}
        </div>
      </nav>

      {userId && (
        <div className="mobile-bottom-nav">
          <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: 'var(--text)' }}><span className="material-symbols-outlined" style={{ fontSize: '22px' }}>home</span></button>
          <button onClick={() => setIsMobileSearchOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--text)' }}><span className="material-symbols-outlined" style={{ fontSize: '22px' }}>search</span></button>
          <button onClick={() => router.push('/create-photobook')} style={{ background: 'none', border: 'none', color: 'var(--text)' }}><span className="material-symbols-outlined" style={{ fontSize: '22px' }}>add_box</span></button>
          <button onClick={() => router.push('/about')} style={{ background: 'none', border: 'none', color: 'var(--text)' }}><span className="material-symbols-outlined" style={{ fontSize: '22px' }}>info</span></button>
          <button onClick={() => router.push(`/profile/${userId}`)} style={{ background: 'none', border: 'none', color: 'var(--text)' }}><span className="material-symbols-outlined" style={{ fontSize: '22px' }}>person</span></button>
        </div>
      )}

      {isMobileSearchOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'var(--bg)', zIndex: 2000, padding: '15px' }}>
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
              <div style={{ width: '32px', height: '32px', border: '1px solid var(--border)', flexShrink: 0, overflow: 'hidden' }}>
                {item.type === 'user' ? (
                  item.avatar_url ? <img src={getOptimizedCloudinaryUrl(item.avatar_url, { width: 64, height: 64, crop: 'fill' })} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ backgroundColor: 'var(--border)', height: '100%' }} />
                ) : (
                  <div style={{ backgroundColor: 'var(--text)', height: '100%', opacity: 0.1 }} />
                )}
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
