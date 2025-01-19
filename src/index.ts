import express, { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
export const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

export const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

app.get('/pokemons-cards', async (req: Request, res: Response): Promise<void> => {
  try {
    const pokemonCards = await prisma.pokemonCard.findMany();
    res.json(pokemonCards);
  } catch (error) {
    handleError(res, error, 'Error fetching Pokémon cards');
  }
});

app.get('/pokemons-cards/:pokemonCardId', async (req: Request, res: Response): Promise<void> => {
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
    handleError(res, error, 'Error fetching Pokémon card by ID');
  }
});

app.post('/pokemon-cards', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, pokedexId, typeId, lifePoints, size, weight, imageUrl } = req.body;

    if (!name || !pokedexId || !typeId || !lifePoints) {
      res.status(400).json({ error: 'Missing required fields: name, pokedexId, typeId, lifePoints' });
      return;
    }

    const newPokemon = await prisma.pokemonCard.create({
      data: {
        name,
        pokedexId,
        typeId,
        lifePoints,
        size,
        weight,
        imageUrl,
      },
    });

    res.status(201).json(newPokemon);
  } catch (error) {
    handleError(res, error, 'Error creating Pokémon');
  }
});

function handleError(res: Response, error: unknown, logMessage: string): void {
  console.error(logMessage, error);

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2025':
        res.status(404).json({ error: 'Record not found.' });
        break;
      default:
        res.status(500).json({ error: 'A database error occurred.' });
    }
  } else if (error instanceof Error) {
    res.status(500).json({ error: error.message });
  } else {
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
}


app.patch('/pokemon-cards/:pokemonCardId', async (req: Request, res: Response): Promise<void> => {
  const { pokemonCardId } = req.params;

  try {
    if (!pokemonCardId || isNaN(Number(pokemonCardId))) {
      res.status(400).json({ error: 'Invalid or missing Pokémon card ID.' });
      return;
    }

    const { name, pokedexId, typeId, lifePoints, size, weight, imageUrl } = req.body;

    if (!name && !pokedexId && !typeId && !lifePoints && !size && !weight && !imageUrl) {
      res.status(400).json({ error: 'At least one field must be provided for update.' });
      return;
    }

    const updatedPokemon = await prisma.pokemonCard.update({
      where: { id: Number(pokemonCardId) },
      data: {
        ...(name && { name }),
        ...(pokedexId && { pokedexId }),
        ...(typeId && { typeId }),
        ...(lifePoints && { lifePoints }),
        ...(size && { size }),
        ...(weight && { weight }),
        ...(imageUrl && { imageUrl }),
      },
    });

    res.status(200).json(updatedPokemon);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error updating Pokémon card:', error.message);

      if (error.message.includes('Record to update not found')) {
        res.status(404).json({ error: 'Pokémon card not found.' });
      } else {
        res.status(500).json({ error: 'An error occurred while updating the Pokémon card.' });
      }
    } else {
      console.error('Unexpected error:', error);
      res.status(500).json({ error: 'An unexpected error occurred.' });
    }
  }
});


export function stopServer() {
  server.close();
}
