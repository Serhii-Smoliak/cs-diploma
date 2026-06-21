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
