import type { CommunityCategoryId, CommunityPost, CommunityTopic } from './community.types';

function postKey(topicId: string, postId: string, field: 'author' | 'body' | 'time'): string {
  return `topics.${topicId}.posts.${postId}.${field}`;
}

function createPost(topicId: string, postId: string): CommunityPost {
  return {
    id: postId,
    authorKey: postKey(topicId, postId, 'author'),
    bodyKey: postKey(topicId, postId, 'body'),
    timeKey: postKey(topicId, postId, 'time'),
  };
}

export function createCommunityTopic(
  id: string,
  categoryId: Exclude<CommunityCategoryId, 'all'>,
  replyCount: number,
  postIds: string[]
): CommunityTopic {
  return {
    id,
    categoryId,
    titleKey: `topics.${id}.title`,
    excerptKey: `topics.${id}.excerpt`,
    replyCount,
    lastActivityKey: `topics.${id}.lastActivity`,
    posts: postIds.map((postId) => createPost(id, postId)),
  };
}
