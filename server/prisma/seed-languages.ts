import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const languages = [
  { code: 'uk', name: 'Українська', flag: '🇺🇦' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
];

export async function seedLanguages() {
  console.log('🌱 Seeding languages...');

  const operations = languages.map((lang) =>
    prisma.language.upsert({
      where: { code: lang.code },
      update: {
        name: lang.name,
        flag: lang.flag,
        isActive: true,
      },
      create: {
        code: lang.code,
        name: lang.name,
        flag: lang.flag,
        isActive: true,
      },
    })
  );

  await prisma.$transaction(operations);
  console.log(`✅ Seeded ${operations.length} languages`);
}

seedLanguages()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
