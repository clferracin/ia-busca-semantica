import path from 'node:path';

//Loader que vai conseguir ler todo o conteúdo de uma pasta
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory'
//Loader para ler os documentos do tipo JSON
import { JSONLoader } from 'langchain/document_loaders/fs/json'
// Permite repartir um texto com base no numero de tokens que eu quero por chunk.
import { TokenTextSplitter } from 'langchain/text_splitter'
//Importar a integração do Langchain com o Redis para armazenar os chunks que criamos
import { RedisVectorStore} from 'langchain/vectorstores/redis'
//importar os embeddings da OpenAI (pago) para fazermos a representação semântica dos chunks de textos que geramos e armazenar no DB Redis
import { OpenAIEmbeddings} from 'langchain/embeddings/openai'

import { createClient } from 'redis';


require('dotenv').config();

const loader = new DirectoryLoader(
  path.resolve(__dirname, '../tmp'),
  {
    //dentro do json ele sabe que precisa navegar no objeto até a propriedade "text"
    '.json': path => new JSONLoader(path, '/text') 
  }
)

async function load() {
  const docs = await loader.load();

  const splitter = new TokenTextSplitter({
    encodingName: 'cl100k_base', //algoritmo para calcular quantos chunks existem dentro de um texto (usado pelo chatGPT)
    chunkSize: 10,
    chunkOverlap: 0, //não quero que um conteúdo de um chunk apareça dentro de outro
  })
  //variável que armazena todos os chunks
  const splittedDocuments = await splitter.splitDocuments(docs)


  //criar uma conexão com o DB Redis
  const redis = createClient ({
    url: 'redis://127.0.0.1:6379'
  })

  //fazer a conexão manualmente no redis
  await redis.connect()

  //carrega os chunks na base de dados Redis.
  await RedisVectorStore.fromDocuments(
    splittedDocuments,
    new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY}), 
    {
      indexName: 'video-embeddings', //forma de separar documentos
      redisClient: redis,
      keyPrefix: 'videos:' //todos os dados que forem salvos no redis terão este prefixo "videos:"
    }
  )

  await redis.disconnect()
}

load()