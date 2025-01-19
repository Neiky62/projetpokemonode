import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.type.deleteMany();
  await prisma.pokemonCard.deleteMany();

  await prisma.type.createMany({
    data: [
      { name: 'Normal' },
      { name: 'Fire' },
      { name: 'Water' },
      { name: 'Grass' },
      { name: 'Electric' },
      { name: 'Ice' },
      { name: 'Fighting' },
      { name: 'Poison' },
      { name: 'Ground' },
      { name: 'Flying' },
      { name: 'Psychic' },
      { name: 'Bug' },
      { name: 'Rock' },
      { name: 'Ghost' },
      { name: 'Dragon' },
      { name: 'Dark' },
      { name: 'Steel' },
      { name: 'Fairy' },
    ],
  });

  const types = await prisma.type.findMany();
  const electricType = types.find((t) => t.name === 'Electric');
  if (!electricType) {
    throw new Error("Type 'Electric' not found in the database.");
  }

  await prisma.pokemonCard.createMany({
    data: [
      {
        name: 'Pikachu',
        pokedexId: 25,
        typeId: electricType.id,
        lifePoints: 35,
        size: 0.4,
        weight: 6.0,
        imageUrl: 'https://assets.pokemon.com/assets/cms2/img/pokedex/full/025.png',
      },
    ],
  });

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error('An error occurred:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
