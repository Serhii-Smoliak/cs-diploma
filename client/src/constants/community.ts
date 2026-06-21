export type CommunityCategoryId = 'all' | 'general' | 'missions' | 'mitre' | 'tips';

export type CommunityPost = {
  id: string;
  authorKey: string;
  bodyKey: string;
  timeKey: string;
};

export type CommunityTopic = {
  id: string;
  categoryId: Exclude<CommunityCategoryId, 'all'>;
  titleKey: string;
  excerptKey: string;
  replyCount: number;
  lastActivityKey: string;
  posts: CommunityPost[];
};

export const COMMUNITY_CATEGORIES: CommunityCategoryId[] = [
  'all',
  'general',
  'missions',
  'mitre',
  'tips',
];

export const COMMUNITY_TOPICS: CommunityTopic[] = [
  {
    id: 'welcome',
    categoryId: 'general',
    titleKey: 'topics.welcome.title',
    excerptKey: 'topics.welcome.excerpt',
    replyCount: 2,
    lastActivityKey: 'topics.welcome.lastActivity',
    posts: [
      {
        id: 'op',
        authorKey: 'topics.welcome.posts.op.author',
        bodyKey: 'topics.welcome.posts.op.body',
        timeKey: 'topics.welcome.posts.op.time',
      },
      {
        id: 'r1',
        authorKey: 'topics.welcome.posts.r1.author',
        bodyKey: 'topics.welcome.posts.r1.body',
        timeKey: 'topics.welcome.posts.r1.time',
      },
      {
        id: 'r2',
        authorKey: 'topics.welcome.posts.r2.author',
        bodyKey: 'topics.welcome.posts.r2.body',
        timeKey: 'topics.welcome.posts.r2.time',
      },
    ],
  },
  {
    id: 'ghostStart',
    categoryId: 'missions',
    titleKey: 'topics.ghostStart.title',
    excerptKey: 'topics.ghostStart.excerpt',
    replyCount: 3,
    lastActivityKey: 'topics.ghostStart.lastActivity',
    posts: [
      {
        id: 'op',
        authorKey: 'topics.ghostStart.posts.op.author',
        bodyKey: 'topics.ghostStart.posts.op.body',
        timeKey: 'topics.ghostStart.posts.op.time',
      },
      {
        id: 'r1',
        authorKey: 'topics.ghostStart.posts.r1.author',
        bodyKey: 'topics.ghostStart.posts.r1.body',
        timeKey: 'topics.ghostStart.posts.r1.time',
      },
      {
        id: 'r2',
        authorKey: 'topics.ghostStart.posts.r2.author',
        bodyKey: 'topics.ghostStart.posts.r2.body',
        timeKey: 'topics.ghostStart.posts.r2.time',
      },
    ],
  },
  {
    id: 'ironSignal',
    categoryId: 'missions',
    titleKey: 'topics.ironSignal.title',
    excerptKey: 'topics.ironSignal.excerpt',
    replyCount: 4,
    lastActivityKey: 'topics.ironSignal.lastActivity',
    posts: [
      {
        id: 'op',
        authorKey: 'topics.ironSignal.posts.op.author',
        bodyKey: 'topics.ironSignal.posts.op.body',
        timeKey: 'topics.ironSignal.posts.op.time',
      },
      {
        id: 'r1',
        authorKey: 'topics.ironSignal.posts.r1.author',
        bodyKey: 'topics.ironSignal.posts.r1.body',
        timeKey: 'topics.ironSignal.posts.r1.time',
      },
      {
        id: 'r2',
        authorKey: 'topics.ironSignal.posts.r2.author',
        bodyKey: 'topics.ironSignal.posts.r2.body',
        timeKey: 'topics.ironSignal.posts.r2.time',
      },
    ],
  },
  {
    id: 'killChain',
    categoryId: 'mitre',
    titleKey: 'topics.killChain.title',
    excerptKey: 'topics.killChain.excerpt',
    replyCount: 2,
    lastActivityKey: 'topics.killChain.lastActivity',
    posts: [
      {
        id: 'op',
        authorKey: 'topics.killChain.posts.op.author',
        bodyKey: 'topics.killChain.posts.op.body',
        timeKey: 'topics.killChain.posts.op.time',
      },
      {
        id: 'r1',
        authorKey: 'topics.killChain.posts.r1.author',
        bodyKey: 'topics.killChain.posts.r1.body',
        timeKey: 'topics.killChain.posts.r1.time',
      },
    ],
  },
  {
    id: 'stealthTips',
    categoryId: 'tips',
    titleKey: 'topics.stealthTips.title',
    excerptKey: 'topics.stealthTips.excerpt',
    replyCount: 3,
    lastActivityKey: 'topics.stealthTips.lastActivity',
    posts: [
      {
        id: 'op',
        authorKey: 'topics.stealthTips.posts.op.author',
        bodyKey: 'topics.stealthTips.posts.op.body',
        timeKey: 'topics.stealthTips.posts.op.time',
      },
      {
        id: 'r1',
        authorKey: 'topics.stealthTips.posts.r1.author',
        bodyKey: 'topics.stealthTips.posts.r1.body',
        timeKey: 'topics.stealthTips.posts.r1.time',
      },
      {
        id: 'r2',
        authorKey: 'topics.stealthTips.posts.r2.author',
        bodyKey: 'topics.stealthTips.posts.r2.body',
        timeKey: 'topics.stealthTips.posts.r2.time',
      },
    ],
  },
  {
    id: 'regexRecon',
    categoryId: 'tips',
    titleKey: 'topics.regexRecon.title',
    excerptKey: 'topics.regexRecon.excerpt',
    replyCount: 2,
    lastActivityKey: 'topics.regexRecon.lastActivity',
    posts: [
      {
        id: 'op',
        authorKey: 'topics.regexRecon.posts.op.author',
        bodyKey: 'topics.regexRecon.posts.op.body',
        timeKey: 'topics.regexRecon.posts.op.time',
      },
      {
        id: 'r1',
        authorKey: 'topics.regexRecon.posts.r1.author',
        bodyKey: 'topics.regexRecon.posts.r1.body',
        timeKey: 'topics.regexRecon.posts.r1.time',
      },
    ],
  },
];
