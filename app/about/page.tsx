'use client'

import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/SupabaseProvider'
import Header from '@/components/Header'

export default function AboutPage() {
  const router = useRouter()
  const { user, loading } = useUser()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--background-color)', color: 'var(--text-primary-color)' }}>
      <Header />
      
      <main style={{ flexGrow: 1, maxWidth: '800px', margin: '80px auto', padding: '0 40px' }}>
        <h2 style={{ fontSize: '56px', fontFamily: '"Alfa Slab One", serif', marginBottom: '40px', lineHeight: '1', letterSpacing: '-3px' }}>
          Nem toda foto é só uma imagem.
        </h2>
        
        <div style={{ fontSize: '24px', lineHeight: '1.5', marginBottom: '60px', borderLeft: '6px solid var(--text-primary-color)', paddingLeft: '30px' }}>
          <p style={{ marginBottom: '20px' }}>
            Algumas guardam um momento. No Miphobook, você cria álbuns públicos com suas fotos e pode escrever sobre cada uma delas — onde foi, o que sentiu, por que aquele dia importou.
          </p>
          <p style={{ fontWeight: '900', fontSize: '28px' }}>
            Simples. Aberto. Seu.
          </p>
        </div>

        <div style={{ marginBottom: '80px' }}>
          <p style={{ fontSize: '18px', color: 'var(--text-secondary-color)', lineHeight: '1.6' }}>
            O Miphobook nasceu da necessidade de um lugar calmo na internet. Onde a pressa do <i>scroll</i> infinito dá lugar à contemplação de um álbum bem montado.
          </p>
        </div>

        <section style={{ borderTop: '1px solid var(--line-color)', paddingTop: '40px' }}>
          <h3 style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px', color: 'var(--text-secondary-color)' }}>
            A FILOSOFIA
          </h3>
          <p style={{ fontSize: '16px', marginBottom: '15px', fontWeight: '500' }}>
            Não buscamos curtidas rápidas, buscamos memórias duradouras.
          </p>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary-color)' }}>
            Um espaço minimalista projetado para que suas histórias não se percam no barulho digital. Cada photobook é um capítulo, cada foto é um verso.
          </p>
        </section>

        {!user && !loading && (
          <div style={{ marginTop: '100px', padding: '40px', border: '1px solid var(--text-primary-color)', textAlign: 'center', backgroundColor: 'var(--text-primary-color)', color: 'var(--background-color)' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '20px' }}>FAÇA PARTE DESSA CURADORIA.</h2>
            <button 
              onClick={() => router.push('/login')} 
              style={{ 
                background: 'var(--background-color)', 
                color: 'var(--text-primary-color)', 
                padding: '12px 30px', 
                fontSize: '14px', 
                fontWeight: '900',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              CRIAR MINHA CONTA
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
