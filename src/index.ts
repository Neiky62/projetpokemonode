import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

export const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

app.get('/pokemons-cards', async (req, res) => {
  try {
    const pokemonCards = await prisma.pokemonCard.findMany();
    res.json(pokemonCards);
  } catch (error) {
    console.error('Error fetching Pokémon cards:', error);
    res.status(500).json({ error: 'An error occurred while fetching Pokémon cards.' });
  }
});


app.get('/pokemons-cards/:pokemonCardId', async (req, res) => {
  const { pokemonCardId } = req.params;
  
  try {
    const pokemonCard = await prisma.pokemonCard.findUnique({
      where: { id: Number(pokemonCardId) },
    });

    if (pokemonCard) {
      res.json(pokemonCard);
    } else {
      res.status(404).json({ error: 'Pokémon card not found.' });
    }
  } catch (error) {
    console.error('Error fetching Pokémon card by ID:', error);
    res.status(500).json({ error: 'An error occurred while fetching the Pokémon card.' });
  }
});






export function stopServer() {
  server.close();
}
