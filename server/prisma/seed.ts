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

async function main() {
  console.log('🌱 Seeding database...\n');

  const testUsers = [
    {
      id: 'test-user-admin',
      username: 'admin',
      email: 'admin@cybertactics.test',
      password: 'admin123',
      role: UserRole.ADMIN,
    },
    {
      id: 'test-user-test1',
      username: 'test1',
      email: 'test1@cybertactics.test',
      password: 'test1123',
      role: UserRole.USER,
    },
    {
      id: 'test-user-test2',
      username: 'test2',
      email: 'test2@cybertactics.test',
      password: 'test2123',
      role: UserRole.USER,
    },
  ] as const;

  for (const account of testUsers) {
    await prisma.user.deleteMany({
      where: { email: account.email },
    });

    const passwordHash = await bcrypt.hash(account.password, 10);

    const user = await prisma.user.create({
      data: {
        id: account.id,
        username: account.username,
        email: account.email,
        passwordHash,
        role: account.role,
        xp: 0,
        rank: 'Script Kiddie',
        stealth: 100,
      },
    });

    await prisma.userStats.create({
      data: {
        userId: user.id,
        totalXp: 0,
        rank: 'Script Kiddie',
        stealth: 100,
        completedLevels: 0,
      },
    });

    console.log('✅ Test user created successfully!');
    console.log('📧 Credentials:');
    console.log(`   Email: ${account.email}`);
    console.log(`   Password: ${account.password}`);
    console.log('');
  }

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
            mitreTechniques: missionData.mitre_techniques || [],
          },
          create: {
            id: missionData.mission_id,
            name: missionData.name,
            description: missionData.description,
            difficulty: missionData.difficulty,
            orderIndex: 1,
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
