import { ChatOpenAI } from 'langchain/chat_models/openai';
//importar a chain para conectar: 1: o prompt, 2: a api que criamos que conecta com a OpenAI, 3: a base de dados
import { RetrievalQAChain } from 'langchain/chains';
//Importar o meu prompt
import { PromptTemplate } from 'langchain/prompts';
import { redis, redisVectorStore } from './redis-store';

require('dotenv').config();

const openAiChat = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: 'gpt-3.5-turbo',
  temperature: 0.3,
});

const prompt = new PromptTemplate({
  template: `
    Você responde perguntas sobre programação.
    O usuário está assistindo um curso com várias aulas.
    Use o conteúdo das transcrições das aulas abaixo ara responder a pergunta do usuário.
    Se a resposta não for encontrada nas transcrições, responde que você não sabe, não tente inventar uma resposta.

    Se possível, inclua exemplos de código em JavaScript e TypeScript.

    Transcrições:
    {context}

    Pergunta:
    {question}
  `.trim(),
  inputVariables: ['context', 'question']
});

// LLM = Large Language Model
//Quero criar uma chain a partir de um LLM, que é o OpenAI aqui.
const chain = RetrievalQAChain.fromLLM(
    openAiChat, 
    redisVectorStore.asRetriever(3), //pega no máximo 3 transcrições
    {
      prompt,
      returnSourceDocuments: true,
      verbose: true // para passar o log de tudo que esta acontecendo  
    }
    );

    async function main() {
      await redis.connect();

      const response = await chain.call({
        query: 'Me explique o conceito de Agregate Root no DDD'
      })

      console.log(response);

      await redis.disconnect();
    };

    main();