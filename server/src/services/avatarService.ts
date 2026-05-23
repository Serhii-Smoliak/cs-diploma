import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const AVATARS_DIR = path.join(__dirname, '../../uploads/avatars');

export async function ensureAvatarsDir() {
  await fs.mkdir(AVATARS_DIR, { recursive: true });
}

export function getAvatarPublicPath(userId: string): string {
  return `/uploads/avatars/${userId}.jpg`;
}

export function getAvatarFilePath(userId: string): string {
  return path.join(AVATARS_DIR, `${userId}.jpg`);
}

export async function saveAvatarFromDataUrl(userId: string, dataUrl: string): Promise<string> {
  const match = /^data:image\/(?:jpeg|jpg|png|webp);base64,(.+)$/i.exec(dataUrl);
  if (!match) {
    throw new Error('Invalid image data');
  }

  const buffer = Buffer.from(match[1], 'base64');
  if (buffer.length > 2 * 1024 * 1024) {
    throw new Error('Image too large');
  }

  await ensureAvatarsDir();
  const filePath = getAvatarFilePath(userId);
  await fs.writeFile(filePath, buffer);

  return `${getAvatarPublicPath(userId)}?v=${Date.now()}`;
}

export async function deleteAvatarFile(userId: string) {
  try {
    await fs.unlink(getAvatarFilePath(userId));
  } catch {
    // ignore missing file
  }
}
