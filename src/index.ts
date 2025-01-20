import express, { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
export const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

export const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Vérifie si un type existe
async function doesTypeExist(typeId: number): Promise<boolean> {
  const type = await prisma.type.findUnique({
    where: { id: typeId },
  });
  return !!type;
}

// Vérifie si un doublon existe pour `name` ou `pokedexId`
async function isDuplicate(name: string, pokedexId: number): Promise<boolean> {
  const duplicate = await prisma.pokemonCard.findFirst({
    where: {
      OR: [{ name }, { pokedexId }],
    },
  });
  return !!duplicate;
}

app.get('/pokemons-cards', async (req: Request, res: Response): Promise<void> => {
  try {
    const pokemonCards = await prisma.pokemonCard.findMany();
    res.status(200).json(pokemonCards);
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
      res.status(200).json(pokemonCard);
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

    if (!await doesTypeExist(typeId)) {
      res.status(400).json({ error: 'Invalid type ID.' });
      return;
    }

    if (await isDuplicate(name, pokedexId)) {
      res.status(400).json({ error: 'Duplicate name or pokedexId.' });
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

app.patch('/pokemon-cards/:pokemonCardId', async (req: Request, res: Response): Promise<void> => {
  const { pokemonCardId } = req.params;

  try {
    if (!pokemonCardId || isNaN(Number(pokemonCardId))) {
      res.status(400).json({ error: 'Invalid or missing Pokémon card ID.' });
      return;
    }

    const { name, pokedexId, typeId, lifePoints, size, weight, imageUrl } = req.body;

    if (typeId && !await doesTypeExist(typeId)) {
      res.status(400).json({ error: 'Invalid type ID.' });
      return;
    }

    if ((name || pokedexId) && await isDuplicate(name, pokedexId)) {
      res.status(400).json({ error: 'Duplicate name or pokedexId.' });
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
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      res.status(404).json({ error: 'Pokémon card not found.' });
    } else {
      handleError(res, error, 'Error updating Pokémon card');
    }
  }
});

app.delete('/pokemon-cards/:pokemonCardId', async (req: Request, res: Response): Promise<void> => {
  const { pokemonCardId } = req.params;

  try {
    if (!pokemonCardId || isNaN(Number(pokemonCardId))) {
      res.status(400).json({ error: 'Invalid or missing Pokémon card ID.' });
      return;
    }

    const deletedPokemon = await prisma.pokemonCard.delete({
      where: { id: Number(pokemonCardId) },
    });

    res.status(200).json({
      message: 'Pokémon card deleted successfully.',
      deletedPokemon,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      res.status(404).json({ error: 'Pokémon card not found.' });
    } else {
      handleError(res, error, 'Error deleting Pokémon card');
    }
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

export function stopServer() {
  server.close();
}
