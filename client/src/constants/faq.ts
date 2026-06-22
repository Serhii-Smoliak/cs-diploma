export type FaqItem = {
  id: string;
  questionKey: string;
  answerKey: string;
};

export type FaqSection = {
  id: string;
  titleKey: string;
  items: FaqItem[];
};

export const FAQ_SECTIONS: FaqSection[] = [
  {
    id: 'platform',
    titleKey: 'section.platform',
    items: [
      { id: 'whatIs', questionKey: 'items.whatIs.question', answerKey: 'items.whatIs.answer' },
      {
        id: 'howMissions',
        questionKey: 'items.howMissions.question',
        answerKey: 'items.howMissions.answer',
      },
      { id: 'stealth', questionKey: 'items.stealth.question', answerKey: 'items.stealth.answer' },
      { id: 'xpRanks', questionKey: 'items.xpRanks.question', answerKey: 'items.xpRanks.answer' },
      {
        id: 'skillMatrix',
        questionKey: 'items.skillMatrix.question',
        answerKey: 'items.skillMatrix.answer',
      },
      { id: 'hints', questionKey: 'items.hints.question', answerKey: 'items.hints.answer' },
      {
        id: 'leaderboard',
        questionKey: 'items.leaderboard.question',
        answerKey: 'items.leaderboard.answer',
      },
      {
        id: 'language',
        questionKey: 'items.language.question',
        answerKey: 'items.language.answer',
      },
    ],
  },
  {
    id: 'missionTypes',
    titleKey: 'section.missionTypes',
    items: [
      {
        id: 'codeEditor',
        questionKey: 'items.codeEditor.question',
        answerKey: 'items.codeEditor.answer',
      },
      {
        id: 'tacticalChoice',
        questionKey: 'items.tacticalChoice.question',
        answerKey: 'items.tacticalChoice.answer',
      },
      {
        id: 'phishingConstructor',
        questionKey: 'items.phishingConstructor.question',
        answerKey: 'items.phishingConstructor.answer',
      },
      {
        id: 'sentenceConstructor',
        questionKey: 'items.sentenceConstructor.question',
        answerKey: 'items.sentenceConstructor.answer',
      },
    ],
  },
];
