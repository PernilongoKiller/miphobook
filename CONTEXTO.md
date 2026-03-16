# Miphobook - Contexto de Desenvolvimento (12/03/2026)

## Estado Atual do Projeto
O Miphobook evoluiu para uma estética **Brutalista Minimalista (Estilo Are.na)**, focada em curadoria visual, conforto e ordem. O conceito de "Momentos" (agrupamento de uploads) é a base da narrativa.

### 1. Design e Identidade Visual
- **Filosofia Are.na**: Fundo off-white (`#fbfbfb`), texto e bordas em preto absoluto (`#000000`).
- **Geometria Rígida**: Todos os elementos são quadrados (`border-radius: 0`). Avatares, capas de álbuns e fotos seguem o padrão `1/1` ou grades organizadas.
- **Bordas Ultra-finas**: Uso de bordas de `1px solid` para estruturar o conteúdo sem pesar visualmente.
- **Escala Humana**: Fotos no photobook limitadas a `450px` para conforto visual e scroll reduzido.
- **Interface Progressiva**: Ações (likes, apagar, comentar) são discretas e aparecem principalmente no hover.

### 2. Novas Funcionalidades
- **Sistema de Momentos**: Fotos enviadas juntas são agrupadas automaticamente em blocos com descrição única.
- **Notificações em Tempo Real**: Sininho no Header que avisa sobre novas apreciações, comentários e seguidores usando o Realtime do Supabase.
- **Interações Unificadas**: Likes e comentários agora são feitos por "Momento" em vez de foto individual, limpando o ruído visual.
- **Gestão de Dados**: Fluxo de exclusão de fotos e conta aprimorado com tratamento de erros e permissões RLS.

### 3. Correções e Estabilidade
- **Hydration & SSR**: Convertido `layout.tsx` para Server Component e removido `styled-jsx` para evitar erros de hidratação.
- **Tradução de Erros**: Mensagens de erro do Supabase agora são amigáveis e em português.
- **RLS**: Políticas de segurança configuradas para criação/exclusão de dados pelo dono.

## Sugestões para Amanhã (13/03/2026)
- **Logística do Feed "Seguindo"**: Implementar a lógica real da aba "Seguindo" na Home (atualmente mostra apenas o Explorar).
- **Busca por Photobooks**: Expandir a busca do Header para encontrar álbuns por título ou descrição, não apenas usuários.
- **Otimização de Imagens**: Refinar o uso do Cloudinary para carregar imagens ainda mais leves e rápidas.
- **UX de Upload**: Melhorar a barra de progresso ou feedback visual durante o envio de múltiplos "Momentos".

## Comandos Úteis
- **RLS SQL**: Sempre que adicionar tabelas, verificar as políticas de `SELECT` e `INSERT`.
- **Clean Dev**: `rm -rf .next && npm run dev`
