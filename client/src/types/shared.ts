// Shared types for CyberTactics

// Export types for runtime (TypeScript will strip these in JS, but they're available for type checking)
export type {};

export interface User {
  id: string;
  username: string;
  email: string;
  xp: number;
  rank: string;
  stealth: number;
  createdAt: string;
}

export interface Mission {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  mitreTechniques: string[];
  order: number;
  handlerGroup?: string | null;
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
  task_type: 'code_editor' | 'tactical_choice' | 'phishing_constructor';
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
  attachments?: Attachment[];
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
  type: 'regex_match' | 'ast_parse' | 'choice' | 'email_check';
  correct_pattern?: string;
  test_string?: string;
  correct_choice_id?: string;
  required_keywords?: string[];
  blocked_extensions?: string[];
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
  answer: string | number | EmailSubmission;
}

export interface EmailSubmission {
  to: string;
  subject: string;
  body: string;
  attachments: string[];
}

export interface SubmitAnswerResponse {
  success: boolean;
  message: string;
  xpGained?: number;
  stealthChange?: number;
  nextLevelId?: string;
}

