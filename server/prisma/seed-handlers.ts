import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const handlers = [
  { codeName: 'Raven', group: 'osint', specialization: 'OSINT Specialist' },
  { codeName: 'Shadow', group: 'osint', specialization: 'OSINT Specialist' },
  { codeName: 'Phantom', group: 'osint', specialization: 'OSINT Specialist' },
  { codeName: 'Ghost', group: 'osint', specialization: 'OSINT Specialist' },
  { codeName: 'Viper', group: 'osint', specialization: 'OSINT Specialist' },

  { codeName: 'Cobra', group: 'pentest', specialization: 'Penetration Tester' },
  { codeName: 'Python', group: 'pentest', specialization: 'Penetration Tester' },
  { codeName: 'Mamba', group: 'pentest', specialization: 'Penetration Tester' },
  { codeName: 'Anaconda', group: 'pentest', specialization: 'Penetration Tester' },
  { codeName: 'Rattlesnake', group: 'pentest', specialization: 'Penetration Tester' },

  { codeName: 'Nexus', group: 'malware', specialization: 'Malware Analyst' },
  { codeName: 'Zero', group: 'malware', specialization: 'Malware Analyst' },
  { codeName: 'Cipher', group: 'malware', specialization: 'Malware Analyst' },
  { codeName: 'Crypto', group: 'malware', specialization: 'Malware Analyst' },
  { codeName: 'Binary', group: 'malware', specialization: 'Malware Analyst' },

  { codeName: 'Router', group: 'network', specialization: 'Network Security Expert' },
  { codeName: 'Switch', group: 'network', specialization: 'Network Security Expert' },
  { codeName: 'Firewall', group: 'network', specialization: 'Network Security Expert' },
  { codeName: 'Gateway', group: 'network', specialization: 'Network Security Expert' },
  { codeName: 'Protocol', group: 'network', specialization: 'Network Security Expert' },
];

async function main() {
  console.log('Seeding handlers...');

  for (const handler of handlers) {
    await prisma.handler.upsert({
      where: { codeName: handler.codeName },
      update: handler,
      create: handler,
    });
  }

  console.log(`Seeded ${handlers.length} handlers`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
