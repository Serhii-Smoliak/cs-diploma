import { createCommunityTopic } from './communityData';
import type { CommunityCategoryId, CommunityTopic } from './community.types';

export type { CommunityCategoryId, CommunityPost, CommunityTopic } from './community.types';

export const COMMUNITY_CATEGORIES: CommunityCategoryId[] = [
  'all',
  'general',
  'missions',
  'mitre',
  'tips',
];

export const COMMUNITY_TOPICS: CommunityTopic[] = [
  createCommunityTopic('welcome', 'general', 2, ['op', 'r1', 'r2']),
  createCommunityTopic('ghostStart', 'missions', 3, ['op', 'r1', 'r2']),
  createCommunityTopic('ironSignal', 'missions', 4, ['op', 'r1', 'r2']),
  createCommunityTopic('killChain', 'mitre', 2, ['op', 'r1']),
  createCommunityTopic('stealthTips', 'tips', 3, ['op', 'r1', 'r2']),
  createCommunityTopic('regexRecon', 'tips', 2, ['op', 'r1']),
];
