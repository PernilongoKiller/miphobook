'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase, useUser } from '@/lib/SupabaseProvider'
import { useToast } from '@/lib/ToastProvider'
import { getOptimizedCloudinaryUrl } from '@/lib/cloudinary'
import FormattedText from '@/components/FormattedText'

interface MomentCardProps {
  moment: {
    id: string;
    description: string;
    created_at: string;
    photos: any[];
    photobook_id: string;
    photobooks?: {
      title: string;
      users: {
        id: string;
        username: string;
        avatar_url: string;
      }
    };
    likes_count?: number;
    is_liked?: boolean;
    comments_count?: number;
  }
}

export default function MomentCard({ moment }: MomentCardProps) {
  const router = useRouter()
  const supabase = useSupabase()
  const { user: currentUser } = useUser()
  const { toast } = useToast()
  
  const [isLiked, setIsLiked] = useState(moment.is_liked || false)
  const [likesCount, setLikesCount] = useState(moment.likes_count || 0)
  const [showComments, setShowComments] = useState(false)

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!supabase || !currentUser) return router.push('/login')

    try {
      if (isLiked) {
        const { error } = await supabase
          .from('photo_likes')
          .delete()
          .eq('photo_id', moment.id)
          .eq('user_id', currentUser.id)
        
        if (error) throw error
        setIsLiked(false)
        setLikesCount(prev => Math.max(0, prev - 1))
      } else {
        const { error } = await supabase
          .from('photo_likes')
          .insert({ photo_id: moment.id, user_id: currentUser.id })
        
        if (error) throw error
        setIsLiked(true)
        setLikesCount(prev => prev + 1)
        
        // Notificação opcional aqui
      }
    } catch (err: any) {
      toast('Erro ao processar curtida.', 'error')
    }
  }

  const isSingle = moment.photos.length === 1;
  const isDouble = moment.photos.length === 2;

  return (
    <article className="social-card">
      {/* Header do Momento */}
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div 
          onClick={() => router.push(`/profile/${moment.photobooks?.users.id}`)}
          style={{ 
            width: '38px', height: '38px', 
            borderRadius: '50%', 
            cursor: 'pointer', overflow: 'hidden',
            border: '1px solid var(--border)' 
          }}
        >
          {moment.photobooks?.users.avatar_url ? (
            <img src={getOptimizedCloudinaryUrl(moment.photobooks.users.avatar_url, { width: 80, height: 80, crop: 'fill' })} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--border)' }} />
          )}
        </div>
        <div style={{ flexGrow: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span 
              onClick={() => router.push(`/profile/${moment.photobooks?.users.id}`)}
              style={{ fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
            >
              {moment.photobooks?.users.username}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>•</span>
            <span 
              onClick={() => router.push(`/photobook/${moment.photobook_id}`)}
              style={{ fontSize: '13px', color: 'var(--muted)', cursor: 'pointer' }}
            >
              {moment.photobooks?.title}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
            {new Date(moment.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </div>
        </div>
      </div>

      {/* Grid de Fotos */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isSingle ? '1fr' : isDouble ? '1fr 1fr' : 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '2px',
        backgroundColor: 'var(--border)'
      }}>
        {moment.photos.map((photo) => (
          <div 
            key={photo.id} 
            onClick={() => router.push(`/photobook/${moment.photobook_id}`)}
            style={{ 
              aspectRatio: isSingle ? 'auto' : '1/1', 
              backgroundColor: 'var(--card-bg)',
              cursor: 'pointer',
              overflow: 'hidden'
            }}
          >
            <img 
              src={getOptimizedCloudinaryUrl(photo.image_url, { width: 800 })} 
              alt="Moment" 
              style={{ width: '100%', height: '100%', objectFit: isSingle ? 'contain' : 'cover', display: 'block' }} 
            />
          </div>
        ))}
      </div>

      {/* Ações e Info */}
      <div style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
          <button 
            onClick={handleLike}
            style={{ 
              border: 'none', padding: '0', background: 'none', 
              display: 'flex', alignItems: 'center', gap: '6px',
              color: isLiked ? '#ed4956' : 'var(--text)',
              cursor: 'pointer'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '26px', fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}>
              {isLiked ? 'favorite' : 'favorite'}
            </span>
          </button>

          <button 
            onClick={() => router.push(`/photobook/${moment.photobook_id}`)}
            style={{ 
              border: 'none', padding: '0', background: 'none', 
              display: 'flex', alignItems: 'center', color: 'var(--text)', cursor: 'pointer'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>
              chat_bubble
            </span>
          </button>
        </div>

        <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '8px' }}>
          {likesCount} {likesCount === 1 ? 'curtida' : 'curtidas'}
        </div>

        {moment.description && (
          <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
            <span style={{ fontWeight: '700', marginRight: '8px' }}>{moment.photobooks?.users.username}</span>
            <FormattedText text={moment.description} />
          </div>
        )}
      </div>
    </article>
  )
}
