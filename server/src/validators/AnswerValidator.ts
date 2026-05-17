import type { Level } from '@cybertactics/shared';

export function validateAnswer(level: Level, answer: string | number | any): boolean {
  const { validation } = level;

  switch (validation.type) {
    case 'regex_match':
      return validateRegex(answer as string, validation.correct_pattern || '', validation.test_string || '');

    case 'choice':
      return validateChoice(answer as number, validation.correct_choice_id || '');

    case 'email_check':
      return validateEmail(answer, validation.required_keywords || [], validation.blocked_extensions || [], level);

    case 'ast_parse':
      return validateAST(answer as string, validation.correct_pattern || '');

    default:
      return false;
  }
}

function validateRegex(answer: string, pattern: string, testString: string): boolean {
  try {
    if (!answer || typeof answer !== 'string' || answer.trim() === '') {
      console.error('Invalid regex answer:', answer);
      return false;
    }

    const normalizedAnswer = answer.replace(/\\\\/g, '\\');
    const regex = new RegExp(normalizedAnswer);
    const result = regex.test(testString);
    console.log('Regex validation:', { answer, normalizedAnswer, testString, result });
    return result;
  } catch (error) {
    console.error('Regex validation error:', error, 'Pattern:', answer);
    return false;
  }
}

function validateChoice(answer: number | string, correctChoiceId: string): boolean {
  if (typeof answer === 'number') {
    return false;
  }
  return String(answer) === correctChoiceId;
}

function validateEmail(answer: any, requiredKeywords: string[], blockedExtensions: string[], level?: Level): boolean {
  if (!answer || typeof answer !== 'object') return false;

  const text = `${answer.subject || ''} ${answer.body || ''}`.toLowerCase();
  const hasKeywords = requiredKeywords.every(keyword => text.includes(keyword.toLowerCase()));

  const attachmentIds = answer.attachments || [];
  const attachmentNames = attachmentIds.map((id: string) => {
    if (id.includes('.')) {
      return id;
    }
    const attachment = level?.work_area?.attachments?.find((att: any) => att.id === id);
    return attachment?.name || id;
  });
  
  const hasBlocked = attachmentNames.some((name: string) =>
    blockedExtensions.some(ext => name.toLowerCase().endsWith(ext.toLowerCase()))
  );

  return hasKeywords && !hasBlocked;
}

function validateAST(answer: string, pattern: string): boolean {
  try {
    const lowerAnswer = answer.toLowerCase();
    const lowerPattern = pattern.toLowerCase();

    if (lowerPattern.includes('invoke-webrequest') || lowerPattern.includes('iwr')) {
      return lowerAnswer.includes('invoke-webrequest') || lowerAnswer.includes('iwr');
    }

    return lowerAnswer.includes(lowerPattern);
  } catch (error) {
    return false;
  }
}

