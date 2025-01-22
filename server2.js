const express = require('express');
const axios = require('axios');
const path = require('path');
const dotenv = require('dotenv'); // Para carregar a chave da API de um arquivo .env
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

// Função para verificar se "Salud" é mencionado no texto
function isSaludMentioned(text) {
    return text.toLowerCase().includes('salud');
}

// Função para adaptar o prompt antes de enviá-lo para DALL·E
function adaptPromptForImage(prompt) {
    // Lista de palavras sensíveis
    const sensitiveWords = ['erótico', 'nudez', 'sexual', 'violência', 'sangue', 'morte'];
    let safePrompt = prompt;

    // Substituir palavras sensíveis por descrições neutras
    sensitiveWords.forEach(word => {
        const regex = new RegExp(word, 'gi');
        safePrompt = safePrompt.replace(regex, '[conteúdo abstrato]');
    });

    return `Gere uma ilustração conceitual baseada no seguinte sonho: ${safePrompt}. Mantenha a imagem apropriada para maiores de 18 anos e evite conteúdo explícito.`;
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
        console.error("Erro ao gerar imagem:", error.response ? error.response.data : error.message);
        return null; // Retorna null se a imagem não puder ser gerada
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
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "Você é um assistente especializado em interpretar sonhos." },
                { role: "user", content: mensagem }
            ],
            max_tokens: 1000,
            temperature: 0.7,
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            }
        });

        const interpretacao = response.data.choices[0].message.content;

        // Gerar imagem com base no conteúdo do sonho
        const adaptedPrompt = adaptPromptForImage(mensagem);
        const imagemUrl = await generateImage(adaptedPrompt);

        // Resposta para o cliente
        return res.json({ 
            resposta: interpretacao,
            imagemUrl: imagemUrl || "Desculpe, não foi possível gerar a imagem do seu sonho, mas aqui está a interpretação textual."
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
