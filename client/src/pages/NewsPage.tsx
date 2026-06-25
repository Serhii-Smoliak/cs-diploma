import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, type NewsPost } from '../services/api';

export default function NewsPage() {
  const { t, i18n } = useTranslation(['ui']);
  const isEn = i18n.resolvedLanguage?.startsWith('en') ?? false;
  const { newsId } = useParams<{ newsId?: string }>();
  const navigate = useNavigate();

  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(newsId ?? null);
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getNewsPosts();
      setPosts(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('newsLoadError', {
              ns: 'ui',
              defaultValue: isEn ? 'Failed to load news.' : 'Не вдалося завантажити новини.',
            })
      );
    } finally {
      setLoading(false);
    }
  }, [t, isEn]);

  useEffect(() => {
    loadPosts().catch(() => {
      // loadPosts already sets error state
    });
  }, [loadPosts]);

  useEffect(() => {
    if (newsId) {
      setExpandedId(newsId);
    }
  }, [newsId]);

  const handleToggle = (postId: string) => {
    setExpandedId((current) => (current === postId ? null : postId));
  };

  const handleCopyPermalink = async (postId: string) => {
    const path = `/news/${postId}`;
    navigate(path);

    const url = `${globalThis.location.origin}${path}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopiedPostId(postId);
      globalThis.setTimeout(() => {
        setCopiedPostId((current) => (current === postId ? null : current));
      }, 2000);
    } catch {
      setError(
        t('newsPermalinkCopyError', {
          ns: 'ui',
          defaultValue: isEn ? 'Failed to copy link.' : 'Не вдалося скопіювати посилання.',
        })
      );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-cyber-primary text-center">
          {t('news', { ns: 'ui', defaultValue: isEn ? 'News' : 'Новини' })}
        </h1>

        {loading && (
          <div className="cyber-panel p-6 text-center text-gray-400 text-sm">
            {t('loading', { ns: 'ui', defaultValue: isEn ? 'Loading...' : 'Завантаження...' })}
          </div>
        )}

        {!loading && error && (
          <div className="cyber-panel p-4 border border-red-500/40 text-red-400 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="cyber-panel p-6 text-center text-gray-400 text-sm">
            {t('newsEmpty', {
              ns: 'ui',
              defaultValue: isEn ? 'No news yet.' : 'Новин поки немає.',
            })}
          </div>
        )}

        {!loading && !error && posts.length > 0 && (
          <div className="cyber-panel border border-cyber-border rounded-lg overflow-hidden divide-y divide-cyber-border/60">
            {posts.map((post) => {
              const isExpanded = expandedId === post.id;

              return (
                <article key={post.id}>
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() => handleToggle(post.id)}
                    className={`w-full text-left px-4 py-4 hover:bg-cyber-panel/60 transition-colors ${
                      isExpanded ? 'bg-cyber-panel/60' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`text-cyber-primary text-xs mt-1 transition-transform ${
                          isExpanded ? 'rotate-90' : ''
                        }`}
                        aria-hidden
                      >
                        ▶
                      </span>
                      <div className="min-w-0 flex-1">
                        <h2 className="font-medium text-gray-100">{post.title}</h2>
                        <p className="text-xs text-gray-500 mt-1">
                          {post.publishedAt
                            ? new Date(post.publishedAt).toLocaleString()
                            : new Date(post.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-cyber-border/60">
                      <p className="text-sm text-gray-200 whitespace-pre-wrap pt-4">{post.body}</p>
                      <button
                        type="button"
                        onClick={() => {
                          handleCopyPermalink(post.id).catch(() => {
                            // handleCopyPermalink already sets error state
                          });
                        }}
                        className="inline-block mt-3 text-xs text-cyber-primary hover:underline"
                      >
                        {copiedPostId === post.id
                          ? t('newsPermalinkCopied', {
                              ns: 'ui',
                              defaultValue: isEn ? 'Link copied' : 'Посилання скопійовано',
                            })
                          : t('newsPermalink', {
                              ns: 'ui',
                              defaultValue: isEn ? 'Copy link' : 'Копіювати посилання',
                            })}
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
