'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase, useUser } from '@/lib/SupabaseProvider'
import { useToast } from '@/lib/ToastProvider'
import { getOptimizedCloudinaryUrl, DEFAULT_AVATAR } from '@/lib/cloudinary'
import FormattedText from '@/components/FormattedText'

interface PostCardProps {
  post: {
    id: string;
    content: string;
    image_url?: string;
    created_at: string;
    user_id: string;
    users: {
      username: string;
      avatar_url: string;
    };
    likes_count?: number;
    is_liked?: boolean;
  }
}

export default function PostCard({ post }: PostCardProps) {
  const router = useRouter()
  const supabase = useSupabase()
  const { user: currentUser } = useUser()
  const { toast } = useToast()
  
  const [isLiked, setIsLiked] = useState(post.is_liked || false)
  const [likesCount, setLikesCount] = useState(post.likes_count || 0)

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!supabase || !currentUser) return router.push('/login')

    try {
      if (isLiked) {
        await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', currentUser.id)
        setIsLiked(false)
        setLikesCount(prev => Math.max(0, prev - 1))
      } else {
        await supabase.from('post_likes').insert({ post_id: post.id, user_id: currentUser.id })
        setIsLiked(true)
        setLikesCount(prev => prev + 1)
      }
    } catch (err) {
      toast('Erro ao curtir post.', 'error')
    }
  }

  return (
    <article className="social-card" style={{ marginBottom: '24px' }}>
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div 
          onClick={() => router.push(`/profile/${post.user_id}`)}
          style={{ width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', overflow: 'hidden', border: '1px solid var(--border)', backgroundColor: 'var(--border)' }}
        >
          <img 
            src={post.users?.avatar_url ? getOptimizedCloudinaryUrl(post.users.avatar_url, { width: 64, height: 64 }) : DEFAULT_AVATAR} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            loading="lazy"
            alt={post.users?.username}
          />
        </div>
        <div>
          <span 
            onClick={() => router.push(`/profile/${post.user_id}`)}
            style={{ fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
          >
            {post.users?.username}
          </span>
          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
            {new Date(post.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </div>
        </div>
      </div>

      <div style={{ padding: '0 16px 12px 16px', fontSize: '15px', lineHeight: '1.5' }}>
        <FormattedText text={post.content} />
      </div>

      {post.image_url && (
        <div 
          style={{ 
            padding: '0 16px 16px 16px',
            cursor: 'pointer'
          }}
          onClick={() => {/* Lógica de zoom opcional */}}
        >
          <div style={{ width: '100%', maxHeight: '500px', overflow: 'hidden', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <img 
              src={getOptimizedCloudinaryUrl(post.image_url, { width: 800, quality: '80' })} 
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} 
              loading="lazy"
            />
          </div>
        </div>
      )}

      <div style={{ padding: '12px 16px', borderTop: post.image_url ? 'none' : '1px solid var(--border)' }}>
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
              favorite
            </span>
          </button>
        </div>

        <div style={{ fontWeight: '700', fontSize: '14px' }}>
          {likesCount} {likesCount === 1 ? 'curtida' : 'curtidas'}
        </div>
      </div>
    </article>
  )
}
