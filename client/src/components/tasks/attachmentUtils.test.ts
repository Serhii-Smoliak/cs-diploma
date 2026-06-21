import { describe, expect, it } from 'vitest';
import { getAttachmentIcon, toggleAttachmentSelection } from './attachmentUtils';

describe('toggleAttachmentSelection', () => {
  it('adds attachment id when not selected', () => {
    expect(toggleAttachmentSelection(['a'], 'b')).toEqual(['a', 'b']);
  });

  it('removes attachment id when already selected', () => {
    expect(toggleAttachmentSelection(['a', 'b'], 'a')).toEqual(['b']);
  });
});

describe('getAttachmentIcon', () => {
  it('returns word document icon', () => {
    expect(getAttachmentIcon('application/msword')).toBe('📄');
  });

  it('returns executable icon', () => {
    expect(getAttachmentIcon('application/exe')).toBe('⚙️');
  });

  it('returns default folder icon', () => {
    expect(getAttachmentIcon('pdf')).toBe('📁');
  });
});
