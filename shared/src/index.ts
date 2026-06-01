// Shared types for CyberTactics

export interface User {
  id: string;
  username: string;
  email: string;
  xp: number;
  rank: string;
  stealth: number;
  avatarUrl?: string | null;
  preferredLocale?: string | null;
  createdAt: string;
}

export interface Mission {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  mitreTechniques: string[];
  order: number;
}

export interface MitreTechniqueInfo {
  id: string;
  name: string;
  description: string | null;
  tactic: string;
  url: string | null;
}

export interface Level {
  level_id: string;
  mission_id: string;
  mitre_id: string;
  mitre_technique: MitreTechniqueInfo | null;
  title: string;
  order: number;
  dialogue: DialogueMessage[];
  task_type: 'code_editor' | 'tactical_choice' | 'phishing_constructor' | 'sentence_constructor';
  work_area: WorkArea;
  validation: Validation;
  rewards: Rewards;
  hints: string[];
}

export interface DialogueMessage {
  speaker: 'system' | 'handler' | 'hint';
  text: string;
}

export interface WorkArea {
  code_snippet?: string;
  input_type?: 'regex' | 'code' | 'command';
  placeholder?: string;
  choices?: Choice[];
  email_fields?: EmailFields;
  email_to?: string;
  fields?: SentenceField[];
  attachments?: Attachment[];
}

export interface SentenceField {
  id: string;
  label?: string;
  slots: number;
  tokens: SentenceToken[];
}

export interface SentenceToken {
  id: string;
  text: string;
}

export interface Choice {
  id: string;
  text: string;
  correct: boolean;
  feedback?: string;
}

export interface EmailFields {
  to: string;
  subject: string;
  body: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  allowed: boolean;
}

export interface Validation {
  type: 'regex_match' | 'ast_parse' | 'choice' | 'email_check' | 'sentence_combination';
  correct_pattern?: string;
  test_string?: string;
  correct_choice_id?: string;
  required_keywords?: string[];
  required_keyword_groups?: string[][];
  blocked_extensions?: string[];
  correct_sequences?: Record<string, string[] | string[][]>;
  required_attachments?: string[];
}

export interface Rewards {
  xp: number;
  stealth_impact: number;
}

export interface UserProgress {
  userId: string;
  levelId: string;
  completed: boolean;
  attempts: number;
  lastAttempt: string;
  lastAnswer?: string | null;
  bestScore?: number;
}

export interface UserStats {
  userId: string;
  totalXp: number;
  rank: string;
  stealth: number;
  completedLevels: number;
  mitreTechniques: string[];
}

export interface SubmitAnswerRequest {
  levelId: string;
  answer: string | number | EmailSubmission | SentenceConstructorSubmission;
}

export interface EmailSubmission {
  to: string;
  subject: string;
  body: string;
  attachments: string[];
}

export interface SentenceConstructorSubmission {
  to?: string;
  fields: Record<string, string[]>;
  attachments: string[];
}

export interface SubmitAnswerResponse {
  success: boolean;
  message: string;
  xpGained?: number;
  stealthChange?: number;
  stealth?: number;
  nextLevelId?: string;
  userAnswer?: string | null;
  stealthDepleted?: boolean;
}

