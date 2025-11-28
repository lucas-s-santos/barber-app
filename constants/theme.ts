// Arquivo: constants/Colors.ts (ou o nome que ele tiver no seu projeto)

/**
 * Abaixo estão as cores que são usadas no aplicativo, com as paletas "Neon Blade" e "Cyber Sky".
 */

// Cor de destaque principal (Ação)
const primaryColor = '#00E5FF'; // Ciano Elétrico

// Cor de destaque secundária (Sucesso/Confirmação)
const secondaryColor = '#FF007A'; // Magenta/Rosa Choque

export const Colors = {
  light: {
    // Tema "Cyber Sky" 🏙️
    text: '#0D1117', // Texto Principal (Azul Escuro)
    subtext: '#57606A', // Texto Secundário (Cinza Médio)
    background: '#F0F6FC', // Fundo Principal (Branco Gelo)
    card: '#FFFFFF', // Fundo dos Cards (Branco Puro)
    tint: primaryColor, // Cor de Destaque para ícones e elementos ativos
    icon: '#57606A', // Cor de ícones inativos (Cinza Médio)
    tabIconDefault: '#57606A', // Cor do ícone da aba inativa
    tabIconSelected: primaryColor, // Cor do ícone da aba selecionada
    border: '#D0D7DE', // Cor da Borda
    primary: primaryColor, // Acesso direto à cor primária
    secondary: secondaryColor, // Acesso direto à cor secundária
  },
  dark: {
    // Tema "Neon Blade" 🌃
    text: '#FFFFFF', // Texto Principal (Branco)
    subtext: '#8B949E', // Texto Secundário (Cinza Claro)
    background: '#0D1117', // Fundo Principal (Azul Quase Preto)
    card: '#161B22', // Fundo dos Cards (Cinza-Azulado)
    tint: primaryColor, // Cor de Destaque para ícones e elementos ativos
    icon: '#8B949E', // Cor de ícones inativos (Cinza Claro)
    tabIconDefault: '#8B949E', // Cor do ícone da aba inativa
    tabIconSelected: primaryColor, // Cor do ícone da aba selecionada
    border: '#30363D', // Cor da Borda
    primary: primaryColor, // Acesso direto à cor primária
    secondary: secondaryColor, // Acesso direto à cor secundária
  },
};

// A seção de fontes pode permanecer a mesma, não precisamos alterá-la.
export const Fonts = {
  // ... (seu código de fontes original)
};
