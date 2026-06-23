import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const navigate = vi.fn();

const { t, i18n } = vi.hoisted(() => ({
  t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  i18n: { resolvedLanguage: 'uk' },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t, i18n }),
}));

vi.mock('../services/api', () => ({
  api: {
    getNewsPosts: vi.fn(),
  },
}));

import { api } from '../services/api';
import NewsPage from './NewsPage';

const samplePost = {
  id: 'news-1',
  title: 'Оновлення платформи',
  body: 'Текст новини',
  isPublished: true,
  publishedAt: '2026-06-23T10:00:00.000Z',
  createdAt: '2026-06-23T10:00:00.000Z',
  updatedAt: '2026-06-23T10:00:00.000Z',
  authorUsername: 'admin',
};

function renderNewsPage(initialEntry = '/news') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/news" element={<NewsPage />} />
        <Route path="/news/:newsId" element={<NewsPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('NewsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigate.mockReset();
    vi.mocked(api.getNewsPosts).mockResolvedValue([samplePost]);
    vi.stubGlobal('navigator', {
      ...navigator,
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('loads and displays news posts', async () => {
    renderNewsPage();

    expect(await screen.findByText('Оновлення платформи')).toBeInTheDocument();
    expect(api.getNewsPosts).toHaveBeenCalled();
  });

  it('shows empty state when no posts', async () => {
    vi.mocked(api.getNewsPosts).mockResolvedValue([]);
    renderNewsPage();

    expect(await screen.findByText('Новин поки немає.')).toBeInTheDocument();
  });

  it('shows error when load fails', async () => {
    vi.mocked(api.getNewsPosts).mockRejectedValue(new Error('Network error'));
    renderNewsPage();

    expect(await screen.findByText('Network error')).toBeInTheDocument();
  });

  it('expands post and copies permalink', async () => {
    const user = userEvent.setup();
    renderNewsPage('/news/news-1');

    await waitFor(() => {
      expect(screen.getByText('Текст новини')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Копіювати посилання' }));

    await waitFor(() => {
      expect(screen.getByText('Посилання скопійовано')).toBeInTheDocument();
    });
    expect(navigate).toHaveBeenCalledWith('/news/news-1');
  });

  it('shows error when clipboard copy fails', async () => {
    vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error('denied'));
    renderNewsPage();

    await screen.findByText('Оновлення платформи');
    fireEvent.click(screen.getByText('Оновлення платформи'));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Копіювати посилання' })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Копіювати посилання' }));

    expect(await screen.findByText('Не вдалося скопіювати посилання.')).toBeInTheDocument();
  });

  it('collapses expanded post on second click', async () => {
    const user = userEvent.setup();
    renderNewsPage();

    await screen.findByText('Оновлення платформи');
    const toggle = screen.getByText('Оновлення платформи');

    await user.click(toggle);
    expect(screen.getByText('Текст новини')).toBeInTheDocument();

    await user.click(toggle);
    expect(screen.queryByText('Текст новини')).not.toBeInTheDocument();
  });
});
