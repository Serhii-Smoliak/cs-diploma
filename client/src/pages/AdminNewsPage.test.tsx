import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { t, i18n } = vi.hoisted(() => ({
  t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  i18n: { resolvedLanguage: 'uk' },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t, i18n }),
}));

vi.mock('../services/api', () => ({
  api: {
    getAdminNewsPosts: vi.fn(),
    createAdminNewsPost: vi.fn(),
    updateAdminNewsPost: vi.fn(),
    deleteAdminNewsPost: vi.fn(),
  },
}));

import { api, type NewsPost } from '../services/api';
import AdminNewsPage from './AdminNewsPage';

const samplePost: NewsPost = {
  id: 'news-1',
  titleUk: 'Новина UA',
  titleEn: 'News EN',
  bodyUk: 'Текст UA',
  bodyEn: 'Text EN',
  title: 'Новина UA',
  body: 'Текст UA',
  isPublished: true,
  publishedAt: '2026-06-23T10:00:00.000Z',
  authorId: 'admin-1',
  createdAt: '2026-06-23T10:00:00.000Z',
  updatedAt: '2026-06-23T10:00:00.000Z',
  authorUsername: 'admin',
};

function clickConfirmDelete(user: ReturnType<typeof userEvent.setup>) {
  const deleteButtons = screen.getAllByRole('button', { name: 'Видалити' });
  return user.click(deleteButtons[deleteButtons.length - 1]!);
}

describe('AdminNewsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getAdminNewsPosts).mockResolvedValue([samplePost]);
    vi.mocked(api.createAdminNewsPost).mockResolvedValue(samplePost);
    vi.mocked(api.updateAdminNewsPost).mockResolvedValue(samplePost);
    vi.mocked(api.deleteAdminNewsPost).mockResolvedValue(undefined);
  });

  it('loads admin news list', async () => {
    render(<AdminNewsPage />);

    expect(await screen.findByText('Новина UA')).toBeInTheDocument();
    expect(screen.getByText('Опубліковано')).toBeInTheDocument();
  });

  it('creates a new article', async () => {
    const user = userEvent.setup();
    render(<AdminNewsPage />);

    await screen.findByText('Новина UA');
    await user.click(screen.getByRole('button', { name: 'Нова публікація' }));

    const inputs = screen.getAllByRole('textbox');
    await user.type(inputs[0]!, 'Заголовок UA');
    await user.type(inputs[1]!, 'Title EN');
    await user.type(inputs[2]!, 'Body UA long enough');
    await user.type(inputs[3]!, 'Body EN long enough');

    await user.click(screen.getByRole('button', { name: 'Зберегти' }));

    await waitFor(() => {
      expect(api.createAdminNewsPost).toHaveBeenCalledWith({
        titleUk: 'Заголовок UA',
        titleEn: 'Title EN',
        bodyUk: 'Body UA long enough',
        bodyEn: 'Body EN long enough',
        isPublished: false,
      });
    });
  });

  it('loads post into edit form', async () => {
    const user = userEvent.setup();
    render(<AdminNewsPage />);

    await user.click(await screen.findByText('Новина UA'));

    await waitFor(() => {
      expect(screen.getByDisplayValue('Новина UA')).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue('News EN')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Скасувати' })).toBeInTheDocument();
  });

  it('updates existing article', async () => {
    const user = userEvent.setup();
    render(<AdminNewsPage />);

    await user.click(await screen.findByText('Новина UA'));
    const titleUkInput = await screen.findByDisplayValue('Новина UA');
    await user.clear(titleUkInput);
    await user.type(titleUkInput, 'Оновлений заголовок');

    await user.click(screen.getByRole('button', { name: 'Зберегти' }));

    await waitFor(() => {
      expect(api.updateAdminNewsPost).toHaveBeenCalledWith(
        'news-1',
        expect.objectContaining({ titleUk: 'Оновлений заголовок' })
      );
    });
  });

  it('deletes article after confirmation', async () => {
    const user = userEvent.setup();
    render(<AdminNewsPage />);

    await user.click(await screen.findByRole('button', { name: 'Видалити' }));
    expect(screen.getByText('Видалити публікацію?')).toBeInTheDocument();

    await clickConfirmDelete(user);

    await waitFor(() => {
      expect(api.deleteAdminNewsPost).toHaveBeenCalledWith('news-1');
    });
  });

  it('shows load error', async () => {
    vi.mocked(api.getAdminNewsPosts).mockRejectedValue(new Error('Load failed'));
    render(<AdminNewsPage />);

    expect(await screen.findByText('Load failed')).toBeInTheDocument();
  });

  it('shows empty list state', async () => {
    vi.mocked(api.getAdminNewsPosts).mockResolvedValue([]);
    render(<AdminNewsPage />);

    expect(await screen.findByText('Публікацій поки немає.')).toBeInTheDocument();
  });

  it('publishes article when checkbox is checked', async () => {
    const user = userEvent.setup();
    render(<AdminNewsPage />);

    await user.click(screen.getByRole('button', { name: 'Нова публікація' }));
    const inputs = screen.getAllByRole('textbox');
    await user.type(inputs[0]!, 'Заголовок UA');
    await user.type(inputs[1]!, 'Title EN');
    await user.type(inputs[2]!, 'Body UA long enough');
    await user.type(inputs[3]!, 'Body EN long enough');
    await user.click(screen.getByRole('checkbox'));

    await user.click(screen.getByRole('button', { name: 'Зберегти' }));

    await waitFor(() => {
      expect(api.createAdminNewsPost).toHaveBeenCalledWith(
        expect.objectContaining({ isPublished: true })
      );
    });
  });

  it('cancels edit and resets form', async () => {
    const user = userEvent.setup();
    render(<AdminNewsPage />);

    await user.click(await screen.findByText('Новина UA'));
    await user.click(screen.getByRole('button', { name: 'Скасувати' }));

    expect(screen.queryByDisplayValue('Новина UA')).not.toBeInTheDocument();
  });

  it('shows delete error', async () => {
    vi.mocked(api.deleteAdminNewsPost).mockRejectedValue(new Error('Delete failed'));
    const user = userEvent.setup();
    render(<AdminNewsPage />);

    await user.click(await screen.findByRole('button', { name: 'Видалити' }));
    await clickConfirmDelete(user);

    expect(await screen.findByText('Delete failed')).toBeInTheDocument();
  });

  it('shows save error when update fails', async () => {
    vi.mocked(api.updateAdminNewsPost).mockRejectedValue(new Error('Save failed'));
    const user = userEvent.setup();
    render(<AdminNewsPage />);

    await user.click(await screen.findByText('Новина UA'));
    await user.click(screen.getByRole('button', { name: 'Зберегти' }));

    expect(await screen.findByText('Save failed')).toBeInTheDocument();
  });
});
