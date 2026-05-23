import type {
  Level,
  EmailSubmission,
  SentenceConstructorSubmission,
  SubmitAnswerRequest,
} from '@cybertactics/shared';

export function validateAnswer(level: Level, answer: SubmitAnswerRequest['answer']): boolean {
  const { validation } = level;

  switch (validation.type) {
    case 'regex_match':
      return validateRegex(
        answer as string,
        validation.correct_pattern || '',
        validation.test_string || ''
      );

    case 'choice':
      return validateChoice(answer as number, validation.correct_choice_id || '');

    case 'email_check':
      return validateEmail(answer, validation, level);

    case 'ast_parse':
      return validateAST(answer as string, validation.correct_pattern || '');

    case 'sentence_combination':
      return validateSentenceCombination(answer, validation, level);

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

function isEmailSubmission(value: SubmitAnswerRequest['answer']): value is EmailSubmission {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && 'subject' in value;
}

function isSentenceSubmission(
  value: SubmitAnswerRequest['answer']
): value is SentenceConstructorSubmission {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && 'fields' in value;
}

function validateEmail(
  answer: SubmitAnswerRequest['answer'],
  validation: Level['validation'],
  level?: Level
): boolean {
  if (!isEmailSubmission(answer)) return false;

  const text = `${answer.subject || ''} ${answer.body || ''}`.toLowerCase();
  const keywordGroups = validation.required_keyword_groups;
  const requiredKeywords = validation.required_keywords || [];

  const hasKeywords =
    keywordGroups && keywordGroups.length > 0
      ? keywordGroups.every((group) =>
          group.some((keyword) => text.includes(keyword.toLowerCase()))
        )
      : requiredKeywords.every((keyword) => text.includes(keyword.toLowerCase()));

  const attachmentIds = answer.attachments || [];
  const attachmentNames = attachmentIds.map((id: string) => {
    if (id.includes('.')) {
      return id;
    }
    const attachment = level?.work_area?.attachments?.find((att) => att.id === id);
    return attachment?.name || id;
  });

  const blockedExtensions = validation.blocked_extensions || [];
  const hasBlocked = attachmentNames.some((name: string) =>
    blockedExtensions.some((ext) => name.toLowerCase().endsWith(ext.toLowerCase()))
  );

  return hasKeywords && !hasBlocked;
}

function normalizeSequenceOptions(value: string[] | string[][]): string[][] {
  if (value.length === 0) return [];
  if (typeof value[0] === 'string') {
    return [value as string[]];
  }
  return value as string[][];
}

function sequencesMatch(submitted: string[], expected: string[]): boolean {
  return submitted.length === expected.length && submitted.every((id, i) => id === expected[i]);
}

function validateSentenceCombination(
  answer: SubmitAnswerRequest['answer'],
  validation: Level['validation'],
  level?: Level
): boolean {
  if (!isSentenceSubmission(answer)) return false;

  const correctSequences = validation.correct_sequences;
  if (!correctSequences) return false;

  for (const [fieldId, optionsRaw] of Object.entries(correctSequences)) {
    const options = normalizeSequenceOptions(optionsRaw);
    const submitted = answer.fields[fieldId];
    if (!submitted || !options.some((option) => sequencesMatch(submitted, option))) {
      return false;
    }
  }

  const requiredAttachments = validation.required_attachments || [];
  const hasRequired = requiredAttachments.every((id) => answer.attachments.includes(id));
  if (!hasRequired) return false;

  const attachmentNames = answer.attachments.map((id: string) => {
    const attachment = level?.work_area?.attachments?.find((att) => att.id === id);
    return attachment?.name || id;
  });

  const blockedExtensions = validation.blocked_extensions || [];
  if (blockedExtensions.length > 0) {
    const hasBlocked = attachmentNames.some((name: string) =>
      blockedExtensions.some((ext) => name.toLowerCase().endsWith(ext.toLowerCase()))
    );
    if (hasBlocked) return false;
  }

  return true;
}

function validateAST(answer: string, pattern: string): boolean {
  try {
    const lowerAnswer = answer.toLowerCase();
    const lowerPattern = pattern.toLowerCase();

    if (lowerPattern.includes('invoke-webrequest') || lowerPattern.includes('iwr')) {
      return lowerAnswer.includes('invoke-webrequest') || lowerAnswer.includes('iwr');
    }

    return lowerAnswer.includes(lowerPattern);
  } catch {
    return false;
  }
}
