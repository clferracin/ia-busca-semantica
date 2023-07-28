import { redis, redisVectorStore } from './redis-store'

async function search() {
  await redis.connect()

  const response = await redisVectorStore.similaritySearchWithScore(
    'Qual o conceito de Agregate Root dentro do DDD?',
    5 //até 5 chunks que podem responder a minha pergunta
  )

  console.log(response);

  await redis.disconnect();
};

search();