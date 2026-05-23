import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const missionPath = path.join(__dirname, '../src/data/missions/operation_ghost.json');
const mission = JSON.parse(readFileSync(missionPath, 'utf-8')) as {
  levels: Array<{ level_id: string; work_area: object; validation: object; hints: string[] }>;
};

const levelData = mission.levels.find((l) => l.level_id === 'ghost_initial_03');
if (!levelData) throw new Error('ghost_initial_03 not found');

await prisma.level.updateMany({
  where: { levelId: 'ghost_initial_03' },
  data: {
    workArea: levelData.work_area,
    validation: levelData.validation,
    hints: levelData.hints,
  },
});

console.log('ghost_initial_03 validation and attachments updated');
await prisma.$disconnect();
