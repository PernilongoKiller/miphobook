'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useUser } from '@/lib/SupabaseProvider'
import Link from 'next/link'

export default function Navigation() {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useUser()

  const navItems = [
    { label: 'Início', icon: 'home', href: '/' },
    { label: 'Explorar', icon: 'explore', href: '/#explore' }, // Usando hash para controle interno ou rota se preferir
    { label: 'Comunidade', icon: 'group', href: '/users' },
    { label: 'Notificações', icon: 'notifications', href: '/notifications', badge: false }, // Badge logic can be added
    { label: 'Criar Álbum', icon: 'add_box', href: '/create-photobook' },
    { label: 'Perfil', icon: 'person', href: user ? `/profile/${user.id}` : '/login' },
    { label: 'Configurações', icon: 'settings', href: '/settings' },
  ]

  return (
    <nav className="left-column hide-on-mobile" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link 
            key={item.href} 
            href={item.href}
            className={`nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
              {item.icon}
            </span>
            <span className="nav-text">{item.label}</span>
          </Link>
        )
      })}

      <div style={{ marginTop: 'auto', padding: '16px' }}>
        <button 
          onClick={() => router.push('/about')}
          style={{ width: '100%', border: 'none', textAlign: 'left', padding: '12px', fontSize: '11px', opacity: 0.6 }}
        >
          SOBRE O MIPHOBOOK
        </button>
      </div>
    </nav>
  )
}
