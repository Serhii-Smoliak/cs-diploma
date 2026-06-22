import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { seedLanguages } from './seed-languages.js';
import { seedTranslations } from './seed-translations.js';

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function rankFromXp(xp: number): string {
  if (xp >= 5000) return 'Elite Hacker';
  if (xp >= 3000) return 'Advanced Hacker';
  if (xp >= 1500) return 'Intermediate Hacker';
  if (xp >= 500) return 'Novice Hacker';
  return 'Script Kiddie';
}

type SeedUser = {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  xp?: number;
  completedLevels?: number;
  stealth?: number;
};

async function main() {
  console.log('🌱 Seeding database...\n');

  const legacyTestEmails = ['test1@cybertactics.test', 'test2@cybertactics.test'];

  await prisma.user.deleteMany({
    where: { email: { in: legacyTestEmails } },
  });

  const testUsers: SeedUser[] = [
    {
      username: 'admin',
      email: 'admin@cybertactics.test',
      password: 'admin123',
      role: UserRole.ADMIN,
      xp: 2250,
      completedLevels: 8,
      stealth: 85,
    },
    {
      username: 'user',
      email: 'user@cybertactics.test',
      password: 'user123',
      role: UserRole.USER,
    },
    {
      username: 'phantom',
      email: 'phantom@cybertactics.test',
      password: 'user123',
      role: UserRole.USER,
      xp: 5200,
      completedLevels: 14,
      stealth: 70,
    },
    {
      username: 'zeroday',
      email: 'zeroday@cybertactics.test',
      password: 'user123',
      role: UserRole.USER,
      xp: 3400,
      completedLevels: 10,
      stealth: 78,
    },
    {
      username: 'shadow',
      email: 'shadow@cybertactics.test',
      password: 'user123',
      role: UserRole.USER,
      xp: 2100,
      completedLevels: 7,
      stealth: 82,
    },
    {
      username: 'cipher',
      email: 'cipher@cybertactics.test',
      password: 'user123',
      role: UserRole.USER,
      xp: 1650,
      completedLevels: 6,
      stealth: 88,
    },
    {
      username: 'nexus',
      email: 'nexus@cybertactics.test',
      password: 'user123',
      role: UserRole.USER,
      xp: 900,
      completedLevels: 4,
      stealth: 91,
    },
    {
      username: 'raven',
      email: 'raven@cybertactics.test',
      password: 'user123',
      role: UserRole.USER,
      xp: 550,
      completedLevels: 2,
      stealth: 95,
    },
    {
      username: 'ghost_ops',
      email: 'ghost_ops@cybertactics.test',
      password: 'user123',
      role: UserRole.USER,
      xp: 120,
      completedLevels: 1,
      stealth: 98,
    },
    {
      username: 'iron_wolf',
      email: 'iron_wolf@cybertactics.test',
      password: 'user123',
      role: UserRole.USER,
      xp: 40,
      completedLevels: 0,
      stealth: 100,
    },
  ];

  for (const account of testUsers) {
    await prisma.user.deleteMany({
      where: { email: account.email },
    });

    const passwordHash = await bcrypt.hash(account.password, 10);
    const xp = account.xp ?? 0;
    const rank = rankFromXp(xp);
    const stealth = account.stealth ?? 100;
    const completedLevels = account.completedLevels ?? 0;

    const user = await prisma.user.create({
      data: {
        username: account.username,
        email: account.email,
        passwordHash,
        role: account.role,
        xp,
        rank,
        stealth,
      },
    });

    await prisma.userStats.create({
      data: {
        userId: user.id,
        totalXp: xp,
        rank,
        stealth,
        completedLevels,
      },
    });
  }

  console.log(`✅ Seeded ${testUsers.length} users`);
  console.log('📧 Primary credentials:');
  console.log('   admin@cybertactics.test / admin123');
  console.log('   user@cybertactics.test / user123');
  console.log('   Other demo users: *@cybertactics.test / user123\n');

  console.log('🔄 Loading missions and levels from JSON files...\n');

  const missionsDir = join(__dirname, '../src/data/missions');

  try {
    const missionFiles = readdirSync(missionsDir).filter((f) => f.endsWith('.json'));

    for (const missionFile of missionFiles) {
      try {
        const missionPath = join(missionsDir, missionFile);
        const missionData = JSON.parse(readFileSync(missionPath, 'utf-8'));

        console.log(`📦 Processing mission: ${missionData.name}`);

        const mission = await prisma.mission.upsert({
          where: { id: missionData.mission_id },
          update: {
            name: missionData.name,
            description: missionData.description,
            difficulty: missionData.difficulty,
            orderIndex: missionData.order_index ?? 1,
            mitreTechniques: missionData.mitre_techniques || [],
          },
          create: {
            id: missionData.mission_id,
            name: missionData.name,
            description: missionData.description,
            difficulty: missionData.difficulty,
            orderIndex: missionData.order_index ?? 1,
            mitreTechniques: missionData.mitre_techniques || [],
          },
        });

        console.log(`✅ Mission: ${mission.name}`);

        if (missionData.mitre_techniques && Array.isArray(missionData.mitre_techniques)) {
          for (const mitreId of missionData.mitre_techniques) {
            try {
              await prisma.missionMitreTechnique.upsert({
                where: {
                  missionId_mitreId: {
                    missionId: mission.id,
                    mitreId: mitreId,
                  },
                },
                update: {},
                create: {
                  missionId: mission.id,
                  mitreId: mitreId,
                },
              });
            } catch {
              console.warn(
                `⚠️  Skipping MITRE technique ${mitreId} for mission ${mission.id} (may not exist yet)`
              );
            }
          }
        }

        if (missionData.levels && Array.isArray(missionData.levels)) {
          for (const levelData of missionData.levels) {
            const level = await prisma.level.upsert({
              where: { id: levelData.level_id },
              update: {
                missionId: missionData.mission_id,
                levelId: levelData.level_id,
                mitreId: levelData.mitre_id || null,
                title: levelData.title,
                orderIndex: levelData.order,
                taskType: levelData.task_type,
                dialogue: levelData.dialogue || [],
                workArea: levelData.work_area || {},
                validation: levelData.validation || {},
                rewards: levelData.rewards || { xp: 0, stealth_impact: 0 },
                hints: levelData.hints || [],
              },
              create: {
                id: levelData.level_id,
                missionId: missionData.mission_id,
                levelId: levelData.level_id,
                mitreId: levelData.mitre_id || null,
                title: levelData.title,
                orderIndex: levelData.order,
                taskType: levelData.task_type,
                dialogue: levelData.dialogue || [],
                workArea: levelData.work_area || {},
                validation: levelData.validation || {},
                rewards: levelData.rewards || { xp: 0, stealth_impact: 0 },
                hints: levelData.hints || [],
              },
            });

            console.log(`  ✅ Level: ${level.title}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing ${missionFile}:`, error);
      }
    }

    console.log('\n✅ All missions and levels loaded successfully!');
  } catch (error) {
    console.error('❌ Error loading missions:', error);
    console.log('⚠️  Missions directory not found or empty. Skipping mission data.');
  }

  await seedLanguages();

  await seedTranslations();

  console.log('\n✅ Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
