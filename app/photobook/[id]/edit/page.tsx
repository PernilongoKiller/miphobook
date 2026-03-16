'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSupabase } from '@/lib/SupabaseProvider'
import Header from '@/components/Header'
import Skeleton from '@/components/Skeleton'

export default function EditPhotobookPage() {
  const router = useRouter()
  const { id } = useParams();
  const supabase = useSupabase()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true) // Initial loading for fetching photobook
  const [saving, setSaving] = useState(false) // For save/delete operations
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null); // Declare message state
  const [photobookOwnerId, setPhotobookOwnerId] = useState<string | null>(null);

  useEffect(() => {
    // Critical Guard: Check ID validity before fetching
    if (!id || typeof id !== 'string') {
      setError("ID do photobook inválido ou não disponível. Verifique o URL.");
      setLoading(false);
      return;
    }

    const fetchPhotobook = async () => {
      if (!supabase) return;
      setLoading(true);
      setError(null);

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('photobooks')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching photobook:', fetchError);
        setError(`Erro ao carregar photobook: ${fetchError.message}`);
        setLoading(false);
        return;
      }

      if (data && data.user_id !== currentUser.id) {
        setError("Você não tem permissão para editar este photobook.");
        setLoading(false);
        return;
      }

      setTitle(data.title);
      setDescription(data.description || '');
      setPhotobookOwnerId(data.user_id);
      setLoading(false);
    };

    fetchPhotobook();
  }, [id, supabase, router]);

  const handleUpdatePhotobook = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    setSaving(true);
    setError(null);

    if (!supabase) {
      setMessage('Supabase client not initialized.');
      setSaving(false);
      return;
    }

    if (!id || typeof id !== 'string') {
        setMessage("ID do photobook inválido. Não é possível atualizar.");
        setSaving(false);
        return;
    }

    if (!title) {
      setMessage('O título do photobook não pode ser vazio.');
      setSaving(false);
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from('photobooks')
        .update({ title, description })
        .eq('id', id)
        .eq('user_id', photobookOwnerId); // Ensure only owner can update

      if (updateError) {
        console.error('Error updating photobook:', updateError);
        setError(`Erro ao atualizar photobook: ${updateError.message}`);
        setSaving(false);
        return;
      }

      setMessage('Photobook atualizado com sucesso!');
      router.push(`/photobook/${id}`); // Redirect back to photobook detail page
    } catch (err: any) {
      console.error('Unexpected error updating photobook:', err);
      setError(`Erro inesperado: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePhotobook = async () => {
    if (!supabase) return;
    if (!window.confirm("Tem certeza que deseja apagar este photobook e todas as suas fotos?")) {
      return;
    }

    setSaving(true);
    setError(null);

    if (!id || typeof id !== 'string') {
        setError("ID do photobook inválido. Não é possível apagar.");
        setSaving(false);
        return;
    }

    try {
      // First, delete all photos associated with this photobook from Cloudinary (using API route)
      const { data: photosToDelete, error: fetchPhotosError } = await supabase
        .from('photos')
        .select('image_url')
        .eq('photobook_id', id);

      if (fetchPhotosError) {
        throw new Error(`Erro ao buscar fotos para apagar: ${fetchPhotosError.message}`);
      }

      const publicIds = photosToDelete.map(photo => {
        const parts = photo.image_url.split('/');
        const publicIdWithExtension = parts[parts.length - 1];
        return publicIdWithExtension.split('.')[0];
      });

      // Execute Cloudinary deletions in parallel
      await Promise.all(publicIds.map(async (publicId) => {
        try {
          const cloudinaryDeleteResponse = await fetch('/api/cloudinary/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicId }),
          });
          if (!cloudinaryDeleteResponse.ok) {
            const errorData = await cloudinaryDeleteResponse.json();
            console.error(`Failed to delete image ${publicId} from Cloudinary:`, errorData);
            // Don't rethrow to allow other deletions and Supabase deletion to proceed
          }
        } catch (cloudinaryErr) {
          console.error(`Error deleting image ${publicId} from Cloudinary:`, cloudinaryErr);
        }
      }));

      // Then, delete the photobook and its photo entries from Supabase
      const { error: deleteError } = await supabase
        .from('photobooks')
        .delete()
        .eq('id', id)
        .eq('user_id', photobookOwnerId); // Ensure only owner can delete

      if (deleteError) {
        throw new Error(`Erro ao apagar photobook do Supabase: ${deleteError.message}`);
      }

      router.push(`/profile/${photobookOwnerId}`); // Redirect to user profile after deletion
    } catch (err: any) {
      console.error('Error deleting photobook:', err);
      setError(`Erro ao apagar photobook: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--background-color)', color: 'var(--text-primary-color)' }}>
        <Header />
        <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', maxWidth: '600px', margin: 'auto', width: '100%' }}>
          <div style={{ backgroundColor: 'var(--background-color)', padding: '40px', border: '1px solid var(--line-color)', width: '100%', textAlign: 'center' }}>
            <Skeleton width="60%" height="32px" style={{ margin: '0 auto 30px auto' }} />
            <Skeleton width="100%" height="45px" style={{ marginBottom: '15px' }} />
            <Skeleton width="100%" height="120px" style={{ marginBottom: '15px' }} />
            <Skeleton width="100%" height="36px" />
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh',
        backgroundColor: 'var(--background-color)', color: 'red', fontSize: '24px',
      }}>
        {error}
        <button
          onClick={() => router.back()}
          style={{
            marginTop: '20px', background: 'transparent', border: '1px solid var(--text-primary-color)', padding: '6px 12px',
            fontSize: '14px', color: 'var(--text-primary-color)', cursor: 'pointer',
          }}
        >
          Voltar
        </button>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: 'var(--background-color)',
      color: 'var(--text-primary-color)',
    }}>
      <Header />

      <main style={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        maxWidth: '600px',
        margin: 'auto',
      }}>
        <div style={{
          backgroundColor: 'var(--background-color)',
          padding: '40px',
          border: '1px solid var(--line-color)',
          width: '100%',
          textAlign: 'center',
        }}>
          <h2 style={{ marginBottom: '20px', fontSize: '28px', color: 'var(--text-primary-color)' }}>Editar Photobook</h2>
          <form onSubmit={handleUpdatePhotobook} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input
              type="text"
              placeholder="Título do Photobook"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{
                padding: '12px',
                border: '1px solid var(--line-color)',
                borderRadius: '0px',
                fontSize: '14px',
                backgroundColor: 'var(--background-color)',
                color: 'var(--text-primary-color)'
              }}
            />
            <textarea
              placeholder="Descrição (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              style={{
                padding: '12px',
                border: '1px solid var(--line-color)',
                borderRadius: '0px',
                fontSize: '14px',
                backgroundColor: 'var(--background-color)',
                color: 'var(--text-primary-color)'
              }}
            />
            <button
              type="submit"
              disabled={saving}
              style={{
                background: 'transparent',
                border: '1px solid var(--text-primary-color)',
                padding: '6px 12px',
                fontSize: '14px',
                color: 'var(--text-primary-color)',
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.1s ease-in-out, color 0.1s ease-in-out',
                opacity: saving ? 0.6 : 1,
              }}
              onMouseOver={(e) => { if (!saving) { e.currentTarget.style.backgroundColor = 'var(--text-primary-color)'; e.currentTarget.style.color = 'var(--background-color)'; }}}
              onMouseOut={(e) => { if (!saving) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-primary-color)'; }}}
            >
              {saving ? 'Atualizando...' : 'Atualizar Photobook'}
            </button>
          </form>
          <button
            onClick={handleDeletePhotobook}
            disabled={saving}
            style={{
              marginTop: '15px',
              background: 'transparent',
              border: '1px solid #ff4d4f', // Red border for delete button
              padding: '6px 12px',
              fontSize: '14px',
              color: '#ff4d4f', // Red text for delete button
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.1s ease-in-out, color 0.1s ease-in-out',
              opacity: saving ? 0.6 : 1,
            }}
            onMouseOver={(e) => { if (!saving) { e.currentTarget.style.backgroundColor = '#ff4d4f'; e.currentTarget.style.color = 'var(--background-color)'; }}}
            onMouseOut={(e) => { if (!saving) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#ff4d4f'; }}}
          >
            {saving ? 'Apagando...' : 'Apagar Photobook'}
          </button>
          {message && (
            <p style={{ marginTop: '20px', color: 'var(--link-color)' }}>
              {message}
            </p>
          )}
          {error && (
            <p style={{ marginTop: '20px', color: 'red' }}>
              {error}
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
