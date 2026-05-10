'use client'

import { useState } from 'react'
import { getOptimizedCloudinaryUrl, extractPublicIdFromUrl } from '@/lib/cloudinary'
import FormattedText from './FormattedText'
import { useSupabase } from '@/lib/SupabaseProvider'
import { useToast } from '@/lib/ToastProvider'

interface MuralItem {
  id: string
  type: 'text' | 'photo' | 'link'
  content: string
  title?: string
}

interface MuralGridProps {
  items: MuralItem[]
  isOwner: boolean
  onItemDeleted: (id: string) => void
}

export default function MuralGrid({ items, isOwner, onItemDeleted }: MuralGridProps) {
  const supabase = useSupabase()
  const { toast } = useToast()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (item: MuralItem) => {
    if (!supabase || !window.confirm("Remover este item do mural?")) return
    
    setDeletingId(item.id)
    try {
      if (item.type === 'photo') {
        const publicId = extractPublicIdFromUrl(item.content)
        if (publicId) {
          await fetch('/api/cloudinary/delete', {
            method: 'POST',
            body: JSON.stringify({ publicId })
          })
        }
      }

      const { error } = await supabase.from('mural_items').delete().eq('id', item.id)
      if (error) throw error
      
      onItemDeleted(item.id)
      toast("Item removido.", "success")
    } catch (err) {
      console.error(err)
      toast("Erro ao remover item.", "error")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="mural-container">
      {items.map((item) => (
        <div key={item.id} className={`mural-item mural-item-${item.type}`} style={{ opacity: deletingId === item.id ? 0.5 : 1 }}>
          
          {isOwner && (
            <button 
              onClick={() => handleDelete(item)}
              className="mural-delete-btn"
              title="Remover"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
            </button>
          )}

          {item.type === 'text' && (
            <div className="mural-content-text">
              {item.title && <h4 className="mural-title">{item.title}</h4>}
              <FormattedText text={item.content} />
            </div>
          )}

          {item.type === 'photo' && (
            <div className="mural-content-photo">
              <img 
                src={getOptimizedCloudinaryUrl(item.content, { width: 600 })} 
                alt={item.title || "Mural photo"} 
                className="mural-photo-img"
              />
              {item.title && <p className="mural-photo-caption">{item.title}</p>}
            </div>
          )}

          {item.type === 'link' && (
            <a href={item.content} target="_blank" rel="noopener noreferrer" className="mural-content-link">
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>link</span>
              <div style={{ overflow: 'hidden' }}>
                <h4 className="mural-link-title">{item.title || "Link Externo"}</h4>
                <p className="mural-link-url">
                  {(() => {
                    try { return new URL(item.content).hostname } catch { return item.content }
                  })()}
                </p>
              </div>
            </a>
          )}
        </div>
      ))}

      <style jsx>{`
        .mural-container {
          columns: 3 250px;
          gap: 20px;
          width: 100%;
        }

        .mural-item {
          break-inside: avoid;
          margin-bottom: 20px;
          position: relative;
          background: var(--card-bg);
          border: 1px solid var(--border);
          box-shadow: var(--shadow);
          transition: transform 0.2s ease;
        }

        .mural-item:hover {
          transform: translateY(-2px);
        }

        .mural-delete-btn {
          position: absolute;
          top: -10px;
          right: -10px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--text);
          color: var(--bg);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .mural-item:hover .mural-delete-btn {
          opacity: 1;
        }

        .mural-item-text {
          padding: 20px;
          background-color: #fffdf2;
          border-bottom: 2px solid rgba(0,0,0,0.05);
          transform: rotate(-1deg);
        }
        
        [data-theme="dark"] .mural-item-text {
          background-color: #242420;
          color: #e8e2d9;
        }

        .mural-title {
          font-family: 'Alfa Slab One', serif;
          font-size: 14px;
          margin: 0 0 10px 0;
          text-transform: uppercase;
        }

        .mural-item-photo {
          padding: 10px 10px 30px 10px;
          background: white;
          transform: rotate(1deg);
        }

        [data-theme="dark"] .mural-item-photo {
          background: #1a1a1a;
          border-color: #333;
        }

        .mural-photo-img {
          width: 100%;
          display: block;
          border: 1px solid rgba(0,0,0,0.05);
        }

        .mural-photo-caption {
          margin: 15px 0 0 0;
          font-family: 'Georgia', serif;
          font-style: italic;
          font-size: 13px;
          text-align: center;
          color: #555;
        }
        
        [data-theme="dark"] .mural-photo-caption {
          color: #aaa;
        }

        .mural-content-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          text-decoration: none;
          color: var(--text);
        }

        .mural-link-title {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mural-link-url {
          margin: 2px 0 0 0;
          font-size: 11px;
          color: var(--muted);
          text-transform: uppercase;
        }

        @media (max-width: 768px) {
          .mural-container {
            columns: 2 160px;
            gap: 15px;
          }
        }
      `}</style>
    </div>
  )
}
