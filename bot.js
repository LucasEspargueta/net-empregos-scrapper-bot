const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');
const xml2js = require('xml2js');
const cron = require('node-cron');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Configuração
const CONFIG = {
    RSS_URL: 'https://www.net-empregos.com/rssfeed.asp',
    CHECK_INTERVAL: '0 * * * *', // Todas as horas, ao minuto 0
    SENT_JOBS_FILE: path.join(__dirname, 'sent_jobs.json'),
    CHANNEL_ID: process.env.CHANNEL_ID, // ID do canal de Discord
    BOT_TOKEN: process.env.BOT_TOKEN // Token do bot do Discord
};

// Palavras-chave de localização para filtrar
const LOCATIONS = [
    'Porto',
    'Maia',
    'Valongo',
    'Braga',
    'Matosinhos',
    'Trofa',
    'Paredes',
    'Vila Nova de Gaia',
    'Leça da Palmeira',
    'Gondomar'
];

class JobBot {
    constructor() {
        this.client = new Client({
            intents: [GatewayIntentBits.Guilds]
        });
        this.sentJobs = new Set();
    }

    async initialize() {
        // Carrega os empregos previamente enviados
        await this.loadSentJobs();

        // Inicia sessão no Discord
        this.client.once('ready', () => {
            console.log(`✅ Bot iniciado como ${this.client.user.tag}`);
            console.log(`📍 A monitorizar o feed RSS de hora a hora`);
            console.log(`🎯 A filtrar pelas localizações: ${LOCATIONS.join(', ')}`);
        });

        await this.client.login(CONFIG.BOT_TOKEN);

        // Agenda as verificações
        this.scheduleChecks();
    }

    async loadSentJobs() {
        try {
            const data = await fs.readFile(CONFIG.SENT_JOBS_FILE, 'utf8');
            this.sentJobs = new Set(JSON.parse(data));
            console.log(`📂 Carregados ${this.sentJobs.size} empregos enviados anteriormente`);
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log('📂 Nenhum ficheiro de empregos anteriores encontrado, a começar do zero');
            } else {
                console.error('❌ Erro ao carregar empregos enviados:', error);
            }
        }
    }

    async saveSentJobs() {
        try {
            await fs.writeFile(
                CONFIG.SENT_JOBS_FILE,
                JSON.stringify([...this.sentJobs], null, 2)
            );
        } catch (error) {
            console.error('❌ Erro ao guardar empregos enviados:', error);
        }
    }

    scheduleChecks() {
        // Executa imediatamente ao iniciar
        this.checkForNewJobs();

        // Depois agenda verificações de hora a hora
        cron.schedule(CONFIG.CHECK_INTERVAL, () => {
            console.log('⏰ A executar verificação agendada de empregos...');
            this.checkForNewJobs();
        });
    }

    async fetchRSS() {
        try {
            const response = await fetch(CONFIG.RSS_URL);
            const xml = await response.text();
            const parser = new xml2js.Parser();
            const result = await parser.parseStringPromise(xml);
            return result.rss.channel[0].item || [];
        } catch (error) {
            console.error('❌ Erro ao obter RSS:', error);
            return [];
        }
    }

    containsLocation(text) {
        if (!text) return false;
        const upperText = text.toUpperCase();
        return LOCATIONS.some(location => 
            upperText.includes(location.toUpperCase())
        );
    }

    generateJobId(item) {
        // Cria um ID único baseado no título e link
        const title = item.title?.[0] || '';
        const link = item.link?.[0] || '';
        return `${title}_${link}`.toLowerCase().replace(/\s+/g, '_');
    }

    async checkForNewJobs() {
        try {
            const items = await this.fetchRSS();
            console.log(`🔍 Encontrados ${items.length} empregos no feed`);

            const channel = await this.client.channels.fetch(CONFIG.CHANNEL_ID);
            if (!channel) {
                console.error('❌ Não foi possível encontrar o canal');
                return;
            }

            let newJobsCount = 0;

            for (const item of items) {
                const title = item.title?.[0] || 'Sem Título';
                const description = item.description?.[0] || '';
                const link = item.link?.[0] || '';
                const company = item['dc:creator']?.[0] || 'Empresa Desconhecida';
                
                // Verifica se o emprego menciona alguma das localizações desejadas
                const fullText = `${title} ${description}`;
                if (!this.containsLocation(fullText)) {
                    continue;
                }

                // Gera um ID único para este emprego
                const jobId = this.generateJobId(item);

                // Ignora se já foi enviado
                if (this.sentJobs.has(jobId)) {
                    continue;
                }

                // Cria e envia embed
                const embed = new EmbedBuilder()
                    .setColor('#ff00d9')
                    .setTitle(title)
                    .setURL(link)
                    .addFields(
                        { name: '🏢 Empresa', value: company, inline: false },
                        { name: '🔗 Link', value: `[Ver Emprego](${link})`, inline: false }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Alerta de Emprego Net-Empregos' });

                try {
                    await channel.send({ embeds: [embed] });
                    this.sentJobs.add(jobId);
                    newJobsCount++;
                    console.log(`✅ Publicado: ${title}`);
                } catch (error) {
                    console.error(`❌ Erro ao publicar emprego "${title}":`, error);
                }

                // Adiciona um pequeno atraso entre mensagens para evitar limites de taxa
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Guarda a lista atualizada de empregos enviados
            await this.saveSentJobs();

            console.log(`✨ Verificação concluída: ${newJobsCount} novos empregos publicados`);
        } catch (error) {
            console.error('❌ Erro em checkForNewJobs:', error);
        }
    }
}

// Inicia o bot
const bot = new JobBot();
bot.initialize().catch(console.error);

// Encerramento gracioso
process.on('SIGINT', async () => {
    console.log('\n👋 A encerrar o bot...');
    await bot.saveSentJobs();
    process.exit(0);
});