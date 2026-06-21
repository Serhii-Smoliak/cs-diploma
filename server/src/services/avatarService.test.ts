import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:fs/promises', () => ({
  default: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
    unlink: vi.fn().mockRejectedValue(new Error('missing')),
  },
}));

describe('avatarService', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('builds avatar paths', async () => {
    const { getAvatarPublicPath, getAvatarFilePath } = await import('./avatarService.js');
    expect(getAvatarPublicPath('u1')).toBe('/uploads/avatars/u1.jpg');
    expect(getAvatarFilePath('u1')).toContain(`${path.sep}u1.jpg`);
  });

  it('rejects invalid data url', async () => {
    const { saveAvatarFromDataUrl } = await import('./avatarService.js');
    await expect(saveAvatarFromDataUrl('u1', 'not-an-image')).rejects.toThrow('Invalid image data');
  });

  it('saves valid jpeg data url', async () => {
    const { saveAvatarFromDataUrl } = await import('./avatarService.js');
    const dataUrl = `data:image/jpeg;base64,${Buffer.from('avatar').toString('base64')}`;
    const savedPath = await saveAvatarFromDataUrl('u1', dataUrl);

    expect(savedPath).toMatch(/^\/uploads\/avatars\/u1\.jpg\?v=\d+$/);
    expect(fs.writeFile).toHaveBeenCalled();
  });

  it('ignores missing file on delete', async () => {
    const { deleteAvatarFile } = await import('./avatarService.js');
    await expect(deleteAvatarFile('u1')).resolves.toBeUndefined();
  });
});
