//Importar a integração do Langchain com o Redis para armazenar os chunks que criamos
import { RedisVectorStore} from 'langchain/vectorstores/redis'
//importar os embeddings da OpenAI (pago) para fazermos a representação semântica dos chunks de textos que geramos e armazenar no DB Redis
import { OpenAIEmbeddings} from 'langchain/embeddings/openai'

import { createClient } from 'redis';


require('dotenv').config();


  //criar uma conexão com o DB Redis
  export const redis = createClient ({
    url: 'redis://127.0.0.1:6379'
  })

  //carrega os chunks na base de dados Redis.
  export const redisVectorStore = new  RedisVectorStore(
    new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY}), 
    {
      indexName: 'video-embeddings', //forma de separar documentos
      redisClient: redis,
      keyPrefix: 'videos:' //todos os dados que forem salvos no redis terão este prefixo "videos:"
    }
  )

