# 🎮 CapyGames PWA

PWA dedicado ao acompanhamento de jogos, backlog e estatísticas gamers para os moradores da **Capihouse**, seguindo os moldes e elegância do **CapyShowTime** com tema roxo imersivo.

---

## ✨ Funcionalidades Principais

1. **Minha Biblioteca & Gerenciamento de Backlog**:
   - Status: **Jogando**, **A Jogar (Backlog)**, **Zerados**, **Platinados / Miletados (100%)**, **Abandonados** e **Em Pausa**.
   - Filtros rápidos por status e plataforma (PC, Xbox, PlayStation, Nintendo Switch, Retro).
   - Busca instantânea dentro da própria coleção.

2. **Avaliações & Reviews**:
   - Avaliação com notas de **1.0 a 10.0** (precisão decimal).
   - Contador de horas jogadas.
   - Espaço para análises e críticas de jogos.
   - **Regra de Feed**: Conquistas incrementais não poluem o feed geral da CapiHouse. Apenas jogos concluídos/platinados, abandonados ou com análise/review publicada aparecem no feed da CapiHouse.

3. **Catálogo & Descoberta**:
   - Integração com catálogo Steam Store e Xbox Live Autosuggest.
   - Seção de jogos populares e em alta na comunidade.
   - Cadastro manual de jogos para emuladores e consoles clássicos.

4. **Feed Gamer da Comunidade (CapyGames)**:
   - Feed exclusivo dentro do app com conquistas desbloqueadas, sessões recentes, zeramentos e reviews de todos os moradores.

5. **Integração com Xbox Live & Steam**:
   - Conexão e sincronização de Gamertag da Xbox Live.
   - Conexão e sincronização com Steam ID / Perfil público da Steam com importação automática de horas jogadas e biblioteca.

6. **Perfil Gamer & Estatísticas**:
   - Total de jogos, total zerados, platinas, total de horas estimadas e nota média.
   - Navegação pelos perfis dos outros moradores da casa.

---

## 🚀 Como Rodar em Desenvolvimento Local

### 1. Backend (capihouse-api)
Certifique-se de que o backend está rodando:
```bash
cd capihouse-api
php artisan migrate
php artisan serve
```

### 2. Frontend (capygames-pwa)
```bash
cd capygames-pwa
npm install
npm run dev
```
Acesse `http://localhost:5175` no navegador.
