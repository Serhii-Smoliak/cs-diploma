import { describe, expect, it } from 'vitest';
import { createCommunityTopic } from './communityData';
import { COMMUNITY_CATEGORIES, COMMUNITY_TOPICS } from './community';

describe('createCommunityTopic', () => {
  it('builds topic with translation keys and posts', () => {
    const topic = createCommunityTopic('testTopic', 'general', 2, ['op', 'r1']);

    expect(topic).toEqual({
      id: 'testTopic',
      categoryId: 'general',
      titleKey: 'topics.testTopic.title',
      excerptKey: 'topics.testTopic.excerpt',
      replyCount: 2,
      lastActivityKey: 'topics.testTopic.lastActivity',
      posts: [
        {
          id: 'op',
          authorKey: 'topics.testTopic.posts.op.author',
          bodyKey: 'topics.testTopic.posts.op.body',
          timeKey: 'topics.testTopic.posts.op.time',
        },
        {
          id: 'r1',
          authorKey: 'topics.testTopic.posts.r1.author',
          bodyKey: 'topics.testTopic.posts.r1.body',
          timeKey: 'topics.testTopic.posts.r1.time',
        },
      ],
    });
  });
});

describe('community constants', () => {
  it('defines categories and seeded topics', () => {
    expect(COMMUNITY_CATEGORIES).toContain('missions');
    expect(COMMUNITY_TOPICS.length).toBeGreaterThan(0);
    expect(COMMUNITY_TOPICS[0]?.posts.length).toBeGreaterThan(0);
  });
});
