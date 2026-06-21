import { describe, expect, it } from 'vitest';
import { FAQ_SECTIONS } from './faq';

describe('FAQ_SECTIONS', () => {
  it('contains platform and mission type sections', () => {
    expect(FAQ_SECTIONS.map((section) => section.id)).toEqual(['platform', 'missionTypes']);
    expect(FAQ_SECTIONS[0]?.items.length).toBeGreaterThan(0);
    expect(FAQ_SECTIONS[1]?.items.some((item) => item.id === 'phishingConstructor')).toBe(true);
  });
});
