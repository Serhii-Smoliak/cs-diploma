import type { Level, SubmitAnswerRequest, SubmitAnswerResponse } from '@cybertactics/shared';
import { validateAnswer } from '../validators/AnswerValidator.js';
import { HttpError } from '../errors/httpError.js';
import prisma from '../db/database.js';
import { mapPrismaLevelToLevel } from '../utils/levelMapper.js';
import { changeStealth, getCurrentStealth } from './stealthService.js';
import { getStealthConfig } from '../config/stealthConfig.js';

export async function submitAnswer(
  userId: string,
  levelId: string,
  answer: SubmitAnswerRequest['answer']
): Promise<SubmitAnswerResponse> {
  console.log('submitAnswer called:', { userId, levelId, answer });

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    console.error(
      `User ${userId} not found in database. User should be created during registration.`
    );
    throw new HttpError(401, 'User not found. Please register or login first.');
  }

  const stealth = await getCurrentStealth(userId);
  if (stealth <= 0) {
    return {
      success: false,
      message: 'Stealth вичерпано. Відновіть стелс, щоб продовжити.',
      stealthDepleted: true,
      stealthChange: 0,
      stealth,
    };
  }

  const levelDb = await prisma.level.findFirst({
    where: { levelId },
  });

  if (!levelDb) {
    console.error('Level not found:', levelId);
    throw new HttpError(404, `Level ${levelId} not found`);
  }

  const level: Level = mapPrismaLevelToLevel(levelDb);

  console.log('Level loaded:', level.level_id, level.title);

  let isValid = false;
  try {
    isValid = validateAnswer(level, answer);
  } catch (error) {
    console.error('Validation error:', error);
    isValid = false;
  }

  let progress = await prisma.userProgress.findUnique({
    where: {
      userId_levelId: {
        userId,
        levelId,
      },
    },
  });

  const wasCompletedBeforeSubmit = progress?.completed === true;

  const answerString = typeof answer === 'string' ? answer : JSON.stringify(answer);

  if (!progress) {
    progress = await prisma.userProgress.create({
      data: {
        userId,
        levelId,
        completed: isValid,
        attempts: 1,
        lastAttempt: new Date(),
        lastAnswer: isValid ? answerString : null,
      },
    });
  } else {
    progress = await prisma.userProgress.update({
      where: {
        id: progress.id,
      },
      data: {
        attempts: progress.attempts + 1,
        lastAttempt: new Date(),
        completed: isValid ? true : progress.completed,
        lastAnswer: isValid ? answerString : progress.lastAnswer,
      },
    });
  }

  const stealthConfig = getStealthConfig();

  if (isValid) {
    let xpGained = 0;
    let stealthChange = 0;
    let message = '';

    if (level.mitre_id) {
      await prisma.userMitreTechnique.upsert({
        where: {
          userId_mitreId: {
            userId,
            mitreId: level.mitre_id,
          },
        },
        update: {},
        create: {
          userId,
          mitreId: level.mitre_id,
        },
      });
    }

    if (!wasCompletedBeforeSubmit) {
      const stats = await prisma.userStats.findUnique({
        where: { userId },
      });

      const newXp = (stats?.totalXp || 0) + level.rewards.xp;
      const rank = calculateRank(newXp);

      if (level.rewards.stealth_impact !== 0) {
        const { change } = await changeStealth(userId, level.rewards.stealth_impact);
        stealthChange = change;
      }

      await prisma.userStats.update({
        where: { userId },
        data: {
          totalXp: newXp,
          rank,
        },
      });

      xpGained = level.rewards.xp;
      message = `Вірно! +${level.rewards.xp} XP`;
    } else {
      message = 'Вірно! Завдання вже виконано раніше, бали нараховані.';
    }

    const nextLevel = await getNextLevel(level.mission_id, level.order);
    const currentStealth = await getCurrentStealth(userId);

    return {
      success: true,
      message,
      xpGained,
      stealthChange,
      stealth: currentStealth,
      nextLevelId: nextLevel?.level_id,
      userAnswer: answerString,
    };
  }

  const { change: stealthChange } = await changeStealth(userId, -stealthConfig.failPenalty);
  const currentStealth = await getCurrentStealth(userId);

  return {
    success: false,
    message: `Неправильна відповідь. Stealth ${stealthChange}%`,
    stealthChange,
    stealth: currentStealth,
    userAnswer: answerString,
    stealthDepleted: currentStealth <= 0,
  };
}

async function getNextLevel(missionId: string, currentOrder: number): Promise<Level | null> {
  try {
    const nextLevelDb = await prisma.level.findFirst({
      where: {
        missionId,
        orderIndex: currentOrder + 1,
      },
    });

    if (!nextLevelDb) {
      return null;
    }

    return mapPrismaLevelToLevel(nextLevelDb);
  } catch (error) {
    console.error('Error getting next level:', error);
    return null;
  }
}

function calculateRank(xp: number): string {
  if (xp >= 5000) return 'Elite Hacker';
  if (xp >= 3000) return 'Advanced Hacker';
  if (xp >= 1500) return 'Intermediate Hacker';
  if (xp >= 500) return 'Novice Hacker';
  return 'Script Kiddie';
}
