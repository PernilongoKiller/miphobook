# Miphobook: Hub de Memórias e Momentos

Miphobook evoluiu de um simples criador de álbuns de fotos para um espaço aconchegante focado em contar as histórias por trás das imagens.

## Princípios de Design (Cozy Space)

1.  **Atmosfera Aconchegante (Cozy):**
    *   **Cores:** Tons quentes e terrosos (creme, linho, carvão quente). Evitar contrastes agressivos de preto e branco puro.
    *   **Textura:** Uso de granulação sutil (paper texture) para evocar a sensação de papel e álbuns físicos.
    *   **Tipografia:** Mix de `Poppins` (moderno e amigável) para interface e fontes com serifa (`Georgia`, `Times`) para as histórias em si. `Alfa Slab One` permanece para títulos de destaque.
    *   **Bordas:** Cantos levemente arredondados (`--radius`), mas mantendo um ar editorial e clássico.

2.  **Foco em Storytelling:**
    *   O texto é tão importante quanto a imagem.
    *   Uso de prompts de memória para incentivar os usuários a escreverem sobre seus momentos.
    *   Formatação de texto rica (quotes, negrito, listas) para dar profundidade aos relatos.

3.  **Identidade Visual "Bookish":**
    *   Os photobooks devem parecer livros físicos em uma estante (lombada, marcador de página, capa editorial).

## Fluxos de Desenvolvimento

*   **Novas Funcionalidades:** Sempre considerar como a nova feature contribui para a sensação de "espaço seguro" e "baú de memórias".
*   **Componentes:** Priorizar componentes que convidem à reflexão, como o `MemoryPrompt`.
*   **Estilos:** Utilizar as variáveis do `:root` definidas no `globals.css` para manter a consistência cromática quente.
