const express = require('express');
const axios = require('axios');
const path = require('path');
const dotenv = require('dotenv');  // Para carregar a chave da API de um arquivo .env
const app = express();

// Carregar variáveis de ambiente do arquivo .env
dotenv.config();

// Middleware para processar JSON no corpo da requisição
app.use(express.json());

// Middleware para servir arquivos estáticos (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Função para verificar se é um sonho
function isDreamRelated(text) {
    const keywords = ['sonho', 'sonhei', 'sonhar', 'sonhando'];
    return keywords.some(keyword => text.toLowerCase().includes(keyword));
}

// Função para gerar imagem usando DALL·E
async function generateImage(prompt) {
    try {
        const response = await axios.post('https://api.openai.com/v1/images/generations', {
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            }
        });
        return response.data.data[0].url;
    } catch (error) {
        console.error("Erro ao gerar imagem:", error);
        return null;
    }
}

// Rota para processar as interpretações de sonhos e gerar a imagem
app.post('/interpreta', async (req, res) => {
    const mensagem = req.body.mensagem;

    // Verifica se a mensagem é sobre um sonho
    if (!isDreamRelated(mensagem)) {
        return res.json({ resposta: "Desculpe, este chat é apenas para interpretações de sonhos. Por favor, compartilhe seu sonho." });
    }

    // Enviar a mensagem para o GPT-3 para interpretação de sonho
    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-3.5-turbo",  // ou use a versão mais recente
            messages: [
                { role: "system", content: "Você é um assistente especializado em interpretar sonhos." },
                { role: "user", content: mensagem }
            ],
            max_tokens: 200,
            temperature: 0.7,
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            }
        });

        const interpretacao = response.data.choices[0].message.content;
        
        // Gerar imagem com base no conteúdo do sonho
        const imagemUrl = await generateImage(mensagem);  // Gera a imagem

        return res.json({ 
            resposta: interpretacao,
            imagemUrl: imagemUrl 
        });
    } catch (error) {
        console.error("Erro ao chamar a API do OpenAI:", error.response ? error.response.data : error.message);
        return res.json({ resposta: "Desculpe, houve um erro ao processar sua solicitação." });
    }
});

// Rota principal para servir a página HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Defina a porta em que o servidor vai rodar
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
