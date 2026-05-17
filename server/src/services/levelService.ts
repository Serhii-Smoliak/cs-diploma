import type { Level, SubmitAnswerResponse } from '@cybertactics/shared';
import { validateAnswer } from '../validators/AnswerValidator.js';
import prisma from '../db/database.js';

export async function submitAnswer(
  userId: string,
  levelId: string,
  answer: string | number | any
): Promise<SubmitAnswerResponse> {
  console.log('submitAnswer called:', { userId, levelId, answer });

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    console.error(`User ${userId} not found in database. User should be created during registration.`);
    throw new Error(`User not found. Please register or login first.`);
  }

  const levelDb = await prisma.level.findFirst({
    where: { levelId },
  });

  if (!levelDb) {
    console.error('Level not found:', levelId);
    throw new Error(`Level ${levelId} not found`);
  }

  const level: Level = {
    level_id: levelDb.levelId,
    mission_id: levelDb.missionId,
    mitre_id: levelDb.mitreId || '',
    title: levelDb.title,
    order: levelDb.orderIndex,
    dialogue: (levelDb.dialogue as any[]) || [],
    task_type: levelDb.taskType as 'code_editor' | 'tactical_choice' | 'phishing_constructor',
    work_area: (levelDb.workArea as any) || {},
    validation: (levelDb.validation as any) || {},
    rewards: (levelDb.rewards as any) || { xp: 0, stealth_impact: 0 },
    hints: (levelDb.hints as string[]) || [],
  };
  
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
      const newStealth = Math.max(0, Math.min(100, (stats?.stealth || 100) + level.rewards.stealth_impact));

      const rank = calculateRank(newXp);

      await prisma.userStats.upsert({
        where: { userId },
        update: {
          totalXp: newXp,
          stealth: newStealth,
          rank,
        },
        create: {
          userId,
          totalXp: newXp,
          stealth: newStealth,
          rank,
          completedLevels: 0,
        },
      });

      xpGained = level.rewards.xp;
      stealthChange = level.rewards.stealth_impact;
      message = `Вірно! +${level.rewards.xp} XP`;
    } else {
      message = 'Вірно! Завдання вже виконано раніше, бали нараховані.';
    }

    const nextLevel = await getNextLevel(level.mission_id, level.order);

    const validation = level.validation as any;
    let correctAnswer: string | null = null;
    
    if (validation?.type === 'regex_match') {
      correctAnswer = validation.correct_pattern || null;
    } else if (validation?.type === 'choice') {
      correctAnswer = validation.correct_choice_id || null;
    } else {
      correctAnswer = validation?.expected_answer ||
                      validation?.correct_answer || 
                      validation?.answer || null;
    }

    return {
      success: true,
      message,
      xpGained,
      stealthChange,
      nextLevelId: nextLevel?.level_id,
      correctAnswer,
      userAnswer: answerString,
    };
  } else {
    const stats = await prisma.userStats.findUnique({
      where: { userId },
    });
    const newStealth = Math.max(0, (stats?.stealth || 100) - 5);

    await prisma.userStats.upsert({
      where: { userId },
      update: {
        stealth: newStealth,
      },
      create: {
        userId,
        totalXp: 0,
        stealth: newStealth,
        rank: 'Script Kiddie',
        completedLevels: 0,
      },
    });

    const validation = level.validation as any;
    let correctAnswer: string | null = null;
    
    if (validation?.type === 'regex_match') {
      correctAnswer = validation.correct_pattern || null;
    } else if (validation?.type === 'choice') {
      correctAnswer = validation.correct_choice_id || null;
    } else {
      correctAnswer = validation?.expected_answer ||
                      validation?.correct_answer || 
                      validation?.answer || null;
    }

    return {
      success: false,
      message: 'Неправильна відповідь. Stealth -5%',
      stealthChange: -5,
      correctAnswer,
      userAnswer: answerString,
    };
  }
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

    return {
      level_id: nextLevelDb.levelId,
      mission_id: nextLevelDb.missionId,
      mitre_id: nextLevelDb.mitreId || '',
      title: nextLevelDb.title,
      order: nextLevelDb.orderIndex,
      dialogue: (nextLevelDb.dialogue as any[]) || [],
      task_type: nextLevelDb.taskType as 'code_editor' | 'tactical_choice' | 'phishing_constructor',
      work_area: (nextLevelDb.workArea as any) || {},
      validation: (nextLevelDb.validation as any) || {},
      rewards: (nextLevelDb.rewards as any) || { xp: 0, stealth_impact: 0 },
      hints: (nextLevelDb.hints as string[]) || [],
    };
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

