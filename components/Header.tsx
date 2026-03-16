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

  // Notificações
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!supabase || !userId) return

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*, actor:actor_id(username, avatar_url)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (!error && data) {
        setNotifications(data)
        setUnreadCount(data.filter(n => !n.read).length)
      }
    }

    fetchNotifications()

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, 
      () => fetchNotifications())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, userId])

  const markAsRead = async () => {
    if (!supabase || !userId || unreadCount === 0) return
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId)
    setUnreadCount(0)
  }

  useEffect(() => {
    const handleSearch = async () => {
      if (!supabase || searchQuery.length < 2) {
        setSearchResults([])
        setShowResults(false)
        return
      }
      setIsSearching(true)
      
      try {
        const [usersRes, pbRes] = await Promise.all([
          supabase.from('users').select('id, username, avatar_url').ilike('username', `%${searchQuery}%`).limit(3),
          supabase.from('photobooks').select('id, title, user_id').ilike('title', `%${searchQuery}%`).limit(3)
        ])

        const users = (usersRes.data || []).map(u => ({ ...u, type: 'user' }))
        const pbs = (pbRes.data || []).map(p => ({ ...p, type: 'pb' }))
        
        setSearchResults([...users, ...pbs])
        setShowResults(true)
      } catch (err) {
        console.error(err)
      } finally {
        setIsSearching(false)
      }
    }
    const timer = setTimeout(handleSearch, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, supabase])

  const buttonStyle: React.CSSProperties = {
    background: 'transparent',
    border: '1px solid var(--text-primary-color)',
    padding: '8px 16px',
    fontSize: '13px',
    color: 'var(--text-primary-color)',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    height: '36px',
    fontWeight: 'bold'
  }

  const iconButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--text-primary-color)',
    position: 'relative'
  }

  return (
    <nav style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '12px 20px', 
      borderBottom: '1px solid var(--line-color)', 
      position: 'sticky', 
      top: 0, 
      backgroundColor: 'var(--background-color)', 
      zIndex: 100 
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexGrow: 1 }}>
        <h1 onClick={() => router.push('/')} style={{ margin: 0, fontSize: '20px', fontFamily: '"Alfa Slab One", serif', cursor: 'pointer', letterSpacing: '-1px' }}>miphobook</h1>
        
        <div ref={searchRef} style={{ position: 'relative', width: '100%', maxWidth: '200px' }}>
          <input
            type="text"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '6px 10px', backgroundColor: 'transparent', border: '1px solid var(--line-color)', color: 'var(--text-primary-color)', fontSize: '11px', outline: 'none' }}
          />
          {showResults && (
            <div style={{ position: 'absolute', top: '105%', left: 0, right: 0, backgroundColor: 'var(--background-color)', border: '1px solid var(--line-color)', zIndex: 1000, boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}>
              {searchResults.length > 0 ? searchResults.map(item => (
                <div 
                  key={item.id + item.type} 
                  onClick={() => { 
                    router.push(item.type === 'user' ? `/profile/${item.id}` : `/photobook/${item.id}`); 
                    setShowResults(false); 
                    setSearchQuery('');
                  }} 
                  style={{ padding: '12px', cursor: 'pointer', borderBottom: '1px solid var(--line-color)', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {item.type === 'user' ? (
                      <>
                        {item.avatar_url ? (
                          <img src={getOptimizedCloudinaryUrl(item.avatar_url, { width: 48, height: 48, crop: 'fill' })} style={{ width: '20px', height: '20px', objectFit: 'cover' }} />
                        ) : (
                          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>person</span>
                        )}
                        <span>{item.username}</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>photo_library</span>
                        <span style={{ fontWeight: 'bold' }}>{item.title}</span>
                      </>
                    )}
                  </div>
                  <span style={{ fontSize: '9px', fontWeight: '900', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {item.type === 'user' ? 'Membro' : 'Álbum'}
                  </span>
                </div>
              )) : (
                <div style={{ padding: '12px', fontSize: '12px', color: 'var(--text-secondary-color)' }}>Nada encontrado.</div>
              )}
            </div>
          )}
        </div>
        
        <button onClick={() => router.push('/about')} style={{ ...buttonStyle, border: 'none' }}>Sobre</button>
      </div>

      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
        {loading ? (
          <Skeleton width="120px" height="30px" />
        ) : userId ? (
          <>
            {/* Notificações */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button onClick={() => { setShowNotifications(!showNotifications); markAsRead(); }} style={iconButtonStyle}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: unreadCount > 0 ? "'FILL' 1" : "none" }}>notifications</span>
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: '2px', right: '2px', background: '#ff4d4f', color: 'white', fontSize: '9px', padding: '2px 4px', fontWeight: 'bold' }}>{unreadCount}</span>
                )}
              </button>

              {showNotifications && (
                <div style={{ position: 'absolute', top: '130%', right: 0, width: '280px', backgroundColor: 'var(--background-color)', border: '1px solid var(--line-color)', boxShadow: '0 15px 40px rgba(0,0,0,0.1)', zIndex: 1000 }}>
                  <div style={{ padding: '12px 15px', fontWeight: 'bold', borderBottom: '1px solid var(--line-color)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Notificações</div>
                  <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary-color)' }}>Silêncio por aqui.</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} onClick={() => { setShowNotifications(false); router.push(n.type === 'follow' ? `/profile/${n.actor_id}` : `/photobook/${n.entity_id}`); }} style={{ padding: '12px 15px', borderBottom: '1px solid var(--line-color)', cursor: 'pointer', backgroundColor: n.read ? 'transparent' : 'rgba(0,0,0,0.02)', fontSize: '12px' }}>
                          <strong>{n.actor?.username}</strong> {
                            n.type === 'like_pb' ? 'apreciou seu álbum' :
                            n.type === 'comment' ? 'comentou no seu momento' :
                            n.type === 'like_moment' ? 'curtiu seu momento' :
                            n.type === 'follow' ? 'começou a te seguir' : 'interagiu'
                          }
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => router.push('/create-photobook')} style={{ ...buttonStyle, padding: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
              <span className="hide-on-mobile">Novo</span>
            </button>
            
            <button onClick={() => router.push(`/profile/${userId}`)} style={{ ...buttonStyle, padding: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person</span>
              <span className="hide-on-mobile">Perfil</span>
            </button>

            <button onClick={() => router.push('/settings')} style={iconButtonStyle}>
              <span className="material-symbols-outlined">settings</span>
            </button>
            
            <button onClick={toggleTheme} style={iconButtonStyle}>
              <span className="material-symbols-outlined">{theme === 'light' ? 'dark_mode' : 'light_mode'}</span>
            </button>
          </>
        ) : (
          <button onClick={() => router.push('/login')} style={buttonStyle}>Entrar</button>
        )}
      </div>
    </nav>
  )
}
