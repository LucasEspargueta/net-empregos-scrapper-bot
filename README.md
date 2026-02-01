# Bot de Empregos do Discord para Net-Empregos

Um bot do Discord que monitoriza o feed RSS do Net-Empregos de hora a hora e publica automaticamente novas ofertas de emprego num canal dedicado do Discord. O bot filtra empregos por localização (Porto, Maia, Valongo, Braga, Matosinhos, Trofa, Paredes, Vila Nova de Gaia, Leça da Palmeira e Gondomar) e garante que não há publicações duplicadas.

## Funcionalidades

- 🔄 Verifica automaticamente o feed RSS de hora a hora
- 📍 Filtra empregos por localizações específicas na região do Porto/Braga
- 🚫 Previne publicações duplicadas usando armazenamento persistente
- 📊 Mensagens embed ricas com título do emprego, empresa e ligação
- 💾 Armazena empregos enviados num ficheiro JSON local

## Pré-requisitos

- Node.js (versão 16 ou superior)
- Uma conta Discord e servidor
- Um token de bot do Discord

## Instruções de Configuração

### 1. Criar um Bot do Discord

1. Acede ao [Portal de Programadores do Discord](https://discord.com/developers/applications)
2. Clica em "New Application" e atribui um nome
3. Vai à secção "Bot" e clica em "Add Bot"
4. Em "TOKEN", clica em "Copy" para copiar o token do teu bot
5. Ativa as seguintes Privileged Gateway Intents:
   - SERVER MEMBERS INTENT (se necessário)
   - MESSAGE CONTENT INTENT
6. Vai a "OAuth2" → "URL Generator"
7. Seleciona os seguintes scopes:
   - `bot`
8. Seleciona as seguintes permissões do bot:
   - Send Messages
   - Embed Links
   - Read Messages/View Channels
9. Copia o URL gerado e abre-o no teu navegador para convidar o bot para o teu servidor

### 2. Obter o ID do Teu Canal

1. Ativa o Modo de Programador no Discord (Definições → Avançado → Modo de Programador)
2. Clica com o botão direito no canal onde queres as publicações de emprego e seleciona "Copiar ID do Canal"

### 3. Instalar Dependências

```bash
npm install
```

### 4. Configurar o Bot

1. Cria um ficheiro `.env`
2. Adiciona as tuas credenciais:
   ```
   DISCORD_BOT_TOKEN=o_teu_token_de_bot_aqui
   DISCORD_CHANNEL_ID=o_teu_id_de_canal_aqui
   ```

### 5. Executar o Bot

```bash
npm start
```

Para desenvolvimento com reinício automático:

```bash
npm run dev
```

## Como Funciona

1. **Monitorização do RSS**: O bot obtém o feed RSS do Net-Empregos de hora a hora
2. **Filtragem por Localização**: Cada emprego é verificado quanto a menções das localizações desejadas
3. **Prevenção de Duplicados**: Os empregos são rastreados por um ID único (título + ligação) e armazenados em `sent_jobs.json`
4. **Publicação no Discord**: Novos empregos que correspondam aos critérios são publicados como embeds ricos com:
   - Título do emprego (como ligação clicável)
   - Nome da empresa (do dc:creator)
   - Ligação direta para a oferta de emprego

## Personalização

### Alterar Intervalo de Verificação

Em `bot.js`, modifica o `CHECK_INTERVAL`:

```javascript
CHECK_INTERVAL: '0 * * * *', // De hora a hora ao minuto 0
```

Formato cron: `minuto hora dia mês dia_da_semana`

Exemplos:
- A cada 30 minutos: `'*/30 * * * *'`
- A cada 2 horas: `'0 */2 * * *'`
- Todos os dias às 9h: `'0 9 * * *'`

### Adicionar/Remover Localizações

Em `bot.js`, modifica o array `LOCATIONS`:

```javascript
const LOCATIONS = [
    'Porto',
    'Maia',
    // Adiciona ou remove localizações aqui
];
```

### Personalizar Aparência do Embed

No método `checkForNewJobs`, modifica o `EmbedBuilder`:

```javascript
const embed = new EmbedBuilder()
    .setColor('#0099ff') // Altera a cor (código hex)
    .setTitle(title)
    .setURL(link)
    // Personaliza campos, rodapé, miniatura, etc.
```

## Resolução de Problemas

### O bot não publica empregos

- Verifica se o bot tem permissões no canal (Enviar Mensagens, Incorporar Ligações)
- Confirma que o ID do canal está correto
- Certifica-te de que o bot está online e ligado

### Erro "Não foi possível encontrar o canal"

- Verifica novamente o ID do teu canal
- Certifica-te de que o bot foi convidado para o teu servidor
- Verifica se o bot tem acesso para visualizar o canal

### Os empregos estão a ser publicados múltiplas vezes

- O ficheiro `sent_jobs.json` pode estar em falta ou corrompido
- Elimina `sent_jobs.json` e reinicia o bot (ele recriará o ficheiro)

### O bot falha

- Verifica a versão do Node.js (tem de ser 16+)
- Verifica se todas as dependências estão instaladas (`npm install`)
- Consulta os logs da consola para mensagens de erro específicas

## Suporte

Para questões relacionadas com:
- **Discord.js**: [Guia do Discord.js](https://discordjs.guide/)
- **Feed RSS**: Verifica se o URL está acessível: https://www.net-empregos.com/rssfeed.asp
- **Tarefas Cron**: [Documentação do node-cron](https://www.npmjs.com/package/node-cron)

## Licença

MIT